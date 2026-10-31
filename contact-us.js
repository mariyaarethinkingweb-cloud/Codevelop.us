/* Codevelop – Contact Us page. File: js/contact.js
   Self-contained. Handles: hero network canvas, topic cards, copy buttons,
   country list, form validation + submit. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  /* ------------------------------------------------------------------
     FORM ENDPOINT — set this to your form handler (Apps Script web app,
     EmailJS wrapper, WordPress/Formspree endpoint, etc.).
     While it is empty the form only simulates a successful send.
     ------------------------------------------------------------------ */
  var ENDPOINT = '';

  var COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'India', 'Australia', 'United Arab Emirates', 'Saudi Arabia', 'Singapore', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Ireland', 'New Zealand', 'South Africa', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Malaysia', 'Philippines', 'Indonesia', 'Japan', 'Mexico', 'Brazil', 'Other'];

  ready(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* ---------- HERO NETWORK CANVAS ---------- */
    (function network() {
      var canvas = document.getElementById('ct-net');
      if (!canvas || reduce || !canvas.getContext) return;
      var ctx = canvas.getContext('2d'), hero = canvas.parentElement;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = 0, h = 0, nodes = [], raf = null, mouse = { x: -9999, y: -9999 };

      function resize() {
        var r = hero.getBoundingClientRect();
        w = r.width; h = r.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.max(24, Math.min(70, Math.round((w * h) / 20000)));
        nodes = [];
        for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .9 });
      }
      function frame() {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < nodes.length; i++) {
          var a = nodes[i];
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          for (var j = i + 1; j < nodes.length; j++) {
            var b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 130) {
              ctx.strokeStyle = 'rgba(255,255,255,' + (.22 * (1 - d / 130)).toFixed(3) + ')';
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          var md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (md < 160) {
            ctx.strokeStyle = 'rgba(255,138,147,' + (.55 * (1 - md / 160)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,.75)';
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      }
      function start() { if (!raf) raf = requestAnimationFrame(frame); }
      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      resize();
      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
      hero.addEventListener('mousemove', function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
      if (hasIO) new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero); else start();
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    })();

    /* ---------- COUNTRY LIST ---------- */
    (function countries() {
      var sel = document.getElementById('ct-country');
      if (!sel) return;
      COUNTRIES.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c; o.textContent = c;
        sel.appendChild(o);
      });
    })();

    /* ---------- TOPIC CARDS -> FORM ---------- */
    (function topics() {
      var wrap = document.getElementById('ct-topics');
      var form = document.getElementById('ct-form');
      if (!wrap || !form) return;
      var btns = Array.prototype.slice.call(wrap.querySelectorAll('.ct-topic'));
      var chosen = document.getElementById('ct-chosen');
      var chosenText = chosen.querySelector('span');
      var hidden = document.getElementById('ct-topic-input');
      var clear = document.getElementById('ct-chosen-x');

      function set(label) {
        hidden.value = label || '';
        btns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-topic') === label); b.setAttribute('aria-pressed', b.getAttribute('data-topic') === label ? 'true' : 'false'); });
        if (label) { chosenText.textContent = 'Topic: ' + label; chosen.hidden = false; }
        else { chosen.hidden = true; }
      }
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          set(b.getAttribute('data-topic'));
          var target = document.getElementById('form');
          if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          setTimeout(function () { var n = document.getElementById('ct-name'); if (n) n.focus({ preventScroll: true }); }, reduce ? 0 : 700);
        });
      });
      clear.addEventListener('click', function () { set(''); });
      form._setTopic = set;
    })();

    /* ---------- COPY BUTTONS ---------- */
    (function copy() {
      Array.prototype.slice.call(document.querySelectorAll('.ct-copy')).forEach(function (btn) {
        var label = btn.querySelector('span');
        var timer;
        function done() {
          btn.classList.add('is-done'); label.textContent = 'Copied';
          clearTimeout(timer);
          timer = setTimeout(function () { btn.classList.remove('is-done'); label.textContent = 'Copy'; }, 1800);
        }
        btn.addEventListener('click', function () {
          var text = btn.getAttribute('data-copy');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, fallback);
          } else { fallback(); }
          function fallback() {
            var t = document.createElement('textarea');
            t.value = text; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
            document.body.appendChild(t); t.select();
            try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
            document.body.removeChild(t);
          }
        });
      });
    })();

    /* ---------- FORM ---------- */
    (function contactForm() {
      var form = document.getElementById('ct-form');
      if (!form) return;
      var done = document.getElementById('ct-done');
      var again = document.getElementById('ct-again');
      var status = document.getElementById('ct-status');
      var submit = document.getElementById('ct-submit');
      var head = form.parentElement.querySelector('.ct-card-head');

      var rules = {
        name: function (v) { return v.trim().length < 2 ? 'Please enter your full name.' : ''; },
        email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
        phone: function (v) { var d = v.replace(/\D/g, ''); return (d.length < 7 || d.length > 15 || !/^[+\d\s().-]+$/.test(v.trim())) ? 'Please enter a valid mobile number.' : ''; },
        country: function (v) { return v ? '' : 'Please select your country.'; },
        category: function (v) { return v ? '' : 'Please choose a category.'; },
        message: function (v) { return v.trim().length < 10 ? 'Please tell us a little more (at least 10 characters).' : ''; }
      };
      var errIds = { name: 'err-name', email: 'err-email', phone: 'err-phone', country: 'err-country', category: 'err-cat', message: 'err-msg' };

      function check(name) {
        var el = form.elements[name];
        var msg = rules[name](el.value || '');
        var wrap = el.closest('.ct-field');
        var out = document.getElementById(errIds[name]);
        wrap.classList.toggle('is-bad', !!msg);
        out.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) el.setAttribute('aria-describedby', errIds[name]); else el.removeAttribute('aria-describedby');
        return !msg;
      }

      Object.keys(rules).forEach(function (name) {
        var el = form.elements[name];
        el.addEventListener('blur', function () { check(name); });
        el.addEventListener('input', function () { if (el.closest('.ct-field').classList.contains('is-bad')) check(name); });
        el.addEventListener('change', function () { if (el.closest('.ct-field').classList.contains('is-bad')) check(name); });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        status.textContent = '';
        var firstBad = null;
        Object.keys(rules).forEach(function (name) {
          if (!check(name) && !firstBad) firstBad = form.elements[name];
        });
        if (firstBad) { firstBad.focus(); return; }

        var payload = {};
        Array.prototype.slice.call(form.elements).forEach(function (el) { if (el.name) payload[el.name] = el.value; });
        payload.page = location.href;

        submit.disabled = true;
        submit.firstChild.nodeValue = 'Sending… ';

        var send = ENDPOINT
          ? fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (r) { if (!r.ok) throw new Error('Request failed'); })
          : new Promise(function (res) { setTimeout(res, 700); });

        send.then(function () {
          form.hidden = true;
          if (head) head.hidden = true;
          done.hidden = false;
          done.querySelector('h3').setAttribute('tabindex', '-1');
          done.querySelector('h3').focus();
        }).catch(function () {
          status.textContent = 'Something went wrong. Please try again or email info@codevelop.us.';
        }).then(function () {
          submit.disabled = false;
          submit.firstChild.nodeValue = 'Submit ';
        });
      });

      again.addEventListener('click', function () {
        form.reset();
        Array.prototype.slice.call(form.querySelectorAll('.ct-field')).forEach(function (f) { f.classList.remove('is-bad'); });
        Array.prototype.slice.call(form.querySelectorAll('.ct-err')).forEach(function (o) { o.textContent = ''; });
        if (form._setTopic) form._setTopic('');
        done.hidden = true; form.hidden = false;
        if (head) head.hidden = false;
        document.getElementById('ct-name').focus();
      });
    })();
  });
})();