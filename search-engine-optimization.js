/* ==========================================================
   Codevelop – Search Engine Optimization page
   File: js/search-engine-optimization.js
   Self-contained. Does not depend on script.js.
   Handles: hero network canvas, reveal-on-scroll, search results
   illustration, services rows, funnel, process stepper, readiness
   check, stat counters, FAQ.
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
    var animate = !reduceMotion && hasIO;

    if (animate) document.documentElement.classList.add('se-js');

    /* ---------- REVEAL ON SCROLL ---------- */
    (function reveal() {
      var els = document.querySelectorAll('.se-sec [data-reveal], .se-why [data-reveal]');
      if (!els.length) return;
      if (!animate) {
        for (var i = 0; i < els.length; i++) els[i].classList.add('se-in');
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('se-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      els.forEach(function (el) { io.observe(el); });
      // safety net: never leave content hidden
      setTimeout(function () { els.forEach(function (el) { el.classList.add('se-in'); }); }, 4000);
    })();

    /* ---------- HERO NETWORK CANVAS ---------- */
    (function network() {
      var canvas = document.getElementById('se-net');
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

    /* ---------- SEARCH RESULTS ILLUSTRATION ---------- */
    (function serp() {
      var typeEl = document.getElementById('se-type');
      var box = document.querySelector('.se-serp');
      if (!typeEl || !box) return;
      var steps = Array.prototype.slice.call(box.querySelectorAll('[data-step]'));
      if (!animate) { steps.forEach(function (s) { s.classList.add('is-in'); }); return; }

      var full = typeEl.getAttribute('data-text') || typeEl.textContent;

      function revealSteps() {
        steps.forEach(function (s, i) {
          setTimeout(function () { s.classList.add('is-in'); }, 250 + i * 320);
        });
      }
      function type() {
        var i = 0, t;
        typeEl.textContent = '';
        typeEl.classList.add('is-typing');
        t = setInterval(function () {
          i += 1;
          typeEl.textContent = full.slice(0, i);
          if (i >= full.length) {
            clearInterval(t);
            typeEl.classList.remove('is-typing');
            revealSteps();
          }
        }, 55);
      }

      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { type(); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(box);
    })();

    /* ---------- SERVICES ROWS ---------- */
    (function rows() {
      var list = document.getElementById('se-rows');
      if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('.se-row'));

      function set(item, open) {
        item.classList.toggle('is-open', open);
        var b = item.querySelector('.se-row-btn');
        if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      items.forEach(function (item) {
        var b = item.querySelector('.se-row-btn');
        if (!b) return;
        b.addEventListener('click', function () {
          var willOpen = !item.classList.contains('is-open');
          items.forEach(function (it) { set(it, false); });
          set(item, willOpen);
        });
      });
    })();

    /* ---------- FUNNEL ---------- */
    (function funnel() {
      var f = document.getElementById('se-funnel');
      if (!f || !animate) return;
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { f.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(f);
      setTimeout(function () { f.classList.add('is-in'); }, 5000);
    })();

    /* ---------- PROCESS STEPPER ---------- */
    (function stepper() {
      var root = document.getElementById('se-steps');
      if (!root) return;
      var tabs = Array.prototype.slice.call(root.querySelectorAll('.se-step'));
      var panels = Array.prototype.slice.call(root.querySelectorAll('.se-detail'));

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
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (idx + 1) % tabs.length;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (idx - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = tabs.length - 1;
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      });
    })();

    /* ---------- READINESS CHECK ---------- */
    (function readiness() {
      var list = document.getElementById('se-boxes');
      var ring = document.getElementById('se-ring');
      var score = document.getElementById('se-score');
      var title = document.getElementById('se-msg-t');
      var msg = document.getElementById('se-msg');
      if (!list || !ring || !score || !title || !msg) return;
      var inputs = Array.prototype.slice.call(list.querySelectorAll('input[type="checkbox"]'));
      var total = inputs.length;

      function update() {
        var n = inputs.filter(function (i) { return i.checked; }).length;
        score.textContent = n;
        ring.style.setProperty('--pct', Math.round((n / total) * 100));
        if (n === 0) {
          title.textContent = "Let's find your starting point";
          msg.textContent = 'Tick the boxes that apply to you.';
        } else if (n <= 2) {
          title.textContent = 'Plenty of room to grow';
          msg.textContent = 'A few fixes could make a big difference. A free SEO audit will show where to begin.';
        } else if (n <= 5) {
          title.textContent = 'A solid start';
          msg.textContent = 'You have some foundations in place. The next gains usually come from local pages, reviews, and links.';
        } else if (n <= 7) {
          title.textContent = 'A strong foundation';
          msg.textContent = 'You are close. Fine-tuning and consistent content can turn this into steady lead growth.';
        } else {
          title.textContent = 'Excellent foundation';
          msg.textContent = 'Everything is in place. Ongoing tracking and refinement will help you keep and extend your lead.';
        }
      }
      inputs.forEach(function (i) { i.addEventListener('change', update); });
      update();
    })();

    /* ---------- STAT COUNTERS ---------- */
    (function counters() {
      var box = document.getElementById('se-stats');
      if (!box || !animate) return;
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
      var list = document.getElementById('se-faq');
      if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('.se-faq-item'));

      function set(item, open) {
        item.classList.toggle('open', open);
        var q = item.querySelector('.se-faq-q');
        if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      items.forEach(function (item) {
        var q = item.querySelector('.se-faq-q');
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