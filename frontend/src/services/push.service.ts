import api from './api'

async function getVapidKey(): Promise<string> {
    const res = await api.get('/api/push/vapid-public-key')
    return res.data.public_key
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function subscribeToPush(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return false

        const vapidKey = await getVapidKey()
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        const json = sub.toJSON()
        await api.post('/api/push/subscribe', {
            endpoint: json.endpoint,
            p256dh: (json.keys as any).p256dh,
            auth: (json.keys as any).auth,
        })

        return true
    } catch (e) {
        console.error('Push subscription failed:', e)
        return false
    }
}

export async function unsubscribeFromPush(): Promise<void> {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return

    const json = sub.toJSON()
    await api.delete('/api/push/unsubscribe', {
        data: { endpoint: json.endpoint, p256dh: (json.keys as any).p256dh, auth: (json.keys as any).auth },
    })
    await sub.unsubscribe()
}

export async function isPushSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return !!sub
}
