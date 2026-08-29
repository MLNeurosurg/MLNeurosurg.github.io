<div class="publications">
<ol class="bibliography">

{% assign stories = site.data.news.main %}
{% if stories == nil or stories.size == 0 %}
<li><p><em>News coming soon.</em></p></li>
{% else %}
{% for item in stories %}
<li>
<div class="pub-row">
  <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
    {% if item.image %}
    {% assign _img = item.image | replace: './', '/' %}
    <div class="teaser-with-badge">
      <img src="{{ _img | relative_url }}" class="teaser img-fluid z-depth-1" alt="{{ item.title | escape }}" style="width=100;height=40%">
      {% assign _vp = item.venue | split: '|' %}
      {% assign _badge = _vp.last | strip %}
      {% if _badge != '' %}
      <abbr class="badge">{{ _badge }}</abbr>
      {% endif %}
    </div>
    {% endif %}
  </div>
  <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
    <div class="title"><a href="{{ item.link }}" rel="noopener" target="_blank">{{ item.title }}</a></div>
    <div class="periodical"><em>{{ item.venue }}</em></div>
    {% if item.also %}
    <div class="periodical">{{ item.also }}</div>
    {% endif %}
    <div class="links">
      <a href="{{ item.link }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">Story</a>
    </div>
  </div>
</div>
</li>
<br>
{% endfor %}
{% endif %}

</ol>
</div>
