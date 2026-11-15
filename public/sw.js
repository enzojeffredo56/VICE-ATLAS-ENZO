/* Service worker VICE ATLAS — cache volontairement limité.
 *  - Ressources statiques versionnées (_next/static, icônes, polices) : cache d'abord.
 *  - Pages : réseau d'abord, copie de secours des dernières pages vues, sinon page hors ligne.
 *  - Jamais en cache : API, authentification, administration, requêtes non GET, autres domaines.
 */
const VERSION = "va-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/hors-ligne";
const PRECACHE = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
const LIMITS = { [STATIC_CACHE]: 120, [PAGE_CACHE]: 25 };
const NEVER = [/^\/api\//, /^\/auth\//, /^\/admin/, /^\/connexion/, /^\/inscription/, /^\/reinitialiser/, /^\/mot-de-passe/];

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

async function trim(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const extra = keys.length - LIMITS[cacheName];
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
    void trim(STATIC_CACHE);
  }
  return response;
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
      void trim(PAGE_CACHE);
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER.some((re) => re.test(url.pathname))) return;
  if (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(?:woff2?|png|svg|webp)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.mode === "navigate") event.respondWith(networkFirstPage(request));
});
