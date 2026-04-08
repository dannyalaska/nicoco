import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Retailer dashboard layout. Requires the logged-in user to be linked
 * to a Retailer via `RetailerUser`. If they aren't, we bounce them to
 * the retailer waitlist page.
 */
export default async function RetailerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/signin");

  const ru = await db.retailerUser.findUnique({
    where: { userId },
    include: { retailer: true },
  });
  if (!ru) redirect("/retailers");

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="font-bold">
              <span className="text-brand-600">Piggy</span>back
            </Link>
            <span className="text-sm text-neutral-500">· {ru.retailer.name}</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-brand-600">
              Overview
            </Link>
            <Link href="/dispatch" className="hover:text-brand-600">
              Dispatch
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
