# Piggyback

Neighbor-powered delivery pings. When you order delivery from a local shop that
runs its own driver, you tap "Piggyback it". Neighbors within a few blocks get a
push: that shop is delivering near them in about N minutes. They can order from
the shop's own site or phone and ask to go on the same run.

Shops never have to sign up. An admin lists shops (name, address, phone,
ordering link). If a shop later agrees to drop or cut its delivery fee for
same-run orders, that goes in its "same-run perk" and shows on every ping.
The app never promises free delivery on its own.

Privacy: a run's drop-off point is the poster's saved location snapped to a
roughly one-block grid, and the area label has digits stripped, so neighbors
never learn which house ordered.

Fatigue limits: per-person radius (default 600 m), quiet hours (default 10 PM
to 9 AM in their time zone) and a daily cap (default 3 pings).

This is an MVP built as a PWA. Everything — landing page, consumer app,
retailer dashboard, admin tools, ingest webhooks — runs inside one Next.js
application.

## Stack

- Next.js 15 (App Router) + TypeScript
- Postgres + PostGIS via Prisma (geography columns + GiST indexes)
- Auth.js v5 with magic-link email (Resend, or console-log in dev)
- Web Push via VAPID (`web-push` npm package)
- Tailwind CSS

## Local setup

### 1. Install deps

```bash
npm install
```

### 2. Start Postgres with PostGIS

```bash
docker run --name piggyback-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=piggyback \
  -p 5432:5432 \
  -d postgis/postgis:16-3.4
```

### 3. Configure `.env.local`

```bash
cp .env.example .env.local
# edit to fill in secrets
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Generate VAPID keys:

```bash
npm run vapid:generate
```

Paste all three VAPID values into `.env.local` (public, private, and
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` which must equal the public one).

Set `ADMIN_EMAILS` to the address you'll use to sign in for the demo.

Set `DIRECT_URL` to the same value as `DATABASE_URL` for local dev.

### 4. Run migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

This creates the schema, enables PostGIS, adds GiST indexes, and seeds two
demo retailers plus three fake subscribers clustered around Tony's Pizza
(37.7599, -122.4148 — Mission District, SF).

### 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo loop

1. Hit `/` → click "I want free delivery" → `/consumers` → click "sign in
   here" → enter your `ADMIN_EMAILS` address → get the magic link from the
   **server console** (dev mode doesn't actually send email unless
   `RESEND_API_KEY` is set).
2. Click the link → land on `/onboarding`.
3. **Step 1 — location.** Open Chrome DevTools → Sensors → Geolocation and
   set a custom position to `37.7600, -122.4148` (within the seeded
   neighborhood). Click "Share my location".
4. **Step 2 — notifications.** Click "Turn on notifications" and accept the
   browser permission.
5. Navigate to `/admin` in the same tab. You should see the admin dashboard
   because your email is in `ADMIN_EMAILS`.
6. In the "Fire test delivery" form, pick **Tony's Pizza (Demo)** and set
   destination `37.7601 / -122.4149`. Click "Fire test delivery".
7. **Expect:** a system notification pops up within ~2 seconds.
8. Click it → `/offer/<id>` → click "Order now (demo)" → confirmation.
9. Refresh `/admin` → the recent-deliveries table shows `notified / clicks /
   orders` counts incrementing.

## Neighbor run loop

1. Sign in on two browsers (or a normal and a private window) with two emails.
2. Onboard both with nearby locations and turn on notifications.
3. As admin, add a shop at `/admin` ("Add a shop") within a few km.
4. In browser A, go to "Piggyback it", pick the shop and an ETA, post.
5. Browser B gets the ping. Tap it to see the offer page with the shop's
   order link, phone and the line to ask for the same run.
6. After "I ordered", the two follow-up questions (same run? fee dropped?)
   feed the per-shop stats on `/admin`. Those stats are what you show a shop
   when asking for a same-run perk.

## Retailer webhook test

```bash
npx tsx scripts/fire-test-delivery.ts \
  --retailer <retailerId-from-seed-output> \
  --lat 37.7601 --lon -122.4149 \
  --address "123 Demo St"
```

This reads the retailer's `webhookSecret` from the DB, signs the payload with
HMAC-SHA256, and POSTs it to `/api/ingest/webhook/:retailerId`.

## Architecture

```
Delivery event (manual button | webhook | future POS adapter)
        │
        ▼
 src/ingest/dispatch.ts  ◄──  src/ingest/types.ts (canonical DeliveryEvent)
        │
        ├─► src/lib/geo.ts       (PostGIS ST_DWithin — find nearby subs)
        ├─► src/lib/push.ts      (web-push VAPID fanout)
        └─► Notification rows   (sent/clicked/ordered analytics)
```

Every retailer integration normalizes into `DeliveryEvent` and calls
`ingestDeliveryEvent`. Adding a new POS integration is one file in
`src/ingest/adapters/` and one route in `src/app/api/ingest/`.

## Tests

```bash
npm test
```

The unit tests cover the webhook HMAC verification, the zod schemas and the
neighbor-run rules (block snapping, quiet hours, copy).

`npm run test:smoke` runs the full pipeline against a real Postgres with
PostGIS and a fake HTTPS push server: poster excluded, quiet hours skipped,
far neighbors not matched, idempotency, daily cap. See the header of
`scripts/smoke-neighbor-run.ts` for the env it needs. Never point it at
production.

## Deploy

See [DEPLOY.md](./DEPLOY.md).

## Roadmap / not-in-MVP

- POS adapters (Square, Toast, Clover, DoorDash Drive)
- SMS / email fallback when push isn't granted
- Multi-location retailer accounts
- Shop-side view of their same-run stats
