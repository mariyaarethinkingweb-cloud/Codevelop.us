/* ==========================================================================
   Codevelop US — Magento Web Development interactions (vanilla JS)
   Load AFTER js/script.js. The header, scroll progress, hero glow and
   scroll-reveal are already handled by script.js.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;


  /* ---------- Hero: living network (canvas), same as Performance Marketing ---------- */
  var cv = $('#mg-net');
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
  var statsEl = $('#mg-stats');
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
      }, { threshold: 0.5 });
      io.observe(statsEl);
    } else { run(); }
  }

  /* ---------- Why Magento: store switcher (multi-store / language / currency) ---------- */
  var why = $('#mg-why');
  if (why) {
    var shop = $('.mg-shop', why);
    var tabs = $$('.mg-shop-tab', why);
    var stores = [
      { url: 'shop.example.com/us', prod: 'Everyday backpack', price: '$120.00', cta: 'Add to cart', lang: 'English', cur: 'USD' },
      { url: 'shop.example.com/fr', prod: 'Sac à dos du quotidien', price: '110,00 €', cta: 'Ajouter au panier', lang: 'Français', cur: 'EUR' },
      { url: 'shop.example.com/jp', prod: 'デイリーバックパック', price: '¥17,800', cta: 'カートに追加', lang: '日本語', cur: 'JPY' }
    ];
    var cur = 0, picked = false, seenWhy = false, timer = null;

    var queue = function () {
      clearTimeout(timer);
      if (picked || reduce || !seenWhy) return;
      timer = setTimeout(function () { show((cur + 1) % stores.length); }, 3500);
    };

    var show = function (i) {
      cur = i;
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
      });
      if (shop) shop.classList.add('is-swap');
      setTimeout(function () {
        var s = stores[i];
        $('#mg-url').textContent = s.url;
        $('#mg-prod').textContent = s.prod;
        $('#mg-price').textContent = s.price;
        $('#mg-cta').textContent = s.cta;
        $('#mg-lang').textContent = s.lang;
        $('#mg-cur').textContent = s.cur;
        if (shop) shop.classList.remove('is-swap');
      }, reduce ? 0 : 220);
      queue();
    };

    tabs.forEach(function (t, i) {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener('click', function () { picked = true; clearTimeout(timer); show(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); picked = true; clearTimeout(timer); show(n); tabs[n].focus(); }
      });
    });

    if (hasIO) {
      new IntersectionObserver(function (es) {
        seenWhy = es[0].isIntersecting;
        if (seenWhy) queue(); else clearTimeout(timer);
      }, { threshold: 0.35 }).observe(why);
    }
  }

  /* ---------- Testimonials: arrow buttons scroll the track ---------- */
  var track = $('#mg-track');
  if (track) {
    var step = function (dir) {
      var card = $('.mg-testi', track);
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 20;
      var w = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
      track.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
    };
    var prev = $('#mg-prev'), next = $('#mg-next');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
  }

  /* ---------- FAQ accordion (one open at a time) ---------- */
  var faq = $('#mg-faq');
  if (faq) {
    var items = $$('.mg-faq-item', faq);
    items.forEach(function (item) {
      var btn = $('.mg-faq-q', item);
      btn.addEventListener('click', function () {
        var open = item.classList.contains('open');
        items.forEach(function (o) {
          o.classList.remove('open');
          $('.mg-faq-q', o).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
})();