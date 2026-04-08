import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";

/**
 * Admin layout. Guards by ADMIN_EMAILS env var. The list is read
 * through `isAdminEmail` in src/lib/env.ts.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminEmail(session.user.email)) redirect("/home");

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-bold">
            <span className="text-brand-600">Piggy</span>back · admin
          </Link>
          <span className="text-sm text-neutral-500">{session.user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
