/* ==========================================================================
   Codevelop US — Shopify Web Development page interactions (vanilla JS)
   Load AFTER js/script.js, js/facebook-ads.js and js/web-development.js.
   Those files already handle the hero, stat count-up, testimonials, FAQ and
   service-card spotlight. This file adds the "Key features" explorer:
   click, arrow keys, or auto-rotate every 5 seconds.
   ========================================================================== */
(function () {
  'use strict';

  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  var feat = document.getElementById('sp-feat');
  if (!feat) return;

  var tabs = $$('.sp-tab', feat);
  var panels = $$('.sp-panel', feat);
  var tabList = $$('.sp-tabs', feat)[0];
  var counter = document.getElementById('sp-cur');
  var cur = 0, timer = 0, auto = !reduce;

  var show = function (i) {
    cur = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p, k) {
      p.classList.toggle('is-active', k === i);
      p.setAttribute('aria-hidden', String(k !== i));
    });
    if (counter) counter.textContent = i + 1;
    // on mobile the tabs scroll sideways: keep the active one in view
    if (tabList.scrollWidth > tabList.clientWidth) {
      tabList.scrollTo({ left: tabs[i].offsetLeft - (tabList.clientWidth - tabs[i].offsetWidth) / 2, behavior: 'smooth' });
    }
  };
  var stop = function () { clearTimeout(timer); timer = 0; };
  var queue = function () {
    stop();
    if (!auto) return;
    timer = setTimeout(function () { show((cur + 1) % tabs.length); queue(); }, 5000);
  };
  var manual = function (i) {
    auto = false; stop(); feat.classList.remove('is-auto');
    show((i + tabs.length) % tabs.length);
  };

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { manual(i); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = i + 1;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = i - 1;
      if (n !== null) { e.preventDefault(); manual(n); tabs[cur].focus(); }
    });
  });

  if (!auto) feat.classList.remove('is-auto');
  show(0);
  if (auto) {
    if (hasIO) {
      new IntersectionObserver(function (es) {
        if (!auto) return;
        if (es[0].isIntersecting) queue(); else stop();
      }, { threshold: 0.35 }).observe(feat);
    } else { queue(); }
  }
})();