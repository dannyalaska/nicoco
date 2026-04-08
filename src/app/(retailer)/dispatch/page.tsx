import { DispatchForm } from "./DispatchForm";

export const metadata = { title: "Dispatch — Piggyback" };

export default function DispatchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dispatch a delivery</h1>
      <p className="text-neutral-600">
        When your driver heads out, enter the destination below. We&apos;ll
        ping everyone on the Piggyback list within a few blocks.
      </p>
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <DispatchForm />
      </div>
    </div>
  );
}
