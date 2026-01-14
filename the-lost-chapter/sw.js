/**
 * TheLostChapter Service Worker
 */

const CACHE_NAME = 'tlc-v1';
const OFFLINE_URL = '/';

// Files to cache immediately
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/utils/router.js',
  './js/utils/markdown.js',
  './js/services/I18nService.js',
  './js/services/ContentService.js',
  './js/services/ProgressService.js',
  './js/components/Library.js',
  './js/components/BookDetail.js',
  './js/components/ChapterReader.js',
  './js/components/AudioPlayer.js',
  './js/components/Exercise.js',
  './manifest.json'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For content (books, chapters), use stale-while-revalidate
  if (url.pathname.includes('/content/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For app shell, cache first
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
  );
});

// Handle messages from main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_BOOK') {
    const { bookId, urls } = event.data;
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(urls).then(() => {
        // Notify clients that caching is complete
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'BOOK_CACHED',
              bookId
            });
          });
        });
      });
    });
  }
});
