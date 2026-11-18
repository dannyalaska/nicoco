/**
 * End-to-end smoke test for neighbor runs against a real Postgres+PostGIS.
 *
 *   openssl req -x509 -newkey rsa:2048 -nodes -keyout /tmp/smoke/key.pem \
 *     -out /tmp/smoke/cert.pem -days 1 -subj "/CN=127.0.0.1"
 *   SMOKE_CERT_DIR=/tmp/smoke NODE_TLS_REJECT_UNAUTHORIZED=0 \
 *     DATABASE_URL=... npx tsx scripts/smoke-neighbor-run.ts
 *
 * Never point this at production: it writes and deletes test rows.
 *
 * Spins up a fake push service on localhost, creates a shop and four
 * neighbors, posts a run, and checks who got pinged:
 *   - poster: never pinged about their own run
 *   - near neighbor: pinged
 *   - near neighbor in quiet hours: skipped
 *   - far neighbor: not matched
 * Then posts again to check the daily cap. Cleans up after itself.
 */
import https from "node:https";
import { readFileSync } from "node:fs";
import { createECDH, randomBytes } from "node:crypto";
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
process.env.VAPID_PUBLIC_KEY ||= keys.publicKey;
process.env.VAPID_PRIVATE_KEY ||= keys.privateKey;
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||= process.env.VAPID_PUBLIC_KEY;
process.env.AUTH_SECRET ||= "smoke";

const b64u = (b: Buffer) => b.toString("base64url");

async function main() {
  const { db } = await import("../src/lib/db");
  const geo = await import("../src/lib/geo");
  const { ingestDeliveryEvent } = await import("../src/ingest/dispatch");
  const { neighborToDeliveryEvent } = await import("../src/ingest/adapters/neighbor");

  const received: string[] = [];
  const certDir = process.env.SMOKE_CERT_DIR;
  if (!certDir) throw new Error("Set SMOKE_CERT_DIR to a folder with key.pem and cert.pem (self-signed is fine)");
  const server = https.createServer(
    { key: readFileSync(`${certDir}/key.pem`), cert: readFileSync(`${certDir}/cert.pem`) },
    (req, res) => {
    received.push(req.url ?? "");
    req.resume();
    req.on("end", () => {
      res.writeHead(201);
      res.end();
    });
    },
  );
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;

  const tag = `smoke-${Date.now()}`;
  const center = { lat: 40.6756, lon: -74.4931 };
  const shop = await db.retailer.create({
    data: { name: `Smoke Pizza ${tag}`, address: "1 Test Rd", webhookSecret: tag, phone: "555-0100" },
  });
  await geo.setRetailerLocation(shop.id, { lat: center.lat + 0.01, lon: center.lon });

  // Quiet hours that cover "now" in UTC for the quiet neighbor.
  const h = new Date().getUTCHours();
  const people = [
    { name: "poster", off: [0, 0], quiet: [22, 9] },
    { name: "near", off: [0.0015, 0.001], quiet: [h, h] },
    { name: "quiet", off: [-0.001, 0.0015], quiet: [h, (h + 1) % 24] },
    { name: "far", off: [0.05, 0.05], quiet: [h, h] },
  ];
  const ids: Record<string, string> = {};
  for (const p of people) {
    const user = await db.user.create({ data: { email: `${p.name}.${tag}@example.com` } });
    const sub = await db.subscriber.create({
      data: {
        userId: user.id,
        radiusMeters: 600,
        quietStartHour: p.quiet[0],
        quietEndHour: p.quiet[1],
        timeZone: "UTC",
        maxPerDay: 1,
      },
    });
    ids[p.name] = sub.id;
    const pt = { lat: center.lat + p.off[0], lon: center.lon + p.off[1] };
    await geo.setSubscriberCurrentLocation(sub.id, pt);
    await geo.setSubscriberHomeLocation(sub.id, pt);
    const ecdh = createECDH("prime256v1");
    ecdh.generateKeys();
    await db.pushSubscription.create({
      data: {
        subscriberId: sub.id,
        endpoint: `https://127.0.0.1:${port}/push/${p.name}/${tag}`,
        p256dh: b64u(ecdh.getPublicKey()),
        auth: b64u(randomBytes(16)),
      },
    });
  }

  let failed = 0;
  const check = (label: string, ok: boolean) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
    if (!ok) failed++;
  };

  try {
    const posterLoc = await geo.getSubscriberLocation(ids.poster);
    check("poster location saved", !!posterLoc);

    const shops = await geo.listShopsNear(posterLoc!);
    check("shop shows up on the nearby list", shops.some((s) => s.id === shop.id));

    const evt = neighborToDeliveryEvent(ids.poster, posterLoc!, {
      retailerId: shop.id,
      etaMinutes: 30,
      areaLabel: "near Main St",
    });
    const r1 = await ingestDeliveryEvent(evt);
    check(`first run notified 1 (got ${r1.notified})`, r1.notified === 1);
    check(`first run skipped 1 for quiet hours (got ${r1.skipped})`, r1.skipped === 1);
    check("only the near neighbor's endpoint was hit", received.length === 1 && received[0].includes("/push/near/"));

    const d = await db.delivery.findUnique({ where: { id: r1.deliveryId } });
    check("run stored with poster and area label", d?.postedById === ids.poster && d?.areaLabel === "near Main St");
    const snapped = await db.$queryRaw<{ lat: number; lon: number }[]>`
      SELECT ST_Y("destLocation"::geometry) AS lat, ST_X("destLocation"::geometry) AS lon FROM "Delivery" WHERE id = ${r1.deliveryId}`;
    check("drop-off is snapped, not the poster's exact point",
      snapped[0].lat !== posterLoc!.lat || snapped[0].lon !== posterLoc!.lon);

    const again = await ingestDeliveryEvent(evt);
    check("same event is idempotent", again.alreadyExisted && again.deliveryId === r1.deliveryId);

    const r2 = await ingestDeliveryEvent(
      neighborToDeliveryEvent(ids.poster, posterLoc!, { retailerId: shop.id, etaMinutes: 45 }, new Date(Date.now() + 1000)),
    );
    check(`daily cap of 1 holds on the second run (notified ${r2.notified})`, r2.notified === 0);
  } finally {
    await db.retailer.delete({ where: { id: shop.id } });
    await db.user.deleteMany({ where: { email: { endsWith: `.${tag}@example.com` } } });
    server.close();
    await db.$disconnect();
  }

  if (failed) {
    console.error(`${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("all checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
