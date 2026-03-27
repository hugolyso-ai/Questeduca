// Service Worker for QUESTEDUCA - Offline Support
const CACHE_NAME = 'questeduca-cache-v1';
const QUIZ_CACHE_NAME = 'questeduca-quiz-cache-v1';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== QUIZ_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // For quiz questions, use cache-first strategy
    if (url.pathname.includes('/quiz/') || url.pathname.includes('/subjects/')) {
      event.respondWith(
        caches.open(QUIZ_CACHE_NAME).then((cache) => {
          return cache.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            }).catch(() => {
              // Network failed, return cached if available
              return cachedResponse;
            });

            // Return cached response immediately, update in background
            return cachedResponse || fetchPromise;
          });
        })
      );
      return;
    }

    // For other API requests, try network first
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If offline, return a custom offline response for API
          return new Response(
            JSON.stringify({ 
              error: 'offline',
              message: 'Estás offline. Esta funcionalidade requer ligação à internet.'
            }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok && request.method === 'GET') {
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

// Background sync for offline quiz submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-answers') {
    event.waitUntil(syncQuizAnswers());
  }
});

async function syncQuizAnswers() {
  try {
    // Get pending quiz answers from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending_answers', 'readonly');
    const store = tx.objectStore('pending_answers');
    const answers = await store.getAll();

    for (const answer of answers) {
      try {
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer),
          credentials: 'include'
        });

        if (response.ok) {
          // Remove from pending
          const deleteTx = db.transaction('pending_answers', 'readwrite');
          const deleteStore = deleteTx.objectStore('pending_answers');
          await deleteStore.delete(answer.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync answer:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('questeduca-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_answers')) {
        db.createObjectStore('pending_answers', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached_questions')) {
        db.createObjectStore('cached_questions', { keyPath: 'id' });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    icon: '/logo192.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Ver', icon: '/check.png' },
      { action: 'close', title: 'Fechar', icon: '/close.png' }
    ]
  };

  let notificationData = { title: 'QUESTEDUCA', body: 'Nova notificação!' };
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (e) {
    console.error('[ServiceWorker] Error parsing push data:', e);
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      ...options,
      ...notificationData.options
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[ServiceWorker] Loaded');
