import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const Input = z.object({
  sameRun: z.boolean().optional(),
  feeWaived: z.boolean().optional(),
});

/**
 * POST /api/notifications/:deliveryId/followup: the neighbor who ordered
 * tells us whether it came on the same run and whether the fee was
 * dropped. This is the number that later convinces shops.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const subscriber = await db.subscriber.findUnique({ where: { userId } });
  if (!subscriber) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await db.notification.updateMany({
    where: { deliveryId: id, subscriberId: subscriber.id, orderPlaced: true },
    data: {
      ...(body.sameRun !== undefined ? { sameRun: body.sameRun } : {}),
      ...(body.feeWaived !== undefined ? { feeWaived: body.feeWaived } : {}),
    },
  });
  if (updated.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
