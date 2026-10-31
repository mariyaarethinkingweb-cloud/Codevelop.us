/* ==========================================================================
   Marketing Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and mobile menu are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var root = document.documentElement;
  if (!reduce && hasIO) root.classList.add('mk-js');

  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ==========================================================================
     1 · Hero: looping "video" of three scenes (same behaviour as the other agent pages)
     ========================================================================== */
  var stage = $('#mk-stage');
  if (stage) {
    var scenes = $$('.mk-scene', stage);
    var segs = $$('.mk-seg', stage);
    var nameEl = $('#mk-scene-name');
    var timeEl = $('#mk-time');
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
     Sections 2-6
     ========================================================================== */

  /* ---------- reveal: blur + rise ---------- */
  var rvs = $$('.mk-rv');
  if (root.classList.contains('mk-js')) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('mk-seen'); rio.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
    // safety net: anything already on screen after load gets revealed
    window.addEventListener('load', function () {
      setTimeout(function () {
        rvs.forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('mk-seen');
        });
      }, 2000);
    });
  }

  /* ---------- 2 · Content studio: typewriter brief → channel fan-out ---------- */
  var studio = $('#mk-studio');
  if (studio) {
    var briefEl = $('#mk-brief-text');
    var gen = $('#mk-gen');
    var sugs = $$('.mk-sug', studio);
    var chans = $$('.mk-ch', studio);

    // order of channels matches the cards: email, instagram, linkedin, google ads
    // each entry: [field that is measured against the limit, body text]
    var BRIEFS = [
      {
        brief: 'Promote our Spring sale: 20% off all skincare, ends Sunday.',
        out: [
          ['Your spring reset: 20% off ends Sunday', 'Every serum, cleanser and SPF is 20% off until Sunday night. Free delivery over $40.'],
          ['Fresh skin for a fresh season. Everything is 20% off until Sunday.', '#springskincare #skinlysale #glowup'],
          ['Our biggest spring sale is live: 20% off the full skincare range through Sunday.', 'A good time to restock the team gift drawer too. Link in the comments.'],
          ['Spring Skincare 20% Off', 'Serums, cleansers and SPF on sale. Ends Sunday. Free delivery over $40.']
        ]
      },
      {
        brief: 'Invite IT managers to our webinar on cutting cloud costs, Nov 12.',
        out: [
          ['Cut your cloud bill: live session Nov 12', '45 minutes, three real cost audits and a checklist you can use the next day. Save your seat.'],
          ['Cloud bill creeping up? We will show where the waste hides. Live, Nov 12.', '#cloudcosts #itleaders #webinar'],
          ['Most teams pay for cloud capacity they never use. On Nov 12 we walk through three real audits and how each team fixed it.', 'Free for IT managers. Register below.'],
          ['Cloud Cost Webinar Nov 12', 'Learn where cloud spend leaks and how to fix it. Free 45-minute live session.']
        ]
      },
      {
        brief: 'Launch our new running shoe, the Pace 2, to existing customers.',
        out: [
          ['Meet Pace 2: lighter, faster, yours first', 'As a Stride customer you get access 48 hours before everyone else. Your size is waiting.'],
          ['Lighter. Bouncier. Built for your long run. Pace 2 drops Friday.', '#pace2 #runningshoes #stride'],
          ['After 14 months of testing with club runners, Pace 2 is here, 40 g lighter than the original.', 'Proud of the team that made this happen.'],
          ['Pace 2 Running Shoe Is Here', '40 g lighter with more bounce. Early access for Stride members this week.']
        ]
      }
    ];

    var sTok = 0, sTimers = [], sVis = false, sPicked = false, sCur = 0;
    var sLater = function (fn, ms) { sTimers.push(setTimeout(fn, ms)); };
    var sClear = function () { sTimers.forEach(clearTimeout); sTimers = []; };

    var setMeter = function (card, text) {
      var lim = Number(card.getAttribute('data-lim'));
      $('.mk-count', card).textContent = text.length + ' / ' + lim;
      card.style.setProperty('--w', Math.min(100, text.length / lim * 100).toFixed(1) + '%');
    };

    var typeInto = function (el, text, speed, t, done, onStep) {
      var i = 0;
      el.textContent = '';
      el.classList.add('is-typing');
      var step = function () {
        if (t !== sTok) { el.classList.remove('is-typing'); return; }
        i = Math.min(text.length, i + (Math.random() < 0.3 ? 2 : 1));
        el.textContent = text.slice(0, i);
        if (onStep) onStep(el.textContent);
        if (i < text.length) {
          sLater(step, speed + Math.random() * speed * 0.6);
        } else {
          el.classList.remove('is-typing');
          if (done) done();
        }
      };
      sLater(step, speed);
    };

    var markSug = function (i) {
      sugs.forEach(function (b, k) {
        b.classList.toggle('is-on', k === i);
        b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
    };

    var clearCards = function () {
      chans.forEach(function (c) {
        c.classList.remove('is-ready', 'is-busy', 'is-writing');
        $('.mk-ch-a', c).textContent = '';
        $('.mk-ch-b', c).textContent = '';
        setMeter(c, '');
      });
    };

    var fillNow = function (i) {
      var B = BRIEFS[i];
      markSug(i);
      briefEl.textContent = B.brief;
      chans.forEach(function (c, k) {
        c.classList.remove('is-busy', 'is-writing');
        $('.mk-ch-a', c).textContent = B.out[k][0];
        $('.mk-ch-b', c).textContent = B.out[k][1];
        setMeter(c, B.out[k][0]);
        c.classList.add('is-ready');
      });
    };

    var runBrief = function (i) {
      sClear();
      sTok++;
      var t = sTok;
      sCur = i;
      if (reduce) { fillNow(i); return; }

      var B = BRIEFS[i];
      markSug(i);
      clearCards();

      typeInto(briefEl, B.brief, 30, t, function () {
        gen.classList.add('is-press');
        sLater(function () { gen.classList.remove('is-press'); }, 420);
        chans.forEach(function (c) { c.classList.add('is-busy'); });

        var k = 0;
        var nextCh = function () {
          if (t !== sTok) return;
          if (k >= chans.length) {
            if (!sPicked) sLater(function () { runBrief((sCur + 1) % BRIEFS.length); }, 4000);
            return;
          }
          var c = chans[k], o = B.out[k];
          c.classList.remove('is-busy');
          c.classList.add('is-writing');
          typeInto($('.mk-ch-a', c), o[0], 22, t, function () {
            typeInto($('.mk-ch-b', c), o[1], 10, t, function () {
              c.classList.remove('is-writing');
              c.classList.add('is-ready');
              k++;
              sLater(nextCh, 260);
            });
          }, function (s) { setMeter(c, s); });
        };
        sLater(nextCh, 700);
      });
    };

    sugs.forEach(function (b, k) {
      b.addEventListener('click', function () {
        sPicked = true;
        runBrief(k);
      });
    });

    gen.addEventListener('click', function () {
      sPicked = true;
      runBrief(sCur);
    });

    if (reduce) {
      fillNow(0);
    } else {
      watch(studio, 0.3, function (v) {
        var was = sVis;
        sVis = v;
        if (v && !was) runBrief(sCur);
        else if (!v) { sTok++; sClear(); fillNow(sCur); }
      });
    }
  }

  /* ---------- 3 · Expanding panels ---------- */
  var pWrap = $('#mk-panels');
  if (pWrap) {
    var panels = $$('.mk-panel', pWrap);
    var PANEL_MS = 4200;
    var pCur = 0, pTimer = null, pVis = false, pPicked = false, pHover = false;
    var canHover = window.matchMedia && matchMedia('(hover: hover) and (min-width: 861px)').matches;

    var setP = function (i) {
      pCur = i;
      panels.forEach(function (p, k) {
        p.classList.remove('is-on');
        p.setAttribute('aria-expanded', 'false');
      });
      void pWrap.offsetWidth; // restart the progress bar
      panels[i].classList.add('is-on');
      panels[i].setAttribute('aria-expanded', 'true');
    };

    var planP = function () {
      clearInterval(pTimer);
      var auto = !(reduce || pPicked || !pVis || pHover);
      pWrap.classList.toggle('is-auto', auto);
      if (!auto) return;
      setP(pCur);
      pTimer = setInterval(function () { setP((pCur + 1) % panels.length); }, PANEL_MS);
    };

    panels.forEach(function (p, k) {
      p.addEventListener('click', function () {
        pPicked = true;
        setP(k);
        planP();
      });
      if (canHover) {
        p.addEventListener('mouseenter', function () { if (k !== pCur) setP(k); });
      }
    });

    pWrap.addEventListener('mouseenter', function () { pHover = true; planP(); });
    pWrap.addEventListener('mouseleave', function () { pHover = false; planP(); });

    watch(pWrap, 0.35, function (v) { pVis = v; planP(); });
  }

  /* ---------- 4 · Scroll-drawn timeline ---------- */
  var tl = $('#mk-tl');
  if (tl) {
    var tSteps = $$('.mk-tl-step', tl);
    if (reduce || !root.classList.contains('mk-js')) {
      tl.style.setProperty('--fill', 1);
      tSteps.forEach(function (s) { s.classList.add('is-lit'); });
    } else {
      var ticking = false;
      var upd = function () {
        ticking = false;
        var vh = window.innerHeight, mark = vh * 0.6;
        var r = tl.getBoundingClientRect();
        var p = (mark - r.top) / r.height;
        p = Math.max(0, Math.min(1, p));
        tl.style.setProperty('--fill', p.toFixed(4));
        tSteps.forEach(function (s) {
          var nr = $('.mk-tl-node', s).getBoundingClientRect();
          s.classList.toggle('is-lit', nr.top + nr.height / 2 <= mark);
        });
      };
      var req = function () {
        if (!ticking) { ticking = true; requestAnimationFrame(upd); }
      };
      window.addEventListener('scroll', req, { passive: true });
      window.addEventListener('resize', req);
      upd();
    }
  }

  /* ---------- 5 · Brand checker: scan, flag, rewrite, score ---------- */
  var guard = $('#mk-guard');
  if (guard) {
    var fixes = $$('.mk-fix', guard);
    var checks = $$('.mk-chk li', guard);
    var post = $('.mk-post', guard);
    var tag = $('.mk-post-tag', guard);
    var scoreEl = $('#mk-score');
    var gTok = 0, gTimers = [], gVis = false;
    var gLater = function (fn, ms) { gTimers.push(setTimeout(fn, ms)); };
    var gClear = function () { gTimers.forEach(clearTimeout); gTimers = []; };

    var setScore = function (v) {
      scoreEl.textContent = Math.round(v);
      guard.style.setProperty('--sc', v.toFixed(1) + '%');
    };

    var tweenScore = function (from, to, dur, t) {
      var t0 = performance.now();
      var f = function (now) {
        if (t !== gTok) return;
        var p = Math.min(1, (now - t0) / dur);
        setScore(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    };

    var finalG = function () {
      post.classList.remove('is-scan');
      tag.textContent = 'Approved';
      fixes.forEach(function (f) { f.classList.remove('is-flag'); f.classList.add('is-fixed'); });
      checks.forEach(function (c) { c.classList.add('is-ok'); });
      setScore(98);
    };

    var runG = function () {
      gClear();
      gTok++;
      var t = gTok;
      if (reduce) { finalG(); return; }

      fixes.forEach(function (f) { f.classList.remove('is-flag', 'is-fixed'); });
      checks.forEach(function (c) { c.classList.remove('is-ok'); });
      setScore(62);
      tag.textContent = 'Checking';
      post.classList.remove('is-scan');
      void post.offsetWidth;
      post.classList.add('is-scan');

      var FLAG = 420, FIX = 620, CHK = 340;
      fixes.forEach(function (f, k) {
        gLater(function () { f.classList.add('is-flag'); }, 600 + k * FLAG);
      });
      var t1 = 600 + fixes.length * FLAG + 600;
      fixes.forEach(function (f, k) {
        gLater(function () { f.classList.remove('is-flag'); f.classList.add('is-fixed'); }, t1 + k * FIX);
      });
      var t2 = t1 + fixes.length * FIX;
      checks.forEach(function (c, k) {
        gLater(function () { c.classList.add('is-ok'); }, t2 + k * CHK);
      });
      gLater(function () { tweenScore(62, 98, 1300, t); }, t2);
      gLater(function () {
        post.classList.remove('is-scan');
        tag.textContent = 'Approved';
      }, t2 + checks.length * CHK);
      gLater(function () { if (gVis) runG(); }, t2 + checks.length * CHK + 4500);
    };

    watch(guard, 0.35, function (v) {
      var was = gVis;
      gVis = v;
      if (v && !was) runG();
      else if (!v) { gTok++; gClear(); finalG(); }
    });
  }

  /* ---------- 6 · Before / after bars ---------- */
  var res = $('#mk-res');
  if (res) {
    var sw = $('#mk-switch');
    var metrics = $$('.mk-metric', res);
    var mode = 1, resPicked = false, autoDone = false;

    var tweenNum = function (el, to, instant) {
      var from = el._v == null ? Number(el.textContent) || 0 : el._v;
      el._v = to;
      cancelAnimationFrame(el._raf);
      if (instant || reduce) { el.textContent = to; return; }
      var t0 = performance.now(), dur = 900;
      var f = function (now) {
        var p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) el._raf = requestAnimationFrame(f);
      };
      el._raf = requestAnimationFrame(f);
    };

    var apply = function (m, instant) {
      mode = m;
      res.setAttribute('data-mode', m ? 'after' : 'before');
      sw.setAttribute('aria-checked', m ? 'true' : 'false');
      sw.setAttribute('aria-label', m ? 'Show results without agents' : 'Show results with agents');
      metrics.forEach(function (box) {
        var bf = Number(box.dataset.before), af = Number(box.dataset.after);
        var v = m ? af : bf, mx = Math.max(bf, af);
        box.style.setProperty('--h', (v / mx * 100).toFixed(1) + '%');
        tweenNum($('.mk-val', box), v, instant);
      });
    };

    sw.addEventListener('click', function () {
      resPicked = true;
      apply(mode ? 0 : 1);
    });

    if (!reduce && hasIO) {
      apply(0, true); // start on "without", flip once it's seen
      watch(res, 0.45, function (v) {
        if (v && !autoDone && !resPicked) {
          autoDone = true;
          setTimeout(function () { if (!resPicked) apply(1); }, 900);
        }
      });
    } else {
      apply(1, true);
    }
  }
})();