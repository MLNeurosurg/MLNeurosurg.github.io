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

    /* The export follows the filter, so say how many it will contain. */
    if (bibBtn) {
      bibBtn.textContent = 'Download BibTeX (' + shown + ')';
      bibBtn.disabled = shown === 0;
    }
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

  /* ---- BibTeX export -------------------------------------------------
   * Entries are read back out of the rendered list rather than duplicated
   * into a data blob, so the export cannot drift from what is on the page.
   * The source YAML has no volume/issue/pages, so neither does the output;
   * the DOI is there for a reference manager to fill in the rest.
   */

  var bibBtn = document.getElementById('pub-bib-download');

  /* Complete references, resolved from each paper's DOI at build time and
     stored in _data/bibliography.yml. An entry added to publications.yml
     before it has been looked up simply falls back to the derived form. */
  var stored = {};
  try {
    var storeEl = document.getElementById('pub-bibtex-data');
    if (storeEl) stored = JSON.parse(storeEl.textContent) || {};
  } catch (e) {
    stored = {};
  }

  var CONFERENCE = /(COMPUTER VISION AND PATTERN RECOGNITION|CVPR|NEURIPS|ICML|ICLR|AAAI|ACL|MLHC|WORKSHOP)/i;
  var PREPRINT = /(ARXIV|MEDRXIV|BIORXIV)/i;
  var STOPWORDS = /^(a|an|the|on|of|for|in|to|from|with|and)$/i;

  function ascii(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '');
  }

  /* "A, B, and C" and "A and B" both become BibTeX's "A and B and C".
   * The final comma-separated part arrives as "and C", which no infix split
   * can catch, so the leading conjunction is stripped explicitly.
   * Trailing *, dagger etc. mark equal contribution and are not part of a name. */
  function authorList(text) {
    return text.split(/\s*,\s*/)
      .reduce(function (acc, part) { return acc.concat(part.split(/\s+and\s+/i)); }, [])
      .map(function (name) {
        return name.trim()
          .replace(/^and\s+/i, '')
          .replace(/[*\u2020\u2021\u00a7#]+$/, '')
          .trim();
      })
      .filter(Boolean)
      .join(' and ');
  }

  function escapeBib(text) {
    return text.replace(/[\\]/g, '\\textbackslash{}')
               .replace(/([&%$#_{}])/g, '\\$1');
  }

  function entryFor(li, usedKeys) {
    var titleEl = li.querySelector('.title a') || li.querySelector('.title');
    var authorEl = li.querySelector('.author');
    var venueEl = li.querySelector('.periodical em') || li.querySelector('.periodical');
    if (!titleEl || !authorEl || !venueEl) return null;

    var title = titleEl.textContent.trim();
    var authors = authorList(authorEl.textContent.trim());
    var year = li.getAttribute('data-year') || '';
    /* The venue string is "NAME · YEAR"; drop the year half. */
    var venue = venueEl.textContent.replace(/\s*[\u00b7]\s*\d{4}\s*$/, '').trim();

    var doiLink = li.querySelector('a[href*="doi.org"]');
    var doi = doiLink ? doiLink.getAttribute('href').replace(/^https?:\/\/(dx\.)?doi\.org\//, '') : '';
    var url = titleEl.getAttribute('href') || '';

    var first = authors.split(' and ')[0] || '';
    var surname = ascii(first.split(/\s+/).pop() || 'anon').toLowerCase();
    var word = (title.split(/\s+/).find(function (w) { return !STOPWORDS.test(ascii(w)); }) || 'untitled');
    var base = surname + year + ascii(word).toLowerCase();
    var key = base, n = 1;
    while (usedKeys[key]) { key = base + String.fromCharCode(96 + ++n); }
    usedKeys[key] = true;

    var type, venueField;
    if (PREPRINT.test(venue)) { type = 'misc'; venueField = 'howpublished'; }
    else if (CONFERENCE.test(venue)) { type = 'inproceedings'; venueField = 'booktitle'; }
    else { type = 'article'; venueField = 'journal'; }

    var lines = ['@' + type + '{' + key + ','];
    /* Double braces keep the title's capitalisation intact through BibTeX. */
    lines.push('  title        = {{' + escapeBib(title) + '}},');
    lines.push('  author       = {' + escapeBib(authors) + '},');
    lines.push('  ' + venueField + (venueField === 'journal' ? '      ' : venueField === 'booktitle' ? '    ' : ' ') +
               '= {' + escapeBib(venue) + '},');
    if (year) lines.push('  year         = {' + year + '},');
    if (doi) lines.push('  doi          = {' + escapeBib(doi) + '},');
    if (url) lines.push('  url          = {' + url + '},');
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
    lines.push('}');
    return lines.join('\n');
  }

  function buildBibtex() {
    var visible = items.filter(function (li) { return !li.hidden; });
    var used = {};
    var derived = 0;
    var body = visible.map(function (li) {
      var key = li.getAttribute('data-bib-key');
      if (key && stored[key]) return stored[key];
      derived++;
      return entryFor(li, used);
    }).filter(Boolean).join('\n\n');
    var stamp = new Date().toISOString().slice(0, 10);
    var header = [
      '% MLiNS Lab publications - ' + visible.length + ' of ' + total + ' entries',
      '% Exported ' + stamp + ' from ' + window.location.origin + window.location.pathname,
      '% References resolved from each paper\'s DOI via Crossref/DataCite.'
    ];
    if (derived) {
      header.push('% ' + derived + ' entr' + (derived === 1 ? 'y has' : 'ies have') +
                  ' no DOI on record and is built from site data alone.');
    }
    header.push('');
    header = header.join('\n');
    return header + '\n' + body + '\n';
  }

  function downloadBibtex() {
    var blob = new Blob([buildBibtex()], { type: 'application/x-bibtex;charset=utf-8' });
    var href = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = href;
    a.download = 'mlins-publications.bib';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
  }

  if (bibBtn) bibBtn.addEventListener('click', downloadBibtex);

  /* ---- keyword chips ----------------------------------------------
   * The chips render as plain list items so they stay readable with no JS.
   * Here they become real controls: click or Enter/Space searches that term.
   */
  function searchFor(term) {
    input.value = term;
    yearSelect.value = '';
    update();
    var heading = root.querySelector('.pub-search');
    if (heading && heading.scrollIntoView) heading.scrollIntoView({ block: 'start' });
  }

  [].slice.call(root.querySelectorAll('.pub-keyword[data-keyword]')).forEach(function (chip) {
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    var term = chip.getAttribute('data-keyword');
    chip.setAttribute('aria-label', 'Search publications for ' + term);

    chip.addEventListener('click', function () { searchFor(term); });
    chip.addEventListener('keydown', function (event) {
      /* Space scrolls the page by default; a control must not. */
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        searchFor(term);
      }
    });
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
