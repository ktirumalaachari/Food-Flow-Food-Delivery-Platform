/**
 * FoodFlow Production Progressive Web App Service Worker
 * Version: 1.0.0
 */

const CACHE_VERSION = "foodflow-v1.0.0";
const STATIC_CACHE = `foodflow-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `foodflow-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `foodflow-images-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/offline.html",
  "/manifest.json",
  "/manifest.webmanifest",
  "/foodNav.png",
  "/Food-Flow-Logo.png",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-180x180.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon-192x192.png",
  "/icons/maskable-icon-512x512.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-16x16.png",
];

// Sensitive routes that must NEVER be cached
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//i,
  /\/api\/user\/profile/i,
  /\/api\/orders\/verify/i,
  /\/api\/orders\/webhook/i,
  /\/api\/ai\/(?!settings)/i,
  /\/socket\.io/i,
  /razorpay/i,
  /\/dashboard\/admin/i,
];

// Maximum cached items in runtime & image caches
const MAX_IMAGE_ITEMS = 60;
const MAX_RUNTIME_ITEMS = 40;

async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      await trimCache(cacheName, maxItems);
    }
  } catch (err) {
    // Graceful ignore
  }
}

// ── 1. INSTALL EVENT ───────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Cache what is available, continue even if single asset fails
      await Promise.all(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Precache item ${asset} skipped:`, err);
          })
        )
      );
      return self.skipWaiting();
    })()
  );
});

// ── 2. ACTIVATE EVENT (Cache Cleanup) ──────────────────────────
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE];

  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (
            key.startsWith("foodflow-") &&
            !currentCaches.includes(key)
          ) {
            console.log(`[SW] Removing outdated cache: ${key}`);
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

// ── 3. MESSAGE EVENT (Force Skip Waiting) ──────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── 4. FETCH EVENT (Intelligent Routing & Caching) ─────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never handle non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // 2. Never cache sensitive auth / payments / sockets
  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return;
  }

  // 3. Navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Network first with fast response
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Network failed — try cached version of page
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to custom offline page
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) {
            return offlinePage;
          }
          return (
            (await caches.match("/offline")) ||
            new Response("Offline - Please connect to the internet.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }
      })()
    );
    return;
  }

  // 4. Next.js Immutable Static Chunks & Fonts (Cache-First)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Images (Stale While Revalidate)
  if (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|svg|webp|gif|avif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
              trimCache(IMAGE_CACHE, MAX_IMAGE_ITEMS);
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || (await networkFetch) || caches.match("/foodNav.png");
      })
    );
    return;
  }

  // 6. Public APIs (Network-First with Runtime fallback)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(RUNTIME_CACHE, MAX_RUNTIME_ITEMS);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default fallback: Network with cache fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// ── 5. PUSH NOTIFICATIONS ──────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "Food Flow",
    body: "You have an update on your Food Flow order!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "foodflow-order-update",
    data: { url: "/" },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-72x72.png",
    tag: data.tag || "foodflow-notification",
    vibrate: [150, 50, 150, 50, 250],
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: data.data || { url: "/" },
    actions: [
      { action: "explore", title: "View Details" },
      { action: "close", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// ── 6. NOTIFICATION CLICK ──────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client && client.url !== targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
