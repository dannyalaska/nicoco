/**
 * Piggyback service worker.
 *
 * Two responsibilities:
 *   1. Show a notification when a push arrives.
 *   2. Open the offer page when the user taps it.
 *
 * No caching, no offline mode for MVP — the service worker exists
 * purely to receive Web Push. Everything else is handled by Next.js.
 */

self.addEventListener("install", (event) => {
  // Activate immediately on first install so the very first push works.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: "Piggyback", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Piggyback";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/home" },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/home";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = all.find((c) => c.url.includes(url));
      if (existing) {
        await existing.focus();
      } else {
        await self.clients.openWindow(url);
      }
      // Fire-and-forget click tracking — best effort, no blocking.
      try {
        const id = url.match(/\/offer\/([^/?#]+)/)?.[1];
        if (id) {
          await fetch(`/api/notifications/${id}/click`, { method: "POST" });
        }
      } catch (_) {}
    })(),
  );
});
