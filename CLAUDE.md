# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bundle install              # Install dependencies
bundle exec jekyll serve    # Local dev server at localhost:4000
bundle exec jekyll build    # Build static site to _site/
```

Deployment is automatic on `git push` to `main` via GitHub Pages.

## Architecture

Academic lab homepage built on Jekyll with the `yaoyao-liu/minimal-light` remote theme. All content is data-driven - no custom plugins.

### Content Model

All dynamic content comes from YAML data files in `_data/`:

- **`publications.yml`** - Full publication list (`main` key), iterated in `_includes/publications.md`
- **`selected_publications.yml`**, **`selected_preprints.yml`** - Featured subsets shown on the homepage
- **`students.yml`** - Lab members (name, role, bio, image, website)
- **`news.yml`** - Lab announcements
- Topic-specific publication sets: `intelligent_histology_publications.yml`, `computer_vision_publications.yml`, `neuroimaging_publications.yml`, `patient_forecasting_publications.yml`, `collaborative_neuro_oncology_publications.yml`

To add a publication, student, or news item - edit the relevant YAML file. The Liquid templates in `_includes/` handle rendering automatically.

### Pages

- `index.md` - Homepage (bio, news, research programs, selected publications, videos, funding)
- `publications.md`, `news.md`, `students.md`, `students-photos.md`, `videos.md` - Standalone pages
- `research/*.md` - Five research program pages, each pulling from a topic-specific `_data/*.yml`

### Templates

- `_layouts/homepage.html` - Single layout wrapping all pages; renders social links from `_config.yml`
- `_includes/*.md` / `_includes/*.html` - Reusable fragments included via Liquid `{% include %}`

### Styling

- `_sass/minimal-light.scss` - Main stylesheet with dark mode support
- `_sass/minimal-light-no-dark-mode.scss` - Light-only variant
- `assets/css/publications.css` - Publication card styles

### Site Configuration

Personal info, social links, avatar, favicons, and theme options are all set in `_config.yml`. The remote theme (`yaoyao-liu/minimal-light`) provides base layouts; local `_data/`, `_includes/`, `_sass/`, and `assets/` override or extend it.
