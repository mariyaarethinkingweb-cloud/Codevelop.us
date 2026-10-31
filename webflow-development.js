/* ==========================================================================
   Codevelop US — Webflow Web Development interactions (vanilla JS)
   Load AFTER js/script.js and js/facebook-ads.js.
   facebook-ads.js already handles the hero network, stat count-up and the
   testimonial slider; this file only adds the FAQ accordion.
   (The old expanding services panels were removed: the services section is
   now a plain list, so no JavaScript is needed for it.)
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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