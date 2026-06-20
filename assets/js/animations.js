/* [Company] Security — animations.js : scroll reveal + tilt + parallax */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Reveal on scroll ----
  var items = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  if (reduce) return;

  // ---- 3D tilt on cards ----
  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    var rect;
    card.classList.add('tilt');
    card.addEventListener('mouseenter', function () { rect = card.getBoundingClientRect(); });
    card.addEventListener('mousemove', function (e) {
      if (!rect) rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = 'perspective(900px) rotateY(' + (x * 7) + 'deg) rotateX(' + (-y * 7) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  });

  // ---- Subtle parallax for hero float cards ----
  var floats = document.querySelectorAll('[data-parallax]');
  if (floats.length) {
    window.addEventListener('mousemove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      floats.forEach(function (f) {
        var depth = parseFloat(f.getAttribute('data-parallax')) || 12;
        f.style.transform = 'translate3d(' + (cx * depth) + 'px,' + (cy * depth) + 'px,0)';
      });
    }, { passive: true });
  }
})();
