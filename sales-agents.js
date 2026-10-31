/* ==========================================================================
   Sales & Lead-Generation Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and scroll-reveal are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Hero: looping "video" of three support scenes ---------- */
  var stage = $('#sl-stage');
  if (stage) {
    var scenes = $$('.sl-scene', stage);
    var segs = $$('.sl-seg', stage);
    var nameEl = $('#sl-scene-name');
    var timeEl = $('#sl-time');
    var SCENE_MS = 7000;
    var idx = 0, started = 0, scTimer = null, clock = null, vis = false, picked = false;

    var fmt = function (sec) {
      var m = Math.floor(sec / 60), s = sec % 60;
      return m + ':' + (s < 10 ? '0' : '') + s;
    };

    var tick = function () {
      var elapsed = Math.min(SCENE_MS, performance.now() - started);
      timeEl.textContent = fmt(Math.floor((idx * SCENE_MS + elapsed) / 1000));
    };

    var show = function (i) {
      idx = i;
      scenes.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      segs.forEach(function (g, k) {
        g.classList.remove('is-on', 'is-done');
        if (k < i) g.classList.add('is-done');
      });
      // restart the progress-bar animation on the active segment
      void stage.offsetWidth;
      segs[i].classList.add('is-on');
      nameEl.textContent = scenes[i].getAttribute('data-name');
      started = performance.now();
      tick();
      plan();
    };

    var plan = function () {
      clearTimeout(scTimer);
      clearInterval(clock);
      if (reduce || !vis) return;
      clock = setInterval(tick, 500);
      if (!picked) {
        scTimer = setTimeout(function () { show((idx + 1) % scenes.length); }, SCENE_MS);
      }
    };

    segs.forEach(function (g, k) {
      g.addEventListener('click', function () {
        picked = true;
        stage.classList.add('is-picked');
        show(k);
      });
    });

    if (reduce) {
      segs[0].classList.add('is-on');
    } else if (hasIO) {
      new IntersectionObserver(function (es) {
        var was = vis;
        vis = es[0].isIntersecting;
        if (vis && !was) show(idx); else if (!vis) plan();
      }, { threshold: 0.25 }).observe(stage);
    } else {
      vis = true;
      show(0);
    }
  }

  /* ---------- Hero stats: count-up ---------- */
  var counters = $$('.stats [data-count]');
  if (counters.length && !reduce) {
    var ran = false;
    var run = function () {
      if (ran) return;
      ran = true;
      var t0 = performance.now(), dur = 1500;
      var frame = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        counters.forEach(function (el) {
          el.textContent = (el.dataset.pre || '') + Math.round(Number(el.dataset.count) * e) + (el.dataset.suf || '');
        });
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    var statsBox = $('.stats');
    if (hasIO && statsBox) {
      var sio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { setTimeout(run, 900); sio.disconnect(); }
      }, { threshold: 0.4 });
      sio.observe(statsBox);
    } else { run(); }
  }

  /* ==========================================================================
     Sections 2-8: lead-generation motion
     ========================================================================== */
  var root = document.documentElement;
  if (!reduce) root.classList.add('sl-js');

  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  var countTo = function (el, to, delay, dur) {
    clearTimeout(el._t);
    cancelAnimationFrame(el._r);
    el.textContent = '0';
    el._t = setTimeout(function () {
      var t0 = performance.now();
      var f = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e);
        if (p < 1) el._r = requestAnimationFrame(f);
      };
      el._r = requestAnimationFrame(f);
    }, delay);
  };

  /* ---------- scroll reveal ---------- */
  var rvs = $$('.sl-rv');
  if (!reduce && hasIO) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('sl-seen'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('sl-seen'); });
  }

  /* ---------- 2 · One lead travels the funnel as you scroll ---------- */
  var funnel = $('#sl-funnel');
  var doSteps = $$('.sl-do-step');
  if (funnel && doSteps.length) {
    var fnRows = $$('.sl-fn-row', funnel);
    var statusEl = $('#sl-fn-status');
    var badgeEl = $('#sl-fn-badge');
    var curDo = -1, swapTimer = null;

    var setDo = function (i) {
      if (i === curDo || i < 0) return;
      curDo = i;
      fnRows.forEach(function (r, k) {
        r.classList.toggle('is-on', k === i);
        r.classList.toggle('is-past', k < i);
      });
      doSteps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      var st = doSteps[i].getAttribute('data-status') || '';
      var bd = doSteps[i].getAttribute('data-badge') || '';
      clearTimeout(swapTimer);
      statusEl.classList.add('is-out');
      swapTimer = setTimeout(function () {
        statusEl.textContent = st;
        badgeEl.textContent = bd;
        statusEl.classList.remove('is-out');
      }, 220);
    };
    setDo(0);

    if (hasIO) {
      var dio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) setDo(doSteps.indexOf(e.target));
        });
      }, { rootMargin: '-42% 0px -48% 0px' });
      doSteps.forEach(function (s) { dio.observe(s); });
    }

    fnRows.forEach(function (r, k) {
      r.style.cursor = 'pointer';
      r.addEventListener('click', function () {
        doSteps[k].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    });
  }

  /* ---------- 3 · Live tickers on the lead hub ---------- */
  var hub = $('#sl-hub');
  if (hub && !reduce) {
    var hubVis = false;
    watch(hub, 0.2, function (v) { hubVis = v; });
    $$('.sl-tick', hub).forEach(function (el, k) {
      var items = (el.getAttribute('data-items') || '').split('|');
      if (items.length < 2) return;
      var i = 0;
      setInterval(function () {
        if (!hubVis) return;
        el.classList.add('is-out');
        setTimeout(function () {
          i = (i + 1) % items.length;
          el.innerHTML = items[i];
          el.classList.remove('is-out');
        }, 350);
      }, 2600 + k * 450);
    });
  }

  /* ---------- 4 · Timeline: the rail fills as you scroll ---------- */
  var tl = $('#sl-tl');
  if (tl) {
    var tlItems = $$('.sl-tl-item', tl);
    if (reduce) {
      tlItems.forEach(function (it) { it.classList.add('is-on'); });
    } else {
      var ticking = false;
      var updTl = function () {
        ticking = false;
        var r = tl.getBoundingClientRect();
        var line = window.innerHeight * 0.55;
        var p = Math.max(0, Math.min(1, (line - r.top) / r.height));
        tl.style.setProperty('--p', p.toFixed(4));
        tlItems.forEach(function (it) {
          var n = $('.sl-tl-n', it).getBoundingClientRect();
          it.classList.toggle('is-on', n.top + n.height / 2 <= line + 10);
        });
      };
      var reqTl = function () {
        if (!ticking) { ticking = true; requestAnimationFrame(updTl); }
      };
      window.addEventListener('scroll', reqTl, { passive: true });
      window.addEventListener('resize', reqTl);
      updTl();
    }
  }

  /* ---------- 5 · Lead queue: scores fill, ready leads go to reps ---------- */
  var board = $('#sl-board');
  if (board && !reduce) {
    var nums = $$('.sl-num', board);
    var bTimer = null;
    var runBoard = function () {
      board.classList.remove('is-run');
      void board.offsetWidth;
      board.classList.add('is-run');
      nums.forEach(function (n, i) {
        countTo(n, Number(n.getAttribute('data-to')), 500 + i * 350, 1400);
      });
    };
    watch(board, 0.35, function (v) {
      clearInterval(bTimer);
      if (v) {
        runBoard();
        bTimer = setInterval(runBoard, 11500);
      }
    });
  }

  /* ---------- 7 · Speed-to-lead race ---------- */
  var race = $('#sl-race');
  if (race && !reduce) {
    var rTimer = null;
    var runRace = function () {
      race.classList.remove('is-run');
      void race.offsetWidth;
      race.classList.add('is-run');
    };
    watch(race, 0.35, function (v) {
      clearInterval(rTimer);
      if (v) {
        runRace();
        rTimer = setInterval(runRace, 12000);
      }
    });
  }
})();