import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-brand-600">Piggy</span>back
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/retailers" className="hover:text-brand-600">For retailers</Link>
          <Link href="/consumers" className="hover:text-brand-600">For neighbors</Link>
          <Link href="/signin" className="hover:text-brand-600">Sign in</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Free delivery when the driver is already coming your way
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">
          Piggyback on your neighbor&apos;s delivery.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
          When a pizza shop, liquor store, or local grocer sends a driver to a
          nearby address, we ping everyone within a few blocks. Order quickly
          and the same driver drops yours off too — no extra delivery fee.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <Link
            href="/consumers"
            className="rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            I want free delivery
          </Link>
          <Link
            href="/retailers"
            className="rounded-lg border border-neutral-300 px-6 py-3 text-base font-semibold text-neutral-800 hover:border-brand-600 hover:text-brand-700"
          >
            I run a delivery shop
          </Link>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-3">
          <Feature
            title="For shops"
            body="Tap one button when your driver heads out. Nearby subscribers get pinged. Extra orders on the same trip, no new delivery cost."
          />
          <Feature
            title="For neighbors"
            body="Get notified only when a driver is actually close. Order in the next few minutes to share the delivery for free."
          />
          <Feature
            title="For drivers"
            body="Same route, more stops, more pay. No app-switching or guessing where the next order is coming from."
          />
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-neutral-500">
        &copy; {new Date().getFullYear()} Piggyback. All rights reserved.
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-neutral-600">{body}</p>
    </div>
  );
}
