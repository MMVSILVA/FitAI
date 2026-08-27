// FitAI Service Worker for Push Notifications & Background Workout Reminders
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: '🔥 Hora do Treino FitAI!',
    body: 'Seu horário agendado de treino chegou. Mantenha o foco e a consistência!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'fitai-daily-workout-reminder',
    data: { url: '/dashboard' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      tag: data.tag || 'fitai-daily-workout-reminder',
      vibrate: [200, 100, 200],
      data: data.data || { url: '/dashboard' },
      actions: [
        { action: 'open_workout', title: 'Ver Treino' },
        { action: 'close', title: 'Depois' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
