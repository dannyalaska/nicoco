import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Fire-and-forget "notification was clicked" endpoint. Called from the
 * service worker's notificationclick handler. Best effort — never fails
 * loudly because we don't want to break the redirect.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: true });

  const subscriber = await db.subscriber.findUnique({ where: { userId } });
  if (!subscriber) return NextResponse.json({ ok: true });

  await db.notification.updateMany({
    where: { deliveryId: id, subscriberId: subscriber.id, clickedAt: null },
    data: { clickedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
