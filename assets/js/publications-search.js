/*
 * Client-side search and year filter for /publications/.
 *
 * The full list is rendered by Jekyll at build time; this only hides and shows
 * what is already on the page, so the page still works with scripting off (the
 * toolbar stays hidden until this file runs).
 */
(function () {
  'use strict';

  var root = document.querySelector('.publications');
  if (!root) return;

  var toolbar = root.querySelector('.pub-search');
  var input = document.getElementById('pub-search-input');
  var yearSelect = document.getElementById('pub-year-filter');
  var clearBtn = document.getElementById('pub-search-clear');
  var status = document.getElementById('pub-search-status');
  var yearNav = root.querySelector('.pub-year-nav');
  if (!toolbar || !input || !yearSelect || !clearBtn || !status) return;

  var items = [].slice.call(root.querySelectorAll('ol.bibliography > li'));
  var headings = [].slice.call(root.querySelectorAll('h2.year[data-year-heading]'));
  var lists = [].slice.call(root.querySelectorAll('ol.bibliography[data-year-list]'));
  var total = items.length;
  if (!total) return;

  /* Entries are separated by a trailing <br>; it has to hide with its entry. */
  var trailingBr = items.map(function (li) {
    var next = li.nextElementSibling;
    return next && next.tagName === 'BR' ? next : null;
  });

  var empty = document.createElement('p');
  empty.className = 'pub-search-empty';
  empty.hidden = true;
  toolbar.parentNode.insertBefore(empty, toolbar.nextSibling);

  function terms() {
    return input.value.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function plural(n) {
    return n === 1 ? 'publication' : 'publications';
  }

  function apply() {
    var words = terms();
    var year = yearSelect.value;
    var shown = 0;

    items.forEach(function (li, i) {
      var haystack = li.getAttribute('data-search') || '';
      var match = (!year || li.getAttribute('data-year') === year) &&
        words.every(function (word) { return haystack.indexOf(word) !== -1; });

      li.hidden = !match;
      if (trailingBr[i]) trailingBr[i].hidden = !match;
      if (match) shown++;
    });

    /* Drop year headings that no longer have any entries under them. */
    lists.forEach(function (list) {
      var listYear = list.getAttribute('data-year-list');
      var hasVisible = !!list.querySelector('li:not([hidden])');
      list.hidden = !hasVisible;
      headings.forEach(function (heading) {
        if (heading.getAttribute('data-year-heading') === listYear) {
          heading.hidden = !hasVisible;
        }
      });
    });

    var filtering = words.length > 0 || year !== '';
    if (yearNav) yearNav.hidden = filtering;
    clearBtn.hidden = !filtering;
    empty.hidden = shown !== 0;
    if (shown === 0) {
      empty.textContent = 'No publications match ' +
        (input.value.trim() ? '“' + input.value.trim() + '”' : 'this filter') +
        (year ? ' in ' + year : '') + '.';
    }

    status.textContent = filtering
      ? 'Showing ' + shown + ' of ' + total + ' ' + plural(total)
      : total + ' ' + plural(total);
  }

  /* Keep the query in the URL so a filtered view can be linked or reloaded. */
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams(window.location.search);
    var query = input.value.trim();

    if (query) params.set('q', query); else params.delete('q');
    if (yearSelect.value) params.set('year', yearSelect.value); else params.delete('year');

    var search = params.toString();
    window.history.replaceState(null, '',
      window.location.pathname + (search ? '?' + search : '') + window.location.hash);
  }

  function update() {
    apply();
    syncUrl();
  }

  var debounce;
  input.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(update, 120);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) {
      input.value = '';
      update();
    }
  });

  yearSelect.addEventListener('change', update);

  clearBtn.addEventListener('click', function () {
    input.value = '';
    yearSelect.value = '';
    update();
    input.focus();
  });

  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get('q');
  var initialYear = params.get('year');
  if (initialQuery) input.value = initialQuery;
  if (initialYear && yearSelect.querySelector('option[value="' + initialYear + '"]')) {
    yearSelect.value = initialYear;
  }

  toolbar.hidden = false;
  apply();
})();
