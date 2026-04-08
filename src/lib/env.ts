/**
 * Zod-validated environment access.
 *
 * Everything that reads process.env should go through `env` so that missing
 * or malformed vars fail loudly at startup instead of silently at runtime.
 */
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().url().optional(),
  ADMIN_EMAILS: z.string().default(""),
  RESEND_API_KEY: z.string().optional(),
  AUTH_EMAIL_FROM: z.string().default("Piggyback <noreply@piggyback.app>"),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().default("mailto:founder@piggyback.app"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
});

const isServer = typeof window === "undefined";

function parseServer() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

function parseClient() {
  // On the client, only NEXT_PUBLIC_* vars are available.
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
  if (!parsed.success) {
    console.error("❌ Invalid client environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

export const env = isServer
  ? { ...parseServer(), ...parseClient() }
  : (parseClient() as ReturnType<typeof parseServer> & ReturnType<typeof parseClient>);

export function adminEmails(): string[] {
  const raw = (env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
