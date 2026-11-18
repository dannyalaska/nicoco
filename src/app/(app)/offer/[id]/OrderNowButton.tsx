"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** "I ordered" self-report, tapped after ordering on the shop's site or phone. */
export function OrderNowButton({
  deliveryId,
  alreadyOrdered,
}: {
  deliveryId: string;
  alreadyOrdered: boolean;
}) {
  const router = useRouter();
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
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  if (ordered) {
    return (
      <p className="rounded-lg bg-green-50 p-3 text-center font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
        Nice. We&apos;ll ask how it went.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={click}
        disabled={working}
        className="w-full rounded-lg border border-neutral-300 px-5 py-3 font-semibold hover:border-brand-600 disabled:opacity-60 dark:border-neutral-700"
      >
        {working ? "Saving…" : "I ordered"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
