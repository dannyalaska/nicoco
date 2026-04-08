/**
 * Geo helpers — the performance-critical path.
 *
 * Prisma does not support PostGIS `geography` types natively, so every
 * read/write that touches a location column happens here via raw SQL.
 *
 * Coordinates use SRID 4326 (WGS84, lat/lon degrees) and `geography`
 * (not `geometry`) so distance comparisons are in meters and honor the
 * curvature of the Earth. All queries rely on GiST indexes created in
 * prisma/migrations/00000000000001_gist_indexes.
 */
import { db } from "./db";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface MatchedSubscriber {
  subscriberId: string;
  radiusMeters: number;
  distanceMeters: number;
}

/**
 * Find every active subscriber whose current location is within their
 * personal `radius_meters` of the given point.
 *
 * ST_DWithin with a geography argument treats the third argument as
 * meters, and the GiST index on `currentLocation` makes this scale from
 * 10 rows to 10 million with the same query shape.
 */
export async function findSubscribersNear(point: LatLon): Promise<MatchedSubscriber[]> {
  const rows = await db.$queryRaw<
    { id: string; radius_meters: number; distance_m: number }[]
  >`
    SELECT
      s.id,
      s."radiusMeters" AS radius_meters,
      ST_Distance(
        s."currentLocation",
        ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)::geography
      ) AS distance_m
    FROM "Subscriber" s
    WHERE s.active = true
      AND s."currentLocation" IS NOT NULL
      AND ST_DWithin(
        s."currentLocation",
        ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)::geography,
        s."radiusMeters"
      );
  `;

  return rows.map((r) => ({
    subscriberId: r.id,
    radiusMeters: r.radius_meters,
    distanceMeters: Math.round(r.distance_m),
  }));
}

/**
 * Set a subscriber's current location. Called from the onboarding flow
 * when the browser's Geolocation API resolves.
 */
export async function setSubscriberCurrentLocation(
  subscriberId: string,
  point: LatLon,
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Subscriber"
    SET "currentLocation" = ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)::geography
    WHERE id = ${subscriberId};
  `;
}

/**
 * Set a subscriber's home location (stickier than currentLocation —
 * used as a fallback when we have no fresh position fix).
 */
export async function setSubscriberHomeLocation(
  subscriberId: string,
  point: LatLon,
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Subscriber"
    SET "homeLocation" = ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)::geography
    WHERE id = ${subscriberId};
  `;
}

/**
 * Set a retailer's shop location.
 */
export async function setRetailerLocation(
  retailerId: string,
  point: LatLon,
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Retailer"
    SET "location" = ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)::geography
    WHERE id = ${retailerId};
  `;
}

/**
 * Write origin+destination on a Delivery row. Kept separate from the
 * row-create path because Prisma's `.create()` can't take `Unsupported`
 * columns; callers create the Delivery first and patch geography second.
 */
export async function setDeliveryLocations(
  deliveryId: string,
  dest: LatLon,
  origin?: LatLon | null,
): Promise<void> {
  if (origin) {
    await db.$executeRaw`
      UPDATE "Delivery"
      SET "destLocation"   = ST_SetSRID(ST_MakePoint(${dest.lon}, ${dest.lat}), 4326)::geography,
          "originLocation" = ST_SetSRID(ST_MakePoint(${origin.lon}, ${origin.lat}), 4326)::geography
      WHERE id = ${deliveryId};
    `;
  } else {
    await db.$executeRaw`
      UPDATE "Delivery"
      SET "destLocation" = ST_SetSRID(ST_MakePoint(${dest.lon}, ${dest.lat}), 4326)::geography
      WHERE id = ${deliveryId};
    `;
  }
}

/**
 * Read a retailer's shop location. Used when a delivery event omits
 * origin and we want to default to the shop.
 */
export async function getRetailerLocation(retailerId: string): Promise<LatLon | null> {
  const rows = await db.$queryRaw<{ lat: number; lon: number }[]>`
    SELECT ST_Y("location"::geometry) AS lat, ST_X("location"::geometry) AS lon
    FROM "Retailer"
    WHERE id = ${retailerId} AND "location" IS NOT NULL;
  `;
  return rows[0] ?? null;
}
