/**
 * The heart of Piggyback: turn a DeliveryEvent into fanned-out push
 * notifications.
 *
 *   1. Upsert a Delivery row (idempotent on externalId)
 *   2. Find every subscriber within their radius of the destination
 *   3. Drop the poster, anyone in quiet hours, and anyone at their daily cap
 *   4. Load each remaining subscriber's push endpoints
 *   5. Send notifications in parallel
 *   6. Log one Notification row per (delivery, subscriber)
 *
 * Intentionally synchronous end-to-end for MVP: no queue, no retry.
 * Every adapter calls this function and nothing else.
 */
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { findSubscribersNear, getRetailerLocation, setDeliveryLocations } from "@/lib/geo";
import { isQuietHour, localHour, runNotificationText } from "@/lib/neighbor";
import { sendPush, type PushPayload } from "@/lib/push";
import type { DeliveryEvent, IngestResult } from "./types";

export async function ingestDeliveryEvent(evt: DeliveryEvent): Promise<IngestResult> {
  // 1. Resolve origin (default to shop location).
  let origin = evt.origin;
  if (!origin) {
    const shop = await getRetailerLocation(evt.retailerId);
    if (shop) origin = shop;
  }

  // 2. Idempotent upsert. Prisma's composite upsert can't key on an
  //    optional externalId (nulls don't collide in Postgres), so check
  //    manually first. A read-then-write race just means a rare duplicate.
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
      const count = await db.notification.count({ where: { deliveryId: existing.id } });
      return { deliveryId: existing.id, notified: count, alreadyExisted: true };
    }
  }

  const created = await db.delivery.create({
    data: {
      retailerId: evt.retailerId,
      sourceAdapter: evt.sourceAdapter,
      externalId: evt.externalId,
      dispatchedAt: evt.dispatchedAt,
      etaMinutes: evt.etaMinutes,
      destAddress: evt.destination.address,
      piggybackWindowMinutes: evt.piggybackWindowMinutes ?? 10,
      postedById: evt.postedBySubscriberId,
      areaLabel: evt.areaLabel,
      rawPayload: (evt.raw as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
    },
    select: { id: true },
  });
  const deliveryId = created.id;
  await setDeliveryLocations(deliveryId, evt.destination, origin);

  // 3. Geo match, then filter.
  const matches = (await findSubscribersNear(evt.destination)).filter(
    (m) => m.subscriberId !== evt.postedBySubscriberId,
  );
  if (matches.length === 0) {
    return { deliveryId, notified: 0, alreadyExisted: false, skipped: 0 };
  }

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const ids = matches.map((m) => m.subscriberId);
  const [subs, recentCounts] = await Promise.all([
    db.subscriber.findMany({
      where: { id: { in: ids } },
      select: { id: true, quietStartHour: true, quietEndHour: true, timeZone: true, maxPerDay: true },
    }),
    db.notification.groupBy({
      by: ["subscriberId"],
      where: { subscriberId: { in: ids }, sentAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);
  const subById = new Map(subs.map((s) => [s.id, s]));
  const sentToday = new Map(recentCounts.map((r) => [r.subscriberId, r._count._all]));

  const eligible = matches.filter((m) => {
    const s = subById.get(m.subscriberId);
    if (!s) return false;
    if (isQuietHour(localHour(now, s.timeZone), s.quietStartHour, s.quietEndHour)) return false;
    if ((sentToday.get(m.subscriberId) ?? 0) >= s.maxPerDay) return false;
    return true;
  });
  const skipped = matches.length - eligible.length;
  if (eligible.length === 0) {
    return { deliveryId, notified: 0, alreadyExisted: false, skipped };
  }

  // 4. Load retailer details + push endpoints in parallel.
  const [retailer, pushSubs] = await Promise.all([
    db.retailer.findUnique({
      where: { id: evt.retailerId },
      select: { name: true, sameRunPerk: true },
    }),
    db.pushSubscription.findMany({
      where: { subscriberId: { in: eligible.map((m) => m.subscriberId) } },
    }),
  ]);

  const shopName = retailer?.name ?? "A shop nearby";
  const window = evt.piggybackWindowMinutes ?? 10;
  const text =
    evt.sourceAdapter === "neighbor"
      ? runNotificationText({
          shopName,
          etaMinutes: evt.etaMinutes,
          areaLabel: evt.areaLabel,
          sameRunPerk: retailer?.sameRunPerk,
        })
      : {
          title: `${shopName} has a driver heading your way`,
          body: `Their driver is ${evt.etaMinutes ? `~${evt.etaMinutes} min away` : "nearby"}. Order in the next ${window} min to ride the same trip.`,
        };

  const payload: PushPayload = {
    ...text,
    url: `${process.env.AUTH_URL ?? "http://localhost:3000"}/offer/${deliveryId}`,
    tag: `delivery-${deliveryId}`,
  };

  // 5. Fan out. Group endpoints by subscriber so we write one
  //    Notification row per subscriber (dedupe via unique constraint).
  const byS = new Map<string, typeof pushSubs>();
  for (const p of pushSubs) {
    const arr = byS.get(p.subscriberId) ?? [];
    arr.push(p);
    byS.set(p.subscriberId, arr);
  }

  let notified = 0;
  await Promise.all(
    eligible.map(async (m) => {
      const endpoints = byS.get(m.subscriberId) ?? [];
      if (endpoints.length === 0) return;

      const results = await Promise.all(
        endpoints.map((e) =>
          sendPush({ endpoint: e.endpoint, p256dh: e.p256dh, auth: e.auth }, payload),
        ),
      );
      if (!results.some((r) => r.ok)) return;

      // 6. Upsert because a race between two ingests could otherwise 23505.
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

  return { deliveryId, notified, alreadyExisted: false, skipped };
}
