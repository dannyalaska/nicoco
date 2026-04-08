"use client";

import { useState } from "react";

export function OrderNowButton({
  deliveryId,
  alreadyOrdered,
}: {
  deliveryId: string;
  alreadyOrdered: boolean;
}) {
  const [ordered, setOrdered] = useState(alreadyOrdered);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function click() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications/${deliveryId}/order`, { method: "POST" });
      if (!res.ok) throw new Error(`request failed (${res.status})`);
      setOrdered(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  if (ordered) {
    return (
      <p className="rounded-lg bg-green-50 p-3 text-center font-semibold text-green-700">
        Ordered! ✓ (demo)
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={click}
        disabled={working}
        className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {working ? "Placing…" : "Order now (demo)"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
