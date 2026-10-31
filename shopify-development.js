/* Shopify page: "Standard vs AI" switch. Auto-flips until the visitor clicks. */
(function () {
  'use strict';

  var cmp = document.getElementById('sp-cmp');
  if (!cmp) return;

  var btns = Array.prototype.slice.call(document.querySelectorAll('.sp-sw'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var auto = !reduce, timer = 0;

  var setMode = function (mode) {
    cmp.setAttribute('data-mode', mode);
    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode));
    });
  };
  var stop = function () { clearInterval(timer); timer = 0; };
  var start = function () {
    stop();
    if (!auto) return;
    timer = setInterval(function () {
      setMode(cmp.getAttribute('data-mode') === 'std' ? 'ai' : 'std');
    }, 4500);
  };

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      auto = false; stop();
      setMode(b.getAttribute('data-mode'));
    });
  });

  if (auto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (!auto) return;
      if (es[0].isIntersecting) start(); else stop();
    }, { threshold: 0.35 }).observe(cmp);
  } else if (auto) { start(); }
})();