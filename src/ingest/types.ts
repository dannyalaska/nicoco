/**
 * The canonical DeliveryEvent contract.
 *
 * Every retailer integration — manual button, webhook, future POS
 * adapters like Square/Toast/Clover — normalizes upstream input into
 * this shape and hands it to `ingestDeliveryEvent`. The rest of the
 * app (geo matching, push fanout, notification logging) never sees the
 * original payload.
 */
import type { SourceAdapter } from "@prisma/client";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface DeliveryEvent {
  retailerId: string;
  /** Upstream's own id for idempotency. Two events with the same
   *  (retailerId, sourceAdapter, externalId) upsert the same Delivery. */
  externalId?: string;
  /** Optional — defaults to the retailer's shop location if missing. */
  origin?: LatLon;
  destination: LatLon & { address?: string };
  dispatchedAt: Date;
  etaMinutes?: number;
  driverRef?: string;
  /** How long the piggyback offer window stays open. Defaults to 10. */
  piggybackWindowMinutes?: number;
  sourceAdapter: SourceAdapter;
  /** Neighbor runs: the subscriber who posted it. They are never notified
   *  about their own run. */
  postedBySubscriberId?: string;
  /** Neighbor runs: coarse area label shown instead of an address. */
  areaLabel?: string;
  /** Original payload, stored for debugging. */
  raw?: unknown;
}

export interface IngestResult {
  deliveryId: string;
  notified: number;
  alreadyExisted: boolean;
  /** Matched neighbors skipped for quiet hours or the daily cap. */
  skipped?: number;
}
