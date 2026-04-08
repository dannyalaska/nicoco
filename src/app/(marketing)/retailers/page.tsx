import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata = { title: "Piggyback for retailers" };

export default function RetailersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-brand-600">
        ← Back
      </Link>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">
        Every delivery run is an unsold second order.
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        Piggyback pings nearby neighbors the moment your driver leaves the
        shop. If even one in ten orders, you just doubled revenue on that trip
        at zero marginal delivery cost. No POS integration required — tap a
        button in the back office, we handle the rest.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <Point title="Works in 30 seconds">
          No POS integration needed. Tap a button when a driver leaves. We
          also offer a webhook for shops that want automated dispatch.
        </Point>
        <Point title="Built for your radius">
          We only ping neighbors within a few blocks of the destination — not
          spam for your whole city.
        </Point>
        <Point title="You keep the customer">
          The notification links back to your ordering page. We don&apos;t
          take a cut of the order.
        </Point>
        <Point title="Measure the lift">
          Dashboard shows orders driven by Piggyback pings so you can prove
          the ROI.
        </Point>
      </div>

      <section className="mt-16 rounded-2xl border border-neutral-200 p-8">
        <h2 className="text-2xl font-bold">Get on the pilot list</h2>
        <p className="mt-2 text-neutral-600">
          We&apos;re onboarding a small group of independent shops and
          regional chains first. Tell us about yours.
        </p>
        <div className="mt-6">
          <WaitlistForm mode="retailer" />
        </div>
      </section>
    </main>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-neutral-600">{children}</p>
    </div>
  );
}
