/**
 * Web Push via VAPID.
 *
 * Wraps the `web-push` library so the rest of the app can call
 * `sendPush(subscription, payload)` without knowing about VAPID details
 * or cleanup semantics.
 *
 * Dead subscriptions (404 / 410 from the push service) are deleted
 * eagerly — browsers never recycle endpoints, so a gone endpoint is
 * gone forever.
 */
import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { db } from "./db";
import { env } from "./env";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    (env as { VAPID_SUBJECT: string }).VAPID_SUBJECT,
    (env as { VAPID_PUBLIC_KEY: string }).VAPID_PUBLIC_KEY,
    (env as { VAPID_PRIVATE_KEY: string }).VAPID_PRIVATE_KEY,
  );
  vapidConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export interface SendPushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface SendPushResult {
  ok: boolean;
  statusCode?: number;
  removed?: boolean;
}

/**
 * Send a single notification. Returns ok=true on success, ok=false on
 * non-cleanup errors. 404/410 result in the subscription row being
 * deleted and `removed: true`.
 */
export async function sendPush(
  target: SendPushTarget,
  payload: PushPayload,
): Promise<SendPushResult> {
  ensureVapid();
  const sub: WebPushSubscription = {
    endpoint: target.endpoint,
    keys: { p256dh: target.p256dh, auth: target.auth },
  };
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    const code = (err as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) {
      await db.pushSubscription.deleteMany({ where: { endpoint: target.endpoint } });
      return { ok: false, statusCode: code, removed: true };
    }
    console.error("web-push error", code, (err as Error).message);
    return { ok: false, statusCode: code };
  }
}

/**
 * Fan out one payload to many endpoints in parallel. Does not throw —
 * individual failures are captured per-target.
 */
export async function sendPushBatch(
  targets: SendPushTarget[],
  payload: PushPayload,
): Promise<SendPushResult[]> {
  return Promise.all(targets.map((t) => sendPush(t, payload)));
}
