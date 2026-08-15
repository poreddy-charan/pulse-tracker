// Service worker for Pulse — Personal Tracker.
// Android Chrome forbids `new Notification()` and only allows notifications
// shown through a service worker registration, so this file exists purely
// to make that possible, plus focus the app when a notification is tapped.

const APP_SCOPE = './index.html';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
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
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(APP_SCOPE);
      return undefined;
    })
  );
});
