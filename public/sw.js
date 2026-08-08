// Service Worker for مركز الألعاب (Deal or No Deal + المزاد) PWA
const CACHE_NAME = 'games-hub-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/sound-effects.js',
  '/js/player-database.js',
  '/manifest.json',
  '/deal/',
  '/deal/index.html',
  '/js/firebase-engine.js',
  '/js/app.js',
  '/mazad/',
  '/mazad/index.html',
  '/mazad/css/mazad.css',
  '/mazad/js/auction-engine.js',
  '/mazad/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
