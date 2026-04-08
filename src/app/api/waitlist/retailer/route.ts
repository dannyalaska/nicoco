import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const Input = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  business: z.string().min(1).max(200),
  city: z.string().max(100).optional(),
  posSystem: z.string().max(100).optional(),
  weeklyVolume: z.string().max(100).optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`waitlist-retailer:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  await db.waitlistLead.create({
    data: {
      type: "retailer",
      email: body.email,
      name: body.name,
      business: body.business,
      city: body.city,
      posSystem: body.posSystem,
      weeklyVolume: body.weeklyVolume,
      note: body.note,
    },
  });

  return NextResponse.json({ ok: true });
}
