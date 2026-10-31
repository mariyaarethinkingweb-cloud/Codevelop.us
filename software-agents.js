/* ==========================================================================
   Software Development Agents page (vanilla JS). Load AFTER js/script.js
   - header, FAQ and mobile menu are already handled by script.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var root = document.documentElement;
  if (!reduce) root.classList.add('sd-js');

  var watch = function (el, th, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: th }).observe(el);
  };

  /* ==========================================================================
     1 · Hero: looping "video" of three scenes (same behaviour as the sales page)
     ========================================================================== */
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

  /* ---------- scroll reveal (blur-in) ---------- */
  var rvs = $$('.sd-rv');
  if (!reduce && hasIO) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('sd-seen'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('sd-seen'); });
  }

  /* ---------- 2 · Code studio: typewriter that writes real-looking diffs ---------- */
  var studio = $('#sd-studio');
  if (studio) {
    var tabs = $$('.sd-tab', studio);
    var codeEl = $('#sd-code');
    var fileEl = $('#sd-file');
    var statusEl = $('#sd-status');
    var pbar = $('#sd-pbar');

    var TASKS = [
      {
        f: 'booking/checkout.ts',
        s: 'Branch ready \u00b7 1 file \u00b7 11 lines added',
        l: [
          '+ // Ticket #482: add Stripe checkout',
          '+ import { stripe } from "../lib/stripe";',
          '+ ',
          '+ export async function createCheckout(booking) {',
          '+   const session = await stripe.checkout.sessions.create({',
          '+     amount: booking.total,',
          '+     currency: "usd",',
          '+     metadata: { bookingId: booking.id },',
          '+   });',
          '+   return session.url;',
          '+ }'
        ]
      },
      {
        f: 'pull/482 \u00b7 review',
        s: '2 issues found \u00b7 fix suggested',
        l: [
          '  const total = items.reduce((s, i) => s + i.price, 0);',
          '- if (total > 0) charge(total);',
          '+ if (total <= 0) throw new Error("Empty cart");',
          '+ await charge(total);',
          '  ',
          '+ // Review: charge() was not awaited, so errors',
          '+ // were silently lost. Added a guard for empty carts.'
        ]
      },
      {
        f: 'booking/checkout.test.ts',
        s: '3 tests added \u00b7 coverage 41% to 82%',
        l: [
          '+ describe("createCheckout", () => {',
          '+   it("returns a payment url", async () => {',
          '+     const url = await createCheckout(booking);',
          '+     expect(url).toContain("checkout.stripe.com");',
          '+   });',
          '+   it("rejects an empty cart", async () => {',
          '+     await expect(createCheckout(empty)).rejects.toThrow();',
          '+   });',
          '+ });'
        ]
      },
      {
        f: 'slots.py',
        s: 'Bug fixed \u00b7 regression test added',
        l: [
          '- def free_slots(day): return all_slots[day]',
          '+ def free_slots(day):',
          '+     booked = {b.slot for b in bookings(day)}',
          '+     return [s for s in all_slots[day] if s not in booked]',
          '  ',
          '+ # Bug: evening slots were double booked.',
          '+ # Cause: booked slots were never filtered out.'
        ]
      },
      {
        f: 'docs/checkout.md',
        s: 'Docs updated to match the code',
        l: [
          '+ // createCheckout(booking)',
          '+ // Returns a Stripe payment URL for a booking.',
          '+ // ',
          '+ // Needs STRIPE_KEY set in your environment.',
          '+ // Throws an error when the cart is empty.',
          '+ // ',
          '+ // Example: const url = await createCheckout(b);'
        ]
      },
      {
        f: '.github/workflows/deploy.yml',
        s: 'Pipeline ready \u00b7 deploys to staging',
        l: [
          '+ name: deploy-staging',
          '+ on: pull_request_review',
          '+ jobs:',
          '+   release:',
          '+     steps:',
          '+       - run: npm test',
          '+       - run: npm run build',
          '+       - run: ./deploy.sh staging'
        ]
      }
    ];

    var esc = function (s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    var RE = /(\/\/.*$|#.*$)|("[^"]*"|'[^']*'|`[^`]*`)|\b(const|let|function|return|async|await|if|else|import|from|export|def|throw|new|describe|it|expect)\b|\b(\d+)\b/g;
    var hl = function (s) {
      var out = '', last = 0, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(s))) {
        out += esc(s.slice(last, m.index));
        var c = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'n';
        out += '<span class="t-' + c + '">' + esc(m[0]) + '</span>';
        last = RE.lastIndex;
      }
      return out + esc(s.slice(last));
    };

    var cur = 0, token = 0, timer = null, userPicked = false, studioVis = false;

    var lineEl = function (raw, n) {
      var sign = raw.charAt(0);
      var d = document.createElement('div');
      d.className = 'sd-ln' + (sign === '+' ? ' sd-ln--add' : sign === '-' ? ' sd-ln--del' : '');
      d.innerHTML = '<span class="no">' + n + '</span><span class="sg">' + (sign === ' ' ? '' : sign) + '</span><span class="tx"></span>';
      return d;
    };

    var finish = function (t, task) {
      if (t !== token) return;
      statusEl.textContent = task.s;
      pbar.style.width = '100%';
      var caret = $('.sd-caret', codeEl);
      if (caret) caret.remove();
      if (!userPicked && !reduce) {
        timer = setTimeout(function () { play((cur + 1) % TASKS.length); }, 3400);
      }
    };

    var play = function (i) {
      clearTimeout(timer);
      token++;
      var t = token;
      cur = i;
      var task = TASKS[i];
      tabs.forEach(function (b, k) {
        b.classList.toggle('is-on', k === i);
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      fileEl.textContent = task.f;
      codeEl.innerHTML = '';
      pbar.style.width = '0%';
      statusEl.textContent = 'Agent working\u2026';

      var total = 0;
      task.l.forEach(function (l) { total += l.length - 2; });

      if (reduce) {
        task.l.forEach(function (raw, n) {
          var el = lineEl(raw, n + 1);
          $('.tx', el).innerHTML = hl(raw.slice(2));
          codeEl.appendChild(el);
        });
        finish(t, task);
        return;
      }

      var li = 0, ci = 0, typed = 0, el = null, tx = null;
      var caret = document.createElement('span');
      caret.className = 'sd-caret';

      var step = function () {
        if (t !== token) return;
        if (li >= task.l.length) { finish(t, task); return; }
        var raw = task.l[li];
        var text = raw.slice(2);
        if (!el) {
          el = lineEl(raw, li + 1);
          tx = $('.tx', el);
          codeEl.appendChild(el);
        }
        ci++;
        typed++;
        tx.innerHTML = hl(text.slice(0, ci));
        tx.appendChild(caret);
        pbar.style.width = Math.min(100, Math.round(typed / total * 100)) + '%';
        if (ci >= text.length) {
          li++; ci = 0; el = null;
          timer = setTimeout(step, 150);
        } else {
          timer = setTimeout(step, 16 + Math.random() * 16);
        }
      };
      step();
    };

    tabs.forEach(function (b, k) {
      b.addEventListener('click', function () {
        userPicked = true;
        play(k);
      });
    });

    if (reduce || !hasIO) {
      play(0);
    } else {
      watch(studio, 0.25, function (v) {
        var was = studioVis;
        studioVis = v;
        if (v && !was) play(cur);
        else if (!v) { token++; clearTimeout(timer); }
      });
    }
  }

  /* ---------- 3 · Stack tiles: cursor-tracking tilt and glow ---------- */
  if (!reduce && window.matchMedia && matchMedia('(hover: hover)').matches) {
    $$('.sd-tile').forEach(function (tile) {
      tile.addEventListener('pointermove', function (e) {
        var r = tile.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        tile.style.setProperty('--mx', x + 'px');
        tile.style.setProperty('--my', y + 'px');
        tile.style.setProperty('--ry', ((x / r.width - 0.5) * 10).toFixed(2) + 'deg');
        tile.style.setProperty('--rx', ((0.5 - y / r.height) * 10).toFixed(2) + 'deg');
      });
      tile.addEventListener('pointerleave', function () {
        tile.style.setProperty('--rx', '0deg');
        tile.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- 4 · Expanding panels ---------- */
  var acc = $('#sd-acc');
  if (acc) {
    var pans = $$('.sd-pan', acc);
    var curPan = 0, accTimer = null, accVis = false, accPicked = false;

    var setPan = function (i) {
      curPan = i;
      pans.forEach(function (p, k) {
        p.classList.toggle('is-on', k === i);
        $('.sd-pan-btn', p).setAttribute('aria-expanded', k === i ? 'true' : 'false');
      });
    };

    var planAcc = function () {
      clearInterval(accTimer);
      if (reduce || accPicked || !accVis) return;
      accTimer = setInterval(function () { setPan((curPan + 1) % pans.length); }, 5200);
    };

    pans.forEach(function (p, k) {
      $('.sd-pan-btn', p).addEventListener('click', function () {
        accPicked = true;
        clearInterval(accTimer);
        setPan(k);
      });
    });

    watch(acc, 0.3, function (v) { accVis = v; planAcc(); });
  }

  /* ---------- 5 · Pull request: checks run, approval, merge (loops) ---------- */
  var pr = $('#sd-pr');
  if (pr && !reduce) {
    var prTimer = null;
    var runPr = function () {
      pr.classList.remove('is-run');
      void pr.offsetWidth;
      pr.classList.add('is-run');
    };
    watch(pr, 0.35, function (v) {
      clearInterval(prTimer);
      if (v) {
        runPr();
        prTimer = setInterval(runPr, 12500);
      }
    });
  }

  /* ---------- 6 · Marquee: clone each row once for a seamless loop ---------- */
  if (!reduce) {
    $$('.sd-mq-track').forEach(function (track) {
      var clones = $$('.sd-tool', track).map(function (n) {
        var c = n.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        return c;
      });
      clones.forEach(function (c) { track.appendChild(c); });
    });
  }

  /* ---------- 7 · Drag to compare ---------- */
  var cmp = $('#sd-cmp');
  var range = $('#sd-range');
  if (cmp && range) {
    var setX = function (v) { cmp.style.setProperty('--x', v + '%'); };
    var sweeping = false, swept = false;

    range.addEventListener('input', function () {
      sweeping = false;
      setX(range.value);
    });

    var sweep = function () {
      if (swept || reduce) return;
      swept = true;
      sweeping = true;
      var t0 = performance.now(), dur = 3200;
      var frame = function (t) {
        if (!sweeping) return;
        var p = Math.min(1, (t - t0) / dur);
        // 50 -> 82 -> 18 -> 50
        var v = 50 + Math.sin(p * Math.PI * 2) * 32 * (1 - p * 0.15);
        range.value = v;
        setX(v.toFixed(2));
        if (p < 1) requestAnimationFrame(frame);
        else { sweeping = false; range.value = 50; setX(50); }
      };
      requestAnimationFrame(frame);
    };

    watch(cmp, 0.5, function (v) { if (v) setTimeout(sweep, 400); });
  }
})();