/* ==========================================================================
   HR & Recruitment Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and scroll-reveal are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Hero: looping "video" of three support scenes ---------- */
  var stage = $('#hr-stage');
  if (stage) {
    var scenes = $$('.hr-scene', stage);
    var segs = $$('.hr-seg', stage);
    var nameEl = $('#hr-scene-name');
    var timeEl = $('#hr-time');
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
     Sections 2-8 (each has its own animation idea)
     ========================================================================== */
  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ---------- 2 · CV x-ray: highlighter marks the evidence, requirements tick, score climbs ---------- */
  var xr = $('#hr-xr');
  if (xr) {
    var marks = $$('mark', xr), reqs = $$('.hr-rq', xr), mFill = $('#hr-mfill'), mNum = $('#hr-mnum');
    var SC = [16, 34, 52, 70, 92, 88], xt = [];
    var xLater = function (fn, ms) { xt.push(setTimeout(fn, ms)); };
    var setScore = function (v) { mFill.style.width = v + '%'; mNum.textContent = v + '%'; };
    var xReset = function () {
      xt.forEach(clearTimeout); xt = [];
      marks.forEach(function (m) { m.classList.remove('on'); });
      reqs.forEach(function (r) { r.classList.remove('on'); });
      setScore(0);
    };
    var xLoop = function () {
      xReset();
      marks.forEach(function (m, i) {
        xLater(function () { m.classList.add('on'); }, 900 + i * 1100);
        xLater(function () { reqs[i].classList.add('on'); setScore(SC[i]); }, 1400 + i * 1100);
      });
      xLater(function () { reqs[5].classList.add('on'); setScore(SC[5]); }, 900 + 5 * 1100 + 700);
      xLater(xLoop, 900 + 6 * 1100 + 4800);
    };
    if (reduce || !hasIO) {
      setScore(88);
    } else {
      xr.classList.add('hr-anim');
      watch(xr, 0.3, function (v) { if (v) xLoop(); else xReset(); });
    }
  }

  /* ---------- 3 · Scheduling puzzle: busy blocks slide in, a scan finds the one free slot ---------- */
  var sch = $('#hr-sch');
  if (sch) {
    var schSt = $('#hr-sch-st'), schT = [];
    var sLater = function (fn, ms) { schT.push(setTimeout(fn, ms)); };
    var sReset = function () {
      schT.forEach(clearTimeout); schT = [];
      sch.classList.remove('in', 'sweep', 'match', 'booked');
      schSt.textContent = 'Checking calendars...';
    };
    var sLoop = function () {
      sReset();
      sLater(function () { sch.classList.add('in'); }, 400);
      sLater(function () { sch.classList.add('sweep'); schSt.textContent = 'Looking for a common slot...'; }, 2500);
      sLater(function () { sch.classList.add('match'); schSt.textContent = 'Only 11:00 works for everyone'; }, 4800);
      sLater(function () { sch.classList.add('booked'); schSt.textContent = 'Interview booked for 11:00'; }, 6200);
      sLater(sLoop, 12500);
    };
    if (!reduce && hasIO) {
      sch.classList.add('hr-anim');
      watch(sch, 0.3, function (v) { if (v) sLoop(); else sReset(); });
    }
  }

  /* ---------- 4 · Phone: notifications arrive one by one and push older ones down ---------- */
  var phone = $('#hr-phone');
  if (phone && !reduce && hasIO) {
    var nts = $$('.hr-nt', phone), frame = $('#hr-ph-frame'), pT = [];
    var pLater = function (fn, ms) { pT.push(setTimeout(fn, ms)); };
    var pReset = function () {
      pT.forEach(clearTimeout); pT = [];
      nts.forEach(function (n) { n.classList.remove('is-in'); n.style.removeProperty('--a'); });
    };
    var place = function (count) {
      nts.forEach(function (n, k) { if (k < count) n.style.setProperty('--a', count - 1 - k); });
    };
    var pLoop = function () {
      pReset();
      nts.forEach(function (n, k) {
        pLater(function () {
          n.classList.add('is-in');
          place(k + 1);
          frame.classList.remove('buzz'); void frame.offsetWidth; frame.classList.add('buzz');
        }, 900 + k * 1700);
      });
      pLater(pLoop, 900 + nts.length * 1700 + 3600);
    };
    phone.classList.add('hr-anim');
    watch(phone, 0.35, function (v) { if (v) pLoop(); else pReset(); });
  }

  /* ---------- 5 · Fair screening: auto-moving before / after slider you can also drag ---------- */
  var cmp = $('#hr-cmp');
  if (cmp) {
    var cPct = 50, cAuto = true, cDrag = false, cVis = false, cRaf = null, cT0 = 0;
    var handle = $('#hr-cmp-h');
    var setP = function (p) {
      cPct = Math.max(4, Math.min(96, p));
      cmp.style.setProperty('--p', cPct + '%');
      handle.setAttribute('aria-valuenow', Math.round(cPct));
    };
    var cTick = function (t) {
      if (!cVis || !cAuto) { cRaf = null; return; }
      setP(50 + 40 * Math.sin((t - cT0) / 1900));
      cRaf = requestAnimationFrame(cTick);
    };
    var cMove = function (e) {
      var r = cmp.getBoundingClientRect();
      setP((e.clientX - r.left) / r.width * 100);
    };
    cmp.addEventListener('pointerdown', function (e) { cAuto = false; cDrag = true; try { cmp.setPointerCapture(e.pointerId); } catch (x) {} cMove(e); });
    cmp.addEventListener('pointermove', function (e) { if (cDrag) cMove(e); });
    cmp.addEventListener('pointerup', function () { cDrag = false; });
    cmp.addEventListener('pointercancel', function () { cDrag = false; });
    handle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { cAuto = false; setP(cPct - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { cAuto = false; setP(cPct + 5); e.preventDefault(); }
    });
    setP(50);
    if (!reduce && hasIO) {
      watch(cmp, 0.3, function (v) {
        cVis = v;
        if (v && cAuto && !cRaf) { cT0 = performance.now(); cRaf = requestAnimationFrame(cTick); }
      });
    }
  }

  /* ---------- 6 · Race: two lanes run over the same clock, the agent lane finishes first ---------- */
  var lanes = $('#hr-lanes');
  if (lanes) {
    var DUR = 8400, DAYS = 42, B_DAYS = 18;
    var mk = function (sel) {
      var l = $(sel, lanes);
      return { fill: $('.hr-fill', l), run: $('.hr-run', l), stops: $$('.hr-stop', l), em: $('em', l) };
    };
    var laneA = mk('.hr-lane--a'), laneB = mk('.hr-lane--b');
    var dayEl = $('#hr-daynum'), saved = $('#hr-saved');
    var lRaf = null, lT0 = 0, lVis = false, lWait = null;

    $$('.hr-stop', lanes).forEach(function (s) { s.style.setProperty('--x', s.getAttribute('data-x')); });

    var setLane = function (L, p) {
      L.fill.style.width = (p * 100) + '%';
      L.fill.style.clipPath = 'none';
      L.run.style.left = (p * 100) + '%';
      L.stops.forEach(function (s) { s.classList.toggle('on', p * 100 >= Number(s.getAttribute('data-x')) - 0.01); });
    };
    var lReset = function () {
      cancelAnimationFrame(lRaf); clearTimeout(lWait); lRaf = null;
      setLane(laneA, 0); setLane(laneB, 0);
      dayEl.textContent = '0';
      laneA.em.classList.remove('on'); laneB.em.classList.remove('on'); saved.classList.remove('on');
    };
    var lFrame = function (t) {
      var p = Math.min(1, (t - lT0) / DUR), day = p * DAYS;
      setLane(laneA, p);
      setLane(laneB, Math.min(1, day / B_DAYS));
      dayEl.textContent = Math.floor(day);
      if (day >= B_DAYS) laneB.em.classList.add('on');
      if (p >= 1) {
        dayEl.textContent = DAYS;
        laneA.em.classList.add('on'); saved.classList.add('on');
        lWait = setTimeout(function () { if (lVis) lStart(); }, 4200);
        return;
      }
      lRaf = requestAnimationFrame(lFrame);
    };
    var lStart = function () { lReset(); lT0 = performance.now() + 700; lRaf = requestAnimationFrame(lFrame); };

    if (reduce || !hasIO) {
      setLane(laneA, 1); setLane(laneB, 1);
    } else {
      lanes.classList.add('hr-anim');
      lReset();
      watch(lanes, 0.35, function (v) { lVis = v; if (v) lStart(); else lReset(); });
    }
  }

  /* ---------- 7 · Onboarding heat map: days fill in one after another, then confetti ---------- */
  var hm = $('#hr-hm');
  if (hm) {
    var hCells = $$('.hr-cell', hm), hNum = $('#hr-hnum'), conf = $('#hr-conf');
    var total = 0;
    hCells.forEach(function (c) { total += Number(c.getAttribute('data-l')); });
    var hT = [];
    var hLater = function (fn, ms) { hT.push(setTimeout(fn, ms)); };
    var setTasks = function (n) { hNum.textContent = n + ' of ' + total + ' tasks'; };
    var COLORS = ['#b31942', '#0a3161', '#1d4f9c', '#ff8da6', '#2fb47c', '#ffffff'];
    var burst = function () {
      conf.innerHTML = '';
      for (var i = 0; i < 34; i++) {
        var s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 170;
        s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
        s.style.setProperty('--dy', (Math.sin(a) * d - 40).toFixed(0) + 'px');
        s.style.setProperty('--r', ((Math.random() - 0.5) * 720).toFixed(0) + 'deg');
        s.style.setProperty('--cf', COLORS[i % COLORS.length]);
        conf.appendChild(s);
      }
    };
    var hReset = function () {
      hT.forEach(clearTimeout); hT = [];
      hCells.forEach(function (c) { c.classList.remove('on', 'pop'); });
      hm.classList.remove('done');
      conf.innerHTML = '';
      setTasks(0);
    };
    var hLoop = function () {
      hReset();
      var done = 0;
      hCells.forEach(function (c, i) {
        hLater(function () {
          c.classList.add('on', 'pop');
          done += Number(c.getAttribute('data-l'));
          setTasks(done);
        }, 700 + i * 105);
      });
      var tEnd = 700 + hCells.length * 105 + 350;
      hLater(function () { hm.classList.add('done'); burst(); }, tEnd);
      hLater(hLoop, tEnd + 5200);
    };
    if (reduce || !hasIO) {
      setTasks(total);
    } else {
      hm.classList.add('hr-anim');
      setTasks(0);
      watch(hm, 0.3, function (v) { if (v) hLoop(); else hReset(); });
    }
  }

  /* ---------- 8 · Metro line: a train rides the line and lights each stop ---------- */
  var metro = $('#hr-metro');
  if (metro) {
    var mPath = $('#hr-mpath'), mProg = $('#hr-mprog'), train = $('#hr-train'), stopsG = $('#hr-mstops');
    var steps = $$('.hr-ms-i', metro), L = mPath.getTotalLength();
    var FR = [0.02, 0.36, 0.68, 0.98], NS = 'http://www.w3.org/2000/svg', stopEls = [];
    FR.forEach(function (f) {
      var pt = mPath.getPointAtLength(f * L), c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'hr-mstop');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', 13);
      stopsG.appendChild(c); stopEls.push(c);
    });
    mProg.style.strokeDasharray = L;

    var setMetro = function (p) {
      mProg.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      var pt = mPath.getPointAtLength(p * L);
      train.setAttribute('cx', pt.x); train.setAttribute('cy', pt.y);
      var active = 0;
      FR.forEach(function (f, i) {
        var on = p >= f - 0.005;
        stopEls[i].classList.toggle('on', on);
        if (on) active = i;
      });
      steps.forEach(function (s, i) { s.classList.toggle('is-on', i === active); });
    };

    var mRaf = null, mT0 = 0, mVis = false, mWait = null, MD = 9000;
    var mFrame = function (t) {
      var p = Math.min(1, (t - mT0) / MD);
      setMetro(p);
      if (p >= 1) { mWait = setTimeout(function () { if (mVis) mStart(); }, 2400); return; }
      mRaf = requestAnimationFrame(mFrame);
    };
    var mStart = function () { cancelAnimationFrame(mRaf); clearTimeout(mWait); setMetro(0); mT0 = performance.now() + 600; mRaf = requestAnimationFrame(mFrame); };

    if (reduce || !hasIO) {
      setMetro(1);
      steps.forEach(function (s) { s.classList.add('is-on'); });
    } else {
      setMetro(0);
      watch(metro, 0.35, function (v) { mVis = v; if (v) mStart(); else { cancelAnimationFrame(mRaf); clearTimeout(mWait); } });
    }
  }
})();