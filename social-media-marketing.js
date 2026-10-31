/* ==========================================================
   Codevelop – Social Media Marketing page
   File: js/social-media-marketing.js
   Self-contained. Does not depend on script.js.
   Handles: hero network canvas, services accordion, platform flip
   cards, stat counters, testimonial slider, FAQ, reveal-on-scroll.
   ========================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- REVEAL ON SCROLL ---------- */
    (function reveal() {
      var els = document.querySelectorAll('.sm-sec [data-reveal], .sm-why [data-reveal]');
      if (!els.length) return;
      if (reduceMotion || !('IntersectionObserver' in window)) {
        for (var i = 0; i < els.length; i++) els[i].classList.add('sm-in');
        return;
      }
      document.documentElement.classList.add('sm-js');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('sm-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      els.forEach(function (el) { io.observe(el); });
      // safety net: never leave content hidden
      setTimeout(function () { els.forEach(function (el) { el.classList.add('sm-in'); }); }, 4000);
    })();

    /* ---------- HERO NETWORK CANVAS ---------- */
    (function network() {
      var canvas = document.getElementById('sm-net');
      if (!canvas || reduceMotion || !canvas.getContext) return;

      var ctx = canvas.getContext('2d');
      var hero = canvas.parentElement;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = 0, h = 0, nodes = [], raf = null, running = false;
      var mouse = { x: -9999, y: -9999 };

      function resize() {
        var r = hero.getBoundingClientRect();
        w = r.width; h = r.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.max(24, Math.min(70, Math.round((w * h) / 20000)));
        nodes = [];
        for (var i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.6 + 0.9
          });
        }
      }

      function frame() {
        ctx.clearRect(0, 0, w, h);
        var link = 130;
        for (var i = 0; i < nodes.length; i++) {
          var a = nodes[i];
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;

          for (var j = i + 1; j < nodes.length; j++) {
            var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < link) {
              ctx.strokeStyle = 'rgba(255,255,255,' + (0.22 * (1 - d / link)).toFixed(3) + ')';
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          var mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
          if (md < 160) {
            ctx.strokeStyle = 'rgba(255,138,147,' + (0.55 * (1 - md / 160)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,.75)';
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      }
      function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
      function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

      resize();
      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero);
      } else { start(); }
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    })();

    /* ---------- SERVICES ACCORDION ---------- */
    (function accordion() {
      var acc = document.getElementById('sm-acc');
      if (!acc) return;
      var items = Array.prototype.slice.call(acc.querySelectorAll('.sm-acc-item'));

      function open(item) {
        items.forEach(function (it) {
          var on = it === item;
          it.classList.toggle('is-open', on);
          var b = it.querySelector('.sm-acc-btn');
          if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
      }

      items.forEach(function (it, idx) {
        var btn = it.querySelector('.sm-acc-btn');
        if (!btn) return;
        btn.addEventListener('click', function () { open(it); });
        btn.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = items[(idx + 1) % items.length];
          else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = items[(idx - 1 + items.length) % items.length];
          else if (e.key === 'Home') n = items[0];
          else if (e.key === 'End') n = items[items.length - 1];
          if (n) { e.preventDefault(); n.querySelector('.sm-acc-btn').focus(); open(n); }
        });
      });
    })();

    /* ---------- PLATFORM FLIP CARDS ---------- */
    (function flips() {
      var cards = document.querySelectorAll('#sm-flips .sm-flip');
      Array.prototype.forEach.call(cards, function (card) {
        card.addEventListener('click', function () {
          var on = card.getAttribute('aria-pressed') === 'true';
          card.setAttribute('aria-pressed', on ? 'false' : 'true');
        });
      });
    })();

    /* ---------- STAT COUNTERS ---------- */
    (function counters() {
      var box = document.getElementById('sm-stats');
      if (!box || reduceMotion || !('IntersectionObserver' in window)) return;
      var nums = Array.prototype.slice.call(box.querySelectorAll('[data-count]'));

      function run() {
        nums.forEach(function (n) {
          var target = parseInt(n.getAttribute('data-count'), 10) || 0;
          var dur = 1600, t0 = null;
          n.textContent = '0';
          function step(ts) {
            if (!t0) t0 = ts;
            var p = Math.min((ts - t0) / dur, 1);
            n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step); else n.textContent = target;
          }
          requestAnimationFrame(step);
        });
      }
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { run(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(box);
    })();

    /* ---------- TESTIMONIAL SLIDER ---------- */
    (function slider() {
      var track = document.getElementById('sm-track');
      var prev = document.getElementById('sm-prev');
      var next = document.getElementById('sm-next');
      if (!track || !prev || !next) return;

      function step() {
        var card = track.querySelector('.sm-quote');
        if (!card) return 320;
        var cs = getComputedStyle(track);
        var gap = parseFloat(cs.columnGap || cs.gap) || 22;
        return card.getBoundingClientRect().width + gap;
      }
      function go(dir) {
        var max = track.scrollWidth - track.clientWidth - 4;
        if (dir > 0 && track.scrollLeft >= max) track.scrollTo({ left: 0, behavior: 'smooth' });
        else if (dir < 0 && track.scrollLeft <= 4) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
        else track.scrollBy({ left: dir * step(), behavior: 'smooth' });
      }
      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      });
    })();

    /* ---------- FAQ ---------- */
    (function faq() {
      var list = document.getElementById('sm-faq');
      if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('.sm-faq-item'));

      function set(item, open) {
        item.classList.toggle('open', open);
        var q = item.querySelector('.sm-faq-q');
        if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      items.forEach(function (item) {
        var q = item.querySelector('.sm-faq-q');
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