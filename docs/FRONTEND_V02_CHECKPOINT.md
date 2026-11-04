# Axiom v0.2 — Chat previews + independent artifact pages

## Delivered

- A focused two-column default chat, with the artifact inspector **closed by default** and accessible from the header or each message's Quick view action.
- `/graph` responses generate inline SVG plots and link to `graph.html?expression=...`; Quick view selects that exact response's expression. `graph.html` renders using the same local SVG math interpreter, with zoom, coordinate hover, presets, and SVG export. **No Mimo request is needed or allowed for graphing.**
- `/tikz` responses generate an explicitly *illustrative* inline SVG template and link to the full `tikz.html` source editor; code is saved locally. Opening a matching preset from chat does not destroy existing edits. **There is no TeX compiler in this frontend.**
- `/note` creates browser-stored notes. `notebook.html` supports search, title/content editing, auto-save, .md export, JSON backup, and deletion.
- `artifacts.html` is a separate landing/gallery page showing the most recent graph, TikZ template and notebook entries. API inspection is not an artifact.
- `src/mimo-contract.js` preserves the future versioned published workflow request format for commands that actually need AI. `/graph` and `/note` return a `local_only` marker and cannot be passed to `toMimoServerRequest`.
- No backend jobs, provider credentials, network inference, Firebase, Mimo, or Quizer repository were modified.

## Verification

- `npm run check`: **12/12 tests passed** (command parser, safe plotter, integration envelope, local-only commands, browser artifact state, and route/template contracts).
- Chromium layout check: all **5 HTML pages** rendered at **1440×900** and **390×844** with no document horizontal overflow or runtime errors.
- Chromium interaction smoke: `/graph` produced inline polylines, Quick view selected the matching graph, `/note` persisted into the independent notebook, graph state survived navigation, and customized TikZ code survived across chat and full-page views.
- Screenshots retained in `docs/v02-*.png`. The browser checks used inlined static JS/CSS because the container's Chromium could not navigate to local HTTP addresses; this verifies DOM/UI behavior but is **not** a production-hosted end-to-end test.
- The QA run did not run a live hosted deployment, use real Mimo projects, or perform a mobile-device hardware test.

## Later release gates

1. Create a separate new GitHub repository `azmath25/axiom` (private/public as desired); publish this source without merging into Quizer or Mimo.
2. Test actual HTTP static hosting, routing, localStorage, graph canvas pointer behavior, and download flows in Safari and Android Chrome.
3. Only then, in a separate backend milestone, connect `/solve`, `/tikz` (if compilation is desired), `/prove`, and other AI commands via a secure authenticated server proxy. Keep `/graph` and `/note` browser-side.

**No server process is needed for graph calculations:** a static web host distributes the HTML/JS, but the graph computation and SVG rendering are performed by the browser. `python3 -m http.server` is only a simple local file server for development.
