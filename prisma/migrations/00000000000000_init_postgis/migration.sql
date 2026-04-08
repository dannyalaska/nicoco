-- Piggyback: enable PostGIS before any geography columns are created.
-- This migration MUST run before the Prisma-generated initial migration,
-- which is why it has the `0000...` timestamp prefix.
CREATE EXTENSION IF NOT EXISTS postgis;
