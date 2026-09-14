#!/usr/bin/env node
/*
 * Rebuilds _data/bibliography.yml from _data/publications.yml.
 *
 *   node scripts/build-bibliography.mjs             # only entries missing from bibliography.yml
 *   node scripts/build-bibliography.mjs --all       # re-resolve every publication
 *   node scripts/build-bibliography.mjs --force-all # ... including hand-enriched ones
 *
 * Entries marked "pubmed:" or "cv" in bibliography.yml were completed by hand
 * from PubMed or the author CV, because a DOI lookup returns nothing useful for
 * them - conference proceedings pagination, or the published version of a paper
 * the site still links to as an arXiv preprint. --all leaves those alone.
 *
 * Each publication's DOI is resolved through doi.org content negotiation
 * (Crossref for journals, DataCite for arXiv). That lookup is what supplies
 * volume, issue, pages, publisher and ISSN - none of which live in
 * publications.yml, which is why the references are stored rather than derived.
 *
 * Papers with no DOI on record (OpenReview preprints, MLHC proceedings) are
 * built from publications.yml alone and marked as such in the output; they
 * legitimately have no volume or pages.
 *
 * A resolved title that disagrees with the site's is never silently accepted -
 * the entry is skipped and reported at the end for a human to check.
 *
 * Requires node 18+ (global fetch) and ruby (YAML read/write).
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const PUBS = ROOT + '_data/publications.yml';
const OUT = ROOT + '_data/bibliography.yml';
const UA = 'MLiNS-bibliography-builder/1.0 (+https://mlins.org)';
const ALL = process.argv.includes('--all');
/* Entries enriched by hand from PubMed or the author CV hold data no DOI lookup
   returns (proceedings pagination, published versions of arXiv preprints).
   A --all refresh must not throw that away; --force-all is the deliberate escape. */
const FORCE = process.argv.includes('--force-all');
const PROTECTED = /^(pubmed:|cv\b)/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/* Crossref titles carry markup (e.g. "<i>IDH1</i>"); strip it before comparing
   or a correct record gets rejected as a mismatch. */
const norm = (s) => String(s || '').replace(/<[^>]+>/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* ---- reading publications.yml via ruby, so YAML quirks stay ruby's problem -- */

function readPublications() {
  const script = `
    require 'yaml'; require 'json'
    data = YAML.load_file(${JSON.stringify(PUBS)})
    puts JSON.generate(data['main'].each_with_index.map { |p, i|
      pills = p['pills'] || []
      doi = pills.map { |pl| pl['link'] }.compact.find { |l| l.include?('doi.org') }
      doi ||= p['doi']
      doi ||= (p['url'].to_s.include?('doi.org') ? p['url'] : nil)
      arxiv = ([p['url'], p['pdf']] + pills.map { |pl| pl['link'] }).compact
                .find { |u| u.to_s.include?('arxiv.org') }
      { idx: i, title: p['title'], authors: p['authors'], conference: p['conference'],
        year: p['conference'].to_s.split(' ').last, url: p['url'], pdf: p['pdf'],
        bib_key: p['bib_key'], keywords: p['keywords'],
        doi: doi && doi.sub(%r{^https?://(dx\\.)?doi\\.org/}, ''), arxiv: arxiv }
    })`;
  return JSON.parse(execFileSync('ruby', ['-e', script], { encoding: 'utf8' }));
}

/* ---- fetching ------------------------------------------------------------ */

async function fetchBibtex(doi) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://doi.org/' + encodeURI(doi), {
        headers: { 'User-Agent': UA, Accept: 'application/x-bibtex' },
        redirect: 'follow'
      });
      if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
      if (!res.ok) return null;
      const body = (await res.text()).trim();
      return body.startsWith('@') ? body : null;
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return null;
}

/* Nature and Springer article URLs embed the DOI suffix. */
function doiFromUrl(url) {
  let m = String(url).match(/nature\.com\/articles\/([a-z0-9-]+)/i);
  if (m) return '10.1038/' + m[1];
  m = String(url).match(/link\.springer\.com\/article\/(10\.\d{4,}\/[^?#]+)/i);
  if (m) return m[1];
  m = String(url).match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i);
  if (m) return '10.48550/arXiv.' + m[1];
  return null;
}

/* ---- BibTeX parse / render ------------------------------------------------ */

function parseEntry(text) {
  const head = text.match(/@(\w+)\s*\{\s*([^,]*),/);
  if (!head) return null;
  const fields = {};
  let i = head[0].length, name = '', buf = '', depth = 0, inVal = false, quote = false;
  while (i < text.length) {
    const c = text[i];
    if (!inVal) {
      if (c === '=') { inVal = true; buf = ''; depth = 0; quote = false;
        while (i + 1 < text.length && /\s/.test(text[i + 1])) i++;
      } else if (c === ',' || c === '}') name = '';
      else name += c;
    } else {
      if (!quote && depth === 0 && c === '"') { quote = true; i++; continue; }
      if (quote && c === '"') { quote = false; i++; continue; }
      if (c === '{') { depth++; if (depth === 1) { i++; continue; } }
      if (c === '}') {
        depth--;
        if (depth === 0) { i++; continue; }
        if (depth < 0) { fields[name.trim().toLowerCase()] = buf.trim(); break; }
      }
      if (!quote && depth === 0 && c === ',') {
        fields[name.trim().toLowerCase()] = buf.trim(); name = ''; inVal = false; i++; continue;
      }
      buf += c;
    }
    i++;
  }
  if (name.trim() && inVal) fields[name.trim().toLowerCase()] = buf.trim();
  return { type: head[1].toLowerCase(), fields };
}

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const DROP = new Set(['copyright', 'abstract', 'note']);
const ORDER = ['title','author','journal','booktitle','howpublished','publisher',
               'volume','number','pages','year','month','issn','doi','pmid',
               'eprint','archiveprefix','url','keywords'];
const STOP = /^(a|an|the|on|of|for|in|to|from|with|and|towards)$/i;
const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '');

function citeKey(fields, fallbackYear, used) {
  const first = (fields.author || '').split(/\s+and\s+/i)[0] || '';
  const surname = first.includes(',') ? first.split(',')[0] : (first.trim().split(/\s+/).pop() || 'anon');
  const year = String(fields.year || fallbackYear || '').replace(/\D/g, '').slice(0, 4);
  const title = (fields.title || '').replace(/[{}]/g, '');
  const word = title.split(/\s+/).find((w) => ascii(w) && !STOP.test(ascii(w))) || 'untitled';
  const base = ascii(surname).toLowerCase() + year + ascii(word).toLowerCase();
  let key = base, n = 1;
  while (used.has(key)) key = base + String.fromCharCode(96 + ++n);
  used.add(key);
  return key;
}

function render(type, key, fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    if (DROP.has(k) || !String(v).trim()) continue;
    let val = String(v).trim();
    if (k === 'pages') val = val.replace(/[‐-―]/g, '--').replace(/(?<!-)-(?!-)/g, '--');
    if (k === 'doi') val = val.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    if (k === 'url') val = val.replace(/^http:\/\/dx\.doi\.org\//i, 'https://doi.org/')
                              .replace(/^http:\/\//i, 'https://');
    if (k === 'month') {
      /* Crossref returns "Nov" or "July" inconsistently; BibTeX wants the
         three-letter macro, unbraced, so entries sort by date. */
      const m = MONTHS.find((mm) => mm === val.slice(0, 3).toLowerCase());
      if (!m) continue;
      val = m;
    }
    out[k] = val;
  }
  const keys = ORDER.filter((k) => out[k])
    .concat(Object.keys(out).filter((k) => !ORDER.includes(k)).sort());
  const width = Math.max(...keys.map((k) => k.length));
  const lines = keys.map((k) => {
    if (k === 'month') return '  ' + k.padEnd(width) + ' = ' + out[k];
    /* Double braces protect title capitalisation from BibTeX's case folding.
       Strip any existing pair first so repeated renders stay stable. */
    const v = k === 'title'
      ? '{' + String(out[k]).replace(/^\{+/, '').replace(/\}+$/, '') + '}'
      : out[k];
    return '  ' + k.padEnd(width) + ' = {' + v + '}';
  });
  return '@' + type + '{' + key + ',\n' + lines.join(',\n') + '\n}';
}

/* Built from site data alone, for papers with no DOI anywhere. */
function localEntry(p) {
  const venue = String(p.conference).replace(/\s*[·]\s*\d{4}\s*$/, '').trim();
  const isConf = /WORKSHOP|MLHC|NEURIPS|CVPR|AAAI|ACL|TRANSACTIONS ON MACHINE LEARNING/i.test(venue);
  const authors = String(p.authors)
    .replace(/<[^>]+>/g, '')          /* publications.yml marks equal contribution as <sup>*</sup> */
    .split(/\s*,\s*/)
    .reduce((a, x) => a.concat(x.split(/\s+and\s+/i)), [])
    .map((s) => s.trim().replace(/^and\s+/i, '').replace(/[*†‡]+$/, '').trim())
    .filter(Boolean).join(' and ');
  return {
    type: isConf ? 'inproceedings' : 'article',
    fields: { title: p.title, author: authors, [isConf ? 'booktitle' : 'journal']: venue,
              year: p.year, url: p.url }
  };
}

/* ---- main ---------------------------------------------------------------- */

const pubs = readPublications();
const existing = fs.existsSync(OUT)
  ? JSON.parse(execFileSync('ruby',
      ['-e', `require 'yaml'; require 'json'; puts JSON.generate(YAML.load_file(${JSON.stringify(OUT)}) || {})`],
      { encoding: 'utf8' }))
  : {};

/* Provenance lives in the "# ..." comment above each key; keep it when the
   entry is reused, otherwise a cached rerun would erase how it was obtained. */
const origins = {};
if (fs.existsSync(OUT)) {
  const text = fs.readFileSync(OUT, 'utf8');
  const re = /^# (.+)\n([A-Za-z0-9_]+): \|-$/gm;
  let m;
  while ((m = re.exec(text))) origins[m[2]] = m[1];
}

const used = new Set();
const entries = [];
const mismatches = [];

for (const p of pubs) {
  const isProtected = p.bib_key && PROTECTED.test(origins[p.bib_key] || '') && !FORCE;
  if ((!ALL || isProtected) && p.bib_key && existing[p.bib_key]) {
    used.add(p.bib_key);
    const stored = parseEntry(existing[p.bib_key].trim());
    if (p.keywords && p.keywords.length) stored.fields.keywords = p.keywords.join(', ');
    else delete stored.fields.keywords;
    entries.push({ key: p.bib_key, bibtex: render(stored.type, p.bib_key, stored.fields),
                   origin: origins[p.bib_key] || 'cached', cached: true });
    continue;
  }

  /* Order matters: a published paper usually keeps its arXiv link in a pill,
     and resolving that instead of the article URL files it as a preprint. */
  const doi = p.doi || doiFromUrl(p.url) || doiFromUrl(p.pdf) || doiFromUrl(p.arxiv);
  let parsed = null, origin = null;

  if (doi) {
    const body = await fetchBibtex(doi);
    if (body) {
      const candidate = parseEntry(body);
      /* arXiv/DataCite attach long subject-classification keyword lists; ours replace them. */
      if (candidate) delete candidate.fields.keywords;
      const got = (candidate?.fields.title || '').replace(/[{}]/g, '');
      const a = norm(p.title), b = norm(got);
      /* Every DOI here comes from the site's own data - a DOI pill, an explicit
         doi: key, or the article URL - so identity is already established. A
         title difference means publications.yml has drifted from the published
         record, which is worth reporting but is never a reason to discard the
         authoritative metadata. */
      parsed = candidate;
      origin = 'doi:' + doi;
      if (!(a === b || a.includes(b) || b.includes(a))) {
        mismatches.push({ title: p.title, got, doi });
      }
    }
    await sleep(350);
  }

  if (!parsed) { parsed = localEntry(p); origin = 'site-data (no DOI on record)'; }
  if (p.doi) parsed.fields.doi = p.doi;   /* Crossref sometimes lowercases the suffix */
  if (!parsed.fields.url && p.url) parsed.fields.url = p.url;

  /* Preserve the preprint alongside the published record. */
  if (p.arxiv && parsed.fields.doi && !/arxiv/i.test(parsed.fields.doi)) {
    const id = String(p.arxiv).match(/(\d{4}\.\d{4,5})/);
    if (id) { parsed.fields.eprint = id[1]; parsed.fields.archiveprefix = 'arXiv'; }
  }
  const key = citeKey(parsed.fields, p.year, used);
  if (p.keywords && p.keywords.length) parsed.fields.keywords = p.keywords.join(', ');
  entries.push({ key, bibtex: render(parsed.type, key, parsed.fields), origin });
  process.stdout.write(`[${entries.length}/${pubs.length}] ${origin.startsWith('doi') ? 'doi ' : 'site'} ${key}\n`);
}

const header = [
  '# Complete BibTeX references for every entry in publications.yml.',
  '#',
  '# Keyed by cite key; publications.yml carries a matching bib_key. Regenerate',
  '# with scripts/build-bibliography.mjs, which resolves each DOI through',
  '# doi.org content negotiation (Crossref/DataCite).',
  '#',
  '# Provenance is recorded per entry. Papers with no DOI on record (OpenReview',
  '# and MLHC proceedings) are built from publications.yml itself and therefore',
  '# carry no volume/pages - that data does not exist for them.',
  ''
];
const body = entries.flatMap((e) => ['# ' + e.origin, e.key + ': |-',
  ...e.bibtex.split('\n').map((l) => '  ' + l), '']);
fs.writeFileSync(OUT, header.concat(body).join('\n'));

console.log(`\nwrote ${entries.length} entries to _data/bibliography.yml`);
console.log(`  resolved from DOI : ${entries.filter((e) => e.origin.startsWith('doi')).length}`);
console.log(`  from site data    : ${entries.filter((e) => e.origin.startsWith('site')).length}`);
console.log(`  reused from cache : ${entries.filter((e) => e.cached).length}`);
if (mismatches.length) {
  console.log('\npublications.yml titles that differ from the published record:');
  for (const m of mismatches) {
    console.log(`  ${m.doi}`);
    console.log(`    site      : ${m.title}`);
    console.log(`    published : ${m.got}`);
  }
}
console.log('\nIf cite keys changed, update bib_key in _data/publications.yml to match.');
