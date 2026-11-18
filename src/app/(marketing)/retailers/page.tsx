import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata = { title: "Piggyback for shops" };

export default function RetailersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-brand-600">
        ← Back
      </Link>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">
        Two orders, one trip.
      </h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        When one of your customers orders, Piggyback lets their neighbors
        know your driver is coming to that block. Those neighbors order from
        you directly and ask for the same run. You don&apos;t install
        anything, change anything or pay anything.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <Point title="Nothing to set up">
          Neighbors post the run, not you. Orders come in through your own
          phone line and website like any other order.
        </Point>
        <Point title="Built for your radius">
          We only ping neighbors within a few blocks of the destination — not
          spam for your whole city.
        </Point>
        <Point title="You keep the customer">
          The heads up links to your ordering page or phone. We never touch
          the payment and take no cut.
        </Point>
        <Point title="Optional: a same-run perk">
          Shops that drop or cut the delivery fee on same-run orders get that
          shown on every heads up, which pulls in more of those orders.
        </Point>
      </div>

      <section className="mt-16 rounded-2xl border border-neutral-200 p-8 dark:border-neutral-800">
        <h2 className="text-2xl font-bold">Want the same-run perk listed?</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
          Tell us about your shop and what you&apos;d offer on same-run orders.
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
      <p className="mt-1 text-neutral-600 dark:text-neutral-300">{children}</p>
    </div>
  );
}
