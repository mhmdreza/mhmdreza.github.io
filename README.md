# mhmdreza.github.io

Personal GitHub profile page + PDF resume generator, both driven by a single source of truth: `content.json`.

## Project structure

```
content.json       ← all resume/profile data lives here
build.js           ← generates the static site  (dist/)
generate_cv.py     ← generates the PDF resume   (rendercv_output/)
snake_dark.svg     ← logo / favicon
```

## Static site

Renders `content.json` into `dist/index.html` and `dist/404.html`.
Deployed automatically to GitHub Pages on every push to `main` via GitHub Actions.

```bash
node build.js
# → dist/index.html  (~48 KB)
# → dist/404.html
```

## PDF resume

Converts `content.json` to a RenderCV YAML and renders a PDF with the classic theme (ATS-safe single-column layout).
Requires [uv](https://docs.astral.sh/uv/) — dependencies are declared inline (PEP 723) and installed automatically.

```bash
uv run generate_cv.py
# → rendercv_output/Mohamad_Reza_Jafarzade_CV.pdf
# → ATS text extraction printed to stdout for quick verification
```

To verify ATS compatibility manually:

```bash
pdftotext rendercv_output/Mohamad_Reza_Jafarzade_CV.pdf -
# install poppler-utils if pdftotext is not available
```

## Updating content

Edit `content.json`, then:

- Re-run `node build.js` (or push to `main`) to update the site.
- Re-run `uv run generate_cv.py` to regenerate the PDF.
