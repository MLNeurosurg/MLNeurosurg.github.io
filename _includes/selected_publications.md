<div class="publications selected-publications">
{% for section in site.data.selected_publications.sections %}
<h3 class="selected-pubs-section">{{ section.heading }}</h3>
<ol class="bibliography">
{% for link in section.items %}
<li>
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
{% endfor %}
</ol>
{% endfor %}
</div>
