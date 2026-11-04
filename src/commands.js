/** The command catalog is deliberately data-only, so a backend can reuse it. */
export const COMMANDS = Object.freeze([
  {id:"solve",label:"Solve",glyph:"∑",description:"Work through an equation or problem",hint:"/solve 2x + 3 = 7",group:"Mathematics",placeholder:"2x + 3 = 7"},
  {id:"graph",label:"Graph",glyph:"⌁",description:"Plot a function in the live graph explorer",hint:"/graph y = sin(x) + 0.25*cos(3*x)",group:"Visualize",placeholder:"y = sin(x)"},
  {id:"tikz",label:"TikZ",glyph:"△",description:"Draft a vector diagram in LaTeX/TikZ",hint:"/tikz triangle with labeled vertices",group:"Visualize",placeholder:"triangle with labeled vertices"},
  {id:"prove",label:"Prove",glyph:"∀",description:"Structure a proof and dependencies",hint:"/prove Every subgroup of Z is cyclic",group:"Mathematics",placeholder:"State your theorem…"},
  {id:"verify",label:"Verify",glyph:"✓",description:"Audit a proof for missing assumptions",hint:"/verify Is this argument valid?",group:"Mathematics",placeholder:"Paste an argument…"},
  {id:"explain",label:"Explain",glyph:"?",description:"Explain with examples and intuition",hint:"/explain Fourier multipliers",group:"Learn",placeholder:"Fourier multipliers"},
  {id:"latex",label:"LaTeX",glyph:"TeX",description:"Polish notation or convert to LaTeX",hint:"/latex integral of sin x",group:"Produce",placeholder:"Describe the expression…"},
  {id:"quiz",label:"Quiz",glyph:"#",description:"Prepare exam questions and solutions",hint:"/quiz 5 questions on matrices",group:"Produce",placeholder:"5 questions on matrices"},
  {id:"extract",label:"Extract",glyph:"↗",description:"Plan document-to-math transcription",hint:"/extract Convert this question to LaTeX",group:"Produce",placeholder:"Describe the document…"},
  {id:"simplify",label:"Simplify",glyph:"≈",description:"Reduce a symbolic expression",hint:"/simplify (x^2-1)/(x-1)",group:"Mathematics",placeholder:"(x^2-1)/(x-1)"},
  {id:"analyze",label:"Analyze",glyph:"∂",description:"Explore assumptions and edge cases",hint:"/analyze continuity of f(x)",group:"Mathematics",placeholder:"Your mathematical question…"},
  {id:"code",label:"Code",glyph:"</>",description:"Generate or review mathematical code",hint:"/code fast Fourier transform in Python",group:"Produce",placeholder:"Describe your algorithm…"}
]);
export function getCommand(id){return COMMANDS.find(x=>x.id===id)||null;}
export function parseCommand(message){
  const raw=String(message||"").trim();
  const match=raw.match(/^\/([a-z][a-z0-9_-]*)(?:\s+([\s\S]*))?$/i);
  if(!match)return {command:"chat",input:raw,raw,recognized:!raw.startsWith("/")};
  const id=match[1].toLowerCase();
  return {command:id,input:(match[2]||"").trim(),raw,recognized:!!getCommand(id)};
}
export function searchCommands(query){const q=String(query||"").trim().toLowerCase().replace(/^\//,"");return COMMANDS.filter(c=>[c.id,c.label,c.description,c.group].some(text=>text.toLowerCase().includes(q)));}
