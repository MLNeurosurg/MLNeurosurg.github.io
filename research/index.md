---
layout: homepage
permalink: /research/
title: Research Programs
description: >-
  Research programs of the Machine Learning in Neurosurgery (MLiNS) Lab at the University of Michigan: neuroimaging, intelligent histology, visual intelligence, patient forecasting, and collaborative neuro-oncology.

---

## MLiNS Research Programs

We develop machine intelligence that understands human health and disease, especially related to the nervous system. Our work is organized into five research programs, each with its own models, datasets, and publications.

{% comment %} Summaries come from each program page's `description`, so they stay in sync. Order matches the homepage. {% endcomment %}
{% assign program_urls = "/research/neuroimaging/,/research/intelligent-histology/,/research/computer-vision/,/research/patient-forecasting/,/research/collaborative-neuro-oncology/" | split: "," %}
{% for url in program_urls %}
{% assign program = site.pages | where: "url", url | first %}
### [{{ program.title }}]({{ program.url }})

{{ program.description }}

[Explore {{ program.title }} →]({{ program.url }})
{% endfor %}

Interested in joining one of these programs? We are hiring PhD students and postdocs in medical AI. Please email tocho [at] umich.edu.

[← Back to home](/)
