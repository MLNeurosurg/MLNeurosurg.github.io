// Light/dark theme toggle. Loaded in <head> so the saved theme is applied
// before first paint; the button itself is wired up once the DOM is ready.
(function () {
  var KEY = 'theme';
  var root = document.documentElement;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
  }

  apply(saved() === 'dark' ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;

    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
      button.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      sync();
    });
    sync();
  });
})();
