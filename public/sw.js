// Service worker mínimo: permite a instalação da app (PWA) sem interferir com o funcionamento do site.
// Estratégia network-first para navegação e assets versionados (hashed); apenas recursos estáticos
// imutáveis (logótipos, manifest, ícones, texturas) são guardados em cache para uso offline.
const CACHE_VERSION = 'v3'
const CACHE_NAME = `questeduca-${CACHE_VERSION}`
const STATIC_ASSETS = [
  '/logo.png',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/grass_texture.jpg',
  '/assets/road_texture.jpg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // HTML de navegação: sempre network-first; em fallback serve o index guardado.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Assets versionados pelo Vite (/assets/*.js, *.css) NUNCA são guardados em cache:
  // os nomes mudam a cada build, pelo que cacheá-los quebra a app após uma nova publicação.
  if (url.pathname.startsWith('/assets/') && /\.(js|css)$/.test(url.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  // Restantes recursos estáticos: network-first com fallback à cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
