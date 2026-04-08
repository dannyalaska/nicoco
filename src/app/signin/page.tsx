import { signIn } from "@/lib/auth";

export const metadata = { title: "Sign in — Piggyback" };

export default function SignInPage() {
  async function action(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    await signIn("resend", { email, redirectTo: "/onboarding" });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-2 text-neutral-600">
        We&apos;ll email you a one-time sign-in link. No password needed.
      </p>
      <form action={action} className="mt-8 space-y-4">
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Email me a link
        </button>
      </form>
    </main>
  );
}
