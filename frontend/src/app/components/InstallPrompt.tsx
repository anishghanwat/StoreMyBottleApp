import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const DISMISSED_KEY = 'pwa_install_dismissed'

export function InstallPrompt() {
    const [prompt, setPrompt] = useState<any>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Don't show if already dismissed or already installed
        if (localStorage.getItem(DISMISSED_KEY)) return
        if (window.matchMedia('(display-mode: standalone)').matches) return

        const handler = (e: Event) => {
            e.preventDefault()
            setPrompt(e)
            // Delay slightly so it doesn't pop up immediately on load
            setTimeout(() => setVisible(true), 3000)
        }

        window.addEventListener('beforeinstallprompt', handler as any)
        return () => window.removeEventListener('beforeinstallprompt', handler as any)
    }, [])

    const handleInstall = async () => {
        if (!prompt) return
        prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === 'accepted') {
            setVisible(false)
        }
        setPrompt(null)
    }

    const handleDismiss = () => {
        setVisible(false)
        localStorage.setItem(DISMISSED_KEY, '1')
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="fixed bottom-20 left-4 right-4 z-50 bg-[#13131F] border border-violet-500/30 rounded-2xl p-4 shadow-2xl shadow-violet-500/10"
                >
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 text-[#4A4A6A] hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3 pr-6">
                        <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                            <img src="/pwa-192.png" alt="StoreMyBottle" className="w-10 h-10 rounded-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-white">Add to Home Screen</p>
                            <p className="text-xs text-[#7171A0] mt-0.5">Install for faster access, no browser needed</p>
                        </div>
                    </div>

                    <button
                        onClick={handleInstall}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Install App
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
