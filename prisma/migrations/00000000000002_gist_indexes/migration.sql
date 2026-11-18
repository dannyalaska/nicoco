-- Piggyback: GiST indexes on every geography column.
-- Prisma cannot express PostGIS indexes in schema.prisma, so we manage
-- them via this hand-edited migration. The column names match the
-- `@map`-less defaults Prisma uses for `Unsupported` fields.
--
-- Runs after 00000000000001_init, which creates the base tables.

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
