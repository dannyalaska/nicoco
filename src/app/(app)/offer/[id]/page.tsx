import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sameRunAsk } from "@/lib/neighbor";
import { OrderNowButton } from "./OrderNowButton";
import { CountdownClient } from "./CountdownClient";
import { FollowUp } from "./FollowUp";

export const metadata = { title: "Offer · Piggyback" };

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const subscriber = await db.subscriber.findUnique({ where: { userId } });
  if (!subscriber) return notFound();

  const delivery = await db.delivery.findUnique({
    where: { id },
    include: { retailer: true },
  });
  if (!delivery) return notFound();

  const notification = await db.notification.findUnique({
    where: { deliveryId_subscriberId: { deliveryId: id, subscriberId: subscriber.id } },
  });

  const expiresAt = new Date(
    delivery.dispatchedAt.getTime() + delivery.piggybackWindowMinutes * 60_000,
  );
  const expired = Date.now() > expiresAt.getTime();
  const shop = delivery.retailer;
  const area = delivery.areaLabel ?? delivery.destAddress;
  const ask = sameRunAsk(delivery.areaLabel);

  return (
    <div className="space-y-6">
      <Link href="/home" className="text-sm text-neutral-500 hover:text-brand-600">
        ← Back
      </Link>
      <div className="rounded-xl border border-brand-600 bg-white p-6 dark:bg-neutral-900">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Driver heading your way
        </p>
        <h1 className="mt-2 text-2xl font-bold">{shop.name}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {area ? `Going ${area}` : "Going to a neighbor's block"}
          {delivery.etaMinutes ? `, due in about ${delivery.etaMinutes} min from when it was posted` : ""}.
        </p>
        {notification && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            About {notification.distanceMeters} m from you
          </p>
        )}
        {shop.sameRunPerk && (
          <p className="mt-3 rounded-md bg-green-50 p-2 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
            {shop.sameRunPerk}
          </p>
        )}

        <div className="mt-6 rounded-lg bg-neutral-50 p-4 text-center dark:bg-neutral-800">
          {expired ? (
            <p className="font-semibold text-neutral-500">This run has probably left.</p>
          ) : (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Order within</p>
              <CountdownClient expiresAt={expiresAt.toISOString()} />
            </>
          )}
        </div>

        {!expired && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              When you order, say or type:
            </p>
            <p className="rounded-md border border-neutral-200 p-3 text-sm italic dark:border-neutral-700">
              {ask}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shop.orderUrl && (
                <a
                  href={shop.orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-brand-600 px-5 py-3 text-center font-semibold text-white hover:bg-brand-700"
                >
                  Order on their site
                </a>
              )}
              {shop.phone && (
                <a
                  href={`tel:${shop.phone.replace(/[^\d+]/g, "")}`}
                  className="rounded-lg border border-brand-600 px-5 py-3 text-center font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-100 dark:hover:bg-brand-900/40"
                >
                  Call {shop.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {notification && (
          <div className="mt-6">
            {notification.orderPlaced ? (
              <FollowUp
                deliveryId={delivery.id}
                sameRun={notification.sameRun}
                feeWaived={notification.feeWaived}
              />
            ) : (
              !expired && <OrderNowButton deliveryId={delivery.id} alreadyOrdered={false} />
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-neutral-500">
        The shop decides whether to batch orders and what to charge. Piggyback
        never takes payment.
      </p>
    </div>
  );
}
