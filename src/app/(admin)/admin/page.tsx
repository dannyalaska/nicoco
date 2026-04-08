import { db } from "@/lib/db";
import { TestDeliveryForm } from "./TestDeliveryForm";

export const metadata = { title: "Admin — Piggyback" };

export default async function AdminPage() {
  const [retailers, subscribers, pushSubs, leads, recent] = await Promise.all([
    db.retailer.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.subscriber.count({ where: { active: true } }),
    db.pushSubscription.count(),
    db.waitlistLead.count(),
    db.delivery.findMany({
      orderBy: { dispatchedAt: "desc" },
      take: 10,
      include: {
        retailer: { select: { name: true } },
        _count: { select: { notifications: true } },
      },
    }),
  ]);

  // Count clicks and orders per recent delivery.
  const deliveryIds = recent.map((d) => d.id);
  const clickCounts = await db.notification.groupBy({
    by: ["deliveryId"],
    where: { deliveryId: { in: deliveryIds }, clickedAt: { not: null } },
    _count: { _all: true },
  });
  const orderCounts = await db.notification.groupBy({
    by: ["deliveryId"],
    where: { deliveryId: { in: deliveryIds }, orderPlaced: true },
    _count: { _all: true },
  });
  const byId: Record<string, { notified: number; clicks: number; orders: number }> = {};
  for (const d of recent) byId[d.id] = { notified: d._count.notifications, clicks: 0, orders: 0 };
  for (const row of clickCounts) if (byId[row.deliveryId]) byId[row.deliveryId].clicks = row._count._all;
  for (const row of orderCounts) if (byId[row.deliveryId]) byId[row.deliveryId].orders = row._count._all;

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Retailers" value={retailers.length} />
        <Stat label="Active subscribers" value={subscribers} />
        <Stat label="Push endpoints" value={pushSubs} />
        <Stat label="Waitlist leads" value={leads} />
      </section>

      <section>
        <h2 className="text-xl font-semibold">Fire test delivery</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Pick a retailer, pick a destination, and run the full geo-match +
          push fanout pipeline end-to-end.
        </p>
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
          <TestDeliveryForm
            retailers={retailers.map((r) => ({ id: r.id, name: r.name, address: r.address }))}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Recent deliveries</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-neutral-500">None yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-2">Retailer</th>
                <th>Dispatched</th>
                <th>Source</th>
                <th className="text-right">Notified</th>
                <th className="text-right">Clicks</th>
                <th className="text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {recent.map((d) => {
                const s = byId[d.id]!;
                return (
                  <tr key={d.id}>
                    <td className="py-2">{d.retailer.name}</td>
                    <td>{new Date(d.dispatchedAt).toLocaleString()}</td>
                    <td>{d.sourceAdapter}</td>
                    <td className="text-right">{s.notified}</td>
                    <td className="text-right">{s.clicks}</td>
                    <td className="text-right">{s.orders}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
