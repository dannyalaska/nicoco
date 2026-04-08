import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const Input = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional(),
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

  const subscriber = await db.subscriber.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await db.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      subscriberId: subscriber.id,
      p256dh: body.p256dh,
      auth: body.auth,
      userAgent: body.userAgent,
    },
    create: {
      subscriberId: subscriber.id,
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
      userAgent: body.userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
