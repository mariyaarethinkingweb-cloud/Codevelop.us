/* ==========================================================================
   Codevelop US — Webflow Web Development interactions (vanilla JS)
   Load AFTER js/script.js and js/facebook-ads.js.
   facebook-ads.js already handles the hero network, stat count-up and the
   testimonial slider; this file adds the services panels and the FAQ.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Services: expanding panels (hover, focus, click, arrow keys) ---------- */
  var acc = $('#wf-acc');
  if (acc) {
    var pans = $$('.wf-pan', acc);
    var heads = pans.map(function (p) { return $('.wf-head', p); });
    var canHover = window.matchMedia && matchMedia('(hover: hover) and (min-width: 960px)').matches;

    var openPan = function (i) {
      pans.forEach(function (p, k) {
        var on = k === i;
        p.classList.toggle('is-on', on);
        heads[k].setAttribute('aria-expanded', String(on));
      });
    };

    pans.forEach(function (p, i) {
      var h = heads[i];
      h.addEventListener('click', function () { openPan(i); });
      h.addEventListener('focus', function () { openPan(i); });
      if (canHover) p.addEventListener('mouseenter', function () { openPan(i); });
      h.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % pans.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + pans.length) % pans.length;
        if (n !== null) { e.preventDefault(); openPan(n); heads[n].focus(); }
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  var faq = $('#ma-faq');
  if (faq) {
    var items = $$('.ma-faq-item', faq);

    var setOpen = function (target) {
      items.forEach(function (item) {
        var on = item === target;
        item.classList.toggle('open', on);
        $('.ma-faq-q', item).setAttribute('aria-expanded', String(on));
      });
    };

    faq.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.ma-faq-q') : null;
      if (!btn || !faq.contains(btn)) return;
      e.stopImmediatePropagation();
      var item = btn.closest('.ma-faq-item');
      // clicking the open one closes it; clicking any other opens it and closes the rest
      setOpen(item.classList.contains('open') ? null : item);
    }, true);
  }
})();