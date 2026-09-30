// Raft service worker.
//   - Navigations: network-first, fall back to the cached shell, so new deploys
//     land immediately and the app still opens offline.
//   - /assets/* (hashed JS/CSS) and /icons/*: cache-first.
//   - /api/* (PocketBase: auth, realtime, records) and other origins: never touched.

const VERSION = "v1";
const SHELL = `raft-shell-${VERSION}`;
const ASSETS = `raft-assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.add("/")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL, ASSETS]);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_/")) return;

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (req.mode === "navigate") {
    event.respondWith(networkFirstShell(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirstShell(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(SHELL)).put("/", res.clone());
    return res;
  } catch {
    const cached = await (await caches.open(SHELL)).match("/");
    return cached || Response.error();
  }
}
