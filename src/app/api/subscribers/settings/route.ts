import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const Input = z.object({
  radiusMeters: z.number().int().min(200).max(2000),
  quietStartHour: z.number().int().min(0).max(23),
  quietEndHour: z.number().int().min(0).max(23),
  maxPerDay: z.number().int().min(1).max(10),
  timeZone: z.string().min(1).max(64),
  active: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: body.timeZone });
  } catch {
    return NextResponse.json({ error: "bad time zone" }, { status: 400 });
  }

  await db.subscriber.upsert({
    where: { userId },
    update: body,
    create: { userId, ...body },
  });
  return NextResponse.json({ ok: true });
}
