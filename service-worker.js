self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('qr-app-cache-v1').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon.png',
        'https://unpkg.com/@zxing/library@latest'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});