/* ==========================================================================
   Codevelop US — WordPress Web Development page interactions (vanilla JS)
   Load AFTER js/script.js, js/facebook-ads.js and js/web-development.js.
   Those files already handle the hero, stat count-up, testimonials, FAQ,
   service-card spotlight and the process flow. This file adds:
   - the cursor spotlight on the "What WordPress lets you do" tiles
   - the feature rows that light up as you scroll to them
   ========================================================================== */
(function () {
  'use strict';

  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Capability tiles: spotlight follows the cursor ---------- */
  if (!reduce) {
    $$('.wp-cap').forEach(function (tile) {
      tile.addEventListener('mousemove', function (e) {
        var r = tile.getBoundingClientRect();
        tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Why choose: rows light up one by one while scrolling ---------- */
  var rows = $$('.wp-row');
  if (rows.length) {
    if (hasIO && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-lit'); io.unobserve(en.target); }
        });
      }, { threshold: 0.6, rootMargin: '0px 0px -10% 0px' });
      rows.forEach(function (r) { io.observe(r); });
    } else {
      rows.forEach(function (r) { r.classList.add('is-lit'); });
    }
  }
})();