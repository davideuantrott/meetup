// Swimming Pals Planner — Service Worker
// Workbox is injected via vite-plugin-pwa; this file handles push notifications
// and background sync in addition to Workbox's caching.

// Workbox precache manifest (injected at build time)
self.__WB_MANIFEST;

// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Swimming Pals Planner', body: event.data.text() };
  }

  const options = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag ?? 'meetup',
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Swimming Pals Planner', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Background sync for offline responses
self.addEventListener('sync', event => {
  if (event.tag === 'sync-responses') {
    event.waitUntil(syncQueuedResponses());
  }
});

async function syncQueuedResponses() {
  // Responses queued while offline are stored in IndexedDB via the app
  // The actual sync logic lives in the app via workbox-background-sync
  // This handler ensures the sync tag is processed
}
