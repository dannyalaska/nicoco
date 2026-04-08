import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Dashboard — Piggyback" };

export default async function RetailerDashboard() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const ru = await db.retailerUser.findUnique({
    where: { userId },
    include: { retailer: true },
  });
  if (!ru) return null;

  const [deliveryCount, totalNotified, totalClicks, totalOrders, recent] = await Promise.all([
    db.delivery.count({ where: { retailerId: ru.retailerId } }),
    db.notification.count({ where: { delivery: { retailerId: ru.retailerId } } }),
    db.notification.count({
      where: { delivery: { retailerId: ru.retailerId }, clickedAt: { not: null } },
    }),
    db.notification.count({
      where: { delivery: { retailerId: ru.retailerId }, orderPlaced: true },
    }),
    db.delivery.findMany({
      where: { retailerId: ru.retailerId },
      orderBy: { dispatchedAt: "desc" },
      take: 10,
      include: { _count: { select: { notifications: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Overview</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Deliveries dispatched" value={deliveryCount} />
        <Stat label="Neighbors notified" value={totalNotified} />
        <Stat label="Notifications clicked" value={totalClicks} />
        <Stat label="Piggyback orders" value={totalOrders} />
      </div>

      <section>
        <h2 className="text-xl font-semibold">Recent dispatches</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-neutral-500">No dispatches yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{d.destAddress ?? "(unspecified address)"}</div>
                  <div className="text-sm text-neutral-500">
                    {d.sourceAdapter} · {new Date(d.dispatchedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-neutral-600">
                  {d._count.notifications} notified
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-3xl font-extrabold">{value}</div>
    </div>
  );
}
