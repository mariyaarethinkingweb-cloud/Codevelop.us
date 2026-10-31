/* ==========================================================================
   Codevelop US: About Us page script  (File: js/about-us.js)
   Loads AFTER js/script.js.
   - Hero: animated particle network on #ab-net + cursor glow (--mx / --my)
   - Stats: count-up numbers when #ab-stats scrolls into view
   - Accordion (#ab-acc): click / hover / arrow keys
   - Triggers .is-in on #ab-duo (bars + flow) and #ab-final (typing line)
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* Run a callback once when an element becomes visible */
  function whenVisible(el, cb, threshold) {
    if (!el) return;
    if (!hasIO || reduceMotion) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        io.disconnect();
        cb();
      }
    }, { threshold: threshold || 0.25 });
    io.observe(el);
  }

  /* ---------------------------------------------------------------------
     HERO: particle network + cursor glow
     --------------------------------------------------------------------- */
  (function heroNetwork() {
    var canvas = document.getElementById('ab-net');
    var hero = document.getElementById('hero');
    if (!canvas || !hero || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var points = [];
    var mouse = { x: null, y: null };
    var raf = 0;
    var running = false;
    var linkDist = 130;

    function build() {
      var count = Math.round(Math.min(90, Math.max(28, (w * h) / 15000)));
      linkDist = w < 600 ? 95 : 135;
      points = [];
      for (var i = 0; i < count; i++) {
        var speed = 0.15 + Math.random() * 0.35;
        var angle = Math.random() * Math.PI * 2;
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1.2 + Math.random() * 1.6,
          accent: i % 7 === 0
        });
      }
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      draw(false);
    }

    function draw(step) {
      ctx.clearRect(0, 0, w, h);
      var i, j, p, q, dx, dy, d, a;

      for (i = 0; i < points.length; i++) {
        p = points[i];

        if (step) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;

          /* gentle push away from the cursor */
          if (mouse.x !== null) {
            dx = p.x - mouse.x;
            dy = p.y - mouse.y;
            d = Math.sqrt(dx * dx + dy * dy);
            if (d < 110 && d > 0.1) {
              p.x += (dx / d) * 0.9;
              p.y += (dy / d) * 0.9;
            }
          }
        }

        /* links between nearby points */
        for (j = i + 1; j < points.length; j++) {
          q = points[j];
          dx = p.x - q.x;
          dy = p.y - q.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            a = (1 - d / linkDist) * 0.32;
            ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        /* links to the cursor */
        if (mouse.x !== null) {
          dx = p.x - mouse.x;
          dy = p.y - mouse.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < 170) {
            a = (1 - d / 170) * 0.5;
            ctx.strokeStyle = 'rgba(255,143,168,' + a.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        /* the dot */
        ctx.fillStyle = p.accent ? 'rgba(255,143,168,0.95)' : 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      if (!running) return;
      draw(true);
      raf = window.requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      raf = window.requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(raf);
    }

    /* Cursor tracking: canvas link target + glow position */
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      hero.style.setProperty('--mx', ((mouse.x / rect.width) * 100).toFixed(1) + '%');
      hero.style.setProperty('--my', ((mouse.y / rect.height) * 100).toFixed(1) + '%');
    });
    hero.addEventListener('mouseleave', function () {
      mouse.x = null;
      mouse.y = null;
    });

    /* Resize (debounced) */
    var resizeTimer = 0;
    var onResize = function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(hero);
    else window.addEventListener('resize', onResize);

    /* Only animate while the hero is on screen and the tab is visible */
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start(); else stop();
      }, { threshold: 0 }).observe(hero);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (!reduceMotion) start();
    });

    resize();
  })();

  /* ---------------------------------------------------------------------
     STATS: count-up
     --------------------------------------------------------------------- */
  (function stats() {
    var wrap = document.getElementById('ab-stats');
    if (!wrap) return;
    var nums = Array.prototype.slice.call(wrap.querySelectorAll('[data-count]'));
    if (!nums.length) return;

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function animate(el, index) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var duration = 1500 + index * 120;
      var startTime = null;

      function frame(now) {
        if (startTime === null) startTime = now;
        var t = Math.min((now - startTime) / duration, 1);
        el.textContent = Math.round(target * easeOut(t));
        if (t < 1) window.requestAnimationFrame(frame);
        else el.textContent = target;
      }
      window.requestAnimationFrame(frame);
    }

    if (reduceMotion || !hasIO) return; /* final numbers already in the HTML */

    nums.forEach(function (el) { el.textContent = '0'; });
    whenVisible(wrap, function () {
      nums.forEach(animate);
    }, 0.3);
  })();

  /* ---------------------------------------------------------------------
     ACCORDION: Strategy / Technology / Measurable outcomes
     --------------------------------------------------------------------- */
  (function accordion() {
    var acc = document.getElementById('ab-acc');
    if (!acc) return;
    var tabs = Array.prototype.slice.call(acc.querySelectorAll('.ab-acc-item'));
    if (!tabs.length) return;

    var hoverDesktop = window.matchMedia('(min-width: 960px) and (hover: hover) and (pointer: fine)');

    function activate(item) {
      tabs.forEach(function (t) {
        var on = t === item;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab); });

      tab.addEventListener('mouseenter', function () {
        if (hoverDesktop.matches) activate(tab);
      });

      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          next.focus();
          activate(next);
        }
      });
    });
  })();

  /* ---------------------------------------------------------------------
     VISION / MISSION cards  (#ab-duo): grow bars + step flow
     CLOSING STATEMENT       (#ab-final): typing line, then the answer
     --------------------------------------------------------------------- */
  (function triggers() {
    var duo = document.getElementById('ab-duo');
    var final = document.getElementById('ab-final');

    whenVisible(duo, function () { duo.classList.add('is-in'); }, 0.25);
    whenVisible(final, function () { final.classList.add('is-in'); }, 0.35);
  })();
})();