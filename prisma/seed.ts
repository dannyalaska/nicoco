/**
 * Piggyback seed script.
 *
 * Creates:
 *   - 2 demo retailers (one pizza shop, one liquor store) with geography locations
 *   - 3 demo subscribers near retailer #1's address
 *
 * Run: npm run db:seed
 *
 * The PostGIS `geography` columns are set with raw SQL because Prisma's
 * `Unsupported` type blocks normal writes.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

// All lat/lon are around Mission District, SF for easy Chrome DevTools spoofing.
const TONYS_PIZZA = { lat: 37.7599, lon: -122.4148 };
const VALENCIA_LIQUOR = { lat: 37.7587, lon: -122.4214 };

async function setGeography(
  table: string,
  column: string,
  id: string,
  point: { lat: number; lon: number },
) {
  await db.$executeRawUnsafe(
    `UPDATE "${table}" SET "${column}" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
    point.lon,
    point.lat,
    id,
  );
}

async function main() {
  console.log("seeding…");

  const tonys = await db.retailer.upsert({
    where: { webhookSecret: "demo-tonys-webhook-secret" },
    update: {},
    create: {
      name: "Tony's Pizza (Demo)",
      address: "3150 24th St, San Francisco, CA",
      webhookSecret: "demo-tonys-webhook-secret",
      ingestMode: "manual",
      plan: "pizza",
    },
  });
  await setGeography("Retailer", "location", tonys.id, TONYS_PIZZA);

  const valencia = await db.retailer.upsert({
    where: { webhookSecret: "demo-valencia-webhook-secret" },
    update: {},
    create: {
      name: "Valencia Liquors (Demo)",
      address: "1199 Valencia St, San Francisco, CA",
      webhookSecret: "demo-valencia-webhook-secret",
      ingestMode: "webhook",
      plan: "pilot",
    },
  });
  await setGeography("Retailer", "location", valencia.id, VALENCIA_LIQUOR);

  // Fake subscribers clustered around Tony's. Each gets its own User row so
  // the Auth.js relation is valid (they just never log in).
  const fakeSubs = [
    { name: "Alice", offset: { lat: 0.0003, lon: 0.0002 } },
    { name: "Bob", offset: { lat: -0.0004, lon: 0.0005 } },
    { name: "Carla", offset: { lat: 0.001, lon: -0.0008 } },
  ];

  for (const sub of fakeSubs) {
    const email = `${sub.name.toLowerCase()}+demo@piggyback.app`;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name: sub.name },
    });
    const subscriber = await db.subscriber.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, radiusMeters: 1500, active: true },
    });
    await setGeography("Subscriber", "currentLocation", subscriber.id, {
      lat: TONYS_PIZZA.lat + sub.offset.lat,
      lon: TONYS_PIZZA.lon + sub.offset.lon,
    });
  }

  console.log("seeded.");
  console.log("  retailer tonys.id     =", tonys.id);
  console.log("  retailer valencia.id  =", valencia.id);
  console.log("  demo center lat/lon   =", TONYS_PIZZA);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

// Unused import guard so tsc is happy even if we stop using randomBytes.
void randomBytes;
