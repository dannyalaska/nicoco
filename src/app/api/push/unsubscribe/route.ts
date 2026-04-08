import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const Input = z.object({ endpoint: z.string().url() });

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

  await db.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } });
  return NextResponse.json({ ok: true });
}
