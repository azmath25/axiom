import { drawGraph, crosshair } from "./plot.js";
import { TIKZ_PRESETS } from "./tikz.js";
import { getGraphState, saveGraphState, getTikzState, saveTikzState, getNotes, saveNotes, addNote } from "./artifact-store.js";
const $=(s)=>document.querySelector(s);
const page=document.body.dataset.artifactPage;
const themeKey="axiom.studio.theme.v1";
let toastTimer;
function notify(str){const el=$("#workToast");el.textContent=str;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3100)}
function theme(){return document.documentElement.dataset.theme||"dark"}
function setTheme(next){document.documentElement.dataset.theme=next;try{localStorage.setItem(themeKey,next)}catch{};if(page==="graph")renderGraph()}
function clipboard(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text).then(()=>notify("Copied"),()=>notify("Clipboard blocked"));notify("Clipboard unavailable");return Promise.resolve()}
function download(name,data,type="text/plain;charset=utf-8"){
 const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`Exported ${name}`);
}
function themeInit(){try{if(localStorage.getItem(themeKey)==="light")document.documentElement.dataset.theme="light"}catch{}$("#themeSwitcher")?.addEventListener("click",()=>setTheme(theme()==="dark"?"light":"dark"))}
let graphZoom=1, plot=null;
function renderGraph(){
 const expr=$("#fullExpr")?.value.trim();if(!expr)return;
 const error=$("#graphError");
 try{plot=drawGraph($("#fullPlot"),expr,{zoom:graphZoom,theme:theme()});error.hidden=true;
 $("#zoomPercent").textContent=Math.round(graphZoom*100)+"%";$("#fullCoords").textContent="Move cursor to inspect x, y";saveGraphState(expr,graphZoom);
 const url=new URL(location.href);url.searchParams.set("expression",expr);history.replaceState({},"",url);
 }catch(e){error.hidden=false;error.textContent="Cannot plot: "+e.message;$("#fullExpr").setAttribute("aria-invalid","true");return;}
 $("#fullExpr").removeAttribute("aria-invalid");
}
function exportSvg(){if(!plot){notify("Draw a valid plot first");return;}const svg=$("#fullPlot").cloneNode(true);
 svg.setAttribute("xmlns","http://www.w3.org/2000/svg");svg.setAttribute("width","960");svg.setAttribute("height","740");
 const styles=getComputedStyle(document.documentElement);let xml=new XMLSerializer().serializeToString(svg);
 for(const token of ["bg","border-soft","faint","muted"])xml=xml.replaceAll(`var(--${token})`,styles.getPropertyValue("--"+token).trim());
 download("axiom-graph.svg",xml,"image/svg+xml;charset=utf-8");
}
function graphInit(){const saved=getGraphState(),query=new URLSearchParams(location.search),initial=query.get("expression");
 $("#fullExpr").value=(initial!==null?initial.slice(0,500):saved.expression).replace(/^y\s*=\s*/i, "").trim();graphZoom=saved.zoom;
 $("#plotNow").addEventListener("click",renderGraph);
 $("#fullExpr").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();renderGraph()}});
 $("#zoomMore").addEventListener("click",()=>{graphZoom=Math.min(5,graphZoom*1.25);renderGraph()});
 $("#zoomLess").addEventListener("click",()=>{graphZoom=Math.max(.25,graphZoom/1.25);renderGraph()});
 $("#resetGraph").addEventListener("click",()=>{graphZoom=1;renderGraph()});
 document.querySelectorAll("[data-expression]").forEach(b=>b.addEventListener("click",()=>{$("#fullExpr").value=b.dataset.expression;graphZoom=1;renderGraph()}));
 $("#exportGraph").addEventListener("click",exportSvg);
 $("#fullPlot").addEventListener("pointermove",e=>{if(!plot)return;const pos=crosshair($("#fullPlot"),plot,e);if(pos)$("#fullCoords").textContent=`x ${pos.x.toFixed(3)}  ·  y ${pos.y.toFixed(3)}`});
 $("#fullPlot").addEventListener("pointerleave",()=>{if(plot)renderGraph()});
 renderGraph();
}
function tikzInit(){const saved=getTikzState(),given=new URLSearchParams(location.search).get("preset");
 const select=$("#tikzTemplate"),code=$("#tikzSource");let preset=given in TIKZ_PRESETS?given:saved.preset;
 select.value=preset;
 // Opening the same preset from the chat must not discard edited code.
 code.value = saved.preset === preset && saved.code !== null ? saved.code : TIKZ_PRESETS[preset].code;
 function show(){ $("#fullTikzPreview").innerHTML=TIKZ_PRESETS[preset].svg; $("#tikzSaveStatus").textContent="Saved locally · Template preview is illustrative, not compiled"; }
 function save(){if(saveTikzState(preset,code.value))$("#tikzSaveStatus").textContent="Saved locally · The illustration does not update with code edits";else $("#tikzSaveStatus").textContent="Local storage unavailable — export to keep your work"}
 select.addEventListener("change",()=>{preset=select.value;code.value=TIKZ_PRESETS[preset].code;save();show();const u=new URL(location.href);u.searchParams.set("preset",preset);history.replaceState({},"",u)});
 code.addEventListener("input",save);
 $("#resetTikz").addEventListener("click",()=>{if(!confirm("Restore original template source? Your current edits will be replaced."))return;code.value=TIKZ_PRESETS[preset].code;save();show()});
 $("#copySource").addEventListener("click",()=>clipboard(code.value));
 $("#downloadSource").addEventListener("click",()=>download("axiom-diagram.tex",code.value));
 show();
}
let notes=[],currentNoteId=null;
function noteList(){const root=$("#noteList"),q=$("#noteSearch").value.trim().toLowerCase();root.replaceChildren();
 const results=notes.filter(n=>(n.title+" "+n.body).toLowerCase().includes(q)).sort((a,b)=>b.updated-a.updated);
 $("#noteCount").textContent=notes.length+" NOTES";
 if(!results.length){const p=document.createElement("p");p.className="control-hint";p.textContent=q?"No notes match your search.":"No notes yet. Create one or use /note in chat.";root.append(p);return;}
 results.forEach(n=>{const b=document.createElement("button");b.type="button";b.className="note-row"+(n.id===currentNoteId?" active":"");
 const title=document.createElement("strong"),desc=document.createElement("span");title.textContent=n.title||"Untitled";desc.textContent=n.body.slice(0,100)||"Empty note";b.append(title,desc);b.addEventListener("click",()=>openNote(n.id));root.append(b)});
}
function openNote(id){const note=notes.find(n=>n.id===id);currentNoteId=note?.id||null;
 $("#noteEditor").hidden=!note;$("#noteEmpty").hidden=Boolean(note);
 if(note){$("#noteTitle").value=note.title;$("#noteBody").value=note.body;$("#noteSavedLabel").textContent="SAVED ON DEVICE";$("#noteTimestamp").textContent="Last modified locally";}
 noteList();
 const url=new URL(location.href);if(note)url.searchParams.set("id",note.id);else url.searchParams.delete("id");history.replaceState({},"",url);
}
function saveCurrent(){const n=notes.find(x=>x.id===currentNoteId);if(!n)return;
 n.title=$("#noteTitle").value.slice(0,120)||"Untitled";n.body=$("#noteBody").value.slice(0,30000);n.updated=Date.now();if(saveNotes(notes)){$("#noteTimestamp").textContent="Saved locally";$("#noteSavedLabel").textContent="AUTO-SAVED";}else $("#noteTimestamp").textContent="Storage full — export your work";noteList();
}
function createNote(){const n=addNote("New observation", "Untitled observation");if(!n){notify("Unable to create note");return;}notes=getNotes();openNote(n.id);$("#noteTitle").focus();$("#noteTitle").select();}
function notebookInit(){notes=getNotes();$("#createNote").addEventListener("click",createNote);$("#emptyCreate").addEventListener("click",createNote);
 $("#noteSearch").addEventListener("input",noteList);$("#noteTitle").addEventListener("input",saveCurrent);$("#noteBody").addEventListener("input",saveCurrent);
 $("#deleteNote").addEventListener("click",()=>{if(!currentNoteId||!confirm("Delete this note from this device?"))return;notes=notes.filter(n=>n.id!==currentNoteId);saveNotes(notes);openNote(notes[0]?.id||null);notify("Note deleted")});
 $("#downloadNote").addEventListener("click",()=>{const n=notes.find(n=>n.id===currentNoteId);if(n)download("axiom-note.md","# "+n.title+"\n\n"+n.body)});
 $("#exportNotes").addEventListener("click",()=>download("axiom-notebook.json",JSON.stringify({schema:"axiom.notes.v1",notes},null,2),"application/json;charset=utf-8"));
 const requested=new URLSearchParams(location.search).get("id");openNote(notes.find(n=>n.id===requested)?.id||notes[0]?.id||null);
}
function galleryInit(){const graph=getGraphState();$("#galleryGraphName").textContent="y = "+graph.expression.replace(/^y\s*=\s*/i, "");
 try{drawGraph($("#galleryPlot"),graph.expression,{zoom:graph.zoom,theme:theme()})}catch{$("#galleryPlot").setAttribute("aria-label","Unable to render saved graph")}
 const tikz=getTikzState();$("#galleryTikz").innerHTML=TIKZ_PRESETS[tikz.preset].svg;
 const notes=getNotes().slice(0,2);const holder=$("#galleryNotes");holder.replaceChildren();if(!notes.length){const el=document.createElement("div");el.className="gallery-note";el.textContent="✎  Your next conjecture…";holder.append(el);}
 for(const n of notes){const el=document.createElement("div");el.className="gallery-note";el.textContent="✎  "+n.title;holder.append(el);}
}
themeInit();if(page==="graph")graphInit();if(page==="tikz")tikzInit();if(page==="notebook")notebookInit();if(page==="artifacts")galleryInit();
