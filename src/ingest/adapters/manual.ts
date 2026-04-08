/**
 * Manual adapter: the retailer dashboard "Dispatch delivery" button.
 *
 * Input (JSON body):
 *   { destLat, destLon, destAddress?, etaMinutes?, piggybackWindowMinutes? }
 *
 * Auth context: the route handler authenticates the logged-in
 * RetailerUser first and passes the resolved retailerId in.
 */
import { z } from "zod";
import type { DeliveryEvent } from "../types";

export const ManualInput = z.object({
  destLat: z.number().min(-90).max(90),
  destLon: z.number().min(-180).max(180),
  destAddress: z.string().max(200).optional(),
  etaMinutes: z.number().int().positive().max(180).optional(),
  piggybackWindowMinutes: z.number().int().positive().max(60).optional(),
});

export function manualToDeliveryEvent(
  retailerId: string,
  input: z.infer<typeof ManualInput>,
): DeliveryEvent {
  return {
    retailerId,
    // Dashboard dispatches get a unique id per click so ingest never
    // dedupes them against each other.
    externalId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    destination: {
      lat: input.destLat,
      lon: input.destLon,
      address: input.destAddress,
    },
    dispatchedAt: new Date(),
    etaMinutes: input.etaMinutes,
    piggybackWindowMinutes: input.piggybackWindowMinutes,
    sourceAdapter: "manual",
    raw: input,
  };
}
