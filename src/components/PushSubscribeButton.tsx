"use client";

import { useState } from "react";

/** Convert a base64url VAPID public key to a Uint8Array for pushManager.subscribe. */
function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view;
}

export function PushSubscribeButton({
  publicKey,
  onDone,
}: {
  publicKey: string;
  onDone: () => void;
}) {
  const [state, setState] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    try {
      setState("working");
      if (!("serviceWorker" in navigator)) {
        throw new Error("Your browser doesn't support notifications.");
      }
      if (!("PushManager" in window)) {
        throw new Error("Push notifications aren't supported here.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notifications were blocked.");
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Incomplete subscription.");
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      setState("ok");
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={subscribe}
        disabled={state === "working"}
        className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "working"
          ? "Enabling…"
          : state === "ok"
            ? "Notifications on ✓"
            : "Turn on notifications"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
