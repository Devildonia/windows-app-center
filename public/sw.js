/**
 * WINDOWS 95 APP CENTER - SERVICE WORKER
 * Full offline PWA support with smart caching strategies.
 * v2.0 — Fase 4 Refactor
 */

const CACHE_VERSION = '1.6.2';
const CACHE_NAME = `win95-app-center-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `win95-dynamic-v${CACHE_VERSION}`;
const MAX_DYNAMIC_ITEMS = 80;

// Core shell — always cached on install
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/main.js',
    '/style.css',
    '/favicon.ico',
    '/manifest.json',
    // JS modules
    '/js/config.js',
    '/js/utils.js',
    '/js/RagdollMemory.js',
    '/js/core/ServiceContainer.js',
    '/js/core/EventBus.js',
    '/js/core/Kernel.js',
    '/js/core/VFS.js',
    '/js/core/BootLoader.js',
    '/js/core/HDRManager.js',
    '/js/core/os_engine.js',
    '/js/core/SystemBridge.js',
    '/js/core/EventDelegation.js',
    '/js/core/event_listeners.js',
    '/js/ui/windows.js',
    '/js/ui/WindowFactory.js',
    '/js/ui/TaskbarManager.js',
    '/js/ui/DesktopManager.js',
    '/js/ui/ShaderWallpaper.js',
    '/js/ui/TouchManager.js',
    '/js/ui/MessageLibrary.js',
    '/js/ui/BubbleAnimator.js',
    '/js/audio/AudioManager.js',
    '/js/apps/Notepad.js',
    '/js/apps/Paint.js',
    '/js/apps/Games.js',
    '/js/apps/FileExplorer.js',
    '/js/apps/WebampApp.js',
    '/js/apps/GenericApps.js',
    '/js/apps/InternetExplorer.js',
    '/games/tetris_tryhard/js/Game.js',
    // Libs
    '/libs/matter.min.js',
    '/libs/webamp.bundle.min.js',
    // Icons
    '/assets/icons/iexplorer.webp',
    '/assets/icons/Display.webp',
    '/assets/icons/ragdoll_skins.webp',
    '/assets/icons/winamp_icon.webp',
    '/assets/icons/neon.webp',
    '/assets/icons/rush.webp',
    '/assets/icons/vlrs_icon.webp',
    '/assets/icons/doom.webp',
    '/assets/icons/tetris.webp',
    '/assets/icons/brain.webp',
    '/assets/icons/pwa_icon_512.png',
    // Audio
    '/assets/audio/w95_startup.opus',
    '/assets/audio/w95_shutdown.opus',
    // Wallpapers (small — cache all)
    '/assets/wallpapers/w95_1.webp',
    '/assets/wallpapers/w95_2.webp',
    '/assets/wallpapers/w95_3.webp',
    '/assets/wallpapers/w95_4.webp',
    '/assets/wallpapers/w95_5.webp',
    '/assets/wallpapers/w95_6.webp',
    '/assets/wallpapers/w95_7.webp',
    '/assets/wallpapers/w95_8.webp'
];

// ============================================
// INSTALL — Pre-cache core shell
// ============================================
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing v${CACHE_VERSION}`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Install failed:', err))
    );
});

// ============================================
// ACTIVATE — Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating v${CACHE_VERSION}`);
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                    .map(key => {
                        console.log(`[SW] Deleting old cache: ${key}`);
                        return caches.delete(key);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ============================================
// FETCH — Strategy router
// ============================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET and cross-origin requests
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // Strategy 1: Game assets — JS/CSS go network-first (pick up code changes immediately);
    // large binary assets (images, audio) go stale-while-revalidate
    if (url.pathname.startsWith('/games/')) {
        if (/\.(js|css|html)$/i.test(url.pathname)) {
            event.respondWith(networkFirst(event.request));
        } else {
            event.respondWith(staleWhileRevalidate(event.request));
        }
        return;
    }

    // Strategy 2: Network-first for HTML (always get latest)
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Strategy 3: Cache-first for static assets (JS, CSS, images, audio)
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    // Default: network with dynamic cache fallback
    event.respondWith(networkFirst(event.request));
});

// ============================================
// CACHING STRATEGIES
// ============================================

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline — asset not cached', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
            await trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS);
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Offline fallback for navigation
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
    }
}

async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request)
        .then(response => {
            if (response && response.status === 200 && response.type !== 'opaque') {
                const responseToCache = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseToCache));
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

// ============================================
// HELPERS
// ============================================

function isStaticAsset(pathname) {
    return /\.(js|css|webp|png|jpg|jpeg|gif|ico|opus|mp3|mp4|woff2?|ttf|svg)$/i.test(pathname);
}

async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        // Delete oldest entries (FIFO)
        const deleteCount = keys.length - maxItems;
        await Promise.all(keys.slice(0, deleteCount).map(key => cache.delete(key)));
    }
}

// ============================================
// UPDATE NOTIFICATION — Tell clients when new version is ready
// ============================================
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
