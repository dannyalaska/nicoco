-- Piggyback: GiST indexes on every geography column.
-- Prisma cannot express PostGIS indexes in schema.prisma, so we manage
-- them via this hand-edited migration. The column names match the
-- `@map`-less defaults Prisma uses for `Unsupported` fields.
--
-- Run this AFTER `prisma migrate dev` has created the base tables.
-- If you run `prisma migrate dev` on a fresh DB, Prisma will generate
-- a middle migration creating the tables; this file should be kept
-- as the final migration in the chain.

CREATE INDEX IF NOT EXISTS "Retailer_location_gist"
  ON "Retailer" USING GIST ("location");

CREATE INDEX IF NOT EXISTS "Delivery_destLocation_gist"
  ON "Delivery" USING GIST ("destLocation");

CREATE INDEX IF NOT EXISTS "Delivery_originLocation_gist"
  ON "Delivery" USING GIST ("originLocation");

CREATE INDEX IF NOT EXISTS "Subscriber_currentLocation_gist"
  ON "Subscriber" USING GIST ("currentLocation");

CREATE INDEX IF NOT EXISTS "Subscriber_homeLocation_gist"
  ON "Subscriber" USING GIST ("homeLocation");
