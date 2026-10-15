/* ==========================================================================
   Codevelop US — Google Ads page interactions (vanilla JS)
   Load AFTER js/script.js. The header, scroll progress, hero glow and
   scroll-reveal are already handled by script.js.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;


  /* ---------- Hero: living network (canvas), same as the other pages ---------- */
  var cv = $('#fa-net');
  var heroEl = $('#hero');
  if (cv && cv.getContext && heroEl) {
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], link = 140, raf = 0, running = false;
    var mouse = { x: -9999, y: -9999 };

    var make = function () {
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        r: 1.3 + Math.random() * 1.8, red: Math.random() < 0.14
      };
    };
    var resize = function () {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      link = W < 600 ? 100 : 140;
      var n = Math.round(Math.min(95, Math.max(26, (W * H) / 15000)));
      while (nodes.length < n) nodes.push(make());
      nodes.length = n;
    };

    var frame = function (animate) {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d, al;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (animate) {
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
    };

    var loop = function () { frame(true); raf = requestAnimationFrame(loop); };
    var start = function () { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } };
    var stop = function () { running = false; cancelAnimationFrame(raf); };

    resize();
    frame(false);
    window.addEventListener('resize', function () { resize(); if (!running) frame(false); });

    if (!reduce) {
      heroEl.addEventListener('mousemove', function (e) {
        var r = cv.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      heroEl.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
      if (hasIO) {
        new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(heroEl);
      } else { start(); }
    }
  }

  /* ---------- Stats: count-up when scrolled into view ---------- */
  var statsEl = $('#fa-stats');
  if (statsEl && !reduce) {
    var counters = $$('[data-count]', statsEl);
    counters.forEach(function (el) { el.textContent = '0'; });
    var counted = false;
    var run = function () {
      if (counted) return;
      counted = true;
      var t0 = performance.now(), dur = 1700;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        counters.forEach(function (el) {
          el.textContent = Math.round(Number(el.dataset.count) * eased);
        });
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };
    if (hasIO) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { run(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(statsEl);
    } else { run(); }
  }

  /* ---------- Services: tabs + ad preview (click, arrow keys, auto-rotate) ---------- */
  var svc = $('#fa-svc');
  if (svc) {
    var tabs = $$('.fa-tab', svc);
    var panels = $$('.fa-panel', svc);
    var cur = 0, timer = 0, auto = !reduce;

    var show = function (i) {
      cur = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
    };
    var stopAuto = function () { clearTimeout(timer); timer = 0; };
    var queue = function () {
      stopAuto();
      if (!auto) return;
      timer = setTimeout(function () { show((cur + 1) % tabs.length); queue(); }, 6000);
    };
    var cancelAuto = function () { auto = false; stopAuto(); svc.classList.remove('is-auto'); };

    if (!auto) svc.classList.remove('is-auto');

    tabs.forEach(function (t, i) {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener('click', function () { cancelAuto(); show(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); cancelAuto(); show(n); tabs[n].focus(); }
      });
    });

    show(0);
    if (auto) {
      if (hasIO) {
        new IntersectionObserver(function (es) {
          if (!auto) return;
          if (es[0].isIntersecting) queue(); else stopAuto();
        }, { threshold: 0.3 }).observe(svc);
      } else { queue(); }
    }
  }

  /* ---------- How it works: steps light up as you scroll ---------- */
  var stepsEl = $('#fa-steps');
  if (stepsEl) {
    var steps = $$('.fa-step', stepsEl);
    if (hasIO && !reduce) {
      var sio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-lit'); sio.unobserve(e.target); }
        });
      }, { threshold: 0.5, rootMargin: '0px 0px -12% 0px' });
      steps.forEach(function (s) { sio.observe(s); });
    } else {
      steps.forEach(function (s) { s.classList.add('is-lit'); });
    }
  }

  /* ---------- Testimonials: prev / next ---------- */
  var track = $('#fa-track');
  var prev = $('#fa-prev');
  var next = $('#fa-next');
  if (track && prev && next) {
    var stepBy = function () {
      var card = $('.fa-quote', track);
      return card ? card.getBoundingClientRect().width + 18 : 320;
    };
    prev.addEventListener('click', function () { track.scrollBy({ left: -stepBy(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () {
      var end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (end) track.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
      else track.scrollBy({ left: stepBy(), behavior: reduce ? 'auto' : 'smooth' });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });
  }

  /* ---------- FAQ accordion (one open at a time) ---------- */
  var faq = $('#ma-faq');
  if (faq) {
    var items = $$('.ma-faq-item', faq);
    items.forEach(function (item) {
      var btn = $('.ma-faq-q', item);
      btn.addEventListener('click', function () {
        var open = item.classList.contains('open');
        items.forEach(function (o) {
          o.classList.remove('open');
          $('.ma-faq-q', o).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
})();