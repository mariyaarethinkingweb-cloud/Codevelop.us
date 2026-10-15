/* ==========================================================================
   Codevelop US — Homepage interactions (vanilla JS, no dependencies)
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  document.documentElement.classList.add('js');

  /* ---------- Header: scroll progress ---------- */
  var progress = $('#progress');
  function onScroll() {
    if (!progress) return;
    var d = document.documentElement;
    var max = (d.scrollHeight - d.clientHeight) || 1;
    progress.style.transform = 'scaleX(' + Math.min(1, (window.scrollY || d.scrollTop) / max) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Header: mobile menu + dropdowns ---------- */
  var nav = $('#nav');
  var navToggle = $('.nav-toggle');
  var menus = $$('.has-menu');

  function closeMenus(except) {
    menus.forEach(function (m) {
      if (m === except) return;
      m.classList.remove('open');
      var b = $('.menu-toggle', m);
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  menus.forEach(function (m) {
    var btn = $('.menu-toggle', m);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !m.classList.contains('open');
      closeMenus(m);
      m.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  navToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    if (!open) closeMenus();
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-menu')) closeMenus();
    if (window.innerWidth < 1024 && !e.target.closest('.nav') && !e.target.closest('.nav-toggle')) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenus();
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Hero: cursor glow ---------- */
  var hero = $('#hero');
  if (hero && !reduce) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- Hero: logo marquee (duplicate for a seamless loop) ---------- */
  var track = $('#marquee');
  if (track && !reduce) {
    $$('img', track).forEach(function (img) {
      var c = img.cloneNode(true);
      c.setAttribute('alt', '');
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
  } else if (track) {
    track.style.animation = 'none';
    track.parentNode.style.overflowX = 'auto';
  }

  /* ---------- Hero: count-up stats ---------- */
  var statsEl = $('#stats');
  if (statsEl && !reduce) {
    var counters = $$('[data-count]', statsEl);
    counters.forEach(function (el) { el.textContent = '0'; });
    var counted = false;
    var runCount = function () {
      if (counted) return;
      counted = true;
      var t0 = performance.now(), dur = 1600;
      (function frame(t) {
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        counters.forEach(function (el) {
          el.textContent = Math.round(Number(el.dataset.count) * eased);
        });
        if (p < 1) requestAnimationFrame(frame);
      })(t0);
    };
    if (hasIO) {
      var cio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { setTimeout(runCount, 900); cio.disconnect(); }
      }, { threshold: 0.4 });
      cio.observe(statsEl);
    } else { runCount(); }
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$('[data-reveal]');
  $$('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--d', (i * 90) + 'ms');
      revealEls.push(child);
    });
  });
  if (hasIO && !reduce) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { rio.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Web development showcase (tabs, auto-rotating) ---------- */
  var showcase = $('#showcase');
  if (showcase) {
    var tabs = $$('.tab', showcase);
    var panels = $$('.panel', showcase);
    var current = 0, picked = false, tabTimer = null, tabVisible = false;

    var setTab = function (i) {
      current = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
      showcase.classList.toggle('is-auto', !picked && !reduce);
      restartTabs();
    };
    var restartTabs = function () {
      clearTimeout(tabTimer);
      if (picked || reduce || !tabVisible) return;
      // restart the CSS progress bar animation
      var bar = $('.tab[aria-selected="true"] .tab-bar', showcase);
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      tabTimer = setTimeout(function () { setTab((current + 1) % tabs.length); }, 6000);
    };

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { picked = true; setTab(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); picked = true; setTab(n); tabs[n].focus(); }
      });
    });
    tabs.forEach(function (t, k) { t.tabIndex = k === 0 ? 0 : -1; });

    if (hasIO) {
      new IntersectionObserver(function (es) {
        tabVisible = es[0].isIntersecting;
        if (tabVisible) { showcase.classList.toggle('is-auto', !picked && !reduce); restartTabs(); }
        else clearTimeout(tabTimer);
      }, { threshold: 0.35 }).observe(showcase);
    }
  }

  /* ---------- Approach stepper ---------- */
  var engine = $('#engine');
  if (engine) {
    var steps = $$('.step');
    var checks = $$('.check-item', engine);
    var data = [
      { title: 'Set Clear Goals', body: 'We align on your business objectives, audience, and success metrics from the start.' },
      { title: 'Develop a Solid Plan', body: 'A tailored digital strategy built on insights, data, and proven frameworks.' },
      { title: 'Consistent Action', body: 'Focused execution across web and marketing channels to drive momentum.' },
      { title: 'Adapt and Learn', body: 'Ongoing testing and optimization to improve performance over time.' }
    ];
    var step = 0, stepPicked = false, stepVisible = false, stepTimer = null, first = true;
    var numEl = $('#eng-num'), titleEl = $('#eng-title'), bodyEl = $('#eng-body');

    var renderStep = function () {
      steps.forEach(function (s, k) {
        s.classList.toggle('is-on', k === step);
        s.classList.toggle('is-done', k < step);
        s.classList.toggle('is-auto', k === step && !stepPicked && stepVisible && !reduce && k < steps.length - 1);
      });
      checks.forEach(function (c, k) {
        c.classList.toggle('is-done', k <= step);
        c.classList.toggle('is-on', k === step);
      });
      numEl.textContent = '0' + (step + 1);
      titleEl.textContent = data[step].title;
      bodyEl.textContent = data[step].body;
      if (!first && !reduce) {
        [numEl, titleEl, bodyEl].forEach(function (el, i) {
          el.style.animation = 'none'; void el.offsetWidth;
          el.style.animation = 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ' + (i * 60) + 'ms both';
        });
      }
      first = false;
      scheduleStep();
    };
    var scheduleStep = function () {
      clearTimeout(stepTimer);
      if (stepVisible && !stepPicked && !reduce) {
        stepTimer = setTimeout(function () { step = (step + 1) % data.length; renderStep(); }, 5000);
      }
    };
    steps.forEach(function (s, k) { s.addEventListener('click', function () { step = k; stepPicked = true; renderStep(); }); });
    $('#eng-prev').addEventListener('click', function () { step = (step + data.length - 1) % data.length; stepPicked = true; renderStep(); });
    $('#eng-next').addEventListener('click', function () { step = (step + 1) % data.length; stepPicked = true; renderStep(); });

    if (hasIO) {
      new IntersectionObserver(function (es) {
        stepVisible = es[0].isIntersecting;
        renderStep();
      }, { threshold: 0.3 }).observe(engine);
    }
    renderStep();
  }

  /* ---------- FAQ accordion ---------- */
  var faqItems = $$('.faq-item');
  faqItems.forEach(function (item) {
    var btn = $('.faq-q', item);
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('open');
      faqItems.forEach(function (o) {
        o.classList.remove('open');
        $('.faq-q', o).setAttribute('aria-expanded', 'false');
      });
      if (open) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();