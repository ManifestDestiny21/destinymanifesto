/* Destiny Manifesto — offline shell cache for installability.
 *
 * Privacy: only public, static assets are cached. Signed-in pages and API
 * responses (profiles, addresses, applications) are never written to the cache,
 * so nothing personal is left on shared or borrowed devices.
 */
const CACHE = "destiny-manifesto-v3";
const OFFLINE_URL = "/";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.png",
];

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/icons/")) return true;
  return PRECACHE.includes(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // credentials: "omit" so the cached shell is the signed-out public page.
      .then((cache) => cache.addAll(PRECACHE.map((path) => new Request(path, { credentials: "omit" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // Deleting old caches also purges anything earlier versions cached from
  // signed-in pages.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            }
            return response;
          })
      )
    );
    return;
  }

  // Page navigations: always go to the network; if offline, show the cached
  // public home page. Nothing from the network response is stored.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
  // Everything else (API calls, data requests) passes straight through.
});
