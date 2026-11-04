# Axiom · Mathematics Studio

**An independent, frontend-only mathematics chatbot interface.** A polished static single-page application designed around specialized slash commands, mathematical visualizations, and a future Mimo backend proxy.

> **Status: v0.1 design prototype.** No actual AI inference, TikZ compilation, document upload, or Mimo run execution occurs. All commands except the offline function plotter and narrow linear-equation demonstration show **clearly labeled request previews**.

![Axiom desktop workspace](docs/desktop-preview.png)

[Phone layout](docs/phone-preview.png) · [Interactive chat and graph](docs/chat-preview.png) · [Design decisions](docs/DESIGN_DECISIONS.md)

## Get started

Requires a modern browser; no JavaScript dependencies or build step.

```bash
python3 -m http.server 4173
# Open http://localhost:4173
```

To publish as **your own new GitHub repository** once reviewed:

```bash
git init -b main
git add .
git commit -m "Initial Axiom frontend"
gh repo create axiom-math-studio --private --source=. --remote=origin --push
```

The project is not associated with the existing Quizer or Mimo repositories. The GitHub creation/publishing action has not been executed here.

To run tests (Node 20+):

```bash
npm test
npm run check
```

## Features

- **Three-pane desktop workspace:** conversation history, central chat and right-side mathematical artifacts. Responsive side drawer and inspector on mobile.
- **12 mathematical commands:** `/solve`, `/graph`, `/tikz`, `/prove`, `/verify`, `/explain`, `/latex`, `/quiz`, `/extract`, `/simplify`, `/analyze`, `/code`.
- **⌘/Ctrl+K palette:** searchable tools and actions, arrow-key navigation, Enter to select, Escape to close. ⌘/Ctrl+J opens a new conversation. Type `/` in the composer for suggestions.
- **Interactive SVG function graphing:** safe expression parser (no `eval`), trigonometric/polynomial functions, zoom, cursor coordinate readout and SVG export.
- **TikZ atelier:** realistic standalone LaTeX templates for geometry and axes, editable source, copy and `.tex` download. Its decorative SVG diagram is illustrative **not** the result of compiling edited source.
- **Persistent conversations:** local browser history, star/filter, full JSON export. No cloud sync.
- **Mimo API inspector:** previews proposed requests using command→published-workflow aliases with version, client request ID and idempotency-ready fields.
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
├── index.html               Accessible workspace markup
├── favicon.svg              Brand mark
├── src/
│   ├── styles.css           Responsive visual design
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

## Next phase (not implemented)

Connect user authentication and a trusted server proxy, create published Mimo workflows for each supported command, add tracked run polling/SSE, integrate private compiler artifact handling for TikZ→PDF/PNG, handle durable uploaded files, implement project-level budgets and usage charts, and test deployed security boundaries and spending rules.

## Restrictions

- Local history can contain sensitive content. Don't type secrets or confidential documents into the browser prototype if shared-device access is a concern.
- The local graph accepts only explicit multiplication (write `2*x` rather than `2x`), one variable `x`, and a small function whitelist.
- Selected attachments remain on your device; no bytes are currently read or transmitted.
- `npm run dev` uses Python, but the runtime itself is just static HTML/CSS/JS.
- Google Fonts are optional; system font fallbacks work when offline.

MIT-style prototype: you're free to adapt this repository for your own project.
