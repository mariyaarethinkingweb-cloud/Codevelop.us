/* ==========================================================
   Codevelop – Content Marketing page
   File: js/content-marketing.js
   Self-contained. Does not depend on script.js.
   Handles: hero network canvas, reveal-on-scroll, content-brief
   typing, services tabs, format filter, process timeline, stat
   counters, testimonial slider, FAQ.
   ========================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* ---------- REVEAL ON SCROLL ---------- */
    (function reveal() {
      var els = document.querySelectorAll('.cm-sec [data-reveal], .cm-why [data-reveal]');
      if (!els.length) return;
      if (reduceMotion || !hasIO) {
        for (var i = 0; i < els.length; i++) els[i].classList.add('cm-in');
        return;
      }
      document.documentElement.classList.add('cm-js');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('cm-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      els.forEach(function (el) { io.observe(el); });
      // safety net: never leave content hidden
      setTimeout(function () { els.forEach(function (el) { el.classList.add('cm-in'); }); }, 4000);
    })();

    /* ---------- HERO NETWORK CANVAS ---------- */
    (function network() {
      var canvas = document.getElementById('cm-net');
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

      if (hasIO) {
        new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero);
      } else { start(); }
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    })();

    /* ---------- CONTENT BRIEF: typing effect ---------- */
    (function typing() {
      var el = document.getElementById('cm-type');
      if (!el || reduceMotion || !hasIO) return;
      var full = el.getAttribute('data-text') || el.textContent;
      var timer = null;

      function type() {
        var i = 0;
        el.textContent = '';
        el.classList.add('is-typing');
        timer = setInterval(function () {
          i += 1;
          el.textContent = full.slice(0, i);
          if (i >= full.length) {
            clearInterval(timer);
            el.classList.remove('is-typing');
          }
        }, 22);
      }

      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { type(); io.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(el);
    })();

    /* ---------- SERVICES TABS ---------- */
    (function tabs() {
      var root = document.getElementById('cm-tabs');
      if (!root) return;
      var tabs = Array.prototype.slice.call(root.querySelectorAll('.cm-tab'));
      var panels = Array.prototype.slice.call(root.querySelectorAll('.cm-panel'));

      function select(idx, focus) {
        tabs.forEach(function (t, i) {
          var on = i === idx;
          t.classList.toggle('is-on', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
        });
        panels.forEach(function (p, i) {
          var on = i === idx;
          p.classList.toggle('is-on', on);
          if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
        });
        if (focus) tabs[idx].focus();
      }

      tabs.forEach(function (t, idx) {
        t.addEventListener('click', function () { select(idx, false); });
        t.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (idx + 1) % tabs.length;
          else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (idx - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = tabs.length - 1;
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      });
    })();

    /* ---------- FORMATS FILTER ---------- */
    (function filter() {
      var bar = document.getElementById('cm-filter');
      var list = document.getElementById('cm-cards');
      if (!bar || !list) return;
      var btns = Array.prototype.slice.call(bar.querySelectorAll('.cm-fbtn'));
      var cards = Array.prototype.slice.call(list.querySelectorAll('.cm-card'));

      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-f');
          btns.forEach(function (x) {
            var on = x === b;
            x.classList.toggle('is-on', on);
            x.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          cards.forEach(function (c) {
            var show = f === 'all' || c.getAttribute('data-stage') === f;
            if (show) {
              c.removeAttribute('hidden');
              c.classList.remove('cm-pop');
              void c.offsetWidth; // restart the animation
              c.classList.add('cm-pop');
            } else {
              c.setAttribute('hidden', '');
              c.classList.remove('cm-pop');
            }
          });
        });
      });
    })();

    /* ---------- PROCESS TIMELINE ---------- */
    (function timeline() {
      var list = document.getElementById('cm-steps');
      if (!list) return;
      var steps = Array.prototype.slice.call(list.querySelectorAll('.cm-step'));
      var ticking = false;

      function update() {
        ticking = false;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var line = vh * 0.6;
        var r = list.getBoundingClientRect();
        var p = (line - r.top) / r.height;
        p = Math.max(0, Math.min(1, p));
        list.style.setProperty('--p', p.toFixed(3));
        steps.forEach(function (s) {
          var sr = s.getBoundingClientRect();
          s.classList.toggle('is-on', sr.top + sr.height * 0.3 < line);
        });
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

      if (reduceMotion) {
        list.style.setProperty('--p', '1');
        steps.forEach(function (s) { s.classList.add('is-on'); });
        return;
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    })();

    /* ---------- STAT COUNTERS ---------- */
    (function counters() {
      var box = document.getElementById('cm-stats');
      if (!box || reduceMotion || !hasIO) return;
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
      var list = document.getElementById('cm-faq');
      if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('.cm-faq-item'));

      function set(item, open) {
        item.classList.toggle('open', open);
        var q = item.querySelector('.cm-faq-q');
        if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      items.forEach(function (item) {
        var q = item.querySelector('.cm-faq-q');
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