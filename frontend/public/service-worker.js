const CACHE_NAME = 'nfm-cache-v2'
const OFFLINE_URLS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    )
    return
  }

  if (url.hostname.includes('res.cloudinary.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        const network = fetch(request).then((response) => {
          cache.put(request, response.clone())
          return response
        })
        return cached || network
      })
    )
    return
  }

  if (url.origin === location.origin && url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        const network = fetch(request).then((response) => {
          cache.put(request, response.clone())
          return response
        })
        return cached || network
      })
    )
    return
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})