# Personal website: Sarbojit Roy

A plain static site: no build step and no dependencies.

```
index.html              all page content (About, Talks, Teaching, Experience, Resources)
data/publications.bib   publications, rendered automatically into the Publications section
assets/style.css        design (light + dark theme)
assets/main.js          BibTeX rendering, theme toggle, nav highlighting
assets/photo.jpg        your portrait (add this; the "SR" monogram shows until you do)
cv/SarbojitRoy_CV.pdf   the CV linked from "Download CV"
```

## Everyday updates

- **New paper:** paste its BibTeX into `data/publications.bib`. The entry type decides the group:
  `@article`/`@inproceedings` → Published, `@misc` → Preprints, `@unpublished` → In preparation.
  Add `doi`, `url`, `pdf`, `eprint` (arXiv id) or `code` fields to get link buttons.
  When a preprint is published, just change `@misc` to `@article` and add the journal.
- **New talk, student, award:** copy an existing `<li>` in `index.html` and edit it.
- **New CV:** replace `cv/SarbojitRoy_CV.pdf` (keep the file name).

## Preview locally

Publications are loaded with `fetch`, so open the site through a local server, not by double-clicking `index.html`:

```bash
cd website && python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Publish (free, on GitHub Pages)

1. Create a GitHub repository named `<your-username>.github.io`.
2. Upload the contents of this `website/` folder to it.
3. The site goes live at `https://<your-username>.github.io` within a minute or two.
4. On the old Google Site, add a link pointing to the new address.
