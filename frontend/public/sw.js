/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'mi-gestor-proyectos-v1';

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/icon.png',
        '/badge.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Nueva notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    data: data.data || {},
    tag: data.data?.taskId || 'default',
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'Ver' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const taskId = event.notification.data?.taskId;
  const projectId = event.notification.data?.projectId;

  let url = '/dashboard';
  if (projectId) {
    url = `/project/${projectId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
