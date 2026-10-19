/* ==========================================================================
   Codevelop US — WordPress page interactions (replaces js/wordpress-development.js)
   - cursor spotlight on capability tiles
   - feature rows light up on scroll
   - AI prompt typewriter in the hero-of-section-2 editor visual
   ========================================================================== */
(function () {
  'use strict';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  if (!reduce) {
    $$('.wp-cap').forEach(function (tile) {
      tile.addEventListener('mousemove', function (e) {
        var r = tile.getBoundingClientRect();
        tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  var rows = $$('.wp-row');
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

  /* typewriter: cycles through example prompts */
  var out = document.getElementById('wp-type');
  if (out) {
    var prompts = [
      'Write a service page for a Portland dental clinic',
      'Add FAQ schema to every product page',
      'Suggest internal links for our latest blog post'
    ];
    if (reduce) { out.textContent = prompts[0]; return; }
    var p = 0, c = 0, del = false;
    (function tick() {
      var t = prompts[p];
      out.textContent = t.slice(0, c);
      if (!del && c < t.length) { c++; return setTimeout(tick, 45); }
      if (!del) { del = true; return setTimeout(tick, 1800); }
      if (c > 0) { c--; return setTimeout(tick, 18); }
      del = false; p = (p + 1) % prompts.length; setTimeout(tick, 400);
    })();
  }
})();