/**
 * Prisma client singleton.
 *
 * Next.js dev mode hot-reloads modules repeatedly. Without this guard,
 * each reload would instantiate a new PrismaClient and exhaust the
 * Postgres connection pool.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
