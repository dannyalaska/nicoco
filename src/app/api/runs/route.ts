import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSubscriberLocation } from "@/lib/geo";
import { rateLimit } from "@/lib/rate-limit";
import { ingestDeliveryEvent } from "@/ingest/dispatch";
import { NeighborRunInput, neighborToDeliveryEvent } from "@/ingest/adapters/neighbor";

/**
 * POST /api/runs: a signed-in neighbor says "I just ordered from this
 * shop". We snap their saved location to the block grid and run the
 * normal fanout. No shop account involved.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // A real person orders dinner a couple of times a day at most.
  const rl = rateLimit(`run:${userId}`, { limit: 4, windowMs: 6 * 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many runs posted. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = NeighborRunInput.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const subscriber = await db.subscriber.findUnique({ where: { userId }, select: { id: true } });
  if (!subscriber) return NextResponse.json({ error: "finish setup first" }, { status: 400 });

  const shop = await db.retailer.findFirst({
    where: { id: body.retailerId, listed: true },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "unknown shop" }, { status: 404 });

  const where = await getSubscriberLocation(subscriber.id);
  if (!where) {
    return NextResponse.json({ error: "Share your location first." }, { status: 400 });
  }

  // One live run per neighbor per shop: a second tap in 30 min is a dupe.
  const recent = await db.delivery.findFirst({
    where: {
      postedById: subscriber.id,
      retailerId: body.retailerId,
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json({ deliveryId: recent.id, notified: 0, alreadyExisted: true });
  }

  const evt = neighborToDeliveryEvent(subscriber.id, where, body);
  const result = await ingestDeliveryEvent(evt);
  return NextResponse.json(result);
}
