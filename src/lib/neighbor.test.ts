import { describe, expect, it } from "vitest";
import { isQuietHour, localHour, runNotificationText, sameRunAsk, snapToBlock } from "./neighbor";
import { NeighborRunInput, neighborToDeliveryEvent } from "@/ingest/adapters/neighbor";

describe("snapToBlock", () => {
  it("puts two houses on the same block in the same cell", () => {
    const a = snapToBlock({ lat: 40.6756, lon: -74.49311 });
    const b = snapToBlock({ lat: 40.6759, lon: -74.49371 });
    expect(a).toEqual(b);
  });

  it("never returns the input point", () => {
    const p = { lat: 40.67521, lon: -74.49311 };
    const s = snapToBlock(p);
    expect(s).not.toEqual(p);
    expect(Math.abs(s.lat - p.lat)).toBeLessThanOrEqual(0.00075);
    expect(Math.abs(s.lon - p.lon)).toBeLessThanOrEqual(0.001);
  });
});

describe("quiet hours", () => {
  it("handles windows that wrap midnight", () => {
    expect(isQuietHour(23, 22, 9)).toBe(true);
    expect(isQuietHour(3, 22, 9)).toBe(true);
    expect(isQuietHour(9, 22, 9)).toBe(false);
    expect(isQuietHour(18, 22, 9)).toBe(false);
  });

  it("handles same-day windows and the off switch", () => {
    expect(isQuietHour(14, 13, 15)).toBe(true);
    expect(isQuietHour(15, 13, 15)).toBe(false);
    expect(isQuietHour(5, 0, 0)).toBe(false);
  });

  it("reads the local hour in a time zone", () => {
    // 23:30 UTC on Nov 18 is 18:30 in New York (EST, UTC-5).
    expect(localHour(new Date("2026-11-18T23:30:00Z"), "America/New_York")).toBe(18);
    expect(localHour(new Date("2026-11-18T23:30:00Z"), "not/a-zone")).toBe(23);
  });
});

describe("neighbor run input", () => {
  it("strips house numbers from the area label", () => {
    const parsed = NeighborRunInput.parse({
      retailerId: "shop1",
      etaMinutes: 30,
      areaLabel: "12 Main St",
    });
    expect(parsed.areaLabel).toBe("Main St");
  });

  it("rejects silly ETAs", () => {
    expect(() => NeighborRunInput.parse({ retailerId: "s", etaMinutes: 2 })).toThrow();
    expect(() => NeighborRunInput.parse({ retailerId: "s", etaMinutes: 500 })).toThrow();
  });

  it("builds a snapped neighbor event", () => {
    const now = new Date("2026-11-18T23:00:00Z");
    const evt = neighborToDeliveryEvent(
      "sub1",
      { lat: 40.67521, lon: -74.49311 },
      { retailerId: "shop1", etaMinutes: 30, areaLabel: "near Main St" },
      now,
    );
    expect(evt.sourceAdapter).toBe("neighbor");
    expect(evt.postedBySubscriberId).toBe("sub1");
    expect(evt.destination.lat).not.toBe(40.67521);
    expect(evt.piggybackWindowMinutes).toBe(15);
    expect(evt.externalId).toBe(`neighbor-sub1-${now.getTime()}`);
  });
});

describe("copy", () => {
  it("never promises free delivery", () => {
    const t = runNotificationText({ shopName: "Tony's", etaMinutes: 30, areaLabel: "near Main St" });
    expect(t.title).toBe("Tony's is delivering near Main St");
    expect(`${t.title} ${t.body}`.toLowerCase()).not.toContain("free");
  });

  it("adds the shop perk only when set", () => {
    const t = runNotificationText({ shopName: "Tony's", sameRunPerk: "No delivery fee on same-run orders" });
    expect(t.body).toContain("No delivery fee on same-run orders.");
  });

  it("gives a line to say when ordering", () => {
    expect(sameRunAsk("near Main St")).toContain("near Main St");
  });
});
