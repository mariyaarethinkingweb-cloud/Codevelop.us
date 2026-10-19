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
  var hdr = $('.site-header');
  var hdrNav = $('nav', hdr);
  var burger = $('.burger', hdr);

  function closeDrops() {
    $$('nav li.open', hdr).forEach(function (li) {
      li.classList.remove('open');
      $('button.top', li).setAttribute('aria-expanded', 'false');
    });
  }

  $$('nav li > button.top', hdr).forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = btn.parentElement;
      var was = li.classList.contains('open');
      closeDrops();
      if (!was) { li.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  burger.addEventListener('click', function (e) {
    e.stopPropagation();
    var shown = hdrNav.classList.toggle('show');
    burger.setAttribute('aria-expanded', String(shown));
    if (!shown) closeDrops();
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.site-header nav li')) closeDrops();
    if (window.innerWidth <= 1020 && !e.target.closest('.site-header nav') && !e.target.closest('.burger')) {
      hdrNav.classList.remove('show');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeDrops();
    hdrNav.classList.remove('show');
    burger.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1020) {
      hdrNav.classList.remove('show');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
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
  /* ---------- AI capability cards: cursor glow ---------- */
  if (!reduce) {
    $$('.bx').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
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
/* ---------- Section 2: Growth Blueprint (paste INSIDE the IIFE in script.js, e.g. just before "FAQ accordion") ---------- */
  var gbStage = $('#gb-stage');
  if (gbStage) {
    var gbGoalsEl = $('#gb-goals');
    var gbGoals = $$('.gb-goal', gbGoalsEl);
    var gbNodes = $$('.gb-node', gbStage);
    var gbLines = $$('.gb-line', gbStage);
    var gbNum = $('#gb-num'), gbLabel = $('#gb-label'), gbSteps = $('#gb-steps');
    var gbLine = $('#gb-spark-line'), gbFill = $('#gb-spark-fill');

    // node order: 0 Web, 1 SEO, 2 Ads, 3 AI, 4 Content, 5 Analytics
    var gbData = [
      { nodes: [0, 2, 5, 3], pre: '+', val: 212, dec: 0, suf: '%', label: 'more qualified leads',
        spark: 'M2 38 C20 36 30 28 48 30 S78 16 92 14 S112 6 118 4',
        steps: ['Conversion-focused website and landing pages', 'Paid campaigns tuned to your best audiences', 'AI follow-up so no lead goes cold'] },
      { nodes: [1, 4, 0, 5], pre: '+', val: 340, dec: 0, suf: '%', label: 'organic search traffic',
        spark: 'M2 40 C24 39 36 34 52 28 S80 22 94 12 S112 6 118 3',
        steps: ['Technical SEO and a fast, crawlable site', 'Content built around what buyers search', 'Reporting that ties rankings to revenue'] },
      { nodes: [0, 1, 5], pre: '', val: 1.2, dec: 1, suf: 's', label: 'average page load time',
        spark: 'M2 6 C20 8 32 18 50 20 S80 32 94 34 S112 38 118 40',
        steps: ['Lean, modern front-end built for speed', 'Core Web Vitals tuned before launch', 'Monitoring that keeps it fast'] },
      { nodes: [3, 5, 4], pre: '−', val: 18, dec: 0, suf: ' hrs', label: 'manual work saved every week',
        spark: 'M2 8 C22 10 34 16 52 22 S82 30 96 34 S112 38 118 40',
        steps: ['AI agents that handle routine requests', 'Workflows wired into your CRM and inbox', 'Dashboards that show what is saved'] }
    ];

    var gbCur = 0, gbPicked = false, gbVisible = false, gbTimer = null, gbRaf = null;

    var gbCount = function (d) {
      cancelAnimationFrame(gbRaf);
      var fmt = function (v) { return d.pre + v.toFixed(d.dec) + d.suf; };
      if (reduce) { gbNum.textContent = fmt(d.val); return; }
      var t0 = performance.now(), dur = 1100;
      var frame = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        gbNum.textContent = fmt(d.val * e);
        if (p < 1) gbRaf = requestAnimationFrame(frame);
      };
      gbRaf = requestAnimationFrame(frame);
    };

    var gbRender = function (i) {
      gbCur = i;
      var d = gbData[i];
      gbGoals.forEach(function (g, k) {
        g.classList.toggle('is-on', k === i);
        g.setAttribute('aria-pressed', String(k === i));
      });
      gbGoalsEl.classList.toggle('is-auto', !gbPicked && gbVisible && !reduce);
      gbNodes.forEach(function (n, k) { n.classList.toggle('is-on', d.nodes.indexOf(k) > -1); });
      gbLines.forEach(function (l, k) { l.classList.toggle('is-on', d.nodes.indexOf(k) > -1); });
      gbLabel.textContent = d.label;
      gbCount(d);
      gbSteps.innerHTML = '';
      d.steps.forEach(function (s, k) {
        var li = document.createElement('li');
        li.style.setProperty('--n', k);
        li.textContent = s;
        gbSteps.appendChild(li);
      });
      gbLine.setAttribute('d', d.spark);
      gbFill.setAttribute('d', d.spark + ' L118 44 L2 44Z');
      gbLine.classList.remove('is-draw'); void gbLine.getBoundingClientRect();
      if (reduce) { gbLine.style.strokeDashoffset = 0; } else { gbLine.classList.add('is-draw'); }
      gbSchedule();
    };

    var gbSchedule = function () {
      clearTimeout(gbTimer);
      if (gbVisible && !gbPicked && !reduce) {
        gbTimer = setTimeout(function () { gbRender((gbCur + 1) % gbData.length); }, 6000);
      }
    };

    gbGoals.forEach(function (g, k) {
      g.addEventListener('click', function () { gbPicked = true; gbRender(k); });
    });

    if (hasIO) {
      new IntersectionObserver(function (es) {
        gbVisible = es[0].isIntersecting;
        gbRender(gbCur);
      }, { threshold: 0.35 }).observe(gbStage);
    }
    gbRender(0);

    // 3D tilt following the pointer (desktop only)
    if (!reduce && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var gbWrap = gbStage.parentNode;
      gbWrap.addEventListener('pointermove', function (e) {
        var r = gbWrap.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        gbStage.classList.add('is-moving');
        gbStage.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        gbStage.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      });
      gbWrap.addEventListener('pointerleave', function () {
        gbStage.classList.remove('is-moving');
        gbStage.style.setProperty('--ry', '0deg');
        gbStage.style.setProperty('--rx', '0deg');
      });
    }
  }
   var capSec = $('#ai-capabilities');
  if (capSec) {
    capSec.classList.add('cap');
    if (!reduce) {
      $$('.cap-card', capSec).forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }
    if (hasIO) {
      new IntersectionObserver(function (es) {
        capSec.classList.toggle('is-paused', !es[0].isIntersecting);
      }, { threshold: 0.05 }).observe(capSec);
    }
  }