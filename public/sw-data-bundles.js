// Offline copy for the data bundle pages ONLY (switched on 20 Oct 2026 with the owner's approval;
// kill switch: DATA_BUNDLES_OFFLINE in src/data/dataBundlesRoute.ts).
//
// Served WITHOUT a .js extension (the address is DATA_BUNDLES_SW in src/data/dataBundlesRoute.ts):
// an exact nginx location returns this file as application/javascript with no-cache, so the
// SPA fallback can never answer the worker's address with HTML.
//
// Registered with the scope of the data bundle pages, so it never controls any other page; the
// fetch handler also checks every navigation is inside that scope.
//   - Pages (navigations): network first; the saved copy only when the network fails.
//   - The prices file: network first with an 8 s limit, then the saved copy. A late network
//     answer is still saved, and open pages are told (message "tt-db-prices-fresh") so they
//     can re-check and show it. Only a JSON answer that parses is ever saved.
//   - Built files with a hash in their name (/assets/ or the preview's /pv-assets/): saved copy
//     first (the name changes whenever the file does). Nothing else is touched: other sites
//     (db2, ads, analytics), non-GET requests and unhashed files pass straight through.
// Anything served from the saved copy carries the header X-TT-Saved-Copy: 1, so the page can say
// "Saved prices from ..." instead of "Checked today". Matches ignore Vary (a module script asks with
// an Origin header, the saved copy was fetched without one).
//
// New versions replace old ones by themselves: BUILD_ID is stamped in at build time (vite.config.ts,
// plugin "data-bundles-sw"), so every build is a new worker file; it skips waiting and claims the
// open pages. On activate it MOVES the older build's saved pages, prices and built files into its
// own caches (so a visitor who goes offline right after an update still has every page), then
// deletes the old caches. The page re-sends its file list when the new worker takes over.
const BUILD_ID = '__BUILD_ID__';
// The data bundle route files of this build (the network pages' code), stamped in at build time,
// so one visit saves every network page, not only the one that was opened.
const ROUTE_ASSETS = ['__ROUTE_ASSETS__'].filter((u) => u.charAt(0) === '/');
const PREFIX = 'tt-db-';
const PAGES = `${PREFIX}pages-${BUILD_ID}`;
const ASSETS = `${PREFIX}assets-${BUILD_ID}`;
const PRICES = `${PREFIX}prices-${BUILD_ID}`;
const PRICES_PATH = '/storage/data-bundles/';
const PRICES_TIMEOUT_MS = 8000;
const FETCHED_AT = 'X-TT-Fetched-At';
const JUST_FETCHED_MS = 2 * 60 * 1000;
const MAX_ASSETS = 200;
const HASHED = /^\/(?:pv-)?assets\/.+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|png|jpe?g|svg|webp|avif)$/;
const SCOPE_PATH = new URL(self.registration.scope).pathname;
// The few unhashed files these pages show (logo, icons): network first, saved copy offline.
const STATIC = new Set(['/logo-t.png', '/favicon.ico', '/favicon-32x32.png', '/favicon-16x16.png', '/manifest.json']);

self.addEventListener('install', () => self.skipWaiting());

// Copy what an older build saved into this build's cache (never overwriting a newer copy).
async function adopt(fromName, toName) {
  const from = await caches.open(fromName);
  const to = await caches.open(toName);
  for (const req of await from.keys()) {
    if (await to.match(req, { ignoreVary: true })) continue;
    const res = await from.match(req, { ignoreVary: true });
    if (res) await to.put(req, res);
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([PAGES, ASSETS, PRICES]);
    for (const name of await caches.keys()) {
      if (!name.startsWith(PREFIX) || keep.has(name)) continue;
      try {
        if (name.startsWith(`${PREFIX}pages-`)) await adopt(name, PAGES);
        else if (name.startsWith(`${PREFIX}prices-`)) await adopt(name, PRICES);
        else if (name.startsWith(`${PREFIX}assets-`)) await adopt(name, ASSETS);
      } catch { /* a failed copy never blocks the update */ }
      await caches.delete(name);
    }
    await trimAssets();
    await self.clients.claim();
  })());
});

const saved = async (res) => {
  const headers = new Headers(res.headers);
  headers.set('X-TT-Saved-Copy', '1');
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers });
};

// The prices file is kept only when it is JSON that parses (never an HTML error page).
async function isPricesJson(response) {
  if (!/json/i.test(response.headers.get('content-type') || '')) return false;
  try { JSON.parse(await response.clone().text()); return true; } catch { return false; }
}

// Saves a good same-site answer; true when it was saved. A prices copy is stamped with the time
// it came from the network (X-TT-Fetched-At) when it is a slow network's late answer (late = true).
async function store(cacheName, request, response, late = false) {
  if (!response || !response.ok || response.type !== 'basic') return false;
  if (cacheName === PRICES && !(await isPricesJson(response))) return false;
  let copy = response.clone();
  if (cacheName === PRICES && late) {
    const headers = new Headers(response.headers);
    headers.set(FETCHED_AT, String(Date.now()));
    copy = new Response(await response.clone().blob(), { status: response.status, statusText: response.statusText, headers });
  }
  await (await caches.open(cacheName)).put(request, copy);
  return true;
}

// The saved copy, marked as saved, unless it is a prices copy that came from the network within
// JUST_FETCHED_MS (a slow network's late answer): that one is as fresh as a network answer, so the
// page shows "Checked" again even if the network is still slow when it re-checks.
function fromSaved(cacheName, old) {
  const at = Number(old.headers.get(FETCHED_AT));
  if (cacheName === PRICES && at && Date.now() - at < JUST_FETCHED_MS) return old;
  return saved(old);
}

async function put(cacheName, request, response) {
  await store(cacheName, request, response);
  return response;
}

async function tellPages(type) {
  for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ type });
}

async function networkFirst(cacheName, request, timeoutMs, key) {
  const k = key || request;
  const fromCache = () => caches.match(k, { cacheName, ignoreSearch: true, ignoreVary: true });
  const netP = fetch(request);
  try {
    let net;
    if (timeoutMs) {
      let timedOut = false;
      net = await Promise.race([netP, new Promise((_, rej) => setTimeout(() => { timedOut = true; rej(new Error('timeout')); }, timeoutMs))]).catch(async (err) => {
        if (!timedOut) throw err;
        // Too slow: answer with the saved copy now, keep waiting for the network, save its answer
        // and tell the open pages, so they show the fresh prices as soon as they arrive.
        netP.then(async (late) => {
          if (await store(cacheName, k, late, true)) await tellPages('tt-db-prices-fresh');
        }).catch(() => {});
        throw err;
      });
    } else {
      net = await netP;
    }
    if (net.ok) return put(cacheName, k, net);
    // Some redirects (an old address moved by nginx) come back opaque: pass them through.
    if (net.type === 'opaqueredirect') return net;
    const old = await fromCache();
    return old ? fromSaved(cacheName, old) : net;
  } catch (err) {
    const old = await fromCache();
    if (old) return fromSaved(cacheName, old);
    throw err;
  }
}

async function trimAssets() {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  for (const old of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(old);
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(request);
  await put(ASSETS, request, res);
  await trimAssets();
  return res;
}

// A page's own pathname (no query) is the key for its saved copy.
const pageKey = (url) => new Request(new URL(url.pathname, url.origin).href);

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    if (!url.pathname.startsWith(SCOPE_PATH)) return; // never another page of the site
    event.respondWith(networkFirst(PAGES, request, 0, pageKey(url)));
  } else if (url.pathname.startsWith(PRICES_PATH)) {
    event.respondWith(networkFirst(PRICES, request, PRICES_TIMEOUT_MS, new Request(new URL(url.pathname, url.origin).href)));
  } else if (HASHED.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (STATIC.has(url.pathname)) {
    event.respondWith(networkFirst(ASSETS, request, 0, new Request(url.href)));
  }
});

// After a visit the page sends what it loaded plus every data bundle page's address; this build's
// route files are added here. Pages and prices are always re-fetched (small, and a copy moved over
// from an older build must be replaced); built files are fetched only when not saved yet.
self.addEventListener('message', (event) => {
  const d = event.data;
  if (!d || d.type !== 'tt-db-save' || !Array.isArray(d.urls)) return;
  event.waitUntil((async () => {
    for (const u of [...d.urls, ...ROUTE_ASSETS]) {
      try {
        const url = new URL(u, self.location.origin);
        if (url.origin !== self.location.origin) continue;
        if (url.pathname.startsWith(SCOPE_PATH)) {
          const r = await fetch(url.href, { credentials: 'same-origin', cache: 'no-cache' });
          if (r.ok && r.type === 'basic' && /text\/html/i.test(r.headers.get('content-type') || '')) await (await caches.open(PAGES)).put(pageKey(url), r);
        } else if (url.pathname.startsWith(PRICES_PATH)) {
          const r = await fetch(url.href, { cache: 'no-cache' });
          if (r.ok && (await isPricesJson(r))) await (await caches.open(PRICES)).put(new Request(new URL(url.pathname, url.origin).href), r);
        } else if (HASHED.test(url.pathname) || STATIC.has(url.pathname)) {
          const c = await caches.open(ASSETS);
          if (!(await c.match(url.href, { ignoreVary: true }))) { const r = await fetch(url.href); if (r.ok) await c.put(url.href, r); }
        }
      } catch { /* one file failing never stops the rest */ }
    }
    await trimAssets();
  })());
});
