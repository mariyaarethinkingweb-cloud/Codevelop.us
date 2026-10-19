/* ==========================================================================
   Codevelop US — Web Development page interactions (vanilla JS)
   Load AFTER js/script.js and js/facebook-ads.js. The hero network, stat
   count-up and FAQ are already handled by facebook-ads.js.
   This file adds: bento animations, service-card spotlight, approach flow,
   clients showcase and the testimonials slider.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Why Codevelop bento: animate only while on screen ---------- */
  var bento = document.getElementById('wd-bento');
  if (bento) {
    var nums = $$('[data-count]', bento);
    var countRaf = 0;
    var countUp = function () {
      if (reduce) return;
      cancelAnimationFrame(countRaf);
      var t0 = performance.now(), dur = 1500;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (el) { el.textContent = Math.round(Number(el.dataset.count) * e); });
        if (p < 1) countRaf = requestAnimationFrame(tick);
      })(t0);
    };
    if (hasIO && !reduce) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { bento.classList.add('is-live'); countUp(); }
        else { bento.classList.remove('is-live'); }
      }, { threshold: 0.2 }).observe(bento);
    } else {
      bento.classList.add('is-live');
    }
  }

  /* ---------- Service cards: spotlight follows the cursor ---------- */
  if (!reduce) {
    $$('.wd-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Approach: steps advance on their own, click to jump ---------- */
  var flow = document.getElementById('wd-flow');
  if (flow) {
    var steps = $$('.wd-step', flow);
    var cur = 0, timer = 0, auto = !reduce;

    var show = function (i) {
      cur = i;
      steps.forEach(function (s, k) {
        s.classList.toggle('is-on', k === i);
        s.classList.toggle('is-done', k < i);
      });
      flow.style.setProperty('--p', i / (steps.length - 1));
    };
    var stop = function () { clearTimeout(timer); timer = 0; };
    var queue = function () {
      stop();
      if (!auto) return;
      timer = setTimeout(function () { show((cur + 1) % steps.length); queue(); }, 4500);
    };

    steps.forEach(function (s, i) {
      $('.wd-node', s).addEventListener('click', function () { auto = false; stop(); show(i); });
    });

    show(0);
    if (auto) {
      if (hasIO) {
        new IntersectionObserver(function (es) {
          if (!auto) return;
          if (es[0].isIntersecting) queue(); else stop();
        }, { threshold: 0.35 }).observe(flow);
      } else { queue(); }
    }
  }

  /* ---------- Clients: colourful browser showcase ---------- */
  var cl = document.getElementById('wd-cl');
  if (cl) {
    var cItems = $$('.wd-cl-item', cl);
    var cSlides = $$('.wd-slide', cl);
    var cList = $('.wd-cl-list', cl);
    var cName = document.getElementById('wd-cl-name');
    var cUrl = document.getElementById('wd-cl-url');
    var cCur = document.getElementById('wd-cl-cur');
    var cScan = document.getElementById('wd-scan');
    var cIdx = 0, cTimer = 0, cAuto = !reduce;

    var cShow = function (i, first) {
      cIdx = i;
      cItems.forEach(function (b, k) {
        b.setAttribute('aria-selected', String(k === i));
        b.tabIndex = k === i ? 0 : -1;
      });
      cSlides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      var name = cItems[i].getAttribute('data-name');
      cName.textContent = name; cUrl.textContent = name; cCur.textContent = i + 1;
      cl.style.setProperty('--c', cItems[i].getAttribute('data-c'));

      if (cScan && !first && !reduce) {
        cScan.classList.remove('go');
        void cScan.offsetWidth;
        cScan.classList.add('go');
      }
      /* Only the horizontal strip (mobile) is scrolled; never the page */
      if (cList.scrollWidth > cList.clientWidth) {
        cList.scrollTo({ left: cItems[i].offsetLeft - (cList.clientWidth - cItems[i].offsetWidth) / 2, behavior: 'smooth' });
      }
    };
    var cStop = function () { clearTimeout(cTimer); cTimer = 0; };
    var cQueue = function () {
      cStop();
      if (!cAuto) return;
      cTimer = setTimeout(function () { cShow((cIdx + 1) % cItems.length); cQueue(); }, 5000);
    };
    var cManual = function (i) {
      cAuto = false; cStop(); cl.classList.remove('is-auto');
      cShow((i + cItems.length) % cItems.length);
    };

    cItems.forEach(function (b, i) {
      b.addEventListener('click', function () { cManual(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); cManual(i + 1); cItems[cIdx].focus(); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); cManual(i - 1); cItems[cIdx].focus(); }
      });
    });
    document.getElementById('wd-cl-prev').addEventListener('click', function () { cManual(cIdx - 1); });
    document.getElementById('wd-cl-next').addEventListener('click', function () { cManual(cIdx + 1); });

    if (!cAuto) cl.classList.remove('is-auto');
    cShow(0, true);
    if (cAuto) {
      if (hasIO) {
        new IntersectionObserver(function (es) {
          if (!cAuto) return;
          if (es[0].isIntersecting) cQueue(); else cStop();
        }, { threshold: 0.35 }).observe(cl);
      } else { cQueue(); }
    }
  }

  /* ---------- Testimonials: featured voice slider ---------- */
  var v = document.getElementById('wd-v');
  if (v) {
    var vq = $$('.wd-vq', v);
    var vt = $$('.wd-vt', v);
    var vIdx = 0, vTimer = 0, vAuto = !reduce;

    var vShow = function (i) {
      vIdx = i;
      vq.forEach(function (f, k) {
        var on = k === i;
        f.classList.toggle('is-active', on);
        f.setAttribute('aria-hidden', String(!on));
      });
      vt.forEach(function (b, k) {
        b.setAttribute('aria-selected', String(k === i));
        b.tabIndex = k === i ? 0 : -1;
      });
      var tabs = vt[i].parentNode;
      if (tabs.scrollWidth > tabs.clientWidth) {
        tabs.scrollTo({ left: vt[i].offsetLeft - (tabs.clientWidth - vt[i].offsetWidth) / 2, behavior: 'smooth' });
      }
    };
    var vStop = function () { clearTimeout(vTimer); vTimer = 0; };
    var vQueue = function () {
      vStop();
      if (!vAuto) return;
      vTimer = setTimeout(function () { vShow((vIdx + 1) % vq.length); vQueue(); }, 7000);
    };
    var vManual = function (i) {
      vAuto = false; vStop(); v.classList.remove('is-auto');
      vShow((i + vq.length) % vq.length);
    };

    vt.forEach(function (b, i) {
      b.addEventListener('click', function () { vManual(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); vManual(i + 1); vt[vIdx].focus(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); vManual(i - 1); vt[vIdx].focus(); }
      });
    });
    document.getElementById('wd-v-prev').addEventListener('click', function () { vManual(vIdx - 1); });
    document.getElementById('wd-v-next').addEventListener('click', function () { vManual(vIdx + 1); });

    if (!vAuto) v.classList.remove('is-auto');
    vShow(0);
    if (vAuto) {
      if (hasIO) {
        new IntersectionObserver(function (es) {
          if (!vAuto) return;
          if (es[0].isIntersecting) vQueue(); else vStop();
        }, { threshold: 0.35 }).observe(v);
      } else { vQueue(); }
    }
  }
})();