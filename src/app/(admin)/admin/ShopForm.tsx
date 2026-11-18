"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ShopForm() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const str = (k: string) => String(fd.get(k) ?? "").trim() || undefined;
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/shops", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: str("name"),
          address: str("address"),
          lat: Number(fd.get("lat")),
          lon: Number(fd.get("lon")),
          phone: str("phone"),
          orderUrl: str("orderUrl") ?? "",
          category: str("category"),
          sameRunPerk: str("sameRunPerk"),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? `failed (${res.status})`);
      setState("ok");
      form.reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  const input = "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950";
  const field = (name: string, label: string, opts: { required?: boolean; type?: string; placeholder?: string; step?: string } = {}) => (
    <div>
      <label className="block text-sm font-medium" htmlFor={`shop-${name}`}>
        {label}{opts.required && " *"}
      </label>
      <input id={`shop-${name}`} name={name} className={input} required={opts.required}
        type={opts.type ?? "text"} step={opts.step} placeholder={opts.placeholder} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("name", "Shop name", { required: true })}
        {field("category", "Category", { placeholder: "pizza, chinese, liquor" })}
      </div>
      {field("address", "Address", { required: true })}
      <div className="grid grid-cols-2 gap-4">
        {field("lat", "Latitude", { required: true, type: "number", step: "any" })}
        {field("lon", "Longitude", { required: true, type: "number", step: "any" })}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("phone", "Phone")}
        {field("orderUrl", "Online order link", { type: "url" })}
      </div>
      {field("sameRunPerk", "Same-run perk (only once the shop agrees)", { placeholder: "No delivery fee on same-run orders" })}
      <button type="submit" disabled={state === "saving"}
        className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {state === "saving" ? "Saving…" : "Add shop"}
      </button>
      {state === "ok" && <p className="text-sm text-green-700">Added.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
