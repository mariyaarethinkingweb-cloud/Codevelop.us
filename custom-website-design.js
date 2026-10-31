/* Codevelop – Custom Website Design page. File: js/custom-website-design.js
   Load AFTER js/script.js (header, scroll progress, hero glow and scroll-reveal live there).
   Handles: hero network, goal switcher, process tabs, timeline estimator,
   stats count-up, testimonials, FAQ. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(function () {
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* ---------- Hero network canvas ---------- */
    (function () {
      var cv = $('#cd-net'), hero = $('#hero');
      if (!cv || !cv.getContext || !hero || reduce) return;
      var ctx = cv.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = 0, H = 0, nodes = [], raf = 0, running = false, link = 140;
      var mouse = { x: -9999, y: -9999 };

      function make() {
        return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, r: 1.3 + Math.random() * 1.8, red: Math.random() < 0.14 };
      }
      function resize() {
        var r = cv.getBoundingClientRect();
        W = r.width; H = r.height;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        link = W < 600 ? 100 : 140;
        var n = Math.round(Math.min(95, Math.max(26, (W * H) / 15000)));
        while (nodes.length < n) nodes.push(make());
        nodes.length = n;
      }
      function frame(animate) {
        ctx.clearRect(0, 0, W, H);
        var i, j, a, b, dx, dy, d, al;
        if (animate) {
          for (i = 0; i < nodes.length; i++) {
            a = nodes[i];
            dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < 160 && d > 1) { a.x -= (dx / d) * 0.6; a.y -= (dy / d) * 0.6; }
            a.x += a.vx; a.y += a.vy;
            if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
            if (a.y < -10) a.y = H + 10; else if (a.y > H + 10) a.y = -10;
          }
        }
        ctx.lineWidth = 1;
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i];
          for (j = i + 1; j < nodes.length; j++) {
            b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < link) {
              al = (1 - d / link) * 0.5;
              ctx.strokeStyle = (a.red || b.red) ? 'rgba(255,107,142,' + al + ')' : 'rgba(255,255,255,' + al * 0.8 + ')';
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < 190) {
            ctx.strokeStyle = 'rgba(160,200,255,' + (1 - d / 190) * 0.7 + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i];
          if (a.red) {
            ctx.fillStyle = 'rgba(255,107,142,0.22)';
            ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 3.4, 0, 6.2832); ctx.fill();
            ctx.fillStyle = '#ff6b8e';
          } else { ctx.fillStyle = 'rgba(255,255,255,0.88)'; }
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
        }
      }
      function loop() { frame(true); raf = requestAnimationFrame(loop); }
      function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
      function stop() { running = false; cancelAnimationFrame(raf); }

      resize(); frame(false);
      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (!running) frame(false); }, 120); });
      hero.addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
      if (hasIO) new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(hero); else start();
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    })();

    /* ---------- Goal switcher (browser mock) ---------- */
    (function () {
      var box = $('#cd-demo');
      if (!box) return;
      var btns = $$('.cd-seg button', box);
      var data = [
        { h: 'Talk to us about your project', p: 'A clear message, proof of results, and a short form that is easy to finish.', b: 'Request a quote', r: ['Services', 'Case studies', 'Reviews'], n: 'We start with the one action that matters most, then design everything around it.' },
        { h: 'Find it. Love it. Buy it.', p: 'Fast product pages, simple filters, and a checkout with no surprises.', b: 'Shop now', r: ['Products', 'Best sellers', 'Delivery'], n: 'For stores, we focus on product discovery and a smooth, trusted checkout.' },
        { h: 'Book your visit in a minute', p: 'Opening hours, location, and a booking form that works well on a phone.', b: 'Book now', r: ['Services', 'Location', 'FAQs'], n: 'For local businesses, we make booking and directions impossible to miss.' }
      ];
      var ids = { h: 'cd-m-h', p: 'cd-m-p', b: 'cd-m-b', n: 'cd-m-note' };
      var screen = $('.cd-screen', box);
      function set(i) {
        var d = data[i];
        btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
        document.getElementById(ids.h).textContent = d.h;
        document.getElementById(ids.p).textContent = d.p;
        document.getElementById(ids.b).textContent = d.b;
        document.getElementById(ids.n).textContent = d.n;
        for (var k = 0; k < 3; k++) document.getElementById('cd-m-' + (k + 1)).textContent = d.r[k];
        if (screen && !reduce) { screen.classList.remove('is-swap'); void screen.offsetWidth; screen.classList.add('is-swap'); }
      }
      btns.forEach(function (b, i) { b.addEventListener('click', function () { set(i); }); });
    })();

    /* ---------- Process tabs ---------- */
    (function () {
      var wrap = $('#cd-proc');
      if (!wrap) return;
      var tabs = $$('.cd-ptab', wrap), panels = $$('.cd-pp', wrap);
      function select(i, focus) {
        tabs.forEach(function (t, k) {
          var on = k === i;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
          if (on && focus) t.focus();
        });
        panels.forEach(function (p, k) {
          var on = k === i;
          p.classList.toggle('is-active', on);
          if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
        });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(i, false); });
        t.addEventListener('keydown', function (e) {
          var n = tabs.length, k = -1;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % n;
          else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i - 1 + n) % n;
          else if (e.key === 'Home') k = 0;
          else if (e.key === 'End') k = n - 1;
          if (k > -1) { e.preventDefault(); select(k, true); }
        });
      });
    })();

    /* ---------- Timeline estimator ---------- */
    (function () {
      var box = $('#cd-time');
      if (!box) return;
      var btns = $$('.cd-seg button', box);
      var val = $('#cd-t-val'), bar = $('#cd-t-bar'), copy = $('#cd-t-copy');
      var data = [
        { v: '6–10 weeks', w: 32, c: 'Strategy, design, development, testing, and launch for a focused business website.' },
        { v: '3–6 months', w: 88, c: 'Custom platforms and complex applications need more discovery, build, and testing time.' }
      ];
      function set(i) {
        btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
        val.textContent = data[i].v;
        copy.textContent = data[i].c;
        bar.style.width = data[i].w + '%';
      }
      btns.forEach(function (b, i) { b.addEventListener('click', function () { set(i); }); });
      bar.style.width = '0%';
      if (hasIO && !reduce) {
        var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { set(0); io.disconnect(); } }, { threshold: 0.4 });
        io.observe(box);
      } else { set(0); }
    })();

    /* ---------- Stats count-up ---------- */
    (function () {
      var el = $('#cd-stats');
      if (!el || reduce) return;
      var nums = $$('[data-count]', el);
      nums.forEach(function (n) { n.textContent = '0'; });
      var done = false;
      function run() {
        if (done) return; done = true;
        var t0 = performance.now(), dur = 1700;
        (function tick(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          nums.forEach(function (n) { n.textContent = Math.round(Number(n.dataset.count) * e); });
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }
      if (hasIO) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.5 }); io.observe(el); }
      else run();
    })();

    /* ---------- Testimonials ---------- */
    (function () {
      var track = $('#cd-track');
      if (!track) return;
      function step(dir) {
        var card = $('.cd-quote', track);
        var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 18;
        var w = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
        track.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
      }
      var prev = $('#cd-prev'), next = $('#cd-next');
      if (prev) prev.addEventListener('click', function () { step(-1); });
      if (next) next.addEventListener('click', function () { step(1); });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      });
    })();

    /* ---------- FAQ (one open at a time) ---------- */
    (function () {
      var list = $('#cd-faq');
      if (!list) return;
      var items = $$('.cd-faq-item', list);
      function set(item, open) {
        item.classList.toggle('open', open);
        var q = $('.cd-faq-q', item);
        if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      items.forEach(function (item) {
        var q = $('.cd-faq-q', item);
        if (!q) return;
        q.addEventListener('click', function () {
          var willOpen = !item.classList.contains('open');
          items.forEach(function (it) { set(it, false); });
          set(item, willOpen);
        });
      });
    })();
  });
})();