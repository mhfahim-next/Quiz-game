/* Quiz Kids service worker.
 *  - static build assets + icons: cache-first (they are content-hashed / immutable)
 *  - page navigations: network-first, fall back to the last cached copy, then /offline
 *  - never touches: /admin, /auth, /login, /profile, API calls (other origins, e.g. Supabase), non-GET
 */
const VERSION = "qk-v2";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];
const PRIVATE_PREFIXES = ["/admin", "/auth", "/login", "/profile"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase etc. always go to the network
  if (PRIVATE_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/offline.html")) || Response.error()),
    );
  }
});
