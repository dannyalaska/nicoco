import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Layout for the consumer-facing PWA. Guarantees three things:
 *   - the user is signed in
 *   - a Subscriber row exists for them
 *   - the service worker gets registered on the client
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Ensure a Subscriber row exists. Cheaper than a findFirst-or-create
  // in user code and keeps the rest of the app simple.
  const userId = (session.user as { id?: string }).id;
  if (userId) {
    await db.subscriber.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/home" className="font-bold">
            <span className="text-brand-600">Piggy</span>back
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-500">
            <Link href="/home" className="hover:text-brand-600">Home</Link>
            <Link href="/post" className="hover:text-brand-600">Piggyback it</Link>
            <Link href="/settings" className="hover:text-brand-600">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      <ServiceWorkerRegister />
    </div>
  );
}

/** Inline client component to register the service worker once on mount. */
function ServiceWorkerRegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function (e) {
                console.warn('SW register failed', e);
              });
            });
          }
        `,
      }}
    />
  );
}
