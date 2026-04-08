import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Demo "Order now" button. Flips `orderPlaced = true` on the
 * notification row so analytics can count conversions. In production
 * this would deep-link into the retailer's own ordering flow and
 * reconcile via webhook instead.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const subscriber = await db.subscriber.findUnique({ where: { userId } });
  if (!subscriber) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await db.notification.updateMany({
    where: { deliveryId: id, subscriberId: subscriber.id },
    data: { orderPlaced: true },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
