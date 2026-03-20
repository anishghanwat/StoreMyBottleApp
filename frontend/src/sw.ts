/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// API — NetworkFirst
registerRoute(
    ({ url }) => url.origin === 'https://api.storemybottle.in' && url.pathname.startsWith('/api/'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
    })
)

// Cloudinary images — CacheFirst
registerRoute(
    ({ url }) => url.origin === 'https://res.cloudinary.com',
    new CacheFirst({
        cacheName: 'image-cache',
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 })],
    })
)

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return
    let payload: { title: string; body: string; url?: string }
    try { payload = event.data.json() }
    catch { payload = { title: 'StoreMyBottle', body: event.data.text() } }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/pwa-192.png',
            badge: '/pwa-192.png',
            data: { url: payload.url || '/' },
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/'
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const existing = clients.find((c) => c.url.includes(self.location.origin))
            if (existing) { existing.focus(); existing.navigate(url) }
            else { self.clients.openWindow(url) }
        })
    )
})
