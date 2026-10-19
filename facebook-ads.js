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


  /* ---------- Hero: living network (canvas) ---------- */
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

  /* ---------- AI command center: live optimization log ---------- */
  var lab = $('#ai-lab');
  var logBody = $('#ai-log-body');
  if (lab && logBody) {
    var steps = [
      ['scan', 'Analyzing search terms by buyer intent'],
      ['flag', 'Wasted spend detected: negative keywords queued'],
      ['bid', 'Shifting budget toward best-converting campaigns'],
      ['test', 'Testing 3 ad variants against the landing page'],
      ['ok', 'Weekly performance report ready for strategist review']
    ];
    var timers = [];
    var active = false;
    var clearTimers = function () { timers.forEach(clearTimeout); timers = []; };
    var addLine = function (s) {
      var row = document.createElement('div');
      row.className = 'ai-ln ai-ln--' + s[0];
      var tag = document.createElement('b');
      tag.textContent = s[0] === 'ok' ? '✓' : '›';
      var txt = document.createElement('span');
      txt.textContent = s[1];
      row.appendChild(tag); row.appendChild(txt);
      logBody.appendChild(row);
      requestAnimationFrame(function () { row.classList.add('in'); });
    };
    var cycle = function () {
      if (!active) return;
      logBody.innerHTML = '';
      steps.forEach(function (s, i) {
        timers.push(setTimeout(function () { addLine(s); }, 700 + i * 1100));
      });
      timers.push(setTimeout(cycle, 700 + steps.length * 1100 + 3200));
    };

    if (reduce) {
      steps.forEach(function (s) { addLine(s); });
      $$('.ai-ln', logBody).forEach(function (r) { r.classList.add('in'); });
    } else if (hasIO) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!active) { active = true; cycle(); } }
        else { active = false; clearTimers(); }
      }, { threshold: 0.25 }).observe(lab);
    } else {
      active = true; cycle();
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
    var stepItems = $$('.fa-step', stepsEl);
    if (hasIO && !reduce) {
      var sio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-lit'); sio.unobserve(e.target); }
        });
      }, { threshold: 0.5, rootMargin: '0px 0px -12% 0px' });
      stepItems.forEach(function (s) { sio.observe(s); });
    } else {
      stepItems.forEach(function (s) { s.classList.add('is-lit'); });
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
/* ==========================================================================
   Services section — "AI Ad Studio" (vanilla JS, self-contained)
   Paste into js/facebook-ads.js (replace the old "Services: tabs + ad preview"
   block), or load as its own file after js/script.js.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('sv');
  if (!root) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  var tabs = $$('.sv-tab', root);
  var panels = $$('.sv-p', root);
  var chan = $('#sv-chan');
  var view = $('#sv-view');
  var stage = $('.sv-stage', root);
  var cells = $$('.sv-m', root);

  /* Sample metrics per channel (illustrative; swap in real numbers if you have them) */
  var METRICS = [
    [{ l: 'Click-through rate', v: 6.4, s: '%', d: 1, w: 64 }, { l: 'Cost per click', v: -18, s: '%', d: 0, w: 46 }, { l: 'Qualified leads', v: 42, p: '+', s: '%', d: 0, w: 78 }],
    [{ l: 'Monthly reach', v: 2.4, s: 'M', d: 1, w: 72 }, { l: 'Click-through rate', v: 3.8, s: '%', d: 1, w: 52 }, { l: 'Audience match', v: 92, s: '%', d: 0, w: 92 }],
    [{ l: 'Views', v: 12, s: 'K', d: 0, w: 66 }, { l: 'Watched to end', v: 68, s: '%', d: 0, w: 68 }, { l: 'Cost per view', v: -24, s: '%', d: 0, w: 50 }],
    [{ l: 'Return on ad spend', v: 5.2, s: '×', d: 1, w: 80 }, { l: 'Sales', v: 28, p: '+', s: '%', d: 0, w: 58 }, { l: 'Add-to-cart rate', v: 7.1, s: '%', d: 1, w: 60 }]
  ];

  var fmt = function (m, n) {
    var neg = m.v < 0;
    return (m.p || '') + (neg ? '−' : '') + Math.abs(n).toFixed(m.d) + (m.s || '');
  };

  var countRaf = 0;
  var setMetrics = function (i) {
    var data = METRICS[i];
    cancelAnimationFrame(countRaf);
    cells.forEach(function (c, k) {
      var m = data[k];
      $('.sv-m-l', c).textContent = m.l;
      var bar = $('.sv-m-b', c);
      bar.style.width = '0';
      if (reduce) { bar.style.width = m.w + '%'; }
      else { requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = m.w + '%'; }); }); }
    });
    if (reduce) {
      cells.forEach(function (c, k) { $('.sv-m-v', c).textContent = fmt(data[k], data[k].v); });
      return;
    }
    var t0 = performance.now(), dur = 1200;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      cells.forEach(function (c, k) {
        var m = data[k];
        $('.sv-m-v', c).textContent = fmt(m, Math.abs(m.v) * e * (m.v < 0 ? -1 : 1));
      });
      if (p < 1) countRaf = requestAnimationFrame(tick);
    })(t0);
  };

  /* ---------- Tabs ---------- */
  var cur = 0, timer = 0, auto = !reduce;

  var show = function (i) {
    cur = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
    if (chan) {
      chan.textContent = tabs[i].getAttribute('data-chan') || '';
      chan.classList.remove('swap');
      void chan.offsetWidth;
      chan.classList.add('swap');
    }
    setMetrics(i);
  };

  var stopAuto = function () { clearTimeout(timer); timer = 0; };
  var queue = function () {
    stopAuto();
    if (!auto) return;
    timer = setTimeout(function () { show((cur + 1) % tabs.length); queue(); }, 6000);
  };
  var cancelAuto = function () { auto = false; stopAuto(); root.classList.remove('is-auto'); };

  if (!auto) root.classList.remove('is-auto');

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

  /* ---------- Run animations only while the section is on screen ---------- */
  var go = function () { root.classList.add('is-live'); if (auto) queue(); };
  var halt = function () { root.classList.remove('is-live'); stopAuto(); };

  if (hasIO) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        go();
        setMetrics(cur);
      } else {
        halt();
      }
    }, { threshold: 0.3 }).observe(root);
  } else {
    go();
  }

  /* ---------- Subtle 3D tilt on the stage (mouse only) ---------- */
  var canHover = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (stage && view && canHover && !reduce) {
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      view.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      view.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
    });
    stage.addEventListener('pointerleave', function () {
      view.style.setProperty('--ry', '0deg');
      view.style.setProperty('--rx', '0deg');
    });
  }
})();