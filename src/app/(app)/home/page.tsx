import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Home · Piggyback" };

export default async function HomePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const subscriber = await db.subscriber.findUnique({ where: { userId } });
  if (!subscriber) return null;

  const [notifications, myRuns] = await Promise.all([
    db.notification.findMany({
      where: { subscriberId: subscriber.id },
      orderBy: { sentAt: "desc" },
      take: 20,
      include: { delivery: { include: { retailer: true } } },
    }),
    db.delivery.findMany({
      where: { postedById: subscriber.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        retailer: { select: { name: true } },
        _count: { select: { notifications: { where: { orderPlaced: true } } } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/post"
        className="block rounded-xl bg-brand-600 p-5 text-center text-white shadow-sm hover:bg-brand-700"
      >
        <span className="block text-lg font-bold">Just ordered? Piggyback it</span>
        <span className="block text-sm opacity-90">Let neighbors ride the same delivery run</span>
      </Link>

      {myRuns.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Your runs</h2>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            {myRuns.map((r) => (
              <li key={r.id}>
                {r.retailer.name}, {timeAgo(r.createdAt)}:{" "}
                {r._count.notifications === 0
                  ? "no neighbors joined yet"
                  : `${r._count.notifications} ${r._count.notifications === 1 ? "neighbor" : "neighbors"} joined`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <h1 className="text-3xl font-bold">Runs near you</h1>
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          <p>Nothing yet. We&apos;ll ping you when a neighbor&apos;s delivery is headed your way.</p>
          <p className="mt-2 text-sm">
            Need to re-do setup?{" "}
            <Link className="underline hover:text-brand-600" href="/onboarding">
              Go to onboarding
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={`/offer/${n.deliveryId}`}
                className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-brand-600 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="font-semibold">{n.delivery.retailer.name}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  {n.distanceMeters} m away · sent {timeAgo(n.sentAt)}
                </div>
                {n.orderPlaced && (
                  <div className="mt-1 text-xs font-medium text-green-700">Ordered</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
