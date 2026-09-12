<div class="publications">

{% comment %} Collect unique publication years by extracting the trailing year from each conference string. {% endcomment %}
{% assign year_set = "" %}
{% for link in site.data.publications.main %}
  {% assign _yr = link.conference | split: ' ' | last | strip %}
  {% unless year_set contains _yr %}
    {% assign year_set = year_set | append: _yr | append: "," %}
  {% endunless %}
{% endfor %}
{% assign years = year_set | split: "," | sort | reverse %}

{% comment %} Search + year filter. Hidden until JS enables it, so the full
list stays readable when scripting is unavailable. {% endcomment %}
<div class="pub-search" role="search" hidden>
<div class="pub-search-fields">
<label class="pub-search-field" for="pub-search-input"><span class="pub-search-label">Search</span>
<input type="search" id="pub-search-input" autocomplete="off" placeholder="Title, author, venue, or keyword">
</label>
<label class="pub-search-field pub-search-field-year" for="pub-year-filter"><span class="pub-search-label">Year</span>
<select id="pub-year-filter">
<option value="">All</option>
{% for y in years %}{% unless y == "" %}<option value="{{ y }}">{{ y }}</option>{% endunless %}{% endfor %}
</select>
</label>
<button type="button" class="pub-search-clear" id="pub-search-clear" hidden>Clear</button>
</div>
<p class="pub-search-status" id="pub-search-status" aria-live="polite" role="status"></p>
</div>

<nav class="pub-year-nav" aria-label="Jump to publications by year">
{% assign first_year_link = true %}
{% for y in years %}
{% unless y == "" %}
  {% unless first_year_link %}<span class="pub-year-sep" aria-hidden="true">|</span>{% endunless %}
  <a href="#pub-year-{{ y }}">{{ y }}</a>
  {% assign first_year_link = false %}
{% endunless %}
{% endfor %}
</nav>

{% for y in years %}
{% unless y == "" %}

<h2 class="year" id="pub-year-{{ y }}" data-year-heading="{{ y }}"><span>{{ y }}</span></h2>

<ol class="bibliography" data-year-list="{{ y }}">
{% for link in site.data.publications.main %}
{% assign _link_year = link.conference | split: ' ' | last | strip %}
{% if _link_year == y %}

{% comment %} Venue aliases: several venues are stored spelled out, so a search for
the acronym everyone actually types (CVPR, JNS, TMLR) would otherwise miss them.
Additive only - an unlisted venue just gets no alias. {% endcomment %}
{% assign _venue = link.conference | upcase %}
{% assign _alias = "" %}
{% if _venue contains "COMPUTER VISION AND PATTERN RECOGNITION" %}{% assign _alias = _alias | append: " cvpr" %}{% endif %}
{% if _venue contains "TRANSACTIONS ON MACHINE LEARNING RESEARCH" %}{% assign _alias = _alias | append: " tmlr" %}{% endif %}
{% if _venue contains "JOURNAL OF NEUROSURGERY" %}{% assign _alias = _alias | append: " jns" %}{% endif %}
{% if _venue contains "NATURE BIOMEDICAL ENGINEERING" %}{% assign _alias = _alias | append: " nbme" %}{% endif %}
{% if _venue contains "NEURIPS" %}{% assign _alias = _alias | append: " neural information processing systems" %}{% endif %}
{% if _venue contains "MLHC" %}{% assign _alias = _alias | append: " machine learning for healthcare" %}{% endif %}
{% if _venue contains "NEJM" %}{% assign _alias = _alias | append: " new england journal of medicine" %}{% endif %}
{% capture _haystack %}{{ link.title }} {{ link.authors }} {{ link.conference }} {{ link.conference_short }} {{ link.search_terms }}{{ _alias }} {{ link.description | strip_html | replace: '*', '' | replace: '_', ' ' }}{% endcapture %}
<li data-year="{{ y }}" data-search="{{ _haystack | normalize_whitespace | downcase | escape }}">
<div class="pub-row">
  <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
    {% if link.venue_logo %}
    {% assign _logo = link.venue_logo | replace: './', '/' %}
    <img src="{{ _logo | relative_url }}" class="venue-logo" alt="{% if link.conference_short %}{{ link.conference_short }}{% else %}Venue{% endif %}">
    {% endif %}
    {% if link.image or link.conference_short %}
    <div class="teaser-with-badge">
      {% if link.image %}
      {% assign _teaser = link.image | replace: './', '/' %}
      <img src="{{ _teaser | relative_url }}" class="teaser img-fluid z-depth-1" alt="Figure from: {{ link.title | escape }}" style="width=100;height=40%">
      {% endif %}
      {% if link.conference_short %}
      <abbr class="badge">{{ link.conference_short }}</abbr>
      {% endif %}
    </div>
    {% endif %}
  </div>
  <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
      {% assign _title_href = link.url | default: link.pdf %}
      <div class="title"><a href="{{ _title_href | relative_url }}" target="_blank" rel="noopener">{{ link.title }}</a></div>
      <div class="author">{{ link.authors }}</div>
      <div class="periodical"><em>{{ link.conference }}</em>
      </div>
      {% if link.description %}
      <div class="pub-description">{{ link.description | markdownify }}</div>
      {% endif %}
    <div class="links">
      {% if link.pills and link.pills.size > 0 %}
      {% for pill in link.pills %}
      <a href="{{ pill.link | relative_url }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">{{ pill.title }}</a>
      {% endfor %}
      {% else %}
      {% if link.pdf %}
      <a href="{{ link.pdf | relative_url }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">PDF</a>
      {% endif %}
      {% if link.code %}
      <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">Code</a>
      {% endif %}
      {% if link.demo %}
      <a href="{{ link.demo | relative_url }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">Demo</a>
      {% endif %}
      {% if link.page %}
      <a href="{{ link.page | relative_url }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">Project Page</a>
      {% endif %}
      {% if link.bibtex %}
      <a href="{{ link.bibtex }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">BibTex</a>
      {% endif %}
      {% endif %}
      {% if link.notes %}
      <strong> <i style="color:#e74d3c">{{ link.notes }}</i></strong>
      {% endif %}
      {% if link.others %}
      {{ link.others }}
      {% endif %}
    </div>
  </div>
</div>
</li>
<br>

{% endif %}
{% endfor %}
</ol>

{% endunless %}
{% endfor %}

</div>

<script src="{{ '/assets/js/publications-search.js' | relative_url }}" defer></script>
