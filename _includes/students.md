<div class="publications">
<ol class="bibliography">

{% assign members = site.data.students.main %}
{% if members == nil or members.size == 0 %}
<li><p><em>Student profiles coming soon.</em></p></li>
{% else %}
{% for member in members %}
<li>
<div class="pub-row">
  <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
    {% if member.image %}
    <img src="{{ member.image | relative_url }}" alt="{{ member.name }}" class="teaser img-fluid z-depth-1" style="width=100;height=40%">
    {% endif %}
  </div>
  <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
    <div class="title">{% if member.website %}<a href="{{ member.website }}" rel="noopener">{{ member.name }}</a>{% else %}{{ member.name }}{% endif %}</div>
    {% if member.role %}
    <div class="author">{{ member.role }}</div>
    {% endif %}
    {% if member.research_focus %}
    <div class="author"><strong>Research focus:</strong> {{ member.research_focus }}</div>
    {% endif %}
    {% if member.bio %}
    <div class="periodical">{{ member.bio | markdownify }}</div>
    {% endif %}
    <div class="links">
      {% if member.website %}
      <a href="{{ member.website }}" class="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener" style="font-size:12px;">{% if member.website_label %}{{ member.website_label }}{% else %}Website{% endif %}</a>
      {% endif %}
      {% if member.email %}
      <a href="mailto:{{ member.email }}" class="btn btn-sm z-depth-0" role="button" style="font-size:12px;">Email</a>
      {% endif %}
    </div>
  </div>
</div>
</li>
<br>
{% endfor %}
{% endif %}

</ol>
</div>
