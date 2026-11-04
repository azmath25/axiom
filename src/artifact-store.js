/** Browser-only artifact persistence. Zero fetches and zero provider credentials. */
export const ARTIFACT_KEYS = Object.freeze({
  graph: "axiom.graph.v1", tikz: "axiom.tikz.v1", notes: "axiom.notes.v1",
});
function read(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; }
  catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function getGraphState() {
  const value = read(ARTIFACT_KEYS.graph, {});
  return { expression: typeof value.expression === "string" ? value.expression.slice(0, 500) : "sin(x) + 0.25*cos(3*x)",
    zoom: Number.isFinite(value.zoom) && value.zoom >= 0.25 && value.zoom <= 5 ? value.zoom : 1 };
}
export function saveGraphState(expression, zoom = 1) {
  return write(ARTIFACT_KEYS.graph, { expression: String(expression).slice(0, 500), zoom, updated: Date.now() });
}
export function getTikzState() {
  const x = read(ARTIFACT_KEYS.tikz, {});
  return { preset: ["triangle", "circle", "axes"].includes(x.preset) ? x.preset : "triangle",
    code: typeof x.code === "string" ? x.code.slice(0, 30000) : null };
}
export function saveTikzState(preset, code) {
  return write(ARTIFACT_KEYS.tikz, { preset, code: String(code).slice(0, 30000), updated: Date.now() });
}
export function getNotes() {
  const data = read(ARTIFACT_KEYS.notes, []);
  if (!Array.isArray(data)) return [];
  return data.filter(x => x && typeof x.id === "string" && typeof x.body === "string")
    .slice(0, 100).map(x => ({ id: x.id, title: String(x.title || "Untitled").slice(0, 120),
      body: x.body.slice(0, 30000), updated: Number(x.updated) || Date.now() }));
}
export function saveNotes(notes) {
  return write(ARTIFACT_KEYS.notes, notes.slice(0, 100));
}
export function addNote(body, title = "") {
  const notes = getNotes();
  const raw = String(body).trim();
  if (!raw) return null;
  const note = { id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "note-" + Date.now(),
    title: String(title || raw.split("\n")[0]).trim().slice(0, 120) || "Untitled",
    body: raw.slice(0, 30000), updated: Date.now() };
  notes.unshift(note);
  if (!saveNotes(notes)) return null;
  return note;
}
