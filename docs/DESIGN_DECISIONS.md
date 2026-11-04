# Axiom visual design and interaction notes

## Product principle

Axiom is a **mathematical workspace with a conversation at its center**, not a generic chat UI with a set of unrelated tools. The main thread holds the problem; the right workspace holds reusable and exportable artifacts; the left rail organizes ongoing exploration.

## Visual system

- Deep midnight background, restrained lavender and cool mint accents, softly elevated surfaces.
- Monospaced technical labels distinguish computation and workflow state from ordinary conversation.
- Rounded mathematical cards, strong spacing hierarchy, explicit command palette and editor affordances.
- Desktop: three panes; laptop: chat + sidebar with inspectable artifact drawer; phone: one-column chat with independent navigation and artifact drawers.
- Canvas-like SVG graph panel, source-first TikZ editor, JSON preview panel.
- Light appearance setting and reduced-motion behavior.

## Implemented keyboard interactions

| Action | Shortcut |
|---|---|
| Open command palette | Ctrl/⌘ + K |
| New exploration | Ctrl/⌘ + J |
| Show slash command suggestions | Type `/` |
| Send prompt | Enter |
| New line | Shift + Enter |
| Exit modal/drawer | Escape |
| Navigate command palette | ↑ / ↓, Enter |

## Frontend vs backend truth table

| Function | Today | Future |
|---|---|---|
| Chat / saved exploration | Browser-only, localStorage | Authenticated cloud history |
| Mathematical commands | Client-side parsing and request preview | Published Mimo workflows |
| Linear equation example | Browser-only for `ax+b=c` | General solver and verification |
| Function plotting | Real offline SVG plotter | Richer tool-generated plots and datasets |
| TikZ | Editable prewritten TeX + illustrative SVG | Private compiler service rendering PNG/PDF |
| Proof verify / explain / quiz | Workflow payload previews only | AI runs and structured outputs |
| Attachment picker | Filename metadata only; no upload | Private server upload + artifact permissions |
| Run progress | Proposed request-state shape only | Durable run IDs, SSE/polling, cancellation |
| API security | No secrets, zero run requests | Credential-safe server proxy + Firebase/other auth |

## Possible second-phase innovations

1. **Notebooks from chat** — pin a message or artifact into a persistent mathematical notebook.
2. **Proof dependency graph** — every lemma as a node; click edges to inspect assumptions.
3. **Equation “what-if” scrubbing** — vary parameters and see plots update instantly.
4. **TikZ → SVG/PDF/PNG compiler queue** — high-resolution artifacts rendered in an isolated backend.
5. **Multi-run comparison** — compare different published Mimo workflow versions or models on the same problem.
6. **Verification lane** — automatic second workflow to check solution consistency and assumptions.
7. **Import-to-Quiz button** — optional future trusted integration with Quizer through a scoped backend API.
8. **Notebook citations** — attach source references, uploaded docs and derivation IDs to final answers.
9. **Trace and cost overlay** — show queued/running/completed phases, model metadata, estimated tokens/costs and RPM limits without exposing credentials.
10. **Browser snipping overlay** — use a user-triggered crop/selection from rendered math content, with strict local preview before upload.

All second-phase work is intentionally outside the current frontend-only milestone and needs design, authorization and API verification before integration.
