/* Codevelop – Remarketing page. File: js/remarketing.js
   Self-contained. Handles: hero network canvas, audience picker, FAQ. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* ---------- HERO NETWORK CANVAS ---------- */
    (function network() {
      var canvas = document.getElementById('rm-net');
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

    /* ---------- AUDIENCE PICKER ---------- */
    (function picker() {
      var box = document.getElementById('rm-aud');
      if (!box) return;
      var btns = Array.prototype.slice.call(box.querySelectorAll('.rm-seg button'));
      var panes = Array.prototype.slice.call(box.querySelectorAll('.rm-pane'));
      function set(i) {
        btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
        panes.forEach(function (p, k) {
          p.classList.toggle('is-on', k === i);
          if (k === i) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
        });
      }
      btns.forEach(function (b, i) { b.addEventListener('click', function () { set(i); }); });
    })();

    /* ---------- FAQ ---------- */
    (function faq() {
      var list = document.getElementById('rm-faq');
      if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('.rm-faq-item'));
      function set(item, open) {
        item.classList.toggle('open', open);
        var q = item.querySelector('.rm-faq-q');
        if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      items.forEach(function (item) {
        var q = item.querySelector('.rm-faq-q');
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