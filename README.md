# Applied — Job Application Tracker

A local-first job search tracker built with plain HTML, CSS and JavaScript. No framework, no build step, no account, no backend — everything you type stays in your own browser.

**Live demo:** https://ravitejaputta257.github.io/job-application-tracker/

---

## What it does

- Add, edit and delete applications (company, role, location, date, status, job link, notes).
- Search by company, role or location.
- Filter by status: Saved, Applied, Interview, Offer, Rejected.
- Sort by newest, oldest or company name.
- Live counters for total applications, interviews and offers.
- Export everything to CSV with one click.
- Light/dark theme, remembered between visits.
- Sample data button so the interface can be explored immediately.
- Responsive down to a 320 px viewport, keyboard-friendly, with visible focus states and labelled form fields.

## Why I built it

I was tracking applications in a spreadsheet and wanted a small, honest frontend project that shows I can take an idea from an empty folder to a deployed, usable interface. It is deliberately vanilla — the goal is to demonstrate HTML, CSS and JavaScript fundamentals rather than a framework.

## What I personally built

Everything in this repository: the layout and visual system, the form and validation, `localStorage` persistence, filtering/sorting/search, CSV export, theme switching, empty states, and accessibility details (skip link, live regions, labelled controls, dialogs). There is no backend or third-party service.

## Tech stack

| Layer | Tool |
| --- | --- |
| Markup | HTML5, ARIA labels and live regions |
| Styling | CSS custom properties, Grid, Flexbox, responsive media queries |
| Behaviour | Vanilla JavaScript (ES5-style syntax, no dependencies) |
| Storage | `localStorage` |
| Hosting | GitHub Pages |

## Run it locally

```bash
git clone https://github.com/ravitejaputta257/job-application-tracker.git
cd job-application-tracker
python -m http.server 8000
```

Then open <http://localhost:8000>. You can also just open `index.html` directly in a browser — there is nothing to compile.

## Project structure

```
.
├── index.html      # semantic markup and all content
├── styles.css      # design tokens, components, responsive rules
├── app.js          # state, rendering, events, storage, export
├── favicon.svg     # generated icon (no external assets)
└── README.md
```

## Privacy

No network requests are made by the app. Data is written only to `localStorage` on the device you use. Clearing browser storage removes it.

## Author

Ravi Teja Putta — 2026 B.Tech Computer Science graduate, focused on frontend development.

- Portfolio: https://ravitejaputta257.github.io/
- GitHub: https://github.com/ravitejaputta257

## License

MIT — see [LICENSE](LICENSE).
