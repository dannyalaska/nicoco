import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";
import { ingestDeliveryEvent } from "@/ingest/dispatch";

const Input = z.object({
  retailerId: z.string().min(1),
  destLat: z.number().min(-90).max(90),
  destLon: z.number().min(-180).max(180),
  destAddress: z.string().max(200).optional(),
  etaMinutes: z.number().int().positive().max(180).optional(),
  piggybackWindowMinutes: z.number().int().positive().max(60).optional(),
});

/**
 * Admin-only "fire test delivery" endpoint. Bypasses retailer auth —
 * intended only for dogfooding and live demos.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const result = await ingestDeliveryEvent({
    retailerId: body.retailerId,
    externalId: `admin-${Date.now()}`,
    destination: { lat: body.destLat, lon: body.destLon, address: body.destAddress },
    dispatchedAt: new Date(),
    etaMinutes: body.etaMinutes,
    piggybackWindowMinutes: body.piggybackWindowMinutes,
    sourceAdapter: "manual",
    raw: body,
  });

  return NextResponse.json(result);
}
