// Service worker for Pulse — Personal Tracker: offline app shell and notifications.

const APP_SCOPE = './index.html';
const PREGNANCY_SCOPE = './index.html?mode=pregnancy';
const CACHE_NAME = 'pulse-shell-v8';
const APP_FILES = ['./', './index.html', './manifest.json', './sakhi-manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const cleanUrl = new URL(event.request.url);
  cleanUrl.search = '';
  cleanUrl.hash = '';
  const cacheable = APP_FILES.some(path => new URL(path, self.registration.scope).href === cleanUrl.href);
  event.respondWith(
    fetch(event.request).then(response => {
      if(cacheable && response.ok){
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(cleanUrl.href, copy));
      }
      return response;
    }).catch(() => caches.match(cleanUrl.href).then(cached => cached || caches.match(APP_SCOPE)))
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type !== 'show-notification') return;
  const { title, body, tag } = data;
  self.registration.showNotification(title || 'Reminder', {
    body: body || '',
    tag: tag || undefined,
    icon: './icon-192.png',
    badge: './icon-192.png',
    requireInteraction: false,
    renotify: !!tag,
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('navigate' in client) return client.navigate(PREGNANCY_SCOPE).then(() => client.focus());
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(PREGNANCY_SCOPE);
      return undefined;
    })
  );
});
