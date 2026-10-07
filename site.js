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

  // Slideshow photos 2-5 load after the page is ready, so the first photo and the words show up fast (2026-10-07)
  const later = () => document.querySelectorAll('img[data-src]').forEach(i => {
    if (i.dataset.srcset) i.srcset = i.dataset.srcset;
    i.src = i.dataset.src; i.removeAttribute('data-src');
  });
  if (document.readyState === 'complete') later(); else addEventListener('load', later);

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
