import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSubscriberLocation, listShopsNear } from "@/lib/geo";
import { PostRunForm } from "./PostRunForm";

export const metadata = { title: "Piggyback it" };

export default async function PostRunPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const subscriber = await db.subscriber.findUnique({ where: { userId } });
  if (!subscriber) return null;

  const where = await getSubscriberLocation(subscriber.id);
  if (!where) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Piggyback it</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          We need your rough location first so we know which neighbors to ping.
        </p>
        <Link className="underline hover:text-brand-600" href="/onboarding">
          Finish setup
        </Link>
      </div>
    );
  }

  const shops = await listShopsNear(where);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Just ordered?</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
          Tell your neighbors a driver is coming. They can order from the same
          shop and ask for the same run. We only share your block, never your
          address or name.
        </p>
      </div>
      {shops.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500 dark:border-neutral-700">
          No shops listed near you yet.
        </p>
      ) : (
        <PostRunForm shops={shops.map((s) => ({ id: s.id, name: s.name, km: s.distance_m / 1000 }))} />
      )}
    </div>
  );
}
