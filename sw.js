const CACHE = 'fitplan-v1';
const FILES = [
  '/FitPlan/',
  '/FitPlan/index.html',
  '/FitPlan/manifest.json',
  '/FitPlan/icon-192.png',
  '/FitPlan/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
