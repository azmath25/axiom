# Axiom ↔ Mimo · frontend integration contract (design only)

This document references the current documented Mimo **external execution API** from `azmath25/mimo-backend/docs/EXTERNAL_API_V2.md` (inspected 2026-11-05). It is an **integration proposal**, not a claim that Axiom already connects.

## Network separation

**Browser** sends an authenticated user request to **your own backend** (`POST /api/chat/runs`), which checks the user's permissions, validates input and command, enforces quota and maps the command to a published Mimo workflow ID/version. The backend holds the project API key in a secret store, never in a JS bundle, HTTP response, or public repo. The backend calls Mimo Cloud Run **execution role**, not Studio.

The browser currently sends **zero** run requests. `src/mimo-contract.js` creates local preview objects and includes `toMimoServerRequest` for testable mapping. Do not enable direct browser execution by copying a project key into the UI.

## Browser → trusted proxy (proposed; not yet deployed)

```json
{
  "workflow": "math_solve",
  "version": 1,
  "command": "solve",
  "input": {
    "text": "2x+3=7",
    "attachment": null
  },
  "session_id": "<local-chat-id>",
  "client_request_id": "<stable-request-uuid>",
  "background": true
}
```

Use **same request ID across retries**. A Mimo idempotency key reused with changed input can return HTTP 409. Your proxy should store client-request ↔ Mimo-run mapping and reconcile rather than blindly re-running.

## Trusted proxy → Mimo (documented API)

```http
POST /v1/workflows/{published_workflow_id}/runs
Authorization: Bearer <SERVER_ONLY_PROJECT_API_KEY>
Content-Type: application/json
Idempotency-Key: <stable-request-uuid>

{"input":"2x+3=7","version":1,"background":true}
```

Other documented routes:

- `GET /v1/runs/{id}` for durable status and output.
- `GET /v1/runs/{id}/timeline` for events/checkpoints.
- `GET /v1/runs/{id}/events` for replay SSE, **not guaranteed live token streaming**.
- `POST /v1/runs/{id}/cancel` for cancellation.
- `GET /v1/runs/{id}/artifacts/{node_id}?index=0` for compiler/image output.
- The external artifact endpoints can upload project-owned PNG/JPEG/PDF and rasterize PDF pages, subject to Mimo quotas and server-side security.
- `POST /v1/workflows/{id}/live` has a different native SSE behavior; see Mimo's `docs/LIVE_STREAM_OPERATIONS.md`, which documents no reliable token replay and possible non-durable provider deltas. Do **not** assume it is suitable for every command.

Server-owned file uploads, compiler jobs, long-running run admission, polling, cancellation, and signed output delivery must be designed/tested separately. Use authenticated proxy endpoints for all user-facing run state and downloads.

## Proposed workflow alias table

| Command | Suggested published Mimo ID | Intended output |
|---|---|---|
| `/solve` | `math_solve` | Structured steps and LaTeX |
| `/graph` | `math_graph` | Function expression + data/figure metadata |
| `/tikz` | `math_tikz` | TikZ source and compiled artifacts |
| `/prove` | `math_prove` | Statement, assumptions, proof |
| `/verify` | `math_verify` | Validity verdict with evidence |
| `/latex` | `math_latex` | Validated LaTeX source |
| `/quiz` | `math_quiz` | Quiz structure and answer key |
| `/extract` | `math_extract` | Document-extracted LaTeX with uncertainty flags |
| other | `math_*` | Tool-specific structured result |

**Important:** these names are not verified to be published, configured, authorized or callable in your Mimo deployment. Your future backend must map them to the exact IDs and versions published in your own Mimo Studio. A compiler or a model cannot be enabled by frontend design alone.

## Proposed backend responses (not existing Mimo schema)

```json
{
  "request_id": "<stable-client-uuid>",
  "run_id": "<Mimo-run-UUID>",
  "status": "queued",
  "command": "tikz",
  "started_at": "<ISO-date>"
}
```

Then your backend can normalize `queued`, `running`, `completed`, `failed`, and `cancelled` states, and return structured artifacts on a separate authorized endpoint. It should handle HTTP errors, provider RPM quotas, cost limits, secret rotation, input sanitization, and per-user data isolation.

## Remaining release gates

1. Confirm current published workflow IDs and pinned versions.
2. Implement authenticated proxy with server-only Mimo key and per-user rate limits.
3. Test same-key retries, Mimo 409/429/503, timeouts, cancellation, and disconnected tabs.
4. Test private image/PDF upload and compiler artifacts on staging only.
5. Test budget alerts, logging without private prompt dumps, concurrency, accessibility, and responsive layout.
6. Only then explicitly approve deployment. **This repo currently contains no deployment workflows or backend.**
