import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Your offers — Piggyback" };

export default async function HomePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const subscriber = await db.subscriber.findUnique({ where: { userId } });
  if (!subscriber) return null;

  const notifications = await db.notification.findMany({
    where: { subscriberId: subscriber.id },
    orderBy: { sentAt: "desc" },
    take: 20,
    include: { delivery: { include: { retailer: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your offers</h1>
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          <p>No offers yet. We&apos;ll ping you next time a driver is nearby.</p>
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
                className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-brand-600"
              >
                <div className="font-semibold">{n.delivery.retailer.name}</div>
                <div className="text-sm text-neutral-600">
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
