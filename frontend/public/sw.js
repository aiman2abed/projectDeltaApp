// frontend/public/sw.js

self.addEventListener('install', (event) => {
  console.log('Spirelay Service Worker installing...');
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Spirelay Service Worker activating...');
  // Tell the active service worker to take control of the page immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler to satisfy PWA install requirements
  event.respondWith(fetch(event.request));
});