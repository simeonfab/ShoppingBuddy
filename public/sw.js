const CACHE = 'smartshop-shell-v2'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg']
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())))
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const request = event.request
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => { caches.open(CACHE).then(cache => cache.put('./index.html', response.clone())); return response }).catch(() => caches.match('./index.html')))
    return
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && new URL(request.url).origin === self.location.origin) caches.open(CACHE).then(cache => cache.put(request, response.clone()))
    return response
  })))
})
