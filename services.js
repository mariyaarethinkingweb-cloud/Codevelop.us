/* Codevelop – Services page. File: js/services.js
   Self-contained. Handles: hero network canvas, stat counters, service
   explorer tabs, testimonials slider. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  /* ------------------------------------------------------------------
     TESTIMONIALS — add real customer quotes here. While this list is
     empty the whole "What they say about us" section stays hidden.
     Example entry:
       { quote: 'Their team rebuilt our site and leads doubled.', name: 'Jane Doe', role: 'Owner, Example Dental' }
     ------------------------------------------------------------------ */
  var TESTIMONIALS = [];

  ready(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* ---------- HERO NETWORK CANVAS ---------- */
    (function network() {
      var canvas = document.getElementById('sv-net');
      if (!canvas || reduce || !canvas.getContext) return;
      var ctx = canvas.getContext('2d'), hero = canvas.parentElement;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = 0, h = 0, nodes = [], raf = null, mouse = { x: -9999, y: -9999 };

      function resize() {
        var r = hero.getBoundingClientRect();
        w = r.width; h = r.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.max(24, Math.min(70, Math.round((w * h) / 20000)));
        nodes = [];
        for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .9 });
      }
      function frame() {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < nodes.length; i++) {
          var a = nodes[i];
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          for (var j = i + 1; j < nodes.length; j++) {
            var b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 130) {
              ctx.strokeStyle = 'rgba(255,255,255,' + (.22 * (1 - d / 130)).toFixed(3) + ')';
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          var md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (md < 160) {
            ctx.strokeStyle = 'rgba(255,138,147,' + (.55 * (1 - md / 160)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,.75)';
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      }
      function start() { if (!raf) raf = requestAnimationFrame(frame); }
      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      resize();
      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
      hero.addEventListener('mousemove', function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
      if (hasIO) new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero); else start();
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    })();

    /* ---------- STAT COUNTERS ---------- */
    (function counters() {
      var box = document.getElementById('sv-stats');
      if (!box || reduce) return;
      var els = Array.prototype.slice.call(box.querySelectorAll('[data-count]'));
      els.forEach(function (el) { el.textContent = '0'; });
      var ran = false;
      function run() {
        if (ran) return; ran = true;
        var t0 = performance.now(), dur = 1600;
        (function frame(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          els.forEach(function (el) { el.textContent = Math.round(Number(el.getAttribute('data-count')) * e); });
          if (p < 1) requestAnimationFrame(frame);
        })(t0);
      }
      if (hasIO) {
        var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
        io.observe(box);
      } else { els.forEach(function (el) { el.textContent = el.getAttribute('data-count'); }); }
    })();

    /* ---------- SERVICE EXPLORER (tabs) ---------- */
    (function explorer() {
      var root = document.getElementById('sv-explorer');
      if (!root) return;
      var tabs = Array.prototype.slice.call(root.querySelectorAll('.sv-tab'));
      var panels = Array.prototype.slice.call(root.querySelectorAll('.sv-panel'));

      function select(i, focus) {
        tabs.forEach(function (t, k) {
          var on = k === i;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
        });
        panels.forEach(function (p, k) {
          var on = k === i;
          p.classList.toggle('is-on', on);
          if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
        });
        if (focus) tabs[i].focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(i, false); });
        t.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
          if (e.key === 'Home') n = 0;
          if (e.key === 'End') n = tabs.length - 1;
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      });
      // deep link, e.g. services.html#seo / #web / #performance / #social
      var map = { web: 0, performance: 1, social: 2, seo: 3 };
      var h = (location.hash || '').replace('#', '');
      if (map.hasOwnProperty(h)) select(map[h], false);
    })();

    /* ---------- TESTIMONIALS ---------- */
    (function testimonials() {
      var sec = document.getElementById('testimonials');
      var track = document.getElementById('sv-track');
      if (!sec || !track || !TESTIMONIALS.length) return;

      var STAR = '<svg class="ico" aria-hidden="true"><use href="#i-star"/></svg>';
      TESTIMONIALS.forEach(function (t) {
        var card = document.createElement('figure');
        card.className = 'sv-quote';
        card.style.margin = '0';

        var stars = document.createElement('div');
        stars.className = 'sv-stars';
        stars.setAttribute('aria-hidden', 'true');
        stars.innerHTML = STAR + STAR + STAR + STAR + STAR;

        var q = document.createElement('blockquote');
        q.textContent = t.quote;

        var who = document.createElement('figcaption');
        who.className = 'sv-who';
        var av = document.createElement('span');
        av.className = 'sv-av';
        av.textContent = (t.name || '?').trim().charAt(0).toUpperCase();
        var txt = document.createElement('span');
        var b = document.createElement('b'); b.textContent = t.name || '';
        var s = document.createElement('small'); s.textContent = t.role || '';
        txt.appendChild(b); txt.appendChild(s);
        who.appendChild(av); who.appendChild(txt);

        card.appendChild(stars); card.appendChild(q); card.appendChild(who);
        track.appendChild(card);
      });
      sec.hidden = false;

      function step(dir) {
        var first = track.querySelector('.sv-quote');
        var amount = first ? first.getBoundingClientRect().width + 20 : track.clientWidth;
        track.scrollBy({ left: dir * amount, behavior: reduce ? 'auto' : 'smooth' });
      }
      document.getElementById('sv-prev').addEventListener('click', function () { step(-1); });
      document.getElementById('sv-next').addEventListener('click', function () { step(1); });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      });
    })();
  });
})();