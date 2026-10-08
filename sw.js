// Minimal service worker for the dashboard's arrival alerts.
// Only job: let the page show notifications (Android Chrome requires a service worker for this)
// and bring the dashboard tab to the front when a notification is clicked.
// There is no 'fetch' handler, so it never caches anything or changes how the site loads.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(self.registration.scope);
    })
  );
});
