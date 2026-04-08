export const metadata = { title: "Check your email — Piggyback" };

export default function CheckEmailPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-3xl font-bold">Check your email</h1>
      <p className="mt-4 text-neutral-600">
        We just sent you a sign-in link. Open it on this device to continue.
      </p>
      <p className="mt-8 text-sm text-neutral-500">
        Running locally? The link is printed in the server console.
      </p>
    </main>
  );
}
