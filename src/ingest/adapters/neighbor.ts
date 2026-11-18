/**
 * Neighbor adapter: a subscriber taps "Piggyback it" after ordering from
 * a listed shop. The shop never touches Piggyback.
 *
 * Input (JSON body):
 *   { retailerId, etaMinutes, areaLabel?, windowMinutes? }
 *
 * The drop-off point is the poster's own saved location, snapped to the
 * block grid, so the client never sends coordinates and neighbors never
 * learn which house ordered.
 */
import { z } from "zod";
import { snapToBlock } from "@/lib/neighbor";
import type { LatLon } from "@/lib/geo";
import type { DeliveryEvent } from "../types";

export const NeighborRunInput = z.object({
  retailerId: z.string().min(1).max(64),
  etaMinutes: z.number().int().min(5).max(120),
  // Free text like "near Main St & Valley Rd". Kept short and stripped
  // of digits so nobody posts a house number by accident.
  areaLabel: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v.replace(/\d+/g, "").replace(/\s{2,}/g, " ").trim() || undefined : undefined)),
  windowMinutes: z.number().int().min(5).max(30).optional(),
});

export type NeighborRunInputT = z.infer<typeof NeighborRunInput>;

export function neighborToDeliveryEvent(
  posterSubscriberId: string,
  posterLocation: LatLon,
  input: NeighborRunInputT,
  now: Date = new Date(),
): DeliveryEvent {
  const dest = snapToBlock(posterLocation);
  return {
    retailerId: input.retailerId,
    externalId: `neighbor-${posterSubscriberId}-${now.getTime()}`,
    destination: { ...dest, address: input.areaLabel },
    dispatchedAt: now,
    etaMinutes: input.etaMinutes,
    // Default window: most of the ETA, so people can still catch the run.
    piggybackWindowMinutes: input.windowMinutes ?? Math.min(15, Math.max(5, input.etaMinutes - 10)),
    sourceAdapter: "neighbor",
    postedBySubscriberId: posterSubscriberId,
    areaLabel: input.areaLabel,
    raw: { etaMinutes: input.etaMinutes, areaLabel: input.areaLabel },
  };
}
