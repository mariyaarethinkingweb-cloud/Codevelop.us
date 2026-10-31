/* ==========================================================================
   Customer Support Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and scroll-reveal are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Hero: looping "video" of three support scenes ---------- */
  var stage = $('#cs-stage');
  if (stage) {
    var scenes = $$('.cs-scene', stage);
    var segs = $$('.cs-seg', stage);
    var nameEl = $('#cs-scene-name');
    var timeEl = $('#cs-time');
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

  /* ---------- Channels: tabs (auto-rotate until the visitor picks one) ---------- */
  var tabsWrap = $('#cs-ch-tabs');
  if (tabsWrap) {
    var tabs = $$('.cs-ch-tab', tabsWrap);
    var panels = $$('.cs-ch-panel');
    var cur = 0, chPicked = false, chVisible = false, chTimer = null;

    var setTab = function (i) {
      cur = i;
      tabs.forEach(function (t, k) {
        t.classList.toggle('is-on', k === i);
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
      });
      panels.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      // restart the progress underline
      tabsWrap.classList.remove('is-auto');
      void tabsWrap.offsetWidth;
      tabsWrap.classList.toggle('is-auto', !chPicked && !reduce);
      chPlan();
    };

    var chPlan = function () {
      clearTimeout(chTimer);
      if (chPicked || reduce || !chVisible) return;
      chTimer = setTimeout(function () { setTab((cur + 1) % tabs.length); }, 8000);
    };

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { chPicked = true; setTab(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); chPicked = true; setTab(n); tabs[n].focus(); }
      });
    });
    tabs.forEach(function (t, k) { t.tabIndex = k === 0 ? 0 : -1; });

    if (hasIO) {
      new IntersectionObserver(function (es) {
        chVisible = es[0].isIntersecting;
        if (chVisible) { tabsWrap.classList.toggle('is-auto', !chPicked && !reduce); chPlan(); }
        else clearTimeout(chTimer);
      }, { threshold: 0.35 }).observe(tabsWrap.parentNode);
    }
  }

  /* ---------- Integrations: duplicate each row for a seamless loop ---------- */
  $$('.cs-mq-track').forEach(function (track) {
    if (reduce) { track.style.animation = 'none'; track.parentNode.style.overflowX = 'auto'; return; }
    $$('.cs-chip', track).forEach(function (chip) {
      var c = chip.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
  });
})();