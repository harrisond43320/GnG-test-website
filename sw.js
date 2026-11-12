// G'N'G app helper (service worker), 2026-10-06.
// Pages: always try the internet first (so a new push shows up right away), fall back to the saved copy,
// then to app/offline.html. Photos, CSS and fonts: show the saved copy fast, refresh it in the background.
// Bump VERSION if this file's rules change. Lives next to the homepage, so in the repo it covers the whole site.
const VERSION = 'gng-v53'; // 2026-11-12: v53 = header video fade 1.2s -> .3s (chrome.css + home), home leaf + mowing loops re-cut with clean cuts, 1080p cut for big screens on 6 Mbps+ with a swap to 720p if it stalls. 2026-11-11 late night: v52 = Fall Pass canceled and removed (banner off, pages plain, chip row on by default, ?lay=2 mock gone). 2026-11-11 night: v51 = busy cuts on phones (banner off, one pill, short first screens, leaves form tap line) + SEO step 4 (img sizes, JSON-LD). 2026-11-11: v50 = leaf-price retired (price by text only). 2026-11-10 late: v49 = ten-of-ten step 1 (phones: plan buttons open a pre-filled text; bar steps aside for page buttons). 2026-11-10: v48 = Google record 5.0 / 64 + Jared B. review. v47 = phone feel round 1 (no idle animation on phones, slimmer header + bar, reveal margin, videos preload metadata, images + fonts cache now survives version bumps, 4s network timeout on pages). 2026-11-06: v46 = /leaves address box, Fall Pass money line back to per visit, computers go to the box, banner drops the date after 11/13. 2026-11-04: v45 = sample leaf-price moved off a private home to Babb's Orchard Park lawn (public). v44: 2026-11-04: v44 = Google record 5.0 / 63. v43 = 5.0 / 62. 2026-11-03: v40 = Fall Pass money line (visit 1 at booking, then pay per visit, refund visit 1 if not happy) on fall-cleanup + winter-walk. v36 = the Fall Pass relaunch (set visits + one free, proof every visit, 3-day start, book by Fri 11/13) + Your leaf-price bands on fall-cleanup (replaced the Winter Walk) + topbar, nav and service-card lines sitewide. v35: 2026-11-03: v35 = HOA page header video (broll-hoa-wide) + Heather B. HOA review under the header. v34 = conversion rounds 3-4: reply promise under the home header button, HOA outlined button, pinned full review, home loop starts on the stripes, phone bar back to the yard plan. v33 = review order (strong at both ends), rows move only once on screen, HOA line in the home header, record row repeat out. v32 = home step 2 (five + ticket one section, 4 service rows) + one small-type scale. v31 = clean-up plan: one banner (topbar leaf/presell), slimmer phone bar, lettering clean-up (chrome.css), home: one hero photo + computer loop, reviews second, reel + quick links out. v30: 2026-10-31: v30 = phone header top padding 64 -> 20px on the video pages (chrome.css). v29: 2026-10-31: v29 = fall-cleanup leaf loop v3 (the 10/30 4K leaf shoot). v28: 2026-10-29 late: v28 = header loops v3 (short shots, no repeats, trimmer + stripes). v27: 2026-10-29: v27 = video headers (fall-cleanup phone strip, lawn-mowing, season-pass v2, five). v26: 2026-10-22: v25 = 2027 save-5% line on the phone bar (chrome.css + footer) + 320px phone fixes (header, section headings). v24 (2026-10-22): v24 = fall aeration last day moved to Sat 10/31 (home strip, aeration Double Pass, soil-check). 2026-10-21: v23 = our-work photos below the header wait for page load (data-src). 2026-10-20: v22 = phone-size crops for all 5 home hero slides (fixes home phone LCP), softer hero shade edges. 2026-10-20 round 3: v21 = Call+Text buttons, skip link, per-page plan links, lighter heroes, 3 fonts, small logo. v20 = round 2. v19 = header videos reverted to photos. 2026-10-19: v18 = header video panel beside the words (v2 B-roll, 4:5, steadied). v17 = header B-roll videos (site.js + chrome.css). v16 = smaller, simpler arrows icon in the Double Pass badge. v15 = /double-pass short link in vercel.json, v15 = Double Pass badge + section (aeration), fix block (soil-check), strip uses the name. v14 = promo strip css in chrome.css, promo strip on home, Soil Check button on aeration page + menu link, topbar line on soil-check. v13 = new aeration + Soil Check hero photos, pass wording. v12 = Soil Check page. 2026-10-13: v11 = flat again (no grain, glows or soft shadows; text 14px+), yard plan first + "Call or text Harrison" ask. 2026-10-08: v10 = less scroll on phones (shorter footer, 2-across service cards, tighter steps, why-gng 3 cards, Menu word on small phones). v9 = speed pass (own fonts, 600px phone card photos, lighter phone heroes). v8 = new before/after pairs from Drive, before/after side by side on phones, service card photos spread out. v7 = Five checks in one 1-5 row, faster review rows on phones. 2026-10-07: v6 (late) = new header (About list + Yard Score button), sharper photos, review drag; v5 = homepage cut-down + about/faq/our-work + phone footer; v4 (late) = reviews.js + review zoom styles; v3 = site.js photo loading + green draft glow
const PAGES = VERSION + '-pages';
const FILES = VERSION + '-files';   // css + js: rotates with VERSION
const IMAGES = 'gng-img-v1';         // photos + fonts: never deleted on a version bump (they keep their names)
const isMedia = (u, sameSite) => !sameSite || /^\/(img|fonts)\//.test(u.pathname) || /\.(jpg|jpeg|png|webp|svg|woff2?)$/i.test(u.pathname);
const CORE = ['./', 'app/offline.html', 'app/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(PAGES).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== IMAGES && !k.startsWith(VERSION)).map(k => caches.delete(k))))
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
      Promise.race([
        fetch(req)
          .then(res => {
            if (res.ok) { const copy = res.clone(); caches.open(PAGES).then(c => c.put(req, copy)); }
            return res;
          })
          .catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match('app/offline.html'))),
        // 2026-11-10: slow signal? after 4s show the saved copy of this page (if there is one); the network answer still refreshes the saved copy
        new Promise(resolve => setTimeout(async () => { const saved = await caches.match(req, { ignoreSearch: true }); if (saved) resolve(saved); }, 4000))
      ])
    );
    return;
  }

  // Photos, CSS, JS, fonts: saved copy first, refresh in the background.
  if (/\.(jpg|jpeg|png|webp|svg|css|js|woff2?)$/i.test(url.pathname) || !sameSite) {
    e.respondWith(
      caches.open(isMedia(url, sameSite) ? IMAGES : FILES).then(async c => {
        const saved = await c.match(req);
        const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => saved);
        return saved || fresh;
      })
    );
  }
});
