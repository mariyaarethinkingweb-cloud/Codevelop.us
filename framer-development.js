/* ==========================================================================
   Codevelop US — Framer Web Development interactions (vanilla JS)
   Load AFTER js/script.js and js/facebook-ads.js.
   facebook-ads.js already handles the hero network, stat count-up and the
   testimonial slider; this file adds the process timeline and the FAQ.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Process timeline: auto-plays once in view, then hover / focus / click ---------- */
  var list = $('#fr-steps');
  if (list) {
    var steps = $$('.fr-step', list);
    var timer = null;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var setOn = function (i) {
      steps.forEach(function (s, k) {
        s.classList.toggle('is-on', k === i);
        s.classList.toggle('is-lit', k <= i);
        s.classList.toggle('is-done', k < i);
        if (k === i) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
      });
    };

    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };

    var play = function () {
      var i = 0;
      setOn(0);
      timer = setInterval(function () {
        i += 1;
        if (i >= steps.length) { stop(); return; }
        setOn(i);
      }, 1300);
    };

    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { stop(); setOn(i); });
      s.addEventListener('focus', function () { stop(); setOn(i); });
      s.addEventListener('mouseenter', function () { stop(); setOn(i); });
      s.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = Math.min(i + 1, steps.length - 1);
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = Math.max(i - 1, 0);
        if (n !== null && n !== i) { e.preventDefault(); stop(); setOn(n); steps[n].focus(); }
      });
    });

    setOn(0);

    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { io.disconnect(); play(); }
        });
      }, { threshold: 0.4 });
      io.observe(list);
    }
  }

  /* ---------- FAQ accordion ---------- */
  var faq = $('#fr-faq');
  if (faq) {
    var items = $$('.fr-faq-item', faq);

    var setOpen = function (target) {
      items.forEach(function (item) {
        var on = item === target;
        item.classList.toggle('open', on);
        $('.fr-faq-q', item).setAttribute('aria-expanded', String(on));
      });
    };

    faq.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.fr-faq-q') : null;
      if (!btn || !faq.contains(btn)) return;
      var item = btn.closest('.fr-faq-item');
      // clicking the open one closes it; clicking any other opens it and closes the rest
      setOpen(item.classList.contains('open') ? null : item);
    });
  }
})();