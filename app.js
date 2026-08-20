/* Fostr — micro-interactions. Vanilla, no dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- current year ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- sticky nav state + scroll progress ---- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('progress');
  var ticking = false;

  var paint = function () {
    ticking = false;
    nav.classList.toggle('is-stuck', window.scrollY > 8);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progress.style.transform = 'scaleX(' + ratio + ')';
  };

  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  };

  paint();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---- mobile menu ---- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobilemenu');

  var setMenu = function (open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1000) setMenu(false);
  });

  /* ---- reveal on scroll ---- */
  var revealables = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---- highlight the nav link for the page you are on ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  var targets = navLinks
    .map(function (link) {
      var el = document.querySelector(link.getAttribute('href'));
      return el ? { link: link, el: el } : null;
    })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var visible = {};

    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });

      var best = null;
      targets.forEach(function (t) {
        var score = visible[t.el.id] || 0;
        if (score > 0.25 && (!best || score > best.score)) best = { t: t, score: score };
      });

      targets.forEach(function (t) {
        t.link.classList.toggle('is-active', !!best && best.t === t);
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    targets.forEach(function (t) { navIO.observe(t.el); });
  }

  /* ---- count up the hero amounts once they are on screen ---- */
  var counters = document.querySelectorAll('[data-count]');

  var animateCount = function (el) {
    var target = parseFloat(el.dataset.count);
    var decimals = (el.dataset.count.split('.')[1] || '').length;
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var duration = 1100;
    var start;

    var frame = function (now) {
      if (!start) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  if (!reduced && 'IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countIO.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---- gentle pointer parallax on the hero stage ---- */
  var stage = document.getElementById('stage');

  if (stage && !reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var frameQueued = false;
    var tx = 0;
    var ty = 0;

    var apply = function () {
      frameQueued = false;
      stage.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
    };

    window.addEventListener('mousemove', function (e) {
      var rect = stage.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      tx = ((e.clientX - cx) / rect.width) * 14;
      ty = ((e.clientY - cy) / rect.height) * 12;

      if (!frameQueued) {
        frameQueued = true;
        requestAnimationFrame(apply);
      }
    }, { passive: true });

    stage.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      requestAnimationFrame(apply);
    });
  }

  /* ---- the sample creator page is lightly interactive ---- */
  var mock = document.getElementById('mock');

  if (mock) {
    var chips = Array.prototype.slice.call(mock.querySelectorAll('.chip'));
    var mockBtn = document.getElementById('mockBtn');
    var thanksTimer;

    var syncButton = function () {
      if (!mockBtn) return;
      var active = mock.querySelector('.chip.is-on');
      mockBtn.textContent = active ? 'Support Maya · ' + active.textContent : 'Support Maya';
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) {
          c.classList.toggle('is-on', c === chip);
          c.setAttribute('aria-pressed', String(c === chip));
        });
        syncButton();
      });
    });

    syncButton();

    if (mockBtn) {
      mockBtn.addEventListener('click', function () {
        mock.classList.add('is-thanks');
        clearTimeout(thanksTimer);
        thanksTimer = setTimeout(function () {
          mock.classList.remove('is-thanks');
        }, 2400);
      });
    }
  }

})();
