// Service worker — Delivery Detail and Berth Information
// 1. Vessel alerts: shows Firebase push messages, also when the app/browser is closed
// 2. Opens / focuses the app when an alert is tapped
// 3. Keeps the page shell so the app opens without network (data needs network)

const CACHE = 'berth-shell-v2';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('berth-shell-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Page loads: network first (always the latest site), cached copy only when offline
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode !== 'navigate' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html'))
  );
});

// Push from the Apps Script (FCM data message: title, body, tag, url)
self.addEventListener('push', event => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) { p = { data: { body: event.data && event.data.text() } }; }
  const d = p.data || {};
  const n = p.notification || {};
  const title = d.title || n.title || 'Berth information';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || n.body || '',
    tag: d.tag || n.tag || undefined,
    renotify: !!(d.tag || n.tag),
    requireInteraction: true,
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    data: { url: d.url || self.registration.scope }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
