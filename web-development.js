/* ==========================================================================
   Codevelop US — Web Development page interactions (vanilla JS)
   Load AFTER js/script.js and js/facebook-ads.js. The hero network, stat
   count-up, testimonials and FAQ are already handled by facebook-ads.js.
   This file adds: service-card spotlight + the approach flow.
   ========================================================================== */
(function () {
  'use strict';

  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

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
      $$('.wd-node', s)[0].addEventListener('click', function () { auto = false; stop(); show(i); });
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
    /* ---------- Clients: browser showcase ---------- */
  var cl = document.getElementById('wd-cl');
  if (cl) {
    var cItems = $$('.wd-cl-item', cl);
    var cSlides = $$('.wd-slide', cl);
    var cList = $$('.wd-cl-list', cl)[0];
    var cName = document.getElementById('wd-cl-name');
    var cUrl = document.getElementById('wd-cl-url');
    var cCur = document.getElementById('wd-cl-cur');
    var cIdx = 0, cTimer = 0, cAuto = !reduce;

    var cShow = function (i) {
      cIdx = i;
      cItems.forEach(function (b, k) {
        b.setAttribute('aria-selected', String(k === i));
        b.tabIndex = k === i ? 0 : -1;
      });
      cSlides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      var name = cItems[i].getAttribute('data-name');
      cName.textContent = name; cUrl.textContent = name; cCur.textContent = i + 1;
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

    if (cAuto) cl.classList.add('is-auto');
    cShow(0);
    if (cAuto) {
      if (hasIO) {
        new IntersectionObserver(function (es) {
          if (!cAuto) return;
          if (es[0].isIntersecting) cQueue(); else cStop();
        }, { threshold: 0.35 }).observe(cl);
      } else { cQueue(); }
    }
  }
})();