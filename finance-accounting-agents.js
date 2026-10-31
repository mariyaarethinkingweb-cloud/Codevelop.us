/* ==========================================================================
   Finance & Accounting Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and scroll-reveal are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var root = document.documentElement;
  var animate = !reduce && hasIO;
  if (!reduce) root.classList.add('fa-js');

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ---------- Hero: looping "video" of three finance scenes ---------- */
  var stage = $('#fa-stage');
  if (stage) {
    var scenes = $$('.fa-scene', stage);
    var segs = $$('.fa-seg', stage);
    var nameEl = $('#fa-scene-name');
    var timeEl = $('#fa-time');
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
      void stage.offsetWidth; // restart the progress-bar animation
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
     Sections 2-8
     ========================================================================== */

  /* ---------- 2 · Invoice lane: a document chip travels through four stages ---------- */
  var lane = $('#fa-lane');
  if (lane && animate) {
    var stops = $$('.fa-stop', lane), rfill = $('#fa-rfill'), chipT = $('#fa-chip-t');
    var LABELS = ['Reading INV-2041', 'Matching PO-1187', 'Waiting for approval', 'Posting to ledger', 'Posted \u00b7 INV-2041'];
    var ln = -1, lTimer = null;

    var setStage = function (n) {
      ln = n;
      lane.style.setProperty('--c', clamp(n, 0, 3));
      rfill.style.width = (clamp(n, 0, 3) * 33.333) + '%';
      chipT.textContent = LABELS[clamp(n, 0, 4)];
      stops.forEach(function (el, k) {
        el.classList.toggle('is-done', k < n);
        el.classList.toggle('is-now', k === n);
      });
    };

    var laneStep = function () {
      var next = ln + 1;
      if (next > 4) next = 0;
      setStage(next);
      lTimer = setTimeout(laneStep, next === 4 ? 3200 : 1500);
    };

    setStage(0);
    watch(lane, 0.35, function (v) {
      clearTimeout(lTimer);
      if (v) { setStage(0); lTimer = setTimeout(laneStep, 1500); }
    });
  }

  /* ---------- 3 · Reconciliation: lines draw from bank rows to ledger rows ---------- */
  var recbox = $('#fa-recbox');
  if (recbox) {
    var panels = $$('.fa-panel', recbox), mid = $('#fa-mid'), links = $('#fa-links');
    var bankRows = $$('.fa-row', panels[0]), ledRows = $$('.fa-row', panels[1]);
    var cntN = $('#fa-count-n'), cntBox = $('#fa-count');
    var rTimers = [], rToken = 0, NS = 'http://www.w3.org/2000/svg';
    var rLater = function (fn, ms) { rTimers.push(setTimeout(fn, ms)); };
    var rClear = function () { rTimers.forEach(clearTimeout); rTimers = []; };
    var isStacked = function () { return window.getComputedStyle(mid).display === 'none'; };

    var setState = function (row, cls) {
      row.classList.remove('is-ok', 'is-flag', 'is-scan');
      if (cls) row.classList.add(cls);
    };

    var finish = function () {
      bankRows.forEach(function (r, i) { setState(r, i === 4 ? 'is-flag' : 'is-ok'); });
      ledRows.forEach(function (r, i) { setState(r, i === 4 ? 'is-flag' : 'is-ok'); });
      cntN.textContent = '4';
    };

    var drawLine = function (i, bad) {
      if (isStacked()) return;
      var m = mid.getBoundingClientRect();
      var a = bankRows[i].getBoundingClientRect();
      var b = ledRows[Number(bankRows[i].getAttribute('data-to'))].getBoundingClientRect();
      var y1 = a.top + a.height / 2 - m.top, y2 = b.top + b.height / 2 - m.top, w = m.width;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M0 ' + y1 + ' C ' + (w * 0.55) + ' ' + y1 + ', ' + (w * 0.45) + ' ' + y2 + ', ' + w + ' ' + y2);
      if (bad) p.setAttribute('class', 'bad');
      p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = bad ? '' : '1';
      links.appendChild(p);
      if (!bad) {
        p.style.strokeDashoffset = '1';
        p.getBoundingClientRect();
        p.style.transition = 'stroke-dashoffset 0.7s ease';
        p.style.strokeDashoffset = '0';
      } else {
        p.style.opacity = '0';
        p.style.transition = 'opacity 0.6s';
        p.getBoundingClientRect();
        p.style.opacity = '1';
      }
      [[0, y1], [w, y2]].forEach(function (pt) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', pt[0]); c.setAttribute('cy', pt[1]); c.setAttribute('r', 5);
        if (bad) c.setAttribute('class', 'bad');
        links.appendChild(c);
      });
    };

    var recLoop = function () {
      rClear();
      var tok = ++rToken;
      links.innerHTML = '';
      bankRows.concat(ledRows).forEach(function (r) { setState(r, null); });
      cntN.textContent = '0';
      var matched = 0;
      bankRows.forEach(function (row, i) {
        var t = 700 + i * 1100, bad = i === 4;
        rLater(function () {
          if (tok !== rToken) return;
          var led = ledRows[Number(row.getAttribute('data-to'))];
          setState(row, 'is-scan'); setState(led, 'is-scan');
          rLater(function () {
            if (tok !== rToken) return;
            drawLine(i, bad);
            setState(row, bad ? 'is-flag' : 'is-ok');
            setState(led, bad ? 'is-flag' : 'is-ok');
            if (!bad) { matched++; cntN.textContent = String(matched); }
          }, 450);
        }, t);
      });
      rLater(recLoop, 700 + 5 * 1100 + 4200);
    };

    if (animate) {
      watch(recbox, 0.35, function (v) {
        rClear(); rToken++;
        if (v) recLoop(); else { links.innerHTML = ''; finish(); }
      });
      window.addEventListener('resize', function () {
        if (!animate) return;
        links.innerHTML = '';
      });
    }
  }

  /* ---------- 4 · Month-end close: tasks tick off and the ring fills ---------- */
  var ckcard = $('#fa-ckcard');
  if (ckcard) {
    var tasks = $$('#fa-tasks li'), ringFg = $('#fa-ringfg'), ringNum = $('#fa-ringnum');
    var ringWrap = ringFg.parentNode.parentNode, ckSub = $('#fa-cksub'), cmp = $('#fa-cmp');
    var CIRC = 377, cTimers = [];
    var cLater = function (fn, ms) { cTimers.push(setTimeout(fn, ms)); };
    var cClear = function () { cTimers.forEach(clearTimeout); cTimers = []; };

    var setRing = function (n) {
      var p = n / tasks.length;
      ringFg.style.strokeDashoffset = String(CIRC * (1 - p));
      ringNum.textContent = Math.round(p * 100) + '%';
      ringWrap.classList.toggle('is-full', n === tasks.length);
      ckSub.textContent = n + ' of ' + tasks.length + ' tasks complete';
      tasks.forEach(function (li, k) { li.classList.toggle('is-done', k < n); });
    };

    var closeLoop = function () {
      cClear();
      setRing(0);
      tasks.forEach(function (_, k) { cLater(function () { setRing(k + 1); }, 900 + k * 900); });
      cLater(closeLoop, 900 + tasks.length * 900 + 4200);
    };

    if (animate) {
      setRing(0);
      watch(ckcard, 0.35, function (v) {
        cClear();
        if (v) { cmp.classList.add('is-in'); closeLoop(); }
      });
    } else {
      cmp.classList.add('is-in');
      setRing(tasks.length);
    }
  }

  /* ---------- 5 · Spend watch: replays the chart draw while it is on screen ---------- */
  var anbox = $('#fa-anbox');
  if (anbox && animate) {
    var aTimer = null;
    var play = function () {
      anbox.classList.remove('is-play');
      void anbox.offsetWidth;
      anbox.classList.add('is-play');
    };
    watch(anbox, 0.35, function (v) {
      clearInterval(aTimer);
      if (v) { play(); aTimer = setInterval(play, 11000); }
    });
  }

  /* ---------- 6 · Savings calculator ---------- */
  var calc = $('#fa-calc');
  if (calc) {
    var inv = $('#fa-inv'), mins = $('#fa-min');
    var invV = $('#fa-inv-v'), minV = $('#fa-min-v');
    var hrsEl = $('#fa-hrs'), fteEl = $('#fa-fte'), hMan = $('#fa-hman'), hAg = $('#fa-hagent');
    var bMan = $('#fa-bman'), bAg = $('#fa-bagent');
    var shown = { hrs: 0, fte: 0 }, tweenId = 0;
    var AUTOMATED = 0.8, HOURS_PER_FTE = 160;
    var MAX_HOURS = 5000 * 20 / 60;

    var fill = function (el) {
      var p = (el.value - el.min) / (el.max - el.min) * 100;
      el.style.setProperty('--fill', p + '%');
    };

    var paint = function (hrs, fte) {
      hrsEl.textContent = Math.round(hrs).toLocaleString('en-US');
      fteEl.textContent = fte.toFixed(1);
    };

    var update = function () {
      var n = Number(inv.value), m = Number(mins.value);
      var manual = n * m / 60, agent = manual * (1 - AUTOMATED), saved = manual - agent;
      var fte = saved / HOURS_PER_FTE;
      invV.textContent = n.toLocaleString('en-US');
      minV.textContent = m + ' min';
      fill(inv); fill(mins);
      hMan.textContent = Math.round(manual).toLocaleString('en-US') + ' h';
      hAg.textContent = Math.round(agent).toLocaleString('en-US') + ' h';
      bMan.style.width = clamp(manual / MAX_HOURS * 100, 6, 100) + '%';
      bAg.style.width = clamp(agent / MAX_HOURS * 100, 3, 100) + '%';

      if (reduce) { paint(saved, fte); return; }
      var from = { hrs: shown.hrs, fte: shown.fte }, t0 = performance.now(), id = ++tweenId;
      var step = function (t) {
        if (id !== tweenId) return;
        var p = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - p, 3);
        shown.hrs = from.hrs + (saved - from.hrs) * e;
        shown.fte = from.fte + (fte - from.fte) * e;
        paint(shown.hrs, shown.fte);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    inv.addEventListener('input', update);
    mins.addEventListener('input', update);
    update();
  }

  /* ---------- 7 · Tools: duplicate each row so the marquee loops seamlessly ---------- */
  if (!reduce) {
    $$('.fa-mtrack').forEach(function (track) {
      $$('.fa-tool', track).forEach(function (el) {
        var c = el.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
    });
  }

  /* ---------- 8 · Timeline: the line fills as you scroll and steps light up ---------- */
  var tl = $('#fa-tl');
  if (tl && !reduce) {
    var steps = $$('.fa-tls', tl), busy = false;
    var update8 = function () {
      busy = false;
      var vh = window.innerHeight, line = vh * 0.62;
      var r = tl.getBoundingClientRect();
      var p = clamp((line - r.top) / r.height, 0, 1);
      tl.style.setProperty('--p', p.toFixed(3));
      steps.forEach(function (s) {
        var n = $('.fa-tln', s).getBoundingClientRect();
        s.classList.toggle('is-lit', n.top + n.height / 2 < line);
      });
    };
    var onScroll = function () {
      if (!busy) { busy = true; requestAnimationFrame(update8); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update8();
  }
})();