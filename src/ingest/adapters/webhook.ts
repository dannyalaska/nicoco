/**
 * Webhook adapter: external systems POST delivery events signed with
 * the retailer's per-account `webhookSecret`.
 *
 * Signature header: `X-Piggyback-Signature: sha256=<hex>` where the
 * digest is HMAC-SHA256 of the raw request body using `webhookSecret`
 * as the key. Timing-safe compare, body is hashed BEFORE JSON parsing.
 *
 * Body schema is deliberately lax — real POS payloads vary wildly. We
 * accept `destination: { lat, lon, address? }` OR a flat `destLat`/
 * `destLon` shape, and map everything into the canonical DeliveryEvent.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { DeliveryEvent } from "../types";

export const WebhookBody = z
  .object({
    externalId: z.string().min(1).max(200).optional(),
    destination: z
      .object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        address: z.string().max(200).optional(),
      })
      .optional(),
    destLat: z.number().min(-90).max(90).optional(),
    destLon: z.number().min(-180).max(180).optional(),
    destAddress: z.string().max(200).optional(),
    origin: z
      .object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
      })
      .optional(),
    dispatchedAt: z.string().datetime().optional(),
    etaMinutes: z.number().int().positive().max(180).optional(),
    driverRef: z.string().max(100).optional(),
    piggybackWindowMinutes: z.number().int().positive().max(60).optional(),
  })
  .refine(
    (b) => b.destination || (typeof b.destLat === "number" && typeof b.destLon === "number"),
    { message: "destination lat/lon required" },
  );

const SIG_HEADER = "x-piggyback-signature";

/**
 * Verify the HMAC signature on a raw request body. Returns true on
 * match, false otherwise. Constant-time comparison.
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}): boolean {
  if (!params.signatureHeader) return false;
  const prefix = "sha256=";
  if (!params.signatureHeader.startsWith(prefix)) return false;
  const provided = params.signatureHeader.slice(prefix.length);
  const expected = createHmac("sha256", params.secret).update(params.rawBody).digest("hex");
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function webhookSignatureHeaderName(): string {
  return SIG_HEADER;
}

export function webhookToDeliveryEvent(
  retailerId: string,
  body: z.infer<typeof WebhookBody>,
): DeliveryEvent {
  const dest = body.destination
    ? body.destination
    : { lat: body.destLat!, lon: body.destLon!, address: body.destAddress };

  return {
    retailerId,
    externalId: body.externalId,
    destination: dest,
    origin: body.origin,
    dispatchedAt: body.dispatchedAt ? new Date(body.dispatchedAt) : new Date(),
    etaMinutes: body.etaMinutes,
    driverRef: body.driverRef,
    piggybackWindowMinutes: body.piggybackWindowMinutes,
    sourceAdapter: "webhook",
    raw: body,
  };
}
