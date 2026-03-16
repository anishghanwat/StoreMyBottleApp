# Cloudinary Image Upload Plan

## Overview

Replace the plain `Image URL` text inputs in the admin portal with a Cloudinary Upload Widget so admins can upload images directly from their browser. Cloudinary stores the image, resizes it, and returns a URL which gets saved to the DB as before.

**No backend changes required.** The `image_url` column already exists on both `Venue` and `Bottle` models and accepts any string URL up to 1000 chars.

---

## Step 1: Cloudinary Account Setup

1. Sign up at https://cloudinary.com (free tier — 25GB storage, 25GB bandwidth/month)
2. Go to Dashboard → copy your **Cloud Name**
3. Go to Settings → Upload → **Upload Presets** → Add upload preset:
   - Preset name: `storemybottle_unsigned`
   - Signing mode: **Unsigned** (required for direct browser uploads)
   - Folder: `storemybottle`
   - Allowed formats: `jpg, jpeg, png, webp`
   - Max file size: `5000000` (5MB)
   - Quality: Auto
   - Format: Auto
   - Save preset

---

## Step 2: Environment Variable

Add to `admin/.env` and `admin/.env.production`:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=storemybottle_unsigned
```

Also add to `.env.docker` (for CI/CD builds):

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=storemybottle_unsigned
```

And pass as build arg in `docker-compose.prod.yml` under the `admin` service:

```yaml
admin:
  build:
    args:
      VITE_API_URL: ${VITE_API_URL}
      VITE_CLOUDINARY_CLOUD_NAME: ${VITE_CLOUDINARY_CLOUD_NAME}
      VITE_CLOUDINARY_UPLOAD_PRESET: ${VITE_CLOUDINARY_UPLOAD_PRESET}
```

---

## Step 3: New Component — `ImageUpload`

Create `admin/src/components/ui/image-upload.tsx`:

```tsx
import { useState, useEffect, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "./button"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string // e.g. "venues" or "bottles"
}

declare global {
  interface Window {
    cloudinary: any
  }
}

export function ImageUpload({ value, onChange, folder = "general" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const widgetRef = useRef<any>(null)

  // Load Cloudinary widget script once
  useEffect(() => {
    if (window.cloudinary) return
    const script = document.createElement("script")
    script.src = "https://upload-widget.cloudinary.com/global/all.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  const openWidget = () => {
    if (!window.cloudinary) {
      console.error("Cloudinary widget not loaded yet")
      return
    }

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
        if (error) {
          console.error("Upload error:", error)
          setLoading(false)
          return
        }
        if (result.event === "success") {
          onChange(result.info.secure_url)
          setLoading(false)
          widgetRef.current?.close()
        }
        if (result.event === "close") {
          setLoading(false)
        }
      }
    )

    widgetRef.current.open()
  }

  const handleClear = () => {
    onChange("")
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-input bg-muted">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
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
      <Button
        type="button"
        variant="outline"
        onClick={openWidget}
        disabled={loading}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {loading ? "Opening..." : value ? "Change Image" : "Upload Image"}
      </Button>
    </div>
  )
}
```

---

## Step 4: Update `Venues.tsx`

Replace the `Image URL` text input field in the dialog:

**Remove:**
```tsx
<div className="grid grid-cols-4 items-center gap-4">
  <Label htmlFor="image_url" className="text-right">Image URL</Label>
  <Input
    id="image_url"
    value={formData.image_url}
    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
    className="col-span-3"
    placeholder="https://..."
  />
</div>
```

**Replace with:**
```tsx
<div className="grid grid-cols-4 items-start gap-4">
  <Label className="text-right pt-2">Image</Label>
  <div className="col-span-3">
    <ImageUpload
      value={formData.image_url}
      onChange={(url) => setFormData({ ...formData, image_url: url })}
      folder="venues"
    />
  </div>
</div>
```

Add import at top:
```tsx
import { ImageUpload } from "@/components/ui/image-upload"
```

Also remove the manual URL validation block in `handleSave` (lines that do `new URL(formData.image_url.trim())`) since Cloudinary always returns valid URLs.

---

## Step 5: Update `Bottles.tsx`

Same change as Venues — replace the `Image URL` input with `<ImageUpload>`:

**Remove:**
```tsx
<div className="grid grid-cols-4 items-center gap-4">
  <Label htmlFor="image_url" className="text-right">Image URL</Label>
  <Input
    id="image_url"
    value={formData.image_url}
    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
    className="col-span-3"
    placeholder="https://..."
  />
</div>
```

**Replace with:**
```tsx
<div className="grid grid-cols-4 items-start gap-4">
  <Label className="text-right pt-2">Image</Label>
  <div className="col-span-3">
    <ImageUpload
      value={formData.image_url}
      onChange={(url) => setFormData({ ...formData, image_url: url })}
      folder="bottles"
    />
  </div>
</div>
```

Add import:
```tsx
import { ImageUpload } from "@/components/ui/image-upload"
```

---

## Step 6: Update `docker-compose.prod.yml`

The admin Dockerfile.prod uses `ARG` to pass Vite env vars at build time. Add the Cloudinary vars:

```yaml
admin:
  build:
    context: ./admin
    dockerfile: Dockerfile.prod
    args:
      VITE_API_URL: ${VITE_API_URL}
      VITE_CLOUDINARY_CLOUD_NAME: ${VITE_CLOUDINARY_CLOUD_NAME}
      VITE_CLOUDINARY_UPLOAD_PRESET: ${VITE_CLOUDINARY_UPLOAD_PRESET}
```

Verify `admin/Dockerfile.prod` has the ARG declarations — if not, add them before the `RUN npm run build` step:
```dockerfile
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET
```

---

## Step 7: Add vars to EC2 `.env`

SSH into EC2 and add to `~/StoreMyBottleApp/.env`:

```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=storemybottle_unsigned
```

---

## Files Changed Summary

| File | Change |
|---|---|
| `admin/src/components/ui/image-upload.tsx` | New component |
| `admin/src/components/Venues.tsx` | Replace image URL input with ImageUpload |
| `admin/src/components/Bottles.tsx` | Replace image URL input with ImageUpload |
| `admin/.env` | Add Cloudinary vars |
| `admin/.env.production` | Add Cloudinary vars |
| `docker-compose.prod.yml` | Pass Cloudinary vars as build args to admin |
| `admin/Dockerfile.prod` | Add ARG/ENV for Cloudinary vars (if missing) |
| `.env.docker` | Add Cloudinary vars |
| EC2 `~/.env` | Add Cloudinary vars |

---

## No Backend Changes

The backend already:
- Accepts `image_url` as a nullable string on both Venue and Bottle
- Stores and returns it as-is
- No file handling, no S3, no multipart — just a URL string

Cloudinary handles all storage, CDN delivery, and resizing. The admin just uploads, gets a URL, saves the form.

---

## Testing

1. Go to `https://admin.storemybottle.in`
2. Venues → Add Venue → click "Upload Image"
3. Cloudinary widget opens → pick a file
4. Image preview appears in the form
5. Save venue → check `https://storemybottle.in` — venue image should show
6. Repeat for Bottles
