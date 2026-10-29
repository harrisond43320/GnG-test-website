// G'N'G shared script for the inner pages (2026-10-07).
// Header + menu + Services dropdown, scroll reveal, ticket notches + countdown, button shine timing,
// lead tracking, the phone-app card, and the offer that ends March 31, 2027.
(() => {
  window.dataLayer = window.dataLayer || [];
  const track = (event, extra) => window.dataLayer.push(Object.assign({ event, page: location.pathname }, extra || {}));
  if (new URLSearchParams(location.search).has('drafts')) document.documentElement.classList.add('show-drafts');

  // Scroll reveal (2026-10-07: starts as soon as a bit shows, so nothing waits on screen)
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .05, rootMargin: '0px 0px -16px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Slideshow photos 2-5 wait until the page is ready (2026-10-07). Later the same day, more speed: each one loads
  // ~3s before its turn, and only while the slideshow is on screen (same code as the homepage).
  const later = () => {
    const load = i => { if (!i.dataset.src) return; if (i.dataset.srcset) i.srcset = i.dataset.srcset; i.src = i.dataset.src; i.removeAttribute('data-src'); };
    const imgs = [...document.querySelectorAll('img[data-src]')];
    imgs.filter(i => !i.closest('.broll')).forEach(load);
    const roll = imgs.filter(i => i.closest('.broll'));
    if (!roll.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return; // still hero = photo 1 only
    let on = true;
    const check = () => {
      const t = performance.now() / 1000;
      roll.forEach(i => { if (on && !i.closest('.vid-on') && t >= (parseFloat(getComputedStyle(i).animationDelay) || 0) - 3) load(i); });
      if (!roll.some(i => i.dataset.src)) clearInterval(timer);
    };
    const timer = setInterval(check, 1000);
    new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) check(); }).observe(roll[0].closest('.broll'));
    check();
  };
  if (document.readyState === 'complete') later(); else addEventListener('load', later);

  // Header B-roll video (2026-10-19 v2, make-broll.ps1): a muted loop of real job clips fades in over the header photo,
  // which a vid-hero header shows as a 4:5 panel beside the words (chrome.css).
  // The photo stays the first paint (speed). The video starts 1.5s after the page loads and only once the header
  // is on screen; it pauses when scrolled away. Skipped on Save-Data, 2g/3g and reduced motion (the photo stays).
  // Phones and small panels get the 576px cut, big sharp screens the 720px cut. Keep the same code in the homepage script.
  (() => {
    // 2026-10-25: (1) a header with data-broll-wide also gets a 16:9 loop behind the words on computers (the horizontal clips;
    // chrome.css darkens it under the words). Phones never load it. (2) Both loops start as soon as this script runs (Harrison:
    // "when you load up, the video instantly pops up and starts rolling"), not 1.5s after the load event.
    const box = document.querySelector('.hero-photo[data-broll-lg]');
    const hero = document.querySelector('header.vid-hero[data-broll-wide]');
    if (!box && !hero) return;
    const net = navigator.connection || {};
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || net.saveData || /2g|3g/.test(net.effectiveType || '')) return;
    const mk = (src, cls) => {
      const v = document.createElement('video');
      v.className = cls; v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      ['muted', 'playsinline', 'disablepictureinpicture'].forEach(a => v.setAttribute(a, ''));
      v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
      v.src = src;
      return v;
    };
    const watch = (v, el) => new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }).observe(el);
    const desktop = innerWidth >= 960;
    const tile = () => {
      if (!box || getComputedStyle(box).display === 'none') return;   // 2026-10-29: a page that hides the tile on computers (lawn-mowing) loads only the wide loop
      const r = box.getBoundingClientRect();
      const v = mk(desktop && r.width * (devicePixelRatio || 1) > 620 ? box.dataset.brollLg : box.dataset.brollSm, 'hero-vid');
      v.addEventListener('playing', () => { v.classList.add('on'); box.classList.add('vid-on'); }, { once: true });
      box.appendChild(v); watch(v, box);
      return v;
    };
    const wide = () => {
      if (!hero || !desktop) return;
      const w = mk(hero.dataset.brollWide, 'hero-wide');
      w.addEventListener('playing', () => { w.classList.add('on'); hero.classList.add('wide-on'); }, { once: true });
      const pic = hero.querySelector('.hero-wide-pic'); hero.insertBefore(w, pic ? pic.nextSibling : hero.firstChild); watch(w, hero);
    };
    // Timing (2026-10-25, measured with speed-test.ps1): the tile can start the moment the page is parsed on computers at no cost
    // (desktop 100). The wide loop covers the whole header, so the moment it shows it counts as the page's biggest paint: starting
    // it at once scored desktop 87 (LCP 2.3s); after load + WIDE_DELAY it scores 100 and people see it about a second later.
    // Phones keep the old timing (load + 1.5s, once the header is on screen): starting the loop with the still cost 3-5 phone points.
    // Measured 10/25 with speed-test.ps1: load + 1.5s still scored 83-85 (the test keeps watching for a bit after load), load + 3s
    // scores 100. Chrome streams the tile loop lazily, so 'wait until it has buffered' took 7s and is no good. WIDE_DELAY = 0 makes the
    // wide loop start at once (desktop 87) if Harrison ever wants that over the score.
    const WIDE_DELAY = 0;   // 10/25 v6: the wide still (page CSS background) is the biggest paint, so the loop can start at once
    const after = (fn, ms) => { const go = () => setTimeout(fn, ms); if (document.readyState === 'complete') go(); else addEventListener('load', go); };
    // v8: on computers both loops start the moment the wide still has painted (about 0.2s on broadband). Started together with it,
    // the loops hog the line and the still (the header's biggest paint) lands late (desktop 86, LCP 2.5s).
    const st = hero && hero.querySelector('.hero-wide-still');
    const both = () => { tile(); after(wide, WIDE_DELAY); };
    if (desktop) { if (st && !st.complete) st.addEventListener('load', both, { once: true }); else both(); }
    else if (box) after(() => { const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); tile(); } }); io.observe(box); }, 1500);  })();
  // Header shadow + phone/tablet menu
  const head = document.querySelector('.site-head');
  if (head) {
    const onScroll = () => head.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  const btn = document.querySelector('.menu-btn');
  const panel = document.getElementById('menu-panel');
  if (btn && panel) {
    const setMenu = open => {
      btn.setAttribute('aria-expanded', open); panel.hidden = !open;
      btn.querySelector('.menu-word').textContent = open ? 'Close' : 'Menu';
    };
    btn.addEventListener('click', () => setMenu(panel.hidden));
    panel.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setMenu(false); btn.focus(); } });
    matchMedia('(min-width: 1180px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  // Services dropdown (desktop): opens on hover by CSS, and on click/Enter here for touch + keyboards
  document.querySelectorAll('.sub-btn').forEach(b => {
    const sub = document.getElementById(b.getAttribute('aria-controls'));
    const set = open => { b.setAttribute('aria-expanded', open); sub.classList.toggle('open', open); };
    b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('click', e => { if (!e.target.closest('.has-sub')) set(false); });
    b.closest('.has-sub').addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); } });
    b.closest('.has-sub').addEventListener('focusout', e => { if (!e.currentTarget.contains(e.relatedTarget)) set(false); });
  });

  // Button shine: stagger the idle glint so buttons don't all flash together
  document.querySelectorAll('.btn').forEach((b, i) => b.style.setProperty('--glint-delay', (1.2 + (i * 1.7) % 6).toFixed(1) + 's'));

  // Ticket: on phones the stub sits under the main part, so the notches go where the two meet
  document.querySelectorAll('.ticket').forEach(t => {
    const inner = t.querySelector('.tk-in'), stub = t.querySelector('.tk-stub');
    if (!inner || !stub) return;
    const place = () => t.style.setProperty('--ny', (stub.offsetTop + 1.5) + 'px');
    new ResizeObserver(place).observe(inner); place();
  });
  // Days left to save 5% (ends March 31, 2027)
  document.querySelectorAll('[data-countdown]').forEach(count => {
    const days = Math.ceil((new Date(2027, 2, 31, 23, 59, 59) - new Date()) / 86400000);
    if (days <= 0) return;
    count.querySelector('[data-days]').textContent = days;
    count.querySelector('[data-days-word]').textContent = days === 1 ? 'day' : 'days';
    count.hidden = false;
  });

  // FAQ: which questions get opened = which worries come up before people call
  let faqReady = false; setTimeout(() => { faqReady = true; }, 1500);
  document.querySelectorAll('.qa').forEach(d => d.addEventListener('toggle', () => {
    if (faqReady && d.open) track('faq_open', { question: d.querySelector('h3').textContent.trim() });
  }));

  // Remember where this visitor came from (ad, campaign, Google click), so the yard plan form on the homepage gets it
  const params = new URLSearchParams(location.search);
  let seen = {};
  try { seen = JSON.parse(sessionStorage.getItem('gng_src') || '{}'); } catch (e) {}
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid'].forEach(k => { if (params.get(k)) seen[k] = params.get(k); });
  if (!seen.landing_page) seen.landing_page = location.pathname + location.search;
  try { sessionStorage.setItem('gng_src', JSON.stringify(seen)); } catch (e) {}

  // Calls, texts and emails count as leads
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]');
    if (!a) return;
    const kind = a.href.startsWith('tel:') ? 'click_to_call' : a.href.startsWith('sms:') ? 'click_to_text' : 'click_email';
    track(kind, { link_text: a.textContent.trim().slice(0, 40) });
  });

  // Phone app: Android/Chrome gets the real install prompt, iPhone gets the 2-step sheet. Touch screens only, never inside the app.
  (() => {
    const btns = [...document.querySelectorAll('[data-app-get]')];
    const inApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (inApp) { track('app_open'); return; }
    if (!btns.length || !matchMedia('(pointer: coarse)').matches) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let prompt = null;
    const show = on => btns.forEach(b => { b.hidden = !on; });
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; show(true); });
    if (ios) show(true);
    btns.forEach(b => b.addEventListener('click', async () => {
      track('app_install_tap', { how: prompt ? 'prompt' : 'ios_steps' });
      if (prompt) {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        track('app_install_' + outcome);
        prompt = null; show(false);
      } else {
        const sheet = document.querySelector('.app-sheet');
        if (sheet) sheet.showModal();
      }
    }));
    addEventListener('appinstalled', () => { show(false); track('app_installed'); });
  })();

  // The 5% prepay ends March 31, 2027. From April 1 the offer text swaps and offer-only blocks hide.
  if (new Date() >= new Date(2027, 3, 1)) {
    document.querySelectorAll('[data-after]').forEach(el => { el.innerHTML = el.dataset.after; });
    document.querySelectorAll('[data-offer-only]').forEach(el => { el.hidden = true; });
  }

  // Phone app helper: saves the site for fast opening and a no-internet screen (see ../home/sw.js)
  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('../home/sw.js').catch(() => {}));
})();
