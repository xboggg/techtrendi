// Retired (20 Oct 2026). The old site-wide worker at /sw.js cached every page cache-first, so
// visitors could be stuck on an old build, and on activate it deleted EVERY other cache (the data
// bundle pages' offline copy included). Nothing registers it any more (the push-notification
// prompt that did is not used on the site).
//
// This stub replaces it so browsers that still have it installed drop it on their next update
// check: it deletes ONLY the old worker's own caches (never tt-db-* or anything else), then
// unregisters itself. It has no fetch handler, so it never answers a request. Open pages keep
// working and load from the network on their next navigation.
const OWN_CACHES = ['techtrendi-v1', 'techtrendi-static-v1', 'techtrendi-dynamic-v1'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (OWN_CACHES.includes(name)) await caches.delete(name);
    }
    await self.registration.unregister();
  })());
});
