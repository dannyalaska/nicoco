"use client";

import { useState } from "react";

type Settings = {
  radiusMeters: number;
  quietStartHour: number;
  quietEndHour: number;
  maxPerDay: number;
  timeZone: string;
  active: boolean;
};

const RADII = [
  { m: 300, label: "My street (300 m)" },
  { m: 600, label: "A few blocks (600 m)" },
  { m: 1200, label: "The neighborhood (1.2 km)" },
];

function hourLabel(h: number) {
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${ampm}`;
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(next: Settings) {
    setS(next);
    setState("saving");
    try {
      const res = await fetch("/api/subscribers/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      setState("saved");
    } catch {
      setState("error");
    }
  }

  const select = "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950";

  return (
    <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <label className="flex items-center justify-between">
        <span className="font-medium">Pings on</span>
        <input
          type="checkbox"
          checked={s.active}
          onChange={(e) => save({ ...s, active: e.target.checked })}
          className="h-5 w-5"
        />
      </label>

      <div>
        <label className="block text-sm font-medium" htmlFor="radius">How far away</label>
        <select id="radius" className={select} value={s.radiusMeters}
          onChange={(e) => save({ ...s, radiusMeters: Number(e.target.value) })}>
          {RADII.map((r) => <option key={r.m} value={r.m}>{r.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="qs">Quiet from</label>
          <select id="qs" className={select} value={s.quietStartHour}
            onChange={(e) => save({ ...s, quietStartHour: Number(e.target.value) })}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="qe">Until</label>
          <select id="qe" className={select} value={s.quietEndHour}
            onChange={(e) => save({ ...s, quietEndHour: Number(e.target.value) })}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="max">Most pings per day</label>
        <select id="max" className={select} value={s.maxPerDay}
          onChange={(e) => save({ ...s, maxPerDay: Number(e.target.value) })}>
          {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <button
        type="button"
        className="text-sm underline"
        onClick={() => save({ ...s, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
      >
        Use this device&apos;s time zone ({s.timeZone})
      </button>

      <p className="text-xs text-neutral-500">
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Couldn't save. Try again." : " "}
      </p>
    </div>
  );
}
