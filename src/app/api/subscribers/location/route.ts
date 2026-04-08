import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { setSubscriberCurrentLocation, setSubscriberHomeLocation } from "@/lib/geo";

const Input = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  setHome: z.boolean().optional(),
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

  await setSubscriberCurrentLocation(subscriber.id, { lat: body.lat, lon: body.lon });
  if (body.setHome) {
    await setSubscriberHomeLocation(subscriber.id, { lat: body.lat, lon: body.lon });
  }

  return NextResponse.json({ ok: true });
}
