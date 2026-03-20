import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const goOffline = () => { setIsOffline(true); setVisible(true) }
        const goOnline = () => {
            setIsOffline(false)
            // Keep banner visible briefly to confirm reconnection
            setTimeout(() => setVisible(false), 2500)
        }

        window.addEventListener('offline', goOffline)
        window.addEventListener('online', goOnline)

        if (!navigator.onLine) setVisible(true)

        return () => {
            window.removeEventListener('offline', goOffline)
            window.removeEventListener('online', goOnline)
        }
    }, [])

    if (!visible) return null

    return (
        <div
            className={`fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors duration-500 ${isOffline
                    ? 'bg-red-600/90 backdrop-blur-sm text-white'
                    : 'bg-emerald-600/90 backdrop-blur-sm text-white'
                }`}
        >
            <WifiOff className="w-4 h-4 shrink-0" />
            {isOffline ? 'No internet connection' : 'Back online'}
        </div>
    )
}
