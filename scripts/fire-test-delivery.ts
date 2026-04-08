/**
 * Fire a signed webhook delivery event at the local server. Useful for
 * testing the webhook adapter end-to-end without building an external
 * integration.
 *
 * Usage:
 *   npx tsx scripts/fire-test-delivery.ts \
 *     --retailer <retailerId> \
 *     --lat 37.7599 --lon -122.4148 \
 *     [--address "3150 24th St"] \
 *     [--eta 5] \
 *     [--url http://localhost:3000]
 *
 * Reads the retailer's webhookSecret directly from the DB, computes
 * the HMAC, and POSTs. This means the script must have DATABASE_URL
 * in its env (.env.local works).
 */
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const retailerId = arg("--retailer");
  const lat = Number(arg("--lat"));
  const lon = Number(arg("--lon"));
  const address = arg("--address");
  const eta = arg("--eta") ? Number(arg("--eta")) : undefined;
  const baseUrl = arg("--url") ?? "http://localhost:3000";

  if (!retailerId || Number.isNaN(lat) || Number.isNaN(lon)) {
    console.error("usage: tsx scripts/fire-test-delivery.ts --retailer <id> --lat <n> --lon <n>");
    process.exit(2);
  }

  const db = new PrismaClient();
  const retailer = await db.retailer.findUnique({
    where: { id: retailerId },
    select: { webhookSecret: true, name: true },
  });
  await db.$disconnect();
  if (!retailer) {
    console.error(`retailer ${retailerId} not found`);
    process.exit(1);
  }

  const body = JSON.stringify({
    externalId: `cli-${Date.now()}`,
    destination: { lat, lon, address },
    dispatchedAt: new Date().toISOString(),
    etaMinutes: eta,
  });

  const signature =
    "sha256=" + createHmac("sha256", retailer.webhookSecret).update(body).digest("hex");

  const res = await fetch(`${baseUrl}/api/ingest/webhook/${retailerId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-piggyback-signature": signature,
    },
    body,
  });
  const text = await res.text();
  console.log(`→ ${res.status}`, text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
