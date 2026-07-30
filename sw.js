const VERSION = "1.2";
const CORE_CACHE = `spaceshooter-core-v${VERSION}`;
const ASSET_CACHE = `spaceshooter-assets-v${VERSION}`;

const CORE_FILES = [
  "index.html",
  "style.css",
  "manifest.json",
  "src/main.js",
  "src/game.js",
  "src/config.js",
  "src/assetLoader.js",
  "src/input.js",
  "src/audio.js",
  "src/save.js",
  "src/entities.js",
  "src/waves.js",
  "src/ui.js",
  "src/updateNotifier.js",
];

const CORE_PATHS = new Set(CORE_FILES.map((f) => new URL(f, self.location.href).pathname));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_FILES)));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CORE_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isCore = event.request.mode === "navigate" || CORE_PATHS.has(new URL(event.request.url).pathname);
  event.respondWith(isCore ? networkFirst(event.request) : cacheFirst(event.request));
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open(CORE_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  const cache = await caches.open(ASSET_CACHE);
  cache.put(request, res.clone());
  return res;
}
