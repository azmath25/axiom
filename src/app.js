import { COMMANDS, getCommand, parseCommand, searchCommands } from "./commands.js";
import { makePreviewRequest, newClientRequestId } from "./mimo-contract.js";
import { compileExpression, drawGraph, crosshair } from "./plot.js";
import { TIKZ_PRESETS } from "./tikz.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escapeHTML = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (id) => `<svg aria-hidden="true"><use href="#ic-${id}"></use></svg>`;
const STORAGE_KEY = "axiom.studio.history.v1";
const THEME_KEY = "axiom.studio.theme.v1";
const MAX_CHATS = 50;
const state = {
  chats: loadChats(), activeId: null, filter: "all", attachedFile: null,
  paletteOpen: false, paletteRows: [], paletteIndex: 0,
  graphZoom: 1, graphPlot: null,
  lastRequest: makePreviewRequest({ command: "chat", input: "Choose a tool or enter a prompt." }),
  toastTimer: null
};
function loadChats() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(d)) return [];
    return d.filter(x => x && typeof x.id === "string" && Array.isArray(x.messages))
      .slice(0, MAX_CHATS).map(x => ({ id: x.id, title: String(x.title || "Untitled").slice(0, 100),
        starred: Boolean(x.starred), updated: Number(x.updated) || Date.now(),
        messages: x.messages.slice(-80).filter(m => m && ["user", "assistant"].includes(m.role)) }));
  } catch { return []; }
}
function saveChats() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.chats.slice(0, MAX_CHATS))); }
  catch { notify("Local storage is full; export or clear old history."); }
}
function notify(text) {
  const t = $("#toast"); t.textContent = text; t.hidden = false;
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}
const getActive = () => state.chats.find(x => x.id === state.activeId) || null;
const makeId = () => newClientRequestId();
function newChat() { state.activeId = null; state.attachedFile = null; $("#fileInput").value = "";
  $("#attachmentChip").hidden = true; $("#promptInput").value = ""; renderAll(); closeSidebar(); $("#promptInput").focus(); }
function createChat(firstMessage) {
  const text = String(firstMessage || "New exploration").replace(/^\/[a-z]+\s*/i, "").trim();
  const chat = { id: makeId(), title: text.slice(0, 46) || "New exploration", updated: Date.now(), starred: false, messages: [] };
  state.chats.unshift(chat); state.activeId = chat.id; return chat;
}
function openChat(id) {
  if (!state.chats.some(c => c.id === id)) return;
  state.activeId = id;
  const last = [...(getActive()?.messages || [])].reverse().find(m => m.role === "assistant");
  if (last) state.lastRequest = makePreviewRequest({
    command: last.command || "chat", input: last.input || "",
    threadId: id, clientRequestId: last.requestId || "historical-preview"
  });
  updateRequestPreview(); renderAll(); closeSidebar();
}
function renderAll() { renderHistory(); renderThread(); const active = getActive(); $("#chatHeading").textContent = active?.title || "New exploration";
  $("#chatCount").textContent = String(state.chats.length); $("#starCount").textContent = String(state.chats.filter(c => c.starred).length); }
function renderHistory() {
  const list = $("#historyList"); list.replaceChildren();
  const chats = [...state.chats].sort((a, b) => b.updated - a.updated).filter(x => state.filter !== "starred" || x.starred);
  if (!chats.length) { const e = document.createElement("p"); e.className = "empty-history"; e.textContent = state.filter === "starred" ? "Nothing starred yet. Star an exploration to find it here." : "Your explorations will appear here. Start with a command →"; list.append(e); }
  for (const c of chats) {
    const wrapper = document.createElement("div");
    wrapper.className = `history-entry ${state.activeId === c.id ? "active" : ""}`;
    const row = document.createElement("button"); row.type = "button";
    row.className = "history-item"; row.title = c.title;
    row.innerHTML = `${icon("terminal")}<span></span>`;
    row.querySelector("span").textContent = c.title;
    row.addEventListener("click", () => openChat(c.id));
    const star = document.createElement("button"); star.type = "button";
    star.className = `star-toggle ${c.starred ? "on" : ""}`;
    star.innerHTML = icon("star");
    star.title = c.starred ? "Unstar exploration" : "Star exploration";
    star.setAttribute("aria-label", star.title);
    star.addEventListener("click", () => { c.starred = !c.starred; saveChats(); renderAll(); });
    wrapper.append(row,star); list.append(wrapper);
  }
}
const starters = [
  { title: "Solve with clarity", sub: "Walk through a linear equation", cmd: "/solve 2x + 3 = 7", icon: "spark" },
  { title: "Plot a function", sub: "Interact with the graph explorer", cmd: "/graph y = sin(x) + 0.25*cos(3*x)", icon: "graph" },
  { title: "Draw with TikZ", sub: "Draft a clean geometric diagram", cmd: "/tikz triangle with labeled vertices", icon: "grid" },
  { title: "Audit a proof", sub: "Inspect assumptions and gaps", cmd: "/verify Check my proof that every subgroup of Z is cyclic", icon: "check" }
];
function renderWelcome() {
  const root = $("#thread"); root.innerHTML = `<section class="welcome" aria-label="Welcome to Axiom">
    <div class="welcome-halo">${icon("spark")}</div>
    <div class="welcome-kicker">YOUR SPACE TO THINK DEEPLY</div>
    <h1>Where mathematics<br>meets <em>possibility.</em></h1>
    <p class="welcome-subtitle">One conversation. A whole workbench of mathematical instruments. Solve, plot, sketch, prove, explore—and turn ideas into things you can use.</p>
    <div class="starter-separator">START WITH SOMETHING INTERESTING</div>
    <div class="starter-grid" id="starterGrid"></div>
    <div class="welcome-bottom"><i></i> LOCAL FRONTEND PREVIEW <span class="dot-sep">·</span> 12 SPECIALIZED COMMANDS <span class="dot-sep">·</span> MIMO-READY CONTRACT</div>
  </section>`;
  const grid = $("#starterGrid"); starters.forEach(s => { const b = document.createElement("button"); b.className = "starter-card"; b.type = "button";
    b.innerHTML = `<span class="starter-icon">${icon(s.icon)}</span><strong>${escapeHTML(s.title)}</strong><small>${escapeHTML(s.sub)}</small>${icon("chevron").replace("<svg",'<svg class="card-arrow"')}`;
    b.addEventListener("click", () => sendText(s.cmd)); grid.append(b);
  });
}
function messageNode(msg) {
  const node = document.createElement("article"); node.className = `message ${msg.role}`;
  const author = msg.role === "user" ? "You" : "Axiom · local tools";
  node.innerHTML = `<div class="message-avatar">${msg.role === "user" ? "U" : "✳"}</div><div class="message-content"><div class="message-label">${author.toUpperCase()}</div><div class="message-bubble"></div></div>`;
  const bubble = $(".message-bubble", node);
  if (msg.role === "user") bubble.textContent = msg.text;
  else { bubble.innerHTML = renderResponse(msg); }
  return node;
}
function renderThread() {
  const root = $("#thread"), chat = getActive(); if (!chat || !chat.messages.length) return renderWelcome();
  root.innerHTML = `<div class="thread-start"><div class="thread-title"><h1>Exploration</h1><small>${chat.messages.filter(m => m.role === "user").length} PROMPTS · LOCAL</small></div></div>`;
  chat.messages.forEach(m => root.append(messageNode(m)));
  requestAnimationFrame(() => { root.scrollTop = root.scrollHeight; });
}
function renderResponse(msg) {
  const c = msg.command || "chat", details = getCommand(c), label = details?.label || "Chat";
  if (msg.result?.kind === "linear") {
    const d = msg.result;
    return `<div class="answer-heading">A simple linear equation, solved locally.</div>
    <p class="inline-note">This is an in-browser demonstration for equations of the form ax + b = c, not an AI model.</p>
    <div class="result-card"><div class="result-card-top"><strong>${icon("check")} Linear equation</strong><span class="result-status">LOCAL DEMO</span></div>
    <div class="result-card-body"><div class="step-row"><span class="step-index">01</span><span>${escapeHTML(d.equation)}</span></div><div class="step-row"><span class="step-index">02</span><span>${escapeHTML(d.a)}x = ${escapeHTML(d.cMinusB)}</span></div><div class="step-row"><span class="step-index">03</span><span>x = ${escapeHTML(d.solution)}</span></div><div class="linear-math">x = <strong>${escapeHTML(d.solution)}</strong></div><div class="answer-pair"><span>Verification</span><strong>${escapeHTML(d.check)} = ${escapeHTML(d.c)}</strong></div></div>
    <div class="result-card-footer"><span>No model or API called</span><button data-open-artifact="request">Inspect Mimo payload</button></div></div>`;
  }
  if (c === "graph") return `Graph request prepared. The workbench has plotted the expression locally; you can edit it, zoom, and export the SVG.
    <div class="result-card"><div class="result-card-top"><strong>${icon("graph")} Graph explorer</strong><span class="result-status">LIVE LOCAL TOOL</span></div><div class="result-card-body"><strong>${escapeHTML(/^y\s*=/.test(msg.input || "") ? msg.input : "y = " + (msg.input || "sin(x)"))}</strong><br>Try the right-side interactive graph, or select another expression from the editor.</div><div class="result-card-footer"><span>No model or API called</span><button data-open-artifact="graph">Open graph</button></div></div>`;
  if (c === "tikz") return `I’ve opened a source-first TikZ workspace with a geometric template. Its SVG preview is illustrative, not compiled from the editable TeX.
    <div class="result-card"><div class="result-card-top"><strong>${icon("grid")} TikZ atelier</strong><span class="result-status">ILLUSTRATIVE DRAFT</span></div><div class="result-card-body">Edit, copy, or export a standalone <code>.tex</code> document. A future trusted backend compiler can render PDF and PNG.</div><div class="result-card-footer"><span>Compilation not connected</span><button data-open-artifact="tikz">Open TikZ</button></div></div>`;
  const input = msg.input || "your request";
  const first = c === "chat" ? "Chat prompt staged" : `/${c} command staged`;
  return `<strong>${escapeHTML(first)}.</strong> I prepared the request contract for <strong>${escapeHTML(label)}</strong> using your current input. Real reasoning is intentionally disabled until an authenticated server proxy is connected.
  <div class="result-card"><div class="result-card-top"><strong>${icon("terminal")} ${escapeHTML(label)} workflow</strong><span class="result-status">PREVIEW ONLY</span></div>
  <div class="result-card-body">Requested task: <strong>${escapeHTML(input)}</strong><br><br>Open the API panel to inspect the workflow name, input and client request identifier. Your future server will map this to a published Mimo workflow version.</div>
  <div class="result-card-footer"><span>No API request sent</span><button data-open-artifact="request">Inspect request</button></div></div>`;
}
function simpleLinearSolve(equation) {
  const original = String(equation).trim(); const text = original.replace(/\s+/g, "").replace(/−/g, "-").replace(/×/g, "*");
  const match = text.match(/^([+-]?(?:\d*\.?\d+)?)\*?x([+-]\d+(?:\.\d+)?)?=([+-]?\d+(?:\.\d+)?)$/i);
  if (!match) return null;
  const a = match[1] === "" || match[1] === "+" ? 1 : match[1] === "-" ? -1 : Number(match[1]);
  const b = Number(match[2] || "0"), c = Number(match[3]);
  if (![a,b,c].every(Number.isFinite) || Math.abs(a) < 1e-12) return null;
  const value = (c-b)/a; if (!Number.isFinite(value)) return null;
  const fmt = v => Math.round(v * 1e8) / 1e8;
  return {kind:"linear",equation:original,a:fmt(a),b:fmt(b),c:fmt(c),cMinusB:fmt(c-b),solution:fmt(value),check:fmt(a*value+b)};
}
function sendText(raw) {
  const text = String(raw || "").trim(); if (!text) return;
  const parsed = parseCommand(text);
  if (!parsed.recognized) { notify(`Unknown command /${parsed.command}. Try / for the command list.`); return; }
  if (text.length > 6000) { notify("Please keep this preview prompt under 6,000 characters."); return; }
  const chat = getActive() || createChat(text);
  const requestId = makeId();
  state.lastRequest = makePreviewRequest({command:parsed.command,input:parsed.input,threadId:chat.id,clientRequestId:requestId,attachmentName:state.attachedFile?.name||null});
  const userMessage={role:"user",text:state.attachedFile ? `${text}\n\n[Local attachment: ${state.attachedFile.name} · not uploaded]` : text,at:Date.now()};
  const response={role:"assistant",command:parsed.command,input:parsed.input,requestId,at:Date.now(),result:parsed.command==="solve" ? simpleLinearSolve(parsed.input) : null};
  chat.messages.push(userMessage,response); chat.messages=chat.messages.slice(-80); chat.updated=Date.now();
  state.chats.sort((a,b)=>b.updated-a.updated);saveChats();
  $("#promptInput").value="";state.attachedFile=null;$("#attachmentChip").hidden=true;$("#fileInput").value="";
  renderAll();updateRequestPreview();closeSlash();
  if(parsed.command==="graph"){
    const ex=(parsed.input||"sin(x)").replace(/^y\s*=\s*/i,""); $("#graphExpression").value=ex;
    setInspectorTab("graph");renderGraph();openInspector();
  } else if (parsed.command==="tikz") {
    const wanted=parsed.input.toLowerCase().includes("circle")?"circle":parsed.input.toLowerCase().includes("axis")?"axes":"triangle";
    $("#tikzPreset").value=wanted;loadTikzPreset();setInspectorTab("tikz");openInspector();
  }
  else if(parsed.command !== "solve") setInspectorTab("request");
}
function updateRequestPreview() { $("#requestJson").textContent=JSON.stringify(state.lastRequest,null,2); }
function setInspectorTab(tab) {
  $$("[data-inspector-tab]").forEach(btn=>{let active=btn.dataset.inspectorTab===tab;btn.classList.toggle("active",active);btn.setAttribute("aria-selected",String(active));});
  $$("[data-view]").forEach(section=>{section.hidden=section.dataset.view!==tab;});
}
function openInspector(){ $("#app").classList.add("inspector-open");syncShade(); }
function closeInspector(){ $("#app").classList.remove("inspector-open");syncShade(); }
function openSidebar(){ $("#app").classList.add("sidebar-open");syncShade(); }
function closeSidebar(){ $("#app").classList.remove("sidebar-open");syncShade(); }
function syncShade(){ const s=$("#mobileShade"); const side=window.matchMedia("(max-width:760px)").matches && $("#app").classList.contains("sidebar-open"); const inspector=window.matchMedia("(max-width:1150px)").matches && $("#app").classList.contains("inspector-open");s.hidden=!(side||inspector); }
function theme(){return document.documentElement.dataset.theme||"dark";}
function toggleTheme(){const next=theme()==="dark"?"light":"dark";document.documentElement.dataset.theme=next;try{localStorage.setItem(THEME_KEY,next)}catch{};$("#themeToggle").innerHTML=icon(next==="dark"?"sun":"moon");renderGraph();}
function copy(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text).then(()=>notify("Copied to clipboard")).catch(()=>fallbackCopy(text));return fallbackCopy(text);}
function fallbackCopy(text){const a=document.createElement("textarea");a.value=text;a.style.position="fixed";a.style.opacity="0";document.body.append(a);a.select();try{document.execCommand("copy");notify("Copied to clipboard")}catch{notify("Clipboard unavailable; select the text instead.")}a.remove();}
function download(name,text,type="text/plain;charset=utf-8") { const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`Exported ${name}`); }
function renderGraph() {
  try {
    const expression=$("#graphExpression").value.trim();state.graphPlot=drawGraph($("#plotSvg"),expression,{zoom:state.graphZoom,theme:theme()});
    $("#graphZoom").textContent=Math.round(state.graphZoom*100)+"%";
    $("#plotCoord").textContent="Move cursor to inspect";
    $("#graphExpression").setAttribute("aria-invalid","false");
    return true;
  } catch(e){state.graphPlot=null;$("#graphExpression").setAttribute("aria-invalid","true");notify("Graph: "+e.message);return false;}
}
function loadTikzPreset(){const p=TIKZ_PRESETS[$("#tikzPreset").value]||TIKZ_PRESETS.triangle;$("#tikzPreview").innerHTML=p.svg;$("#tikzCode").value=p.code;}
function openPalette(){closeSlash();state.paletteOpen=true;$("#paletteBackdrop").hidden=false;$("#paletteInput").value="";renderPalette();requestAnimationFrame(()=>$("#paletteInput").focus());}
function closePalette(){state.paletteOpen=false;$("#paletteBackdrop").hidden=true;}
function paletteActions(){return [
 {id:"new",label:"New exploration",glyph:"+",description:"Start a fresh chat",run:()=>newChat()},
 {id:"graphview",label:"Open graph explorer",glyph:"⌁",description:"Open the live interactive graph",run:()=>{setInspectorTab("graph");openInspector()}},
 {id:"tikzview",label:"Open TikZ atelier",glyph:"△",description:"Open the vector diagram workspace",run:()=>{setInspectorTab("tikz");openInspector()}},
 {id:"requestview",label:"Inspect Mimo request",glyph:"<> ",description:"See the proposed integration payload",run:()=>{setInspectorTab("request");openInspector()}},
 {id:"theme",label:"Switch appearance",glyph:"◐",description:"Toggle light and dark themes",run:toggleTheme}
 ];}
function renderPalette(){const q=$("#paletteInput").value.toLowerCase().trim();const actions=paletteActions().filter(a=>[a.label,a.description].some(v=>v.toLowerCase().includes(q)));
  const cmds=searchCommands(q).map(c=>({...c,run:()=>selectCommand(c.id),description:c.description,cmd:true}));state.paletteRows=[...cmds,...actions];state.paletteIndex=Math.min(state.paletteIndex,Math.max(0,state.paletteRows.length-1));
  const root=$("#paletteResults");root.replaceChildren(); if(!state.paletteRows.length){const p=document.createElement("p");p.className="empty-history";p.textContent="No matching commands";root.append(p);return;}
  state.paletteRows.forEach((c,i)=>{const row=document.createElement("button");row.className=`palette-entry ${i===state.paletteIndex?"selected":""}`;row.type="button";
    row.innerHTML=`<span class="palette-entry-icon">${escapeHTML(c.glyph)}</span><span class="palette-entry-info"><strong>${escapeHTML(c.label)}</strong><small>${escapeHTML(c.description)}</small></span><span class="palette-entry-code">${c.cmd?"/"+c.id:"↵"}</span>`;
    row.addEventListener("click",()=>activatePalette(i));row.addEventListener("mousemove",()=>{state.paletteIndex=i;markPaletteSelection();});root.append(row);
  });}
function markPaletteSelection(){const entries=$$(".palette-entry",$("#paletteResults"));entries.forEach((node,i)=>node.classList.toggle("selected",i===state.paletteIndex));entries[state.paletteIndex]?.scrollIntoView({block:"nearest"});}
function activatePalette(i){const row=state.paletteRows[i];if(!row)return;closePalette();row.run();}
function selectCommand(id){const meta=getCommand(id);if(!meta)return;const box=$("#promptInput");const before=box.value.trim();box.value=`/${id} ${before.startsWith("/")?before.replace(/^\/[a-z]+\s*/i,""):before}`.trimEnd()+" ";resizeInput();box.focus();closeSlash();}
function closeSlash(){$("#slashPopover").hidden=true;}
function updateSlash(){const v=$("#promptInput").value;const match=v.match(/^\/([a-z]*)$/i);if(!match){closeSlash();return;}
  const matches=searchCommands(match[1]).slice(0,7);const root=$("#slashPopover");root.innerHTML="";if(!matches.length){closeSlash();return;}
  matches.forEach(c=>{const row=document.createElement("button");row.type="button";row.className="popover-row";row.innerHTML=`<span class="slash-command">/${escapeHTML(c.id)}</span><span class="command-desc">${escapeHTML(c.description)}</span>`;row.addEventListener("click",()=>selectCommand(c.id));root.append(row);});root.hidden=false;
}
function resizeInput(){const el=$("#promptInput");el.style.height="auto";el.style.height=Math.min(el.scrollHeight,175)+"px";}
function openSettings(){ $("#settingsBackdrop").hidden=false; $("#closeSettings").focus(); }
function closeSettings(){ $("#settingsBackdrop").hidden=true; }
function bind() {
  $("#newChat").addEventListener("click",newChat);$("#brandHome").addEventListener("click",e=>{e.preventDefault();newChat()});
  $("#newChatTop")?.addEventListener("click",newChat);
  $("#openSidebar").addEventListener("click",openSidebar);$("#sidebarClose").addEventListener("click",closeSidebar);
  $("#mobileShade").addEventListener("click",()=>{closeSidebar();closeInspector()});
  $("#toggleInspector").addEventListener("click",()=>$("#app").classList.contains("inspector-open")?closeInspector():openInspector());
  $("#inspectorClose").addEventListener("click",closeInspector);
  $("#openPaletteHeader").addEventListener("click",openPalette);$("#openPaletteSidebar").addEventListener("click",openPalette);$("#slashButton").addEventListener("click",openPalette);
  $("#navChats").addEventListener("click",()=>{state.filter="all";$("#navChats").classList.add("active");$("#navStarred").classList.remove("active");renderHistory();});
  $("#navStarred").addEventListener("click",()=>{state.filter="starred";$("#navStarred").classList.add("active");$("#navChats").classList.remove("active");renderHistory();});
  $("#navArtifacts").addEventListener("click",()=>{setInspectorTab("graph");openInspector()});
  $("#clearHistory").addEventListener("click",()=>{if(!state.chats.length)return;if(confirm("Delete all local explorations on this device?")){state.chats=[];newChat();saveChats();notify("Local history cleared")}});
  $("#sendButton").addEventListener("click",()=>sendText($("#promptInput").value));
  $("#promptInput").addEventListener("input",()=>{resizeInput();updateSlash();});
  $("#promptInput").addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!$("#slashPopover").hidden){const first=$(".popover-row");first?.click();}else sendText(e.currentTarget.value);}
  });
  $("#attachButton").addEventListener("click",()=>$("#fileInput").click());
  $("#fileInput").addEventListener("change",e=>{const f=e.target.files?.[0];if(!f)return;state.attachedFile={name:f.name,size:f.size,type:f.type};const chip=$("#attachmentChip");chip.textContent=f.name+" · local only";chip.hidden=false;notify("Attachment selected, but file upload is disabled in preview mode.");});
  $("#thread").addEventListener("click",e=>{const b=e.target.closest("[data-open-artifact]");if(!b)return;setInspectorTab(b.dataset.openArtifact);openInspector();});
  $$("[data-inspector-tab]").forEach(b=>b.addEventListener("click",()=>setInspectorTab(b.dataset.inspectorTab)));
  $("#themeToggle").addEventListener("click",toggleTheme);$("#graphDraw").addEventListener("click",renderGraph);
  $("#graphExpression").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();renderGraph()}});
  $("#graphZoomIn").addEventListener("click",()=>{state.graphZoom=Math.min(5,state.graphZoom*1.25);renderGraph()});
  $("#graphZoomOut").addEventListener("click",()=>{state.graphZoom=Math.max(.25,state.graphZoom/1.25);renderGraph()});
  $("#resetGraph").addEventListener("click",()=>{state.graphZoom=1;$("#graphExpression").value="sin(x) + 0.25*cos(3*x)";renderGraph()});
  $("#plotSvg").addEventListener("pointermove",e=>{if(!state.graphPlot)return;const loc=crosshair($("#plotSvg"),state.graphPlot,e);if(loc)$("#plotCoord").textContent=`x ${loc.x.toFixed(2)} · y ${loc.y.toFixed(2)}`;});
  $("#plotSvg").addEventListener("pointerleave",()=>{if(state.graphPlot)renderGraph()});
  $("#downloadGraph").addEventListener("click",()=>{if(!state.graphPlot){notify("Plot a valid expression first");return;}const s=$("#plotSvg").cloneNode(true);
    s.setAttribute("xmlns","http://www.w3.org/2000/svg");
    s.setAttribute("width","960");s.setAttribute("height","740");
    s.style.background=theme()==="dark"?"#0b0e17":"#f5f5fa";
    const computed=getComputedStyle(document.documentElement);
    let xml=new XMLSerializer().serializeToString(s);
    for(const token of ["bg","border-soft","faint","muted"]){
      const value=computed.getPropertyValue("--"+token).trim();
      xml=xml.replaceAll(`var(--${token})`,value);
    }
    download("axiom-graph.svg",xml,"image/svg+xml");});
  $("#tikzPreset").addEventListener("change",loadTikzPreset);$("#copyTikz").addEventListener("click",()=>copy($("#tikzCode").value));
  $("#downloadTikz").addEventListener("click",()=>download("axiom-diagram.tex",$("#tikzCode").value));
  $("#copyRequest").addEventListener("click",()=>copy($("#requestJson").textContent));
  $("#openSettings").addEventListener("click",openSettings);$("#closeSettings").addEventListener("click",closeSettings);
  $("#settingsBackdrop").addEventListener("click",e=>{if(e.target===$("#settingsBackdrop"))closeSettings()});
  $("#settingsTheme").addEventListener("click",toggleTheme);$("#settingsExport").addEventListener("click",()=>download("axiom-local-history.json",JSON.stringify({schema:"axiom.local.v1",chats:state.chats},null,2),"application/json"));
  $("#paletteBackdrop").addEventListener("click",e=>{if(e.target===$("#paletteBackdrop"))closePalette()});
  $("#paletteInput").addEventListener("input",()=>{state.paletteIndex=0;renderPalette()});
  $("#paletteInput").addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();state.paletteIndex=Math.min(state.paletteIndex+1,state.paletteRows.length-1);markPaletteSelection();}else if(e.key==="ArrowUp"){e.preventDefault();state.paletteIndex=Math.max(0,state.paletteIndex-1);markPaletteSelection();}else if(e.key==="Enter"){e.preventDefault();activatePalette(state.paletteIndex)}});
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closePalette();closeSettings();closeSlash();closeSidebar();closeInspector();return;}
    if((e.metaKey||e.ctrlKey)&&!e.altKey){const k=e.key.toLowerCase();if(k==="k"){e.preventDefault();state.paletteOpen?closePalette():openPalette();}if(k==="j"){e.preventDefault();newChat();}}
  });
  window.addEventListener("resize",syncShade);
}
function init(){let saved=null;try{saved=localStorage.getItem(THEME_KEY)}catch{};
  document.documentElement.dataset.theme=saved==="light"?"light":"dark";$("#themeToggle").innerHTML=icon(saved==="light"?"moon":"sun");
  bind();renderAll();loadTikzPreset();renderGraph();updateRequestPreview();
}
init();
