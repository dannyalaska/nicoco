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
        Free delivery, but only when a driver is already coming.
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        Tell us your neighborhood and turn on notifications. When a
        participating shop&apos;s driver heads toward your block, you&apos;ll
        get a ping. Order in the next few minutes and the same driver drops
        yours off too — no delivery fee.
      </p>

      <ul className="mt-10 space-y-4 text-neutral-700">
        <li>• No ads. No spam. Only pings when a driver is actually close.</li>
        <li>• Works with any participating shop, not a single app.</li>
        <li>• Quiet hours so you&apos;re not woken up for a 2am burrito run.</li>
      </ul>

      <section className="mt-16 rounded-2xl border border-neutral-200 p-8">
        <h2 className="text-2xl font-bold">Get on the waitlist</h2>
        <p className="mt-2 text-neutral-600">
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
