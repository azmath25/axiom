# Axiom · Mathematics Studio

**An independent, frontend-only mathematics chatbot interface.** A polished static single-page application designed around specialized slash commands, mathematical visualizations, and a future Mimo backend proxy.

> **Status: v0.2 design prototype.** No actual AI inference, TikZ compilation, document upload, or Mimo run execution occurs. The graph, Math Notebook, and narrow linear-equation demonstration execute locally; other commands show **clearly labeled request previews** until a trusted Mimo proxy is connected. TikZ source editing is local and its illustrated template preview is not compiled.

**Axiom v0.2:** Chat, Artifacts, Graph, TikZ and Notebook.

[Earlier desktop preview](docs/desktop-preview.png) · [Design decisions](docs/DESIGN_DECISIONS.md)

## Get started

Requires a modern browser; no JavaScript dependencies or build step.

```bash
python3 -m http.server 4173
# Open http://localhost:4173
```

To publish as **your own new GitHub repository** once reviewed (from the ZIP, which does not include `.git`):

```bash
git init -b main
git add .
git commit -m "Initial Axiom frontend"
gh repo create axiom-math-studio --private --source=. --remote=origin --push
```

The project is not associated with the existing Quizer or Mimo repositories. Publishing it on GitHub is a separate step: GitHub repository creation was unavailable to the connected tools in this session. A Git bundle is supplied separately if you want to retain the complete local commit history.

To run tests (Node 20+):

```bash
npm test
npm run check
```

## Features

- **Distraction-reduced chat:** conversation history and focused chat. An optional slide-out inspector offers quick tool previews, and each tool also has its own spacious HTML page.
- **13 mathematical commands:** `/solve`, `/graph`, `/tikz`, `/prove`, `/verify`, `/explain`, `/latex`, `/quiz`, `/extract`, `/simplify`, `/analyze`, `/note`, `/code`.
- **⌘/Ctrl+K palette:** searchable tools and actions, arrow-key navigation, Enter to select, Escape to close. ⌘/Ctrl+J opens a new conversation. Type `/` in the composer for suggestions.
- **Three independent tool pages and an artifact gallery:** browser-only `graph.html`, `tikz.html`, `notebook.html`, plus `artifacts.html`. Inline chat previews have links to the same tools.
- **Interactive SVG function graphing:** safe expression parser (no `eval`), trigonometric/polynomial functions, zoom, cursor coordinate readout and SVG export.
- **TikZ atelier:** realistic standalone LaTeX templates for geometry and axes, editable source, copy and `.tex` download. Its decorative SVG diagram is illustrative **not** the result of compiling edited source.
- **Persistent conversations:** local browser history, star/filter, full JSON export. No cloud sync.
- **Mimo-compatible internal request adapter:** prepares proposed command→published-workflow envelopes with version, client request ID and idempotency-ready fields; no API widget in the artifact gallery.
- **Theme switching, reduced-motion support, keyboard navigation, touch-friendly components, accessible labels.**

## Mimo architecture and security

The repository is deliberately separate from Quizer and Mimo and modifies neither. See [`docs/MIMO_INTEGRATION.md`](docs/MIMO_INTEGRATION.md).

**Never embed your Mimo execution project API key in HTML, JavaScript or browser localStorage.** After an authorized backend milestone, add an authenticated server proxy that accepts frontend actions and calls Mimo's execution service:

```text
Browser SPA        your auth + proxy                 Mimo execution Cloud Run
POST /api/chat/runs  ── validate + grant ──▶  POST /v1/workflows/{id}/runs
(no project key)     Idempotency-Key          Authorization: Bearer private-key
                          │                             │
                          └──── status/artifact proxy ◀──┘
```

Mimo API source: `azmath25/mimo-backend/docs/EXTERNAL_API_V2.md`. The current workflow names are **proposed placeholders**—they do not claim any published Mimo workflows exist.

## Project layout

```text
axiom-math-studio/
├── index.html               Chat and optional inline quick previews
├── artifacts.html           Artifact gallery with saved previews
├── graph.html               Full-page browser-side interactive grapher
├── tikz.html                Full-page TikZ source editor
├── notebook.html            Full-page persistent Math Notebook
├── favicon.svg              Brand mark
├── src/
│   ├── styles.css           Chat and responsive visual design
│   ├── workspace.css        Dedicated artifact page design
│   ├── artifact-store.js    Shared local artifact state
│   ├── artifact-pages.js    Full-page graph/TikZ/notebook controllers
│   ├── app.js               Chat, dialogs, history and UI events
│   ├── commands.js          Declarative command catalog and parser
│   ├── plot.js              Safe numeric expression plotter
│   ├── tikz.js              Editable example diagrams and TeX source
│   └── mimo-contract.js     Browser→proxy→Mimo request mapping
├── tests/                   Node built-in test runner
└── docs/
    ├── MIMO_INTEGRATION.md
    └── desktop-preview.png
```

## v0.2 — dual-view artifact workspace

- **Inside chat:** each `/graph` and `/tikz` response contains a compact preview and a *Quick view* button that opens the associated inspector tool without leaving chat. `/note` creates a local entry and links to it.
- **On dedicated pages:** `artifacts.html` displays the saved tool gallery, `graph.html` provides a full graph canvas, `tikz.html` provides a spacious LaTeX editor, and `notebook.html` provides searchable editable notes.
- **Shared state:** graph expression/zoom, TikZ source/preset, and notes are kept in same-origin browser storage. Opening the current TikZ preset preserves edits. The graph renderer, zoom, and SVG export do not require a separate backend or paid API.
- **Boundaries:** TikZ diagrams are illustrative local templates, not compiled previews; general mathematics and AI commands remain explicitly labeled request previews.

## Next phase (not implemented)

Connect user authentication and a trusted server proxy, create published Mimo workflows for each supported command, add tracked run polling/SSE, integrate private compiler artifact handling for TikZ→PDF/PNG, handle durable uploaded files, implement project-level budgets and usage charts, and test deployed security boundaries and spending rules.

## Restrictions

- Local history can contain sensitive content. Don't type secrets or confidential documents into the browser prototype if shared-device access is a concern.
- The local graph accepts only explicit multiplication (write `2*x` rather than `2x`), one variable `x`, and a small function whitelist.
- Selected attachments remain on your device; no bytes are currently read or transmitted.
- `npm run dev` uses Python, but the runtime itself is just static HTML/CSS/JS.
- Google Fonts are optional; system font fallbacks work when offline.

MIT-style prototype: you're free to adapt this repository for your own project.

## GitHub Pages deployment

This repository includes a frontend-only GitHub Actions workflow in `.github/workflows/pages.yml`.
On **each push to `main`**, the workflow verifies JavaScript and all 12 source/unit tests,
creates a clean `dist/` containing only the five pages, `src/`, the favicon and `.nojekyll`,
then publishes that output to GitHub Pages. It does not run a Node server in production,
use a database, or call Quizer/Mimo services.

**First-time setup in a new repository:**

1. Create a **new** repository named `axiom-math-studio` in the `azmath25` GitHub account. To let a GitHub-connected assistant upload the files, initialize it with a README so the `main` branch exists.
2. Share the new repository URL with your GitHub-connected assistant to upload the files. Alternatively, for a repository created **without** a README, you can push this local repository yourself with `git remote add origin https://github.com/azmath25/axiom.git && git push -u origin main` using an authenticated GitHub client.
3. In GitHub, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Build, verify and deploy Axiom frontend**, confirm the workflow succeeded, then open `https://azmath25.github.io/axiom/`.

GitHub Pages publishes a static site and does not require a continuously running
backend server. The browser grapher remains client-side. Only a future explicitly
authorized Mimo integration would need a separate authenticated server-side proxy.


**Canonical repository:** https://github.com/azmath25/axiom. Graphing and notebooks are browser-only.
