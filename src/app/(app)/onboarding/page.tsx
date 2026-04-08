"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationGrant } from "@/components/LocationGrant";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Let&apos;s get you set up</h1>
      <p className="text-neutral-600">Two quick permissions and you&apos;re done.</p>

      <StepCard n={1} title="Share your location" active={step === 1} done={step > 1}>
        <p className="text-sm text-neutral-600">
          We need a rough position so we know which deliveries are near you.
          We don&apos;t sell or share this.
        </p>
        <div className="mt-3">
          <LocationGrant onDone={() => setStep(2)} />
        </div>
      </StepCard>

      <StepCard n={2} title="Turn on notifications" active={step === 2} done={step > 2}>
        <p className="text-sm text-neutral-600">
          We only ping you when a driver is actually near. No spam, no ads.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          On iPhone? Add Piggyback to your Home Screen first, then open it
          from there — Apple only allows push in installed PWAs.
        </p>
        <div className="mt-3">
          <PushSubscribeButton
            publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
            onDone={() => setStep(3)}
          />
        </div>
      </StepCard>

      <StepCard n={3} title="You&apos;re all set" active={step === 3} done={false}>
        <p className="text-sm text-neutral-600">
          We&apos;ll ping you next time a driver is nearby.
        </p>
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="mt-3 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Go to my home
        </button>
      </StepCard>
    </div>
  );
}

function StepCard(props: {
  n: number;
  title: string;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={[
        "rounded-xl border p-6",
        props.active ? "border-brand-600 bg-white shadow-sm" : "border-neutral-200 bg-white/60",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            props.done
              ? "bg-green-100 text-green-700"
              : props.active
                ? "bg-brand-100 text-brand-700"
                : "bg-neutral-100 text-neutral-500",
          ].join(" ")}
        >
          {props.done ? "✓" : props.n}
        </span>
        <h2 className="text-lg font-semibold">{props.title}</h2>
      </div>
      <div className={props.active ? "mt-4" : "mt-2 opacity-60"}>{props.children}</div>
    </section>
  );
}
