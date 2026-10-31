/* ==========================================================================
   Workflow Automation Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and mobile menu are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var root = document.documentElement;
  if (!reduce) root.classList.add('wf-js');

  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ==========================================================================
     1 · Hero: looping "video" of three scenes (same behaviour as the other agent pages)
     ========================================================================== */
  var stage = $('#wf-stage');
  if (stage) {
    var scenes = $$('.wf-scene', stage);
    var segs = $$('.wf-seg', stage);
    var nameEl = $('#wf-scene-name');
    var timeEl = $('#wf-time');
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

  /* ---------- scroll reveal (left-to-right wipe) ---------- */
  var rvs = $$('.wf-rv');
  if (!reduce && hasIO) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('wf-seen'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('wf-seen'); });
  }

  /* ---------- 2 · Workflow canvas: nodes appear, edges draw, steps run ---------- */
  var lab = $('#wf-lab');
  var canvas = $('#wf-canvas');
  if (lab && canvas) {
    var logEl = $('#wf-log');
    var picks = $$('.wf-pick', lab);
    var SVGNS = 'http://www.w3.org/2000/svg';

    var ICON = function (id) {
      return '<svg class="ico"><use href="#' + id + '"/></svg>';
    };

    // edge = [from, to, onPath]; order = [[nodeId, log text], ...]
    var FLOWS = [
      {
        nodes: [
          { id: 't', x: 10, y: 50, ty: 'trigger', ic: 'i-inbox', t: 'Invoice email arrives', s: 'Trigger' },
          { id: 'e', x: 30, y: 50, ty: 'action', ic: 'i-file', t: 'Read the PDF', s: '12 fields' },
          { id: 'l', x: 50, y: 50, ty: 'logic', ic: 'i-split', t: 'Over $4,000?', s: 'Check rule' },
          { id: 'a', x: 71, y: 22, ty: 'action', ic: 'i-chat', t: 'Ask Dana in Slack', s: 'Approval' },
          { id: 'u', x: 71, y: 78, ty: 'action', ic: 'i-check', t: 'Auto-approve', s: 'If under $4,000' },
          { id: 'p', x: 90, y: 50, ty: 'action', ic: 'i-coin', t: 'Post to QuickBooks', s: 'Bill created' }
        ],
        edges: [['t', 'e', 1], ['e', 'l', 1], ['l', 'a', 1], ['l', 'u', 0], ['a', 'p', 1], ['u', 'p', 0]],
        order: [
          ['t', 'Invoice received from Acme Supplies'],
          ['e', 'Read 12 fields from the PDF'],
          ['l', 'Matched PO-1187. Amount is $4,820, so approval is needed'],
          ['a', 'Dana K. approved in Slack'],
          ['p', 'Bill #7714 posted to QuickBooks']
        ]
      },
      {
        nodes: [
          { id: 't', x: 10, y: 50, ty: 'trigger', ic: 'i-inbox', t: 'Form submitted', s: 'Trigger' },
          { id: 'e', x: 30, y: 50, ty: 'action', ic: 'i-db', t: 'Enrich the company', s: 'Size, industry' },
          { id: 'l', x: 50, y: 50, ty: 'logic', ic: 'i-split', t: 'Which region?', s: 'Check rule' },
          { id: 'a', x: 71, y: 22, ty: 'action', ic: 'i-users', t: 'Assign to US rep', s: 'Round robin' },
          { id: 'u', x: 71, y: 78, ty: 'action', ic: 'i-users', t: 'Assign to EU rep', s: 'If in Europe' },
          { id: 'p', x: 90, y: 50, ty: 'action', ic: 'i-funnel', t: 'Create deal in CRM', s: 'With notes' }
        ],
        edges: [['t', 'e', 1], ['e', 'l', 1], ['l', 'a', 1], ['l', 'u', 0], ['a', 'p', 1], ['u', 'p', 0]],
        order: [
          ['t', 'New lead: Northwind Dental, 12 seats'],
          ['e', 'Found company size and industry'],
          ['l', 'Region is United States'],
          ['a', 'Assigned to Daniel R. and notified in Slack'],
          ['p', 'Deal created in the CRM with a full lead brief']
        ]
      },
      {
        nodes: [
          { id: 't', x: 10, y: 50, ty: 'trigger', ic: 'i-file', t: 'Offer letter signed', s: 'Trigger' },
          { id: 'a', x: 38, y: 18, ty: 'action', ic: 'i-lock', t: 'Create accounts', s: 'Email, Slack, CRM' },
          { id: 'b', x: 38, y: 50, ty: 'action', ic: 'i-desk', t: 'Order a laptop', s: 'IT request' },
          { id: 'c', x: 38, y: 82, ty: 'action', ic: 'i-mail', t: 'Send welcome email', s: 'First-day plan' },
          { id: 'j', x: 68, y: 50, ty: 'action', ic: 'i-bell', t: 'Notify the manager', s: 'Slack message' },
          { id: 'f', x: 90, y: 50, ty: 'action', ic: 'i-db', t: 'Update HR record', s: 'Status: ready' }
        ],
        edges: [['t', 'a', 1], ['t', 'b', 1], ['t', 'c', 1], ['a', 'j', 1], ['b', 'j', 1], ['c', 'j', 1], ['j', 'f', 1]],
        order: [
          ['t', 'Offer signed by Sam T.'],
          ['a', 'Created 6 accounts'],
          ['b', 'Laptop ordered for day one'],
          ['c', 'Welcome email sent with the first-day plan'],
          ['j', 'Manager notified in Slack'],
          ['f', 'HR record updated to ready']
        ]
      }
    ];

    var nodeEls = {}, edgeEls = [], svg = null;
    var curFlow = 0, token = 0, timers = [], labPicked = false, labVis = false;

    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var clearAll = function () { timers.forEach(clearTimeout); timers = []; };

    var drawEdges = function () {
      if (!svg) return;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var f = FLOWS[curFlow];
      edgeEls.forEach(function (ed, k) {
        var a = f.nodes.filter(function (n) { return n.id === f.edges[k][0]; })[0];
        var b = f.nodes.filter(function (n) { return n.id === f.edges[k][1]; })[0];
        var x1 = a.x / 100 * w, y1 = a.y / 100 * h, x2 = b.x / 100 * w, y2 = b.y / 100 * h;
        var mx = (x1 + x2) / 2;
        var d = 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
        ed.base.setAttribute('d', d);
        ed.go.setAttribute('d', d);
      });
    };

    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    var addLog = function (n, text) {
      var li = document.createElement('li');
      li.innerHTML = '<time>00:' + pad(n) + '</time><span>' + text + '</span><b>OK</b>';
      logEl.appendChild(li);
    };

    var build = function (i) {
      curFlow = i;
      var f = FLOWS[i];
      canvas.innerHTML = '';
      logEl.innerHTML = '';
      nodeEls = {};
      edgeEls = [];

      svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'wf-edges');
      svg.setAttribute('aria-hidden', 'true');
      canvas.appendChild(svg);

      f.edges.forEach(function () {
        var base = document.createElementNS(SVGNS, 'path');
        base.setAttribute('class', 'wf-edge');
        base.setAttribute('pathLength', '1');
        var go = document.createElementNS(SVGNS, 'path');
        go.setAttribute('class', 'wf-edge-go');
        go.setAttribute('pathLength', '1');
        svg.appendChild(base);
        svg.appendChild(go);
        edgeEls.push({ base: base, go: go });
      });

      f.nodes.forEach(function (n) {
        var el = document.createElement('div');
        el.className = 'wf-node wf-node--' + n.ty;
        el.style.left = n.x + '%';
        el.style.top = n.y + '%';
        el.innerHTML = '<span class="wf-n-ico">' + ICON(n.ic) + '</span>' +
          '<span class="wf-n-txt"><b>' + n.t + '</b><small>' + n.s + '</small></span>' +
          '<i class="wf-n-st">' + ICON('i-check') + '</i>';
        canvas.appendChild(el);
        nodeEls[n.id] = el;
      });

      drawEdges();

      picks.forEach(function (b, k) {
        b.classList.toggle('is-on', k === i);
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
    };

    var markSkipped = function (f) {
      var used = {};
      f.order.forEach(function (o) { used[o[0]] = true; });
      f.nodes.forEach(function (n) {
        if (!used[n.id]) nodeEls[n.id].classList.add('is-skip');
      });
    };

    var showFinal = function (i) {
      build(i);
      var f = FLOWS[i];
      markSkipped(f);
      f.order.forEach(function (o, k) {
        nodeEls[o[0]].classList.add('is-done');
        addLog(k * 2 + 1, o[1]);
      });
      f.edges.forEach(function (e, k) { if (e[2]) edgeEls[k].go.classList.add('is-go'); });
    };

    var play = function (i) {
      clearAll();
      token++;
      var t = token;
      if (reduce) { showFinal(i); return; }

      build(i);
      var f = FLOWS[i];

      // hide everything, then build up
      f.nodes.forEach(function (n) { nodeEls[n.id].classList.add('pre'); });
      edgeEls.forEach(function (ed) { ed.base.classList.add('pre'); });

      f.nodes.forEach(function (n, k) {
        later(function () { nodeEls[n.id].classList.remove('pre'); }, 150 + k * 130);
      });
      var t1 = 150 + f.nodes.length * 130;
      edgeEls.forEach(function (ed, k) {
        later(function () { ed.base.classList.remove('pre'); }, t1 + k * 90);
      });
      var t2 = t1 + edgeEls.length * 90 + 500;
      later(function () { markSkipped(f); }, t2);

      // execute step by step
      var STEP = 1150, prev = null;
      f.order.forEach(function (o, k) {
        later(function () {
          if (t !== token) return;
          if (prev) { prev.classList.remove('is-run'); prev.classList.add('is-done'); }
          var el = nodeEls[o[0]];
          el.classList.add('is-run');
          prev = el;
          f.edges.forEach(function (e, ei) {
            if (e[1] === o[0] && e[2]) edgeEls[ei].go.classList.add('is-go');
          });
          addLog(k * 2 + 1, o[1]);
        }, t2 + 400 + k * STEP);
      });

      var tEnd = t2 + 400 + f.order.length * STEP;
      later(function () {
        if (t !== token) return;
        if (prev) { prev.classList.remove('is-run'); prev.classList.add('is-done'); }
        if (!labPicked) {
          later(function () { play((curFlow + 1) % FLOWS.length); }, 3200);
        }
      }, tEnd);
    };

    picks.forEach(function (b, k) {
      b.addEventListener('click', function () {
        labPicked = true;
        play(k);
      });
    });

    var rsz = null;
    window.addEventListener('resize', function () {
      clearTimeout(rsz);
      rsz = setTimeout(drawEdges, 120);
    });

    if (reduce || !hasIO) {
      showFinal(0);
    } else {
      watch(lab, 0.25, function (v) {
        var was = labVis;
        labVis = v;
        if (v && !was) play(curFlow);
        else if (!v) { token++; clearAll(); }
      });
    }
  }

  /* ---------- 3 · Card deck: top card swipes off and goes to the back ---------- */
  var deck = $('#wf-deck');
  if (deck) {
    var cards = $$('.wf-card', deck);
    var dots2 = $$('#wf-dots2 i');
    var order = cards.map(function (c, k) { return k; }); // order[0] is the front card
    var dTimer = null, deckVis = false, busy = false, deckPicked = false;

    var layout = function () {
      order.forEach(function (ci, pos) {
        cards[ci].style.setProperty('--p', pos);
        cards[ci].setAttribute('data-p', pos);
      });
      dots2.forEach(function (d, k) { d.classList.toggle('is-on', k === order[0]); });
    };

    var next = function () {
      if (busy) return;
      busy = true;
      var front = cards[order[0]];
      front.classList.add('is-out');
      setTimeout(function () {
        order.push(order.shift());
        layout();
        front.classList.remove('is-out');
        busy = false;
      }, reduce ? 0 : 460);
    };

    var prev = function () {
      if (busy) return;
      order.unshift(order.pop());
      layout();
    };

    var planDeck = function () {
      clearInterval(dTimer);
      if (reduce || deckPicked || !deckVis) return;
      dTimer = setInterval(next, 3800);
    };

    $('#wf-next').addEventListener('click', function () { deckPicked = true; clearInterval(dTimer); next(); });
    $('#wf-prev').addEventListener('click', function () { deckPicked = true; clearInterval(dTimer); prev(); });
    deck.addEventListener('mouseenter', function () { clearInterval(dTimer); });
    deck.addEventListener('mouseleave', planDeck);

    layout();
    watch(deck, 0.3, function (v) { deckVis = v; planDeck(); });
  }

  /* ---------- 4 · Progress dial ---------- */
  var dial = $('#wf-dial');
  if (dial) {
    var stepBtns = $$('.wf-step', dial);
    var panes = $$('.wf-ring-c > div', dial);
    var rdots = $$('.wf-rdot', dial);
    var prog = $('#wf-prog');
    var C = 2 * Math.PI * 84;
    var curStep = 0, dialTimer = null, dialVis = false, dialPicked = false;

    var setStep = function (i) {
      curStep = i;
      stepBtns.forEach(function (b, k) {
        b.classList.toggle('is-on', k === i);
        b.setAttribute('aria-expanded', k === i ? 'true' : 'false');
      });
      panes.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      rdots.forEach(function (d, k) {
        d.setAttribute('class', 'wf-rdot' + (k <= i ? ' is-on' : ''));
      });
      prog.style.strokeDashoffset = (C * (1 - (i + 1) / 4)).toFixed(1);
    };

    var planDial = function () {
      clearInterval(dialTimer);
      if (reduce || dialPicked || !dialVis) return;
      dialTimer = setInterval(function () { setStep((curStep + 1) % stepBtns.length); }, 4800);
    };

    stepBtns.forEach(function (b, k) {
      b.addEventListener('click', function () {
        dialPicked = true;
        clearInterval(dialTimer);
        setStep(k);
      });
    });

    setStep(0);
    watch(dial, 0.3, function (v) { dialVis = v; planDial(); });
  }

  /* ---------- 5 · Autonomy dial: same request at three levels ---------- */
  var auto = $('#wf-auto');
  if (auto) {
    var ctl = $('.wf-seg-ctl', auto);
    var abtns = $$('button', ctl);
    var curA = 0, aTimer = null, aVis = false, aPicked = false;

    var setA = function (i) {
      curA = i;
      auto.setAttribute('data-s', i);
      ctl.style.setProperty('--i', i);
      abtns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); });
    };

    var planA = function () {
      clearInterval(aTimer);
      if (reduce || aPicked || !aVis) return;
      aTimer = setInterval(function () { setA((curA + 1) % abtns.length); }, 4400);
    };

    abtns.forEach(function (b, k) {
      b.addEventListener('click', function () {
        aPicked = true;
        clearInterval(aTimer);
        setA(k);
      });
    });

    setA(0);
    watch(auto, 0.35, function (v) { aVis = v; planA(); });
  }

  /* ---------- 7 · Time-saved calculator ---------- */
  var calc = $('#wf-calc');
  if (calc) {
    var tasks = $('#wf-tasks'), mins = $('#wf-mins'), share = $('#wf-share');
    var tasksV = $('#wf-tasks-v'), minsV = $('#wf-mins-v'), shareV = $('#wf-share-v');
    var hoursEl = $('#wf-hours'), daysEl = $('#wf-days'), gauge = $('#wf-gauge');
    var GC = 2 * Math.PI * 82;
    var shownH = 0, shownD = 0, rafH = null;

    var tween = function (toH, toD) {
      cancelAnimationFrame(rafH);
      var fromH = shownH, fromD = shownD, t0 = performance.now(), dur = reduce ? 0 : 500;
      var f = function (t) {
        var p = dur ? Math.min(1, (t - t0) / dur) : 1;
        var e = 1 - Math.pow(1 - p, 3);
        shownH = fromH + (toH - fromH) * e;
        shownD = fromD + (toD - fromD) * e;
        hoursEl.textContent = Math.round(shownH).toLocaleString();
        daysEl.textContent = Math.round(shownD).toLocaleString();
        if (p < 1) rafH = requestAnimationFrame(f);
      };
      rafH = requestAnimationFrame(f);
    };

    var update = function () {
      var tk = Number(tasks.value), mn = Number(mins.value), sh = Number(share.value);
      tasksV.textContent = tk.toLocaleString();
      minsV.textContent = mn + ' min';
      shareV.textContent = sh + '%';
      var hours = (tk * 52 / 12) * (mn / 60) * (sh / 100);
      var days = hours * 12 / 8;
      gauge.style.strokeDashoffset = (GC * (1 - sh / 100)).toFixed(1);
      tween(hours, days);
    };

    [tasks, mins, share].forEach(function (inp) { inp.addEventListener('input', update); });
    update();
  }
})();
const items = document.querySelectorAll('.wf-rv');
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('wf-js'); // add ONLY if the observer works
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('wf-seen'); io.unobserve(e.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => io.observe(el));
  // safety net: reveal everything after 2.5s regardless
  setTimeout(() => items.forEach(el => el.classList.add('wf-seen')), 2500);
}