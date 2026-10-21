// G'N'G app helper (service worker), 2026-10-06.
// Pages: always try the internet first (so a new push shows up right away), fall back to the saved copy,
// then to app/offline.html. Photos, CSS and fonts: show the saved copy fast, refresh it in the background.
// Bump VERSION if this file's rules change. Lives next to the homepage, so in the repo it covers the whole site.
const VERSION = 'gng-v23'; // 2026-10-21: v23 = our-work photos below the header wait for page load (data-src). 2026-10-20: v22 = phone-size crops for all 5 home hero slides (fixes home phone LCP), softer hero shade edges. 2026-10-20 round 3: v21 = Call+Text buttons, skip link, per-page plan links, lighter heroes, 3 fonts, small logo. v20 = round 2. v19 = header videos reverted to photos. 2026-10-19: v18 = header video panel beside the words (v2 B-roll, 4:5, steadied). v17 = header B-roll videos (site.js + chrome.css). v16 = smaller, simpler arrows icon in the Double Pass badge. v15 = /double-pass short link in vercel.json, v15 = Double Pass badge + section (aeration), fix block (soil-check), strip uses the name. v14 = promo strip css in chrome.css, promo strip on home, Soil Check button on aeration page + menu link, topbar line on soil-check. v13 = new aeration + Soil Check hero photos, pass wording. v12 = Soil Check page. 2026-10-13: v11 = flat again (no grain, glows or soft shadows; text 14px+), yard plan first + "Call or text Harrison" ask. 2026-10-08: v10 = less scroll on phones (shorter footer, 2-across service cards, tighter steps, why-gng 3 cards, Menu word on small phones). v9 = speed pass (own fonts, 600px phone card photos, lighter phone heroes). v8 = new before/after pairs from Drive, before/after side by side on phones, service card photos spread out. v7 = Five checks in one 1-5 row, faster review rows on phones. 2026-10-07: v6 (late) = new header (About list + Yard Score button), sharper photos, review drag; v5 = homepage cut-down + about/faq/our-work + phone footer; v4 (late) = reviews.js + review zoom styles; v3 = site.js photo loading + green draft glow
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
