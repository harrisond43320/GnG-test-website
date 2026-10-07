// G'N'G app helper (service worker), 2026-10-06.
// Pages: always try the internet first (so a new push shows up right away), fall back to the saved copy,
// then to app/offline.html. Photos, CSS and fonts: show the saved copy fast, refresh it in the background.
// Bump VERSION if this file's rules change. Lives next to the homepage, so in the repo it covers the whole site.
const VERSION = 'gng-v2'; // 2026-10-07: v2 so returning visitors get the faster CSS/JS right away
const PAGES = VERSION + '-pages';
const FILES = VERSION + '-files';
const CORE = ['./', 'app/offline.html', 'app/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(PAGES).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  if (!sameSite && !FONT_HOSTS.includes(url.hostname)) return; // leave everything else alone

  // Pages: internet first.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(PAGES).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match('app/offline.html')))
    );
    return;
  }

  // Photos, CSS, JS, fonts: saved copy first, refresh in the background.
  if (/\.(jpg|jpeg|png|webp|svg|css|js|woff2?)$/i.test(url.pathname) || !sameSite) {
    e.respondWith(
      caches.open(FILES).then(async c => {
        const saved = await c.match(req);
        const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => saved);
        return saved || fresh;
      })
    );
  }
});
