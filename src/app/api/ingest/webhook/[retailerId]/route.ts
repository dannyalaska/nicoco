import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ingestDeliveryEvent } from "@/ingest/dispatch";
import {
  WebhookBody,
  verifyWebhookSignature,
  webhookSignatureHeaderName,
  webhookToDeliveryEvent,
} from "@/ingest/adapters/webhook";

/**
 * POST /api/ingest/webhook/[retailerId] — external delivery events.
 * Authenticated via HMAC-SHA256 signature over the raw request body,
 * using the retailer's per-account webhookSecret as the key.
 *
 *   X-Piggyback-Signature: sha256=<hex>
 *
 * We hash the raw body BEFORE JSON parsing so whitespace differences
 * don't break verification.
 */
export async function POST(req: Request, { params }: { params: Promise<{ retailerId: string }> }) {
  const { retailerId } = await params;

  // Rate-limit unauthenticated clients by IP to prevent signature-brute-force.
  const ip = clientIp(req);
  const rl = rateLimit(`ingest-webhook:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const retailer = await db.retailer.findUnique({
    where: { id: retailerId },
    select: { id: true, webhookSecret: true },
  });
  if (!retailer) return NextResponse.json({ error: "unknown retailer" }, { status: 404 });

  const rawBody = await req.text();
  const sig = req.headers.get(webhookSignatureHeaderName());
  if (!verifyWebhookSignature({ rawBody, signatureHeader: sig, secret: retailer.webhookSecret })) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  let body;
  try {
    body = WebhookBody.parse(parsed);
  } catch (err) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const evt = webhookToDeliveryEvent(retailer.id, body);
  const result = await ingestDeliveryEvent(evt);
  return NextResponse.json(result, { status: 202 });
}
