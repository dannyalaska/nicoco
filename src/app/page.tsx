import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-brand-600">Piggy</span>back
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/retailers" className="hover:text-brand-600">For shops</Link>
          <Link href="/signin" className="hover:text-brand-600">Sign in</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          The driver is already coming to your block
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">
          Piggyback on your neighbor&apos;s delivery.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
          When a neighbor orders from a local pizza place, deli or liquor store
          that runs its own drivers, they tap one button. Everyone within a few
          blocks gets a heads up. Order from the same shop, ask for the same
          run, and skip the extra trip.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <Link
            href="/signin"
            className="rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Join your block
          </Link>
          <Link
            href="/consumers"
            className="rounded-lg border border-neutral-300 px-6 py-3 text-base font-semibold hover:border-brand-600 hover:text-brand-700 dark:border-neutral-700"
          >
            How it works
          </Link>
        </div>
      </section>

      <section className="bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-3">
          <Feature
            title="1. A neighbor orders"
            body="From a local shop with its own drivers, the normal way. Then they tap Piggyback it. We share their block, never their address or name."
          />
          <Feature
            title="2. You get a heads up"
            body="Only when a run is a few blocks away. Quiet hours and a daily cap keep it from turning into spam."
          />
          <Feature
            title="3. Ride the same run"
            body="Order from the shop's own site or by phone and ask them to send it with the other delivery. Piggyback never takes a payment."
          />
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-neutral-500">
        &copy; {new Date().getFullYear()} Piggyback
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">{body}</p>
    </div>
  );
}
