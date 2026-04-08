/**
 * The heart of Piggyback: turn a DeliveryEvent into fanned-out push
 * notifications.
 *
 *   1. Upsert a Delivery row (idempotent on externalId)
 *   2. Find every subscriber within their radius of the destination
 *   3. Load each matched subscriber's push endpoints
 *   4. Send notifications in parallel
 *   5. Log one Notification row per (delivery, subscriber)
 *
 * Intentionally synchronous end-to-end for MVP — no queue, no retry.
 * Every adapter calls this function and nothing else.
 */
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { findSubscribersNear, getRetailerLocation, setDeliveryLocations } from "@/lib/geo";
import { sendPush, type PushPayload } from "@/lib/push";
import type { DeliveryEvent, IngestResult } from "./types";

export async function ingestDeliveryEvent(evt: DeliveryEvent): Promise<IngestResult> {
  // 1. Resolve origin (default to shop location).
  let origin = evt.origin;
  if (!origin) {
    const shop = await getRetailerLocation(evt.retailerId);
    if (shop) origin = shop;
  }

  // 2. Idempotent upsert. We can't use prisma's unique-composite upsert
  //    directly with an optional externalId (nulls don't collide in
  //    Postgres), so we check manually first. In production this is
  //    a serializable transaction; for MVP a read-then-write race just
  //    means a rare duplicate Delivery row.
  let alreadyExisted = false;
  let deliveryId: string;
  if (evt.externalId) {
    const existing = await db.delivery.findUnique({
      where: {
        retailerId_sourceAdapter_externalId: {
          retailerId: evt.retailerId,
          sourceAdapter: evt.sourceAdapter,
          externalId: evt.externalId,
        },
      },
      select: { id: true },
    });
    if (existing) {
      alreadyExisted = true;
      deliveryId = existing.id;
    } else {
      const created = await db.delivery.create({
        data: {
          retailerId: evt.retailerId,
          sourceAdapter: evt.sourceAdapter,
          externalId: evt.externalId,
          dispatchedAt: evt.dispatchedAt,
          etaMinutes: evt.etaMinutes,
          destAddress: evt.destination.address,
          piggybackWindowMinutes: evt.piggybackWindowMinutes ?? 10,
          rawPayload: (evt.raw as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
        },
        select: { id: true },
      });
      deliveryId = created.id;
      await setDeliveryLocations(deliveryId, evt.destination, origin);
    }
  } else {
    const created = await db.delivery.create({
      data: {
        retailerId: evt.retailerId,
        sourceAdapter: evt.sourceAdapter,
        dispatchedAt: evt.dispatchedAt,
        etaMinutes: evt.etaMinutes,
        destAddress: evt.destination.address,
        piggybackWindowMinutes: evt.piggybackWindowMinutes ?? 10,
        rawPayload: (evt.raw as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      },
      select: { id: true },
    });
    deliveryId = created.id;
    await setDeliveryLocations(deliveryId, evt.destination, origin);
  }

  if (alreadyExisted) {
    // Duplicate event — do not re-notify. Return current stats.
    const count = await db.notification.count({ where: { deliveryId } });
    return { deliveryId, notified: count, alreadyExisted: true };
  }

  // 3. Geo match.
  const matches = await findSubscribersNear(evt.destination);
  if (matches.length === 0) {
    return { deliveryId, notified: 0, alreadyExisted: false };
  }

  // 4. Load retailer details + push endpoints in parallel.
  const [retailer, pushSubs] = await Promise.all([
    db.retailer.findUnique({ where: { id: evt.retailerId }, select: { name: true } }),
    db.pushSubscription.findMany({
      where: { subscriberId: { in: matches.map((m) => m.subscriberId) } },
    }),
  ]);

  const shopName = retailer?.name ?? "a shop nearby";
  const eta = evt.etaMinutes ? `~${evt.etaMinutes} min away` : "nearby";
  const window = evt.piggybackWindowMinutes ?? 10;

  const payload: PushPayload = {
    title: `Free delivery from ${shopName}`,
    body: `Their driver is ${eta}. Order in ${window} min for no delivery fee.`,
    url: `${process.env.AUTH_URL ?? "http://localhost:3000"}/offer/${deliveryId}`,
    tag: `delivery-${deliveryId}`,
  };

  // 5. Fan out. Group endpoints by subscriber so we can write one
  //    Notification row per subscriber (dedupe via unique constraint).
  const byS = new Map<string, typeof pushSubs>();
  for (const p of pushSubs) {
    const arr = byS.get(p.subscriberId) ?? [];
    arr.push(p);
    byS.set(p.subscriberId, arr);
  }

  let notified = 0;
  const now = new Date();

  await Promise.all(
    matches.map(async (m) => {
      const endpoints = byS.get(m.subscriberId) ?? [];
      if (endpoints.length === 0) return;

      const results = await Promise.all(
        endpoints.map((e) =>
          sendPush({ endpoint: e.endpoint, p256dh: e.p256dh, auth: e.auth }, payload),
        ),
      );
      const anyOk = results.some((r) => r.ok);
      if (!anyOk) return;

      // Notification is per-subscriber, not per-endpoint. Use upsert
      // because a race between two ingests could otherwise 23505.
      await db.notification.upsert({
        where: { deliveryId_subscriberId: { deliveryId, subscriberId: m.subscriberId } },
        update: {},
        create: {
          deliveryId,
          subscriberId: m.subscriberId,
          sentAt: now,
          distanceMeters: m.distanceMeters,
        },
      });
      notified += 1;
    }),
  );

  return { deliveryId, notified, alreadyExisted: false };
}
