import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingestDeliveryEvent } from "@/ingest/dispatch";
import { ManualInput, manualToDeliveryEvent } from "@/ingest/adapters/manual";

/**
 * POST /api/ingest/manual — called from the retailer dashboard when a
 * driver heads out. Resolves the retailer from the logged-in user's
 * RetailerUser row and hands off to the canonical pipeline.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ru = await db.retailerUser.findUnique({ where: { userId } });
  if (!ru) return NextResponse.json({ error: "not a retailer" }, { status: 403 });

  let body;
  try {
    body = ManualInput.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const evt = manualToDeliveryEvent(ru.retailerId, body);
  const result = await ingestDeliveryEvent(evt);
  return NextResponse.json(result);
}
