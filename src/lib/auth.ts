/**
 * Auth.js v5 (NextAuth beta) setup with Prisma adapter and magic-link email.
 *
 * - If RESEND_API_KEY is set, we send via Resend.
 * - Otherwise we override sendVerificationRequest to print the link to
 *   the server console so local dev works without any email provider.
 *
 * Either way we use the `resend` provider shell (no nodemailer dep
 * required).
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import ResendProvider from "next-auth/providers/resend";
import { db } from "./db";

const RESEND_KEY = process.env.RESEND_API_KEY;

const emailProvider = ResendProvider({
  apiKey: RESEND_KEY || "dev-noop", // Provider requires non-empty; unused when sendVerificationRequest is overridden
  from: process.env.AUTH_EMAIL_FROM || "Piggyback <noreply@piggyback.app>",
  // Override only in dev. In prod (RESEND_KEY set) we use the default
  // Resend sender.
  ...(RESEND_KEY
    ? {}
    : {
        sendVerificationRequest: async ({
          identifier,
          url,
        }: {
          identifier: string;
          url: string;
        }) => {
          console.log("\n================ PIGGYBACK MAGIC LINK ================");
          console.log(`to:   ${identifier}`);
          console.log(`link: ${url}`);
          console.log("======================================================\n");
        },
      }),
});

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  providers: [emailProvider],
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const { GET, POST } = handlers;
