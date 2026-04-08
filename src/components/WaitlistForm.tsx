"use client";

import { useState } from "react";

type Mode = "retailer" | "consumer";

export function WaitlistForm({ mode }: { mode: Mode }) {
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`/api/waitlist/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `request failed (${res.status})`);
      }
      setState("ok");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        Thanks — you&apos;re on the list. We&apos;ll be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "retailer" ? (
        <>
          <Field name="name" label="Your name" required />
          <Field name="email" label="Email" type="email" required />
          <Field name="business" label="Business name" required />
          <Field name="city" label="City" />
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              POS / ordering system
            </label>
            <select
              name="posSystem"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
              defaultValue=""
            >
              <option value="">Choose one</option>
              <option>Square</option>
              <option>Toast</option>
              <option>Clover</option>
              <option>ChowNow / Slice</option>
              <option>Own website</option>
              <option>None / pen and paper</option>
              <option>Other</option>
            </select>
          </div>
          <Field name="weeklyVolume" label="Rough weekly delivery count" />
          <Field name="note" label="Anything else?" textarea />
        </>
      ) : (
        <>
          <Field name="email" label="Email" type="email" required />
          <Field name="zip" label="ZIP code" />
          <Field name="note" label="What would you order?" textarea />
        </>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "submitting" ? "Submitting…" : "Join the waitlist"}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function Field(props: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const base = "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2";
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-800" htmlFor={props.name}>
        {props.label}
        {props.required && " *"}
      </label>
      {props.textarea ? (
        <textarea id={props.name} name={props.name} rows={3} className={base} />
      ) : (
        <input
          id={props.name}
          name={props.name}
          type={props.type ?? "text"}
          required={props.required}
          className={base}
        />
      )}
    </div>
  );
}
