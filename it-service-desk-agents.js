/* ==========================================================================
   IT Service Desk Agents page (vanilla JS). Load AFTER js/script.js
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
  if (!reduce) root.classList.add('sd-js');

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ---------- Hero: looping "video" of three IT desk scenes ---------- */
  var stage = $('#sd-stage');
  if (stage) {
    var scenes = $$('.sd-scene', stage);
    var segs = $$('.sd-seg', stage);
    var nameEl = $('#sd-scene-name');
    var timeEl = $('#sd-time');
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

  /* ---------- 2 · Hub: pulses travel from the agent out to each system ---------- */
  var hub = $('#sd-hubsvg');
  if (hub && animate) {
    var NS = 'http://www.w3.org/2000/svg';
    var spokes = $$('.sd-spoke', hub), nodes = $$('.sd-node', hub), capEl = $('#sd-cap-t');
    var CAPS = [
      'Verified who is asking and reset their password',
      'Created the mailbox and added the calendar',
      'Added them to the right channels',
      'Logged the ticket and closed it with notes',
      'Pushed the software install to their laptop',
      'Granted the cloud apps their role needs'
    ];
    var hi = 0, hTimer = null;

    var pulse = function (k) {
      var path = spokes[k], len = path.getTotalLength();
      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', 7);
      dot.setAttribute('class', 'sd-pulse');
      hub.appendChild(dot);
      path.classList.add('is-on');
      var t0 = performance.now(), dur = 900;
      var f = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        var pt = path.getPointAtLength(len * e);
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
        if (p < 1) { requestAnimationFrame(f); return; }
        dot.parentNode && dot.parentNode.removeChild(dot);
        nodes[k].classList.add('is-hit');
        capEl.textContent = CAPS[k];
        setTimeout(function () {
          nodes[k].classList.remove('is-hit');
          path.classList.remove('is-on');
        }, 1300);
      };
      requestAnimationFrame(f);
    };

    watch(hub, 0.35, function (v) {
      clearInterval(hTimer);
      if (v) {
        pulse(hi % nodes.length); hi++;
        hTimer = setInterval(function () { pulse(hi % nodes.length); hi++; }, 1800);
      }
    });
  }

  /* ---------- 3 · SLA gauge: needle sweeps up as tickets get resolved ---------- */
  var slabox = $('#sd-slabox');
  if (slabox && animate) {
    var rows = $$('.sd-tk', slabox), gfg = $('#sd-gfg'), needle = $('#sd-needle'), gpct = $('#sd-gpct');
    var START = [26, 48, 66, 80];
    var DUE = ['Due in 12 min', 'Due in 1 h 05 min', 'Due in 3 h', 'Due in 5 h'];
    var DONE = ['Resolved by agent in 4 min', 'Resolved by agent in 11 min', 'Resolved by agent in 2 min', 'Resolved by agent in 6 min'];
    var CLS = ['is-urgent', 'is-warn', 'is-ok', 'is-ok'];
    var PCT = [71, 80, 88, 94, 98];
    var sTimers = [];
    var sLater = function (fn, ms) { sTimers.push(setTimeout(fn, ms)); };
    var sClear = function () { sTimers.forEach(clearTimeout); sTimers = []; };

    var setGauge = function (p) {
      gfg.style.strokeDashoffset = String(1 - p / 100);
      gfg.classList.toggle('is-low', p < 85);
      needle.style.transform = 'rotate(' + (-90 + p * 1.8) + 'deg)';
      gpct.textContent = p + '%';
    };

    var setRow = function (k, done) {
      var li = rows[k], bar = $('.sd-bar i', li), small = $('small', li);
      li.classList.remove('is-done', 'is-urgent', 'is-warn', 'is-ok');
      if (done) {
        li.classList.add('is-done');
        bar.style.setProperty('--w', '100%');
        small.textContent = DONE[k];
      } else {
        li.classList.add(CLS[k]);
        bar.style.setProperty('--w', START[k] + '%');
        small.textContent = DUE[k];
      }
    };

    var slaLoop = function () {
      sClear();
      rows.forEach(function (_, k) { setRow(k, false); });
      setGauge(PCT[0]);
      rows.forEach(function (_, k) {
        sLater(function () {
          rows.forEach(function (r, j) {
            if (j > k) $('.sd-bar i', r).style.setProperty('--w', Math.max(8, START[j] - (k + 1) * 6) + '%');
          });
          setRow(k, true);
          setGauge(PCT[k + 1]);
        }, 2000 + k * 1900);
      });
      sLater(slaLoop, 2000 + rows.length * 1900 + 4500);
    };

    watch(slabox, 0.35, function (v) {
      sClear();
      if (v) slaLoop();
      else { rows.forEach(function (_, k) { setRow(k, true); }); setGauge(98); }
    });
  }

  /* ---------- 4 · Before / after slider: sweeps on its own until you drag it ---------- */
  var cmpbox = $('#sd-cmpbox'), range = $('#sd-range');
  if (cmpbox && range) {
    var setX = function (v) { cmpbox.style.setProperty('--x', v + '%'); };
    var cPicked = false, cVis = false, cT0 = 0, cRun = false;
    range.addEventListener('input', function () { cPicked = true; setX(range.value); });

    var sweep = function (t) {
      if (!cVis || cPicked) { cRun = false; return; }
      var v = 50 + 38 * Math.sin((t - cT0) / 1700);
      range.value = v;
      setX(v);
      requestAnimationFrame(sweep);
    };

    setX(range.value);
    if (animate) {
      watch(cmpbox, 0.3, function (v) {
        cVis = v;
        if (v && !cPicked && !cRun) { cRun = true; cT0 = performance.now(); requestAnimationFrame(sweep); }
      });
    }
  }

  /* ---------- 5 · Card fan: cards spread out like a hand when scrolled into view ---------- */
  var fan = $('#sd-fan');
  if (fan) {
    if (animate) {
      var fTimer = null;
      watch(fan, 0.4, function (v) {
        clearTimeout(fTimer);
        if (v) fTimer = setTimeout(function () { fan.classList.add('is-open'); }, 350);
        else fan.classList.remove('is-open');
      });
    } else {
      fan.classList.add('is-open');
    }
  }

  /* ---------- 6 · Guardrails: switches flip on, then a live feed follows the rules ---------- */
  var gcard = $('#sd-gcard');
  if (gcard) {
    var sws = $$('.sd-sw', gcard), feed = $('#sd-feed');
    var EVENTS = [
      ['Admin access held for manager approval'],
      ['Identity verified before password reset'],
      ['Production change deferred until 9:00 AM'],
      ['Action saved to audit log #A-'],
      ['Handed to Level 2 after 2 failed attempts']
    ];
    var secs = 9 * 3600 + 41 * 60 + 7, evI = 0, gTimer = null, gTimers = [], seq = 20418;

    var isOn = function (i) { return sws[i].getAttribute('aria-checked') === 'true'; };
    var setSw = function (i, on) { sws[i].setAttribute('aria-checked', on ? 'true' : 'false'); };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var clockStr = function (s) { return pad(Math.floor(s / 3600) % 24) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); };

    var addEvent = function () {
      var tries = 0, r;
      do { r = evI % EVENTS.length; evI++; tries++; } while (!isOn(r) && tries <= EVENTS.length);
      if (!isOn(r)) return;
      secs += 2 + Math.floor(Math.random() * 4);
      var text = EVENTS[r][0];
      if (r === 3) { seq += 1; text += seq; }
      var li = document.createElement('li');
      li.className = 'is-new';
      li.innerHTML = '<span class="t">' + clockStr(secs) + '</span>';
      li.appendChild(document.createTextNode(text));
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > 6) feed.removeChild(feed.lastChild);
    };

    sws.forEach(function (b, i) {
      b.addEventListener('click', function () { setSw(i, !isOn(i)); });
    });

    if (animate) {
      var gStarted = false;
      watch(gcard, 0.35, function (v) {
        clearInterval(gTimer);
        gTimers.forEach(clearTimeout); gTimers = [];
        if (!v) return;
        if (!gStarted) {
          gStarted = true;
          sws.forEach(function (_, i) { setSw(i, false); });
          sws.forEach(function (_, i) {
            gTimers.push(setTimeout(function () { setSw(i, true); }, 500 + i * 450));
          });
          gTimers.push(setTimeout(function () { gTimer = setInterval(addEvent, 1800); }, 500 + sws.length * 450));
        } else {
          gTimer = setInterval(addEvent, 1800);
        }
      });
    }
  }

  /* ---------- 7 · Donut: segments draw in, legend steps through each slice ---------- */
  var donut = $('#sd-donut');
  if (donut) {
    var segsC = $$('.sd-seg-c', donut), btns = $$('#sd-legend button'), dnum = $('#sd-dnum'), dlab = $('#sd-dlab');
    var VALS = ['62%', '23%', '15%'];
    var LABS = ['Resolved by the agent', 'Approved by a person', 'Escalated to your team'];
    var dCur = 0, dTimer = null, dVis = false, dPicked = false;

    var setSeg = function (k) {
      dCur = k;
      segsC.forEach(function (s, i) { s.classList.toggle('is-active', i === k); });
      btns.forEach(function (b, i) { b.classList.toggle('is-on', i === k); });
      dnum.textContent = VALS[k];
      dlab.textContent = LABS[k];
    };

    var planD = function () {
      clearInterval(dTimer);
      if (reduce || dPicked || !dVis) return;
      dTimer = setInterval(function () { setSeg((dCur + 1) % 3); }, 3200);
    };

    btns.forEach(function (b, k) {
      b.addEventListener('click', function () { dPicked = true; clearInterval(dTimer); setSeg(k); });
    });

    if (animate) {
      watch(donut, 0.35, function (v) {
        dVis = v;
        if (v) donut.classList.add('is-in');
        planD();
      });
    } else {
      donut.classList.add('is-in');
    }
  }

  /* ---------- 8 · Stacking cards: earlier cards shrink as new ones slide over them ---------- */
  var stack = $('#sd-stack');
  if (stack && !reduce) {
    var cards = $$('.sd-card', stack), busy = false;
    var update8 = function () {
      busy = false;
      var base = window.innerWidth <= 600 ? 80 : 96, step = window.innerWidth <= 600 ? 14 : 20;
      var reached = cards.map(function (c, j) {
        var r = c.getBoundingClientRect();
        var stuck = base + j * step;
        return clamp(1 - (r.top - stuck) / Math.max(120, r.height * 0.9), 0, 1);
      });
      cards.forEach(function (c, k) {
        var sum = 0;
        for (var j = k + 1; j < cards.length; j++) sum += reached[j];
        c.style.setProperty('--s', (1 - 0.035 * sum).toFixed(4));
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