import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings · Piggyback" };

export default async function SettingsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const s = await db.subscriber.findUnique({ where: { userId } });
  if (!s) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <SettingsForm
        initial={{
          radiusMeters: s.radiusMeters,
          quietStartHour: s.quietStartHour,
          quietEndHour: s.quietEndHour,
          maxPerDay: s.maxPerDay,
          timeZone: s.timeZone,
          active: s.active,
        }}
      />
    </div>
  );
}
