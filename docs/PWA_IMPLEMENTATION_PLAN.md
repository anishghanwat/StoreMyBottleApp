# PWA Implementation Plan for StoreMyBottle

## Overview
Convert the three React apps (Customer, Bartender, Admin) into Progressive Web Apps (PWAs) that can be installed on mobile devices like native apps.

## Prerequisites
- ✅ Domain with HTTPS (required for PWA)
- ✅ React apps already built
- ✅ Service worker support in modern browsers

## Timeline: 2-3 hours per app (6-9 hours total)

---

## Phase 1: Customer App PWA (2-3 hours)

### Step 1.1: Create Web App Manifest
**File:** `frontend/public/manifest.json`

```json
{
  "name": "StoreMyBottle - Customer",
  "short_name": "StoreMyBottle",
  "description": "Store your bottle at your favorite nightclub",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#7C3AED",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png"
    },
    {
      "src": "/screenshots/venues.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ]
}
```

### Step 1.2: Update index.html
**File:** `frontend/index.html`

Add to `<head>`:
```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme color for browser UI -->
<meta name="theme-color" content="#7C3AED">

<!-- iOS specific -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="StoreMyBottle">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">

<!-- Android specific -->
<meta name="mobile-web-app-capable" content="yes">
```

### Step 1.3: Create Service Worker
**File:** `frontend/public/sw.js`

```javascript
const CACHE_NAME = 'storemybottle-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add critical assets
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
```

### Step 1.4: Register Service Worker
**File:** `frontend/src/main.tsx`

Add after ReactDOM.render:
```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### Step 1.5: Create App Icons
**Tools needed:**
- PWA Asset Generator: `npx @vite-pwa/assets-generator`
- Or use online tool: https://www.pwabuilder.com/imageGenerator

**Source image:** 512x512 PNG with transparent background

**Generate:**
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- icon-maskable-192x192.png (with safe zone)
- icon-maskable-512x512.png (with safe zone)

**Place in:** `frontend/public/icons/`

### Step 1.6: Add Install Prompt (Optional)
**File:** `frontend/src/components/InstallPrompt.tsx`

```typescript
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <div className="install-prompt">
      <p>Install StoreMyBottle app for quick access!</p>
      <button onClick={handleInstall}>Install</button>
      <button onClick={() => setShowInstall(false)}>Later</button>
    </div>
  );
}
```

### Step 1.7: Update Vite Config
**File:** `frontend/vite.config.ts`

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        // Will use manifest.json from public folder
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.storemybottle\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### Step 1.8: Install Dependencies
```bash
cd frontend
npm install vite-plugin-pwa workbox-window -D
```

### Step 1.9: Test PWA
**Chrome DevTools:**
1. Open DevTools → Application tab
2. Check Manifest section
3. Check Service Workers section
4. Run Lighthouse audit (PWA score)

**Test Install:**
1. Visit site on mobile (HTTPS required)
2. Browser shows "Add to Home Screen" prompt
3. Install and test offline functionality

---

## Phase 2: Bartender App PWA (2-3 hours)

### Repeat all steps from Phase 1 with these changes:

**Manifest differences:**
```json
{
  "name": "StoreMyBottle - Bartender",
  "short_name": "SMB Bartender",
  "description": "Scan and redeem customer bottles",
  "theme_color": "#10B981",
  "background_color": "#0a0a0a"
}
```

**Additional features for Bartender:**
- Camera permission handling
- QR scanner offline fallback
- Sync queue for offline redemptions

**Files to modify:**
- `frontend-bartender/public/manifest.json`
- `frontend-bartender/index.html`
- `frontend-bartender/public/sw.js`
- `frontend-bartender/src/main.tsx`
- `frontend-bartender/vite.config.ts`

---

## Phase 3: Admin Portal PWA (2-3 hours)

### Repeat all steps from Phase 1 with these changes:

**Manifest differences:**
```json
{
  "name": "StoreMyBottle - Admin",
  "short_name": "SMB Admin",
  "description": "Manage venues, bottles, and users",
  "theme_color": "#EF4444",
  "background_color": "#0a0a0a",
  "display": "standalone"
}
```

**Admin-specific considerations:**
- Desktop-first (but mobile-capable)
- Larger viewport requirements
- More complex caching strategy

**Files to modify:**
- `admin/public/manifest.json`
- `admin/index.html`
- `admin/public/sw.js`
- `admin/src/main.tsx`
- `admin/vite.config.ts`

---

## Phase 4: Testing & Optimization (2 hours)

### 4.1: Lighthouse Audit
Run for each app:
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://storemybottle.com --view
lighthouse https://bartender.storemybottle.com --view
lighthouse https://admin.storemybottle.com --view
```

**Target scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 100

### 4.2: Test on Real Devices
**Android:**
1. Chrome → Menu → "Add to Home Screen"
2. Test offline mode (airplane mode)
3. Test install/uninstall
4. Test notifications (if implemented)

**iOS:**
1. Safari → Share → "Add to Home Screen"
2. Test offline mode
3. Test standalone mode
4. Note: iOS has limited PWA features

### 4.3: Cross-browser Testing
- Chrome (Android)
- Safari (iOS)
- Firefox (Android)
- Samsung Internet
- Edge (Android)

### 4.4: Performance Optimization
- Lazy load routes
- Code splitting
- Image optimization
- Cache API responses
- Preload critical assets

---

## Phase 5: Deployment Updates (1 hour)

### 5.1: Update Docker Builds
Ensure manifest.json and icons are copied:

**Dockerfile.prod:**
```dockerfile
# Copy public assets including PWA files
COPY public ./public
```

### 5.2: Update nginx Config
Serve manifest with correct MIME type:

**nginx.conf:**
```nginx
location /manifest.json {
    types { application/manifest+json json; }
    add_header Cache-Control "public, max-age=604800";
}

location /sw.js {
    add_header Cache-Control "no-cache";
    add_header Service-Worker-Allowed "/";
}
```

### 5.3: Update CORS for Service Worker
Backend needs to allow service worker requests:

**backend/main.py:**
```python
# Add to CORS origins
"https://storemybottle.com",
"https://bartender.storemybottle.com",
"https://admin.storemybottle.com"
```

---

## Phase 6: Advanced Features (Optional, 4-6 hours)

### 6.1: Push Notifications
- Set up Firebase Cloud Messaging
- Add notification permission request
- Handle notification clicks
- Background sync for offline actions

### 6.2: Background Sync
- Queue failed API requests
- Sync when connection restored
- Show sync status to user

### 6.3: Offline Mode
- Cache all static assets
- IndexedDB for data storage
- Offline indicator UI
- Sync queue management

### 6.4: App Shortcuts
Add to manifest.json:
```json
"shortcuts": [
  {
    "name": "Scan QR",
    "short_name": "Scan",
    "description": "Scan customer QR code",
    "url": "/scan",
    "icons": [{ "src": "/icons/scan-96x96.png", "sizes": "96x96" }]
  }
]
```

---

## Checklist

### Customer App
- [ ] manifest.json created
- [ ] Icons generated (all sizes)
- [ ] Service worker implemented
- [ ] Service worker registered
- [ ] index.html updated
- [ ] Vite config updated
- [ ] Install prompt added
- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Lighthouse score 90+

### Bartender App
- [ ] manifest.json created
- [ ] Icons generated (all sizes)
- [ ] Service worker implemented
- [ ] Service worker registered
- [ ] index.html updated
- [ ] Vite config updated
- [ ] Camera permissions handled
- [ ] Offline QR fallback
- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Lighthouse score 90+

### Admin App
- [ ] manifest.json created
- [ ] Icons generated (all sizes)
- [ ] Service worker implemented
- [ ] Service worker registered
- [ ] index.html updated
- [ ] Vite config updated
- [ ] Desktop layout optimized
- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Lighthouse score 90+

### Deployment
- [ ] Docker builds updated
- [ ] nginx config updated
- [ ] CORS configured
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] SSL certificates installed
- [ ] All apps deployed
- [ ] Production testing complete

---

## Resources

### Tools
- **PWA Builder:** https://www.pwabuilder.com/
- **Icon Generator:** https://www.pwabuilder.com/imageGenerator
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse
- **Workbox:** https://developers.google.com/web/tools/workbox

### Documentation
- **MDN PWA Guide:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Web.dev PWA:** https://web.dev/progressive-web-apps/
- **Vite PWA Plugin:** https://vite-pwa-org.netlify.app/

### Testing
- **Chrome DevTools:** Application tab
- **Firefox DevTools:** Application tab
- **Safari Web Inspector:** Storage tab
- **Lighthouse CI:** https://github.com/GoogleChrome/lighthouse-ci

---

## Estimated Costs

- **Development Time:** 8-15 hours total
- **Icon Design:** Free (if using logo) or $50-200 (designer)
- **Testing Devices:** Use personal devices
- **Domain:** $10/year (already needed)
- **SSL Certificate:** Free (Let's Encrypt)
- **Hosting:** No additional cost (already on EC2)

**Total Additional Cost:** $0-200 (one-time)

---

## Success Metrics

### Technical
- Lighthouse PWA score: 100
- Service worker registered: 100%
- Install rate: Track via analytics
- Offline functionality: Working

### User Experience
- Install prompt shown: Track impressions
- Install completion: Track conversions
- App launches: Track vs web visits
- Offline usage: Track service worker hits

### Business
- User retention: Compare PWA vs web
- Engagement: Session duration
- Performance: Load time improvements
- Conversion: Purchase/redemption rates

---

## Next Steps After PWA

1. **App Store Presence (Optional):**
   - Use PWABuilder to generate app store packages
   - Submit to Google Play Store (easier)
   - Submit to Apple App Store (more restrictive)

2. **Native Features:**
   - If PWA limitations hit, migrate to Capacitor
   - Keep same codebase, add native wrappers
   - Access more device features

3. **Analytics:**
   - Track PWA installs
   - Monitor offline usage
   - Measure performance improvements
   - A/B test install prompts

---

## Notes

- **HTTPS is mandatory** for PWA features
- **iOS has limitations** (no push notifications, limited storage)
- **Service workers** don't work in private/incognito mode
- **Install prompts** are browser-controlled (can't force)
- **Updates** happen automatically when service worker changes
- **Testing** requires real devices (simulators have limitations)
