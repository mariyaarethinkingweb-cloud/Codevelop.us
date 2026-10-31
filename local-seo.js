/* Codevelop – Local SEO page. File: js/local-seo.js
   Self-contained. Handles: hero network canvas, service-radius map, FAQ. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* ---------- HERO NETWORK CANVAS ---------- */
    (function network() {
      var canvas = document.getElementById('ls-net');
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

    /* ---------- SERVICE RADIUS MAP ---------- */
    (function radius() {
      var box = document.getElementById('ls-radar');
      var note = document.getElementById('ls-note');
      if (!box) return;
      var btns = Array.prototype.slice.call(box.querySelectorAll('.ls-seg button'));
      var pins = Array.prototype.slice.call(box.querySelectorAll('.ls-pin'));

      function set(r) {
        var count = 0;
        box.setAttribute('data-r', r);
        btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-r') === String(r) ? 'true' : 'false'); });
        pins.forEach(function (p) {
          var on = parseInt(p.getAttribute('data-r'), 10) <= r;
          p.classList.toggle('on', on);
          if (on) count++;
        });
        if (note) note.textContent = 'Illustration: ' + r + ' miles covers ' + count + ' neighborhoods.';
      }
      btns.forEach(function (b) { b.addEventListener('click', function () { set(parseInt(b.getAttribute('data-r'), 10)); }); });
      set(parseInt(box.getAttribute('data-r'), 10) || 5);
    })();

    /* ---------- FAQ ---------- */
    (function faq() {
      var list = document.getElementById('ls-faq');
      if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('.ls-faq-item'));
      function set(item, open) {
        item.classList.toggle('open', open);
        var q = item.querySelector('.ls-faq-q');
        if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      items.forEach(function (item) {
        var q = item.querySelector('.ls-faq-q');
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