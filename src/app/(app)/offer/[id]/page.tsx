import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderNowButton } from "./OrderNowButton";
import { CountdownClient } from "./CountdownClient";

export const metadata = { title: "Offer — Piggyback" };

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

  return (
    <div className="space-y-6">
      <Link href="/home" className="text-sm text-neutral-500 hover:text-brand-600">
        ← Back
      </Link>
      <div className="rounded-xl border border-brand-600 bg-white p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Free delivery
        </p>
        <h1 className="mt-2 text-2xl font-bold">{delivery.retailer.name}</h1>
        {delivery.destAddress && (
          <p className="mt-1 text-sm text-neutral-600">Heading to {delivery.destAddress}</p>
        )}
        {notification && (
          <p className="mt-1 text-sm text-neutral-600">
            {notification.distanceMeters} m from you
          </p>
        )}

        <div className="mt-6 rounded-lg bg-neutral-50 p-4 text-center">
          {expired ? (
            <p className="font-semibold text-neutral-500">Window closed.</p>
          ) : (
            <>
              <p className="text-sm text-neutral-600">Order within</p>
              <CountdownClient expiresAt={expiresAt.toISOString()} />
            </>
          )}
        </div>

        {!expired && notification && (
          <div className="mt-6">
            <OrderNowButton
              deliveryId={delivery.id}
              alreadyOrdered={notification.orderPlaced}
            />
          </div>
        )}
      </div>

      <p className="text-center text-xs text-neutral-500">
        Demo only — the &quot;order now&quot; button is a stub. In production
        this deep-links into the shop&apos;s ordering flow.
      </p>
    </div>
  );
}
