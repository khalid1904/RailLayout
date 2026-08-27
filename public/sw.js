const CACHE_NAME = "train-coach-planner-v2";
const APP_SHELL = ["/manifest.webmanifest"];

function shouldCache(url: URL): boolean {
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/_next/")) return false;
  if (url.pathname.endsWith(".hot-update.json")) return false;
  if (url.pathname.endsWith(".hot-update.js")) return false;
  return APP_SHELL.includes(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") {
    return;
  }

  if (!shouldCache(url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
    )
  );
});
