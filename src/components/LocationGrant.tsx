"use client";

import { useState } from "react";

export function LocationGrant({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<"idle" | "asking" | "saving" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function grant() {
    if (!("geolocation" in navigator)) {
      setError("Your browser doesn't support location.");
      setState("error");
      return;
    }
    setState("asking");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState("saving");
        try {
          const res = await fetch("/api/subscribers/location", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            }),
          });
          if (!res.ok) throw new Error(`save failed (${res.status})`);
          setState("ok");
          onDone();
        } catch (err) {
          setError((err as Error).message);
          setState("error");
        }
      },
      (err) => {
        setError(err.message);
        setState("error");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={grant}
        disabled={state === "asking" || state === "saving"}
        className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "asking"
          ? "Waiting for location…"
          : state === "saving"
            ? "Saving…"
            : state === "ok"
              ? "Location set ✓"
              : "Share my location"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
