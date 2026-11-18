/**
 * Pure helpers for neighbor-posted runs. No database access here so the
 * rules are easy to unit test.
 */
import type { LatLon } from "./geo";

/**
 * Grid size for snapping a run's drop-off point. About 165 m north-south
 * and about 170 m east-west at New Jersey latitudes, i.e. roughly one
 * suburban block. Neighbors learn "a driver is coming near here", never
 * which house ordered.
 */
export const BLOCK_LAT_STEP = 0.0015;
export const BLOCK_LON_STEP = 0.002;

/** Snap a point to the centre of its block-grid cell. */
export function snapToBlock(p: LatLon): LatLon {
  const cell = (v: number, step: number) => (Math.floor(v / step) + 0.5) * step;
  return {
    lat: round6(cell(p.lat, BLOCK_LAT_STEP)),
    lon: round6(cell(p.lon, BLOCK_LON_STEP)),
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Hour of day (0 to 23) for `now` in an IANA time zone. */
export function localHour(now: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(now);
    const h = parts.find((p) => p.type === "hour")?.value;
    const n = Number(h);
    return Number.isFinite(n) ? n % 24 : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

/**
 * True when `hour` falls in the quiet window [start, end). Handles
 * windows that wrap midnight (22 to 9). start === end means no quiet hours.
 */
export function isQuietHour(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

/** Push text for a neighbor run. Never promises a free delivery. */
export function runNotificationText(input: {
  shopName: string;
  etaMinutes?: number | null;
  areaLabel?: string | null;
  sameRunPerk?: string | null;
}): { title: string; body: string } {
  const where = input.areaLabel ? ` ${input.areaLabel}` : " near you";
  const when = input.etaMinutes ? ` in about ${input.etaMinutes} min` : " soon";
  const title = `${input.shopName} is delivering${where}`;
  const perk = input.sameRunPerk ? ` ${input.sameRunPerk}.` : "";
  const body =
    `A neighbor just ordered, arriving${when}. ` +
    `Order now and ask them to put yours on the same run.${perk}`;
  return { title, body };
}

/** The line a neighbor says or types when ordering, so the shop can batch. */
export function sameRunAsk(areaLabel?: string | null): string {
  const where = areaLabel ? ` ${areaLabel}` : " on my street";
  return `Can you put this on the same run as the delivery going${where} right now?`;
}
