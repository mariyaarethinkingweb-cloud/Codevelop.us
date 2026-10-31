/* ==========================================================================
   Research & Data Analyst Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and scroll-reveal are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Hero: looping "video" of three support scenes ---------- */
  var stage = $('#rs-stage');
  if (stage) {
    var scenes = $$('.rs-scene', stage);
    var segs = $$('.rs-seg', stage);
    var nameEl = $('#rs-scene-name');
    var timeEl = $('#rs-time');
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
     Sections 2-7 (each has its own animation idea)
     ========================================================================== */
  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ---------- 2 · Ask: question types, sources arrive, answer streams with citations ---------- */
  var qa = $('#rs-qa');
  if (qa) {
    var QS = [
      { q: 'What are our top three competitors charging for the Pro plan?',
        s: ['Pricing pages', 'G2 reviews', 'Analyst report', 'Internal CRM'],
        a: 'Competitor A charges $49 per seat [1], Competitor B $59 [1] and Competitor C $42 on annual billing [3]. Your Pro plan at $55 sits mid-market [4]. Reviewers say support quality, not price, is why they switch [2].' },
      { q: 'Which regions grew fastest last year, and why?',
        s: ['Sales database', 'Census data', 'News archive', 'Board deck'],
        a: 'The Pacific Northwest grew 31% [1], helped by population gains in the metro areas [2]. The Southeast followed at 24% after the Atlanta launch [4]. Local coverage of the new warehouse lifted brand searches there [3].' },
      { q: 'Summarise the latest research on remote-work productivity.',
        s: ['Journal articles', 'Preprints', 'Survey data', 'Industry reports'],
        a: 'Most peer-reviewed studies find small productivity gains for focused tasks [1]. The gains shrink for work that needs close collaboration [2]. Recent surveys show hybrid teams report the highest retention [3], while industry reports warn of slower onboarding [4].' }
    ];
    var qEl = $('#rs-q'), srcEl = $('#rs-srcs'), ansEl = $('#rs-ans'), picks = $$('.rs-qp', qa);
    var qCur = 0, qToken = 0, qTimers = [], qPicked = false, qVis = false;

    var qLater = function (fn, ms) { qTimers.push(setTimeout(fn, ms)); };
    var qClear = function () { qTimers.forEach(clearTimeout); qTimers = []; };

    var tokens = function (a) {
      var out = [], re = /\[(\d)\]|[^\s\[]+\s*/g, m;
      while ((m = re.exec(a))) out.push(m[1] ? { c: Number(m[1]) } : { w: m[0] });
      return out;
    };

    var buildChips = function (Q) {
      srcEl.innerHTML = '';
      Q.s.forEach(function (s, k) {
        var c = document.createElement('span');
        c.className = 'rs-chip';
        c.innerHTML = '<b>' + (k + 1) + '</b>' + s + '<i></i>';
        srcEl.appendChild(c);
      });
      return $$('.rs-chip', srcEl);
    };

    var markPick = function (i) {
      picks.forEach(function (p, k) {
        p.classList.toggle('is-on', k === i);
        p.setAttribute('aria-pressed', String(k === i));
      });
    };

    var addToken = function (tk) {
      if (tk.w) { ansEl.appendChild(document.createTextNode(tk.w)); return null; }
      var s = document.createElement('sup');
      s.className = 'rs-cite';
      s.textContent = tk.c;
      ansEl.appendChild(s);
      return tk.c;
    };

    var finalState = function (i) {
      var Q = QS[i];
      qCur = i; markPick(i);
      qEl.textContent = Q.q;
      buildChips(Q).forEach(function (c) { c.classList.add('in'); });
      ansEl.innerHTML = '';
      tokens(Q.a).forEach(addToken);
      qa.classList.add('is-done');
    };

    var qPlay = function (i) {
      qClear(); qToken++;
      var t = qToken;
      qCur = i; markPick(i);
      if (reduce) { finalState(i); return; }

      var Q = QS[i];
      qa.classList.add('rs-anim');
      qa.classList.remove('is-done');
      qEl.textContent = '';
      ansEl.innerHTML = '';
      var chips = buildChips(Q);
      var toks = tokens(Q.a), n = 0, k = 0;

      var stream = function () {
        if (t !== qToken) return;
        if (n >= toks.length) {
          qa.classList.add('is-done');
          if (!qPicked) qLater(function () { qPlay((i + 1) % QS.length); }, 4200);
          return;
        }
        var tk = toks[n++];
        var c = addToken(tk);
        if (c && chips[c - 1]) {
          var ch = chips[c - 1];
          ch.classList.add('hit');
          qLater(function () { ch.classList.remove('hit'); }, 900);
        }
        qLater(stream, tk.w ? 55 : 150);
      };

      var showChips = function () {
        chips.forEach(function (c, j) {
          qLater(function () { if (t === qToken) c.classList.add('in'); }, j * 320);
        });
        qLater(stream, chips.length * 320 + 900);
      };

      var typeQ = function () {
        if (t !== qToken) return;
        k++;
        qEl.textContent = Q.q.slice(0, k);
        if (k < Q.q.length) qLater(typeQ, 30); else qLater(showChips, 300);
      };

      typeQ();
    };

    picks.forEach(function (p, k) {
      p.addEventListener('click', function () { qPicked = true; if (qVis || !hasIO) qPlay(k); else finalState(k); });
    });

    if (reduce || !hasIO) {
      finalState(0);
    } else {
      watch(qa, 0.3, function (v) {
        var was = qVis;
        qVis = v;
        if (v && !was) qPlay(qCur);
        else if (!v) { qToken++; qClear(); }
      });
    }
  }

  /* ---------- 3 · Radar: dots are placed by angle, pinged by the sweep ---------- */
  var radar = $('#rs-radar');
  if (radar) {
    var SWEEP = 7;
    $$('.rs-dot', radar).forEach(function (d) {
      var a = Number(d.dataset.a), r = Number(d.dataset.r), rad = a * Math.PI / 180;
      d.style.left = (50 + r / 100 * 50 * Math.sin(rad)).toFixed(2) + '%';
      d.style.top = (50 - r / 100 * 50 * Math.cos(rad)).toFixed(2) + '%';
      d.style.setProperty('--d', (a / 360 * SWEEP).toFixed(2) + 's');
    });

    var legend = $$('#rs-legend li'), dots = $$('.rs-dot', radar);
    var lCur = 0, lTimer = null;

    var setLegend = function (i) {
      lCur = i;
      var type = legend[i].getAttribute('data-t');
      legend.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      dots.forEach(function (d) { d.classList.toggle('is-type', d.getAttribute('data-t') === type); });
    };

    legend.forEach(function (li, k) {
      li.addEventListener('mouseenter', function () { clearInterval(lTimer); setLegend(k); });
    });

    setLegend(0);
    if (!reduce) {
      watch(radar, 0.3, function (v) {
        clearInterval(lTimer);
        if (v) lTimer = setInterval(function () { setLegend((lCur + 1) % legend.length); }, 2400);
      });
    }
  }

  /* ---------- 4 · Data to insight: table scan > bars grow > bars turn into a line > insight ---------- */
  var mo = $('#rs-mo');
  if (mo) {
    var mCards = $$('.rs-mc', mo), mTimers = [];
    var hot = function (i) { mCards.forEach(function (c, k) { c.classList.toggle('is-hot', k === i); }); };
    var mLater = function (fn, ms) { mTimers.push(setTimeout(fn, ms)); };
    var mReset = function () { mTimers.forEach(clearTimeout); mTimers = []; mo.classList.remove('p1', 'p2', 'p3'); hot(0); };
    var mLoop = function () {
      mReset();
      mLater(function () { mo.classList.add('p1'); hot(1); }, 1400);
      mLater(function () { mo.classList.add('p2'); }, 3400);
      mLater(function () { mo.classList.add('p3'); hot(2); }, 5200);
      mLater(mLoop, 12500);
    };

    if (reduce || !hasIO) {
      mo.classList.add('p1', 'p2', 'p3');
      hot(2);
    } else {
      mo.classList.add('rs-anim');
      watch(mo, 0.3, function (v) { if (v) mLoop(); else mReset(); });
    }
  }

  /* ---------- 6 · Stacking cards: earlier cards shrink and dim as the next one covers them ---------- */
  var stack = $('#rs-stack');
  if (stack && !reduce) {
    var sCards = $$('.rs-sc', stack), ticking = false;
    var updStack = function () {
      ticking = false;
      var narrow = window.innerWidth <= 760;
      sCards.forEach(function (c, k) {
        var n = sCards[k + 1];
        if (!n || narrow) { c.style.removeProperty('--s'); c.style.removeProperty('--b'); return; }
        var cr = c.getBoundingClientRect(), nr = n.getBoundingClientRect();
        var o = Math.max(0, Math.min(1, (cr.bottom - nr.top) / cr.height));
        c.style.setProperty('--s', (1 - o * 0.05).toFixed(3));
        c.style.setProperty('--b', (1 - o * 0.3).toFixed(3));
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(updStack); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updStack();
  }

  /* ---------- 7 · Output columns: duplicate cards for a seamless vertical loop ---------- */
  $$('.rs-otrack').forEach(function (track) {
    if (reduce) { track.style.animation = 'none'; return; }
    $$('.rs-oc', track).forEach(function (card) {
      var c = card.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
  });
})();