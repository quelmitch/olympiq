/* Olympiq's service worker: only the app's notifications (olympiq/push.py sends them). No caching: the screens always
   come fresh from the server. A notification is {title, body, href, tag}; tapping it opens `href` in the app. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || "Olympiq", {
      body: d.body || "",
      tag: d.tag || undefined,
      renotify: Boolean(d.tag),
      icon: "icon-192.png",
      badge: "badge-96.png",
      data: { href: d.href || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(self.registration.scope);
  url.hash = (e.notification.data && e.notification.data.href) || "/";
  e.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of open) {
        if (w.url.startsWith(self.registration.scope)) {
          await w.focus();
          return w.navigate(url.href).catch(() => self.clients.openWindow(url.href));
        }
      }
      return self.clients.openWindow(url.href);
    })(),
  );
});
