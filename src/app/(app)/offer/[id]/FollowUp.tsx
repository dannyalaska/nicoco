"use client";

import { useState } from "react";

type Answer = boolean | null;

/** Two quick questions after a piggyback order. These numbers sell shops later. */
export function FollowUp(props: { deliveryId: string; sameRun: Answer; feeWaived: Answer }) {
  const [sameRun, setSameRun] = useState<Answer>(props.sameRun);
  const [feeWaived, setFeeWaived] = useState<Answer>(props.feeWaived);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: { sameRun?: boolean; feeWaived?: boolean }) {
    setError(null);
    try {
      const res = await fetch(`/api/notifications/${props.deliveryId}/followup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      if (patch.sameRun !== undefined) setSameRun(patch.sameRun);
      if (patch.feeWaived !== undefined) setFeeWaived(patch.feeWaived);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
      <Question
        label="Did it come on the same run?"
        value={sameRun}
        onAnswer={(v) => save({ sameRun: v })}
      />
      <Question
        label="Did they drop or cut the delivery fee?"
        value={feeWaived}
        onAnswer={(v) => save({ feeWaived: v })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Question(props: { label: string; value: Answer; onAnswer: (v: boolean) => void }) {
  return (
    <div>
      <p className="text-sm font-medium">{props.label}</p>
      <div className="mt-2 flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => props.onAnswer(v)}
            className={[
              "rounded-md border px-4 py-1.5 text-sm font-semibold",
              props.value === v
                ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100"
                : "border-neutral-300 dark:border-neutral-600",
            ].join(" ")}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
