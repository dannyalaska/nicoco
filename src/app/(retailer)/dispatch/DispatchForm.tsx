"use client";

import { useState } from "react";

export function DispatchForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [result, setResult] = useState<{ notified: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      destLat: Number(fd.get("destLat")),
      destLon: Number(fd.get("destLon")),
      destAddress: String(fd.get("destAddress") || ""),
      etaMinutes: fd.get("etaMinutes") ? Number(fd.get("etaMinutes")) : undefined,
      piggybackWindowMinutes: fd.get("piggybackWindowMinutes")
        ? Number(fd.get("piggybackWindowMinutes"))
        : undefined,
    };
    try {
      const res = await fetch("/api/ingest/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? `failed (${res.status})`);
      setResult({ notified: j.notified });
      setState("ok");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field name="destLat" label="Destination latitude" required type="number" step="any" />
        <Field name="destLon" label="Destination longitude" required type="number" step="any" />
      </div>
      <Field name="destAddress" label="Destination address (shown to customers)" />
      <div className="grid grid-cols-2 gap-4">
        <Field name="etaMinutes" label="ETA minutes" type="number" />
        <Field
          name="piggybackWindowMinutes"
          label="Piggyback window (minutes)"
          type="number"
          placeholder="10"
        />
      </div>
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "sending" ? "Dispatching…" : "Dispatch delivery"}
      </button>
      {result && (
        <p className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
          Pinged {result.notified} {result.notified === 1 ? "neighbor" : "neighbors"}.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function Field(props: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-800" htmlFor={props.name}>
        {props.label}
        {props.required && " *"}
      </label>
      <input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        step={props.step}
        required={props.required}
        placeholder={props.placeholder}
        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
      />
    </div>
  );
}
