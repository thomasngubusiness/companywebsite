/* VNT Security — theme.js
   Auto day/night: light 07:00–18:59, dark otherwise. Re-checked every minute so
   an open tab flips at the boundary. The manual toggle sets a SESSION-only
   override (resets next visit) so the site keeps following the clock. */
(function () {
  'use strict';
  var root = document.documentElement;
  function autoTheme() { var h = new Date().getHours(); return (h >= 7 && h < 19) ? 'light' : 'dark'; }
  function getOverride() { try { return sessionStorage.getItem('theme-override'); } catch (e) { return null; } }
  function setIcons(t) {
    document.querySelectorAll('#themeToggle,[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    });
  }
  function apply(t, manual) {
    root.setAttribute('data-theme', t);
    if (manual) { try { sessionStorage.setItem('theme-override', t); } catch (e) {} }
    setIcons(t);
  }
  // Clear any legacy permanent preference so time-following works again.
  try { localStorage.removeItem('theme'); } catch (e) {}

  apply(getOverride() || autoTheme(), false);

  function wire() {
    document.querySelectorAll('#themeToggle,[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
      });
    });
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // Follow the clock on long-open tabs (no manual override active).
  setInterval(function () { if (!getOverride()) apply(autoTheme(), false); }, 60000);
})();
