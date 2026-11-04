import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {ARTIFACT_KEYS,getGraphState,saveGraphState,getTikzState,saveTikzState,addNote,getNotes,saveNotes} from "../src/artifact-store.js";

const memory = new Map();
const previousStorage = globalThis.localStorage;
const fakeStorage = {
 getItem: (key) => memory.has(key) ? memory.get(key) : null,
 setItem: (key,value) => memory.set(key,String(value)),
 removeItem: (key) => memory.delete(key),
 clear: () => memory.clear()
};
function withStorage(fn) {
 globalThis.localStorage=fakeStorage;
 memory.clear();
 try { fn(); } finally { globalThis.localStorage=previousStorage; }
}
const source = (name) => readFileSync(new URL("../"+name, import.meta.url),"utf8");
test("graph expression/zoom are saved and validated with browser-only storage",()=>withStorage(()=>{
 assert.equal(getGraphState().zoom,1);
 assert.equal(saveGraphState("x^2 - 5",2),true);
 assert.deepEqual({expression:getGraphState().expression,zoom:getGraphState().zoom},{expression:"x^2 - 5",zoom:2});
 memory.set(ARTIFACT_KEYS.graph,JSON.stringify({expression:"y=sin(x)",zoom:1000}));
 assert.equal(getGraphState().zoom,1);
}));
test("TikZ source survives page changes without needing a compiler",()=>withStorage(()=>{
 const code=String.raw`\draw (0,0)--(3,2);`;
 assert.equal(saveTikzState("triangle",code),true);
 assert.equal(getTikzState().preset,"triangle");
 assert.equal(getTikzState().code,code);
 assert.match(source("src/app.js"),/loadTikzPreset\(\{ preserveExisting: true \}\)/);
 assert.match(source("src/artifact-pages.js"),/saved\.preset === preset && saved\.code !== null/);
}));
test("Math Notebook persists and exports only browser-local entries",()=>withStorage(()=>{
 assert.deepEqual(getNotes(),[]);
 const note=addNote("Proof sketch: consider the boundary case", "Boundary case");
 assert.equal(note.title,"Boundary case");
 assert.equal(getNotes()[0].id,note.id);
 assert.equal(saveNotes([]),true);
 assert.deepEqual(getNotes(),[]);
}));
test("full pages and compact chat previews both exist; no API artifact panel",()=>{
 for(const name of ["artifacts","graph","tikz","notebook"]){
  const html=source(name+".html");
  assert.match(html,/src\/workspace\.css/);
  assert.match(html,/src\/artifact-pages\.js/);
 }
 const chat=source("index.html");
 const app=source("src/app.js");
 assert.match(chat,/data-inspector-tab="graph"/);
 assert.match(chat,/data-inspector-tab="tikz"/);
 assert.match(chat,/data-inspector-tab="notebook"/);
 assert.doesNotMatch(chat,/data-inspector-tab="api"|id="requestJson"/);
 assert.match(app,/data-inline-graph/);
 assert.match(app,/href="graph\.html\?expression=/);
 assert.match(app,/href="tikz\.html\?preset=/);
 assert.match(app,/loadTikzPreset\(\{ preserveExisting: true \}\)/);
 assert.doesNotMatch(app,/updateRequestPreview/);
});
