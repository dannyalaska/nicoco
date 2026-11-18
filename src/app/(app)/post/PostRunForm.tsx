"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ETAS = [20, 30, 45, 60];

export function PostRunForm({ shops }: { shops: { id: string; name: string; km: number }[] }) {
  const router = useRouter();
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [eta, setEta] = useState(30);
  const [area, setArea] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMsg(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ retailerId: shopId, etaMinutes: eta, areaLabel: area || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? `failed (${res.status})`);
      setState("done");
      setMsg(
        j.alreadyExisted
          ? "You already posted this run."
          : j.notified === 0
            ? "Posted. Nobody nearby is listening right now, but it counts."
            : `Posted. ${j.notified} ${j.notified === 1 ? "neighbor" : "neighbors"} pinged.`,
      );
      router.refresh();
    } catch (err) {
      setMsg((err as Error).message);
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <label className="block text-sm font-medium" htmlFor="shop">Where did you order?</label>
        <select
          id="shop"
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
        >
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.km.toFixed(1)} km)
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-sm font-medium">When is it due?</span>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {ETAS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setEta(m)}
              className={[
                "rounded-md border px-2 py-2 text-sm font-semibold",
                eta === m
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100"
                  : "border-neutral-300 dark:border-neutral-700",
              ].join(" ")}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="area">
          Street or landmark (optional)
        </label>
        <input
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          maxLength={60}
          placeholder="near Main St and Valley Rd"
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <p className="mt-1 text-xs text-neutral-500">No house numbers. We strip digits anyway.</p>
      </div>

      <button
        type="submit"
        disabled={state === "sending" || state === "done" || !shopId}
        className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "sending" ? "Posting…" : state === "done" ? "Posted" : "Piggyback it"}
      </button>
      {msg && (
        <p className={state === "error" ? "text-sm text-red-600" : "text-sm text-green-700 dark:text-green-400"}>
          {msg}
        </p>
      )}
    </form>
  );
}
