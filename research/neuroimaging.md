---
layout: homepage
permalink: /research/neuroimaging/
title: AI-based Neuroimaging
description: >-
  Clinically grounded AI for neuroimaging learned from routine health system data at scale, including NeuroVFM, Prima, HLIP, and ItemizedCLIP.

---

## Intelligent Neuroimaging

A focus of the MLiNS lab is to develop clinically grounded artificial intelligence for neuroimaging by learning directly from routine health system data at scale. Our work has advanced from HLIP, which introduced hierarchical language-image pretraining for uncurated 3D MRI and CT studies, to ItemizedCLIP, which learns more complete and explainable visual representations from structured radiology supervision. Building on these foundations, we developed NeuroVFM, a generalist neuroimaging foundation model trained on millions of clinical MRI and CT volumes, and [Prima](https://www.nature.com/articles/s41551-025-01608-0), a health system-scale vision-language model for brain MRI designed for real-world diagnosis, triage, and clinical decision support. Together, this research program aims to create neuroimaging models that are accurate, interpretable, fair, and deployable across the full spectrum of neurologic disease, while establishing the health system itself as a powerful engine for medical AI discovery.

### Figures

![Overview of health system-scale neuroimaging data, NeuroVFM self-supervised pretraining, and clinical evaluation with grounded findings and triage.](/assets/img/research/neuroimaging_overview.png)

### Related publications

{% include bibliography_list.html collection=site.data.neuroimaging_publications.main %}

[← Back to home](/)
