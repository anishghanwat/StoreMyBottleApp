import { useState, useEffect, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "./button"

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    folder?: string
}

declare global {
    interface Window {
        cloudinary: any
    }
}

export function ImageUpload({ value, onChange, folder = "general" }: ImageUploadProps) {
    const [loading, setLoading] = useState(false)
    const [scriptLoaded, setScriptLoaded] = useState(!!window.cloudinary)
    const widgetRef = useRef<any>(null)

    useEffect(() => {
        if (window.cloudinary) { setScriptLoaded(true); return }
        const script = document.createElement("script")
        script.src = "https://upload-widget.cloudinary.com/global/all.js"
        script.async = true
        script.onload = () => setScriptLoaded(true)
        document.body.appendChild(script)
    }, [])

    const openWidget = () => {
        if (!scriptLoaded) return
        setLoading(true)

        widgetRef.current = window.cloudinary.createUploadWidget(
            {
                cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                folder: `storemybottle/${folder}`,
                sources: ["local", "url", "camera"],
                multiple: false,
                maxFileSize: 5000000,
                clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                cropping: true,
                croppingAspectRatio: 16 / 9,
                showSkipCropButton: true,
                styles: {
                    palette: {
                        window: "#1a1a2e",
                        windowBorder: "#6B6B9A",
                        tabIcon: "#a855f7",
                        menuIcons: "#a855f7",
                        textDark: "#ffffff",
                        textLight: "#ffffff",
                        link: "#a855f7",
                        action: "#a855f7",
                        inactiveTabIcon: "#6B6B9A",
                        error: "#ef4444",
                        inProgress: "#a855f7",
                        complete: "#22c55e",
                        sourceBg: "#0f0f1a",
                    },
                },
            },
            (error: any, result: any) => {
                if (error) { setLoading(false); return }
                if (result.event === "success") {
                    onChange(result.info.secure_url)
                    setLoading(false)
                    widgetRef.current?.close()
                }
                if (result.event === "close") setLoading(false)
            }
        )

        widgetRef.current.open()
    }

    const buttonLabel = !scriptLoaded
        ? "Loading uploader..."
        : loading
            ? "Opening..."
            : value
                ? "Change Image"
                : "Upload Image"

    return (
        <div className="flex flex-col gap-2">
            {value ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-input bg-muted">
                    <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="w-full aspect-video rounded-lg border-2 border-dashed border-input bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-sm">No image uploaded</p>
                </div>
            )}
            <Button type="button" variant="outline" onClick={openWidget} disabled={loading || !scriptLoaded} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                {buttonLabel}
            </Button>
        </div>
    )
}
