import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/env";
import { setRetailerLocation } from "@/lib/geo";

const Input = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  phone: z.string().trim().max(30).optional(),
  orderUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(40).optional(),
  sameRunPerk: z.string().trim().max(120).optional(),
  listed: z.boolean().optional(),
});

/**
 * Admin-only: add or edit a shop on the neighbor list. Shops don't sign
 * up; you add the ones near your pilot area that run their own drivers.
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

  const data = {
    name: body.name,
    address: body.address,
    phone: body.phone || null,
    orderUrl: body.orderUrl || null,
    category: body.category || null,
    sameRunPerk: body.sameRunPerk || null,
    listed: body.listed ?? true,
  };

  const shop = body.id
    ? await db.retailer.update({ where: { id: body.id }, data, select: { id: true } })
    : await db.retailer.create({
        data: { ...data, webhookSecret: randomBytes(24).toString("hex"), ingestMode: "manual" },
        select: { id: true },
      });
  await setRetailerLocation(shop.id, { lat: body.lat, lon: body.lon });

  return NextResponse.json({ id: shop.id });
}
