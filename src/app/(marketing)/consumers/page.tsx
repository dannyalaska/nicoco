import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata = { title: "Piggyback for neighbors" };

export default function ConsumersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-brand-600">
        ← Back
      </Link>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">
        Your neighbor already ordered. Ride the same run.
      </h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        Turn on notifications and share a rough location. When someone a few
        blocks over orders from a local shop with its own drivers, you get a
        heads up. Order from that shop and ask them to send yours on the same
        run. Some shops drop the fee when they do.
      </p>

      <ul className="mt-10 space-y-4 text-neutral-700 dark:text-neutral-200">
        <li>• Only your block is shared when you post a run. Never your address or name.</li>
        <li>• Quiet hours and a daily cap. No ads.</li>
        <li>• Works with the shop&apos;s own site or phone. Piggyback never takes payment.</li>
        <li>• On iPhone, add Piggyback to your Home Screen to get notifications.</li>
      </ul>

      <section className="mt-16 rounded-2xl border border-neutral-200 p-8 dark:border-neutral-800">
        <h2 className="text-2xl font-bold">Get on the waitlist</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
          We&apos;re seeding one neighborhood at a time. Tell us where you
          are and we&apos;ll let you know when Piggyback goes live near you.
        </p>
        <div className="mt-6">
          <WaitlistForm mode="consumer" />
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          Already on the pilot?{" "}
          <Link className="underline hover:text-brand-600" href="/signin">
            Sign in here
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
