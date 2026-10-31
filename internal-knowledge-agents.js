/* ==========================================================================
   Internal Knowledge Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and scroll-reveal are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Hero: looping "video" of three support scenes ---------- */
  var stage = $('#ik-stage');
  if (stage) {
    var scenes = $$('.ik-scene', stage);
    var segs = $$('.ik-seg', stage);
    var nameEl = $('#ik-scene-name');
    var timeEl = $('#ik-time');
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
  var root = document.documentElement;
  if (!reduce) root.classList.add('ik-js');

  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ---------- 2 · Scattered documents sort themselves into topics ---------- */
  var sb = $('#ik-sortbox');
  if (sb && !reduce && hasIO) {
    var sTimer = null, sT0 = null;
    sb.classList.add('ik-anim');
    watch(sb, 0.35, function (v) {
      clearInterval(sTimer); clearTimeout(sT0);
      if (v) {
        sb.classList.remove('is-sorted');
        sT0 = setTimeout(function () { sb.classList.add('is-sorted'); }, 1300);
        sTimer = setInterval(function () { sb.classList.toggle('is-sorted'); }, 5600);
      }
    });
  }

  /* ---------- 3 · Command palette: live filtering while a query is typed ---------- */
  var pal = $('#ik-pal');
  if (pal) {
    var rows = $$('.ik-pr', pal), pq = $('#ik-pq'), selBar = $('.ik-sel', pal);
    var ansBox = $('#ik-pans'), ansT = $('#ik-pans-t'), ansS = $('#ik-pans-s');
    var titles = rows.map(function (r) { return $('b', r).textContent; });
    var recent = [0, 2, 5, 8];
    var QUERIES = ['vpn', 'expense', 'brand'];
    var pTimers = [], pTok = 0, selIdx = -1;

    var pLater = function (fn, ms) { pTimers.push(setTimeout(fn, ms)); };
    var pClear = function () { pTimers.forEach(clearTimeout); pTimers = []; };

    var select = function (i) {
      rows.forEach(function (r, k) { r.classList.toggle('is-sel', k === i); });
      if (i == null || i < 0) return;
      if (i !== selIdx) {
        selIdx = i;
        ansT.textContent = rows[i].getAttribute('data-sn');
        ansS.textContent = 'Source: ' + $('small', rows[i]).textContent + ' - ' + titles[i];
        ansBox.classList.remove('is-swap'); void ansBox.offsetWidth; ansBox.classList.add('is-swap');
      }
      var place = function () { selBar.style.setProperty('--y', rows[i].offsetTop + 'px'); };
      if (reduce) place(); else pLater(place, 480);
    };

    var render = function (q) {
      var ql = q.toLowerCase(), first = -1;
      rows.forEach(function (r, i) {
        var t = titles[i], at = ql ? t.toLowerCase().indexOf(ql) : -1;
        var ok = ql ? at > -1 : recent.indexOf(i) > -1;
        r.classList.toggle('is-hide', !ok);
        var b = $('b', r);
        if (ok && ql) b.innerHTML = t.slice(0, at) + '<mark>' + t.slice(at, at + ql.length) + '</mark>' + t.slice(at + ql.length);
        else b.textContent = t;
        if (ok && first < 0) first = i;
      });
      select(first);
    };

    var runQuery = function (qi) {
      pTok++;
      var t = pTok, q = QUERIES[qi], k = 0;
      var back = function () {
        if (t !== pTok) return;
        k--;
        pq.textContent = q.slice(0, k);
        render(q.slice(0, k));
        if (k > 0) pLater(back, 80); else pLater(function () { runQuery((qi + 1) % QUERIES.length); }, 900);
      };
      var typeNext = function () {
        if (t !== pTok) return;
        k++;
        pq.textContent = q.slice(0, k);
        render(q.slice(0, k));
        if (k < q.length) pLater(typeNext, 300); else pLater(back, 3600);
      };
      pq.textContent = '';
      render('');
      pLater(typeNext, 700);
    };

    if (reduce || !hasIO) {
      pq.textContent = 'vpn';
      render('vpn');
    } else {
      watch(pal, 0.35, function (v) {
        pClear(); pTok++;
        if (v) runQuery(0);
      });
    }
  }

  /* ---------- 4 · Team panels: the active one grows, the others shrink ---------- */
  var pnRow = $('#ik-pn-row');
  if (pnRow) {
    var panels = $$('.ik-pn', pnRow), pnCur = 0, pnTimer = null, pnVis = false, pnPicked = false;
    var setPn = function (i) {
      pnCur = i;
      panels.forEach(function (p, k) {
        p.classList.toggle('is-on', k === i);
        $('.ik-pn-btn', p).setAttribute('aria-expanded', k === i ? 'true' : 'false');
      });
    };
    var planPn = function () {
      clearInterval(pnTimer);
      if (reduce || pnPicked || !pnVis) return;
      pnTimer = setInterval(function () { setPn((pnCur + 1) % panels.length); }, 5200);
    };
    panels.forEach(function (p, k) {
      p.addEventListener('click', function () { pnPicked = true; clearInterval(pnTimer); setPn(k); });
      $('.ik-pn-btn', p).addEventListener('focus', function () { pnPicked = true; clearInterval(pnTimer); setPn(k); });
    });
    watch(pnRow, 0.35, function (v) { pnVis = v; planPn(); });
  }

  /* ---------- 5 · Permissions: same question, different answers per role ---------- */
  var who = $('#ik-who');
  if (who) {
    var roleBtns = $$('.ik-roles button', who), answers = $$('.ik-wa', who);
    var wCur = 0, wTimer = null, wVis = false, wPicked = false;
    var setRole = function (i) {
      wCur = i;
      roleBtns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      answers.forEach(function (a, k) { a.classList.toggle('is-on', k === i); });
    };
    var planRole = function () {
      clearInterval(wTimer);
      if (reduce || wPicked || !wVis) return;
      wTimer = setInterval(function () { setRole((wCur + 1) % roleBtns.length); }, 6200);
    };
    roleBtns.forEach(function (b, k) { b.addEventListener('click', function () { wPicked = true; clearInterval(wTimer); setRole(k); }); });
    watch(who, 0.35, function (v) { wVis = v; planRole(); });
  }

  /* ---------- 6 · Freshness: cards flip from outdated to fresh, health score climbs ---------- */
  var flips = $('#ik-flips');
  if (flips) {
    var fcs = $$('.ik-fc', flips), hFill = $('#ik-hfill'), hNum = $('#ik-hnum');
    var fTimers = [];
    var fLater = function (fn, ms) { fTimers.push(setTimeout(fn, ms)); };
    var health = function (n) {
      var v = Math.round(58 + n * (38 / fcs.length));
      hNum.textContent = v + '%';
      hFill.style.width = v + '%';
    };
    var fReset = function () { fTimers.forEach(clearTimeout); fTimers = []; };
    var fLoop = function () {
      fReset();
      fcs.forEach(function (c) { c.classList.remove('is-fresh'); });
      health(0);
      fcs.forEach(function (c, i) {
        fLater(function () { c.classList.add('is-fresh'); health(i + 1); }, 1500 + i * 750);
      });
      var tDone = 1500 + fcs.length * 750 + 3600;
      fcs.forEach(function (c, i) {
        fLater(function () { c.classList.remove('is-fresh'); health(fcs.length - i - 1); }, tDone + i * 220);
      });
      fLater(fLoop, tDone + fcs.length * 220 + 1200);
    };
    if (reduce || !hasIO) {
      health(fcs.length);
    } else {
      flips.classList.add('ik-anim');
      watch(flips, 0.3, function (v) {
        if (v) fLoop();
        else { fReset(); fcs.forEach(function (c) { c.classList.add('is-fresh'); }); health(fcs.length); }
      });
    }
  }

  /* ---------- 7 · Insights: topics race and swap places ---------- */
  var race = $('#ik-race');
  if (race) {
    var TOPICS = [
      ['Time off and leave', 96, 5], ['VPN and MFA', 88, 6], ['Expense claims', 70, 4],
      ['Brand assets', 64, 7], ['Security training', 58, 6], ['Pricing and discounts', 52, 5]
    ];
    var ROW = 48, rowsEl = $('#ik-rrows'), totEl = $('#ik-rtot');
    var counts = TOPICS.map(function (t) { return t[1]; });
    var seed = 7, ticks = 0, rTimer = null;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    rowsEl.style.height = (TOPICS.length * ROW) + 'px';

    var rEls = TOPICS.map(function (t) {
      var el = document.createElement('div');
      el.className = 'ik-rr';
      el.innerHTML = '<span class="ik-rl">' + t[0] + '</span><span class="ik-rbar"><i></i></span><b></b>';
      rowsEl.appendChild(el);
      return el;
    });

    var drawRace = function () {
      var order = counts.map(function (c, i) { return i; }).sort(function (a, b) { return counts[b] - counts[a]; });
      var max = counts[order[0]], sum = 0;
      order.forEach(function (idx, rank) {
        var el = rEls[idx];
        el.style.transform = 'translateY(' + (rank * ROW) + 'px)';
        el.classList.toggle('is-top', rank === 0);
        $('.ik-rbar i', el).style.setProperty('--w', (counts[idx] / max * 100).toFixed(1) + '%');
        $('b', el).textContent = counts[idx];
      });
      counts.forEach(function (c) { sum += c; });
      totEl.textContent = sum.toLocaleString('en-US') + ' questions';
    };

    var raceStep = function () {
      ticks++;
      if (ticks % 26 === 0) { counts = TOPICS.map(function (t) { return t[1]; }); }
      else { counts = counts.map(function (c, i) { return c + Math.round(rnd() * TOPICS[i][2] * 2); }); }
      drawRace();
    };

    drawRace();
    if (!reduce && hasIO) {
      watch(race, 0.3, function (v) {
        clearInterval(rTimer);
        if (v) rTimer = setInterval(raceStep, 1000);
      });
    }
  }

  /* ---------- 8 · Staircase builds when it scrolls into view ---------- */
  var stair = $('#ik-stair');
  if (stair) {
    if (reduce || !hasIO) stair.classList.add('in');
    else {
      var stairIO = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { stair.classList.add('in'); stairIO.disconnect(); }
      }, { threshold: 0.3 });
      stairIO.observe(stair);
    }
  }
})();