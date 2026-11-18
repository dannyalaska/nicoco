# Deploying Piggyback

Target setup: Supabase (Postgres + PostGIS) for the database, Vercel for the
app, Resend for sign-in emails. All three have free tiers that cover a pilot
in one town.

## 1. Database (Supabase)

1. Create a project. Pick the US East region.
2. Database > Extensions: turn on `postgis`. (The first migration also runs
   `CREATE EXTENSION IF NOT EXISTS postgis`, so this is a belt-and-braces step.)
3. Connect > ORMs > Prisma gives you two URLs:
   - `DATABASE_URL`: the pooled Transaction URL (port 6543). Append
     `?pgbouncer=true&connection_limit=1`.
   - `DIRECT_URL`: the direct URL (port 5432).
4. From your machine, with both set in `.env.local`:

   ```bash
   npx dotenv -e .env.local -- npm run db:deploy
   ```

   or export them in the shell and run `npm run db:deploy`. This applies
   `00000000000001_init` and `00000000000002_gist_indexes`.

Do not run `npm run db:seed` against production. It adds demo shops in San
Francisco and fake subscribers.

## 2. Keys

```bash
openssl rand -base64 32      # AUTH_SECRET
npm run vapid:generate       # VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` must equal `VAPID_PUBLIC_KEY`. Generate VAPID
keys once and keep them: changing them later breaks every existing push
subscription.

## 3. Email (Resend)

Magic-link sign-in needs real email in production.

1. Create a Resend account and add a sending domain you own. Add the DNS
   records it shows (SPF, DKIM). Until the domain verifies, Resend only
   delivers to your own address.
2. Create an API key: `RESEND_API_KEY`.
3. `AUTH_EMAIL_FROM="Piggyback <signin@yourdomain>"` on the verified domain.

## 4. App (Vercel)

1. Import the GitHub repo. Framework preset: Next.js. The build command is
   already `prisma generate && next build`.
2. Environment variables (Production):

   ```
   DATABASE_URL
   DIRECT_URL
   AUTH_SECRET
   AUTH_URL                      https://your-domain (no trailing slash)
   ADMIN_EMAILS                  your sign-in email
   RESEND_API_KEY
   AUTH_EMAIL_FROM
   VAPID_PUBLIC_KEY
   VAPID_PRIVATE_KEY
   NEXT_PUBLIC_VAPID_PUBLIC_KEY
   VAPID_SUBJECT                 mailto:your-email
   ```

3. Deploy. Add your domain under Settings > Domains and update `AUTH_URL`.

Migrations are not run on build on purpose: run `npm run db:deploy` from your
machine whenever `prisma/migrations` changes, before or right after deploying.

## 5. Smoke check in production

1. Sign in with your `ADMIN_EMAILS` address. `/admin` should load.
2. Add one real shop near you with its phone and ordering page.
3. On a second phone signed in as someone else, onboard nearby and turn on
   notifications.
4. Post a run from the first phone. The second should get a ping.

## Phones

- Android Chrome: push works in the browser.
- iPhone: push only works after "Add to Home Screen" (iOS 16.4+), then
  opening the app from the home screen and turning on notifications there.
  Onboarding already tells iPhone users this.

## Costs to expect

- Supabase free tier pauses a project after a week with no activity. Upgrade
  (about $25 a month) before real users depend on it.
- Vercel Hobby is free but for non-commercial use. Move to Pro (about $20 a
  month) if this starts making money.
- Resend free tier covers 3,000 emails a month.
- A domain is roughly $10 to $15 a year.
