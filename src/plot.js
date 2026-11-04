/** Tiny safe graph expression interpreter. No eval, Function, or arbitrary JS. */
const functions=Object.freeze({sin:Math.sin,cos:Math.cos,tan:Math.tan,abs:Math.abs,sqrt:Math.sqrt,exp:Math.exp,log:Math.log10,ln:Math.log});
export function tokenize(source){
 const s=String(source).trim().replace(/^\s*y\s*=\s*/i,"");const t=[];let i=0;
 while(i<s.length){let rest=s.slice(i);if(/^\s/.test(rest)){i++;continue;}
  let m=rest.match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);if(m){t.push({kind:"number",value:Number(m[0])});i+=m[0].length;continue;}
  m=rest.match(/^[a-zA-Z]+/);if(m){t.push({kind:"name",value:m[0].toLowerCase()});i+=m[0].length;continue;}
  if("+-*/^(),".includes(s[i])){t.push({kind:s[i],value:s[i]});i++;continue;}
  throw new Error(`Unsupported character “${s[i]}” at position ${i+1}`);
 }
 t.push({kind:"eof"});return t;
}
export function compileExpression(source){
 const tokens=tokenize(source);let i=0;const peek=()=>tokens[i],take=()=>tokens[i++];
 const expect=(k)=>{if(peek().kind!==k)throw new Error(`Expected ${k}`);return take()};
 const primary=()=>{const token=take();
   if(token.kind==="number")return ()=>token.value;
   if(token.kind==="("){const x=expression();expect(")");return x;}
   if(token.kind==="name"){
    if(token.value==="x")return x=>x;
    if(token.value==="pi")return ()=>Math.PI;
    if(token.value==="e")return ()=>Math.E;
    const fn=functions[token.value];if(!fn)throw new Error(`Unknown function or variable: ${token.value}`);
    expect("(");const arg=expression();expect(")");return x=>fn(arg(x));
   }
   throw new Error(`Unexpected token ${token.kind}`);
 };
 // Right associative exponent, with standard -x^2 = -(x^2) precedence.
 const power=()=>{let a=primary();if(peek().kind==="^"){take();const b=unary();const left=a;a=x=>Math.pow(left(x),b(x));}return a;};
 const unary=()=>{if(peek().kind==="+"){take();return unary()}if(peek().kind==="-"){take();const y=unary();return x=>-y(x);}return power()};
 const term=()=>{let a=unary();while(peek().kind==="*"||peek().kind==="/"){const op=take().kind,b=unary(),left=a;a=op==="*"?(x=>left(x)*b(x)):(x=>left(x)/b(x));}return a;};
 const expression=()=>{let a=term();while(peek().kind==="+"||peek().kind==="-"){const op=take().kind,b=term(),left=a;a=op==="+"?(x=>left(x)+b(x)):(x=>left(x)-b(x));}return a;};
 const result=expression();if(peek().kind!=="eof")throw new Error(`Unexpected token ${peek().kind}`);return result;
}
const svgns="http://www.w3.org/2000/svg";
export function drawGraph(svg,expression,{zoom=1,theme="dark"}={}){
 const func=compileExpression(expression);const W=480,H=370,xmax=10/zoom,ymax=7.7/zoom;
 const sx=x=>W/2+(x/xmax)*W/2,sy=y=>H/2-(y/ymax)*H/2;
 const lines=[];for(let n=-10;n<=10;n++){
 const x=n*xmax/10,y=n*ymax/10;
 lines.push(`<line x1="${sx(x).toFixed(3)}" y1="0" x2="${sx(x).toFixed(3)}" y2="${H}" stroke="var(--border-soft)" opacity=".83"/>`);
 lines.push(`<line x1="0" y1="${sy(y).toFixed(3)}" x2="${W}" y2="${sy(y).toFixed(3)}" stroke="var(--border-soft)" opacity=".83"/>`);
 }
 let paths=[],points=[];const count=720;const stroke=theme==="light"?"#7357cb":"#b8a9ff";
 for(let n=0;n<=count;n++){
   const x=-xmax+2*xmax*n/count;let y;try{y=func(x)}catch{y=NaN;}
   if(!Number.isFinite(y)||Math.abs(y)>ymax*4){if(points.length>1)paths.push(points.join(" "));points=[];continue;}
   const cx=sx(x),cy=sy(y);if(points.length&&Math.abs(cy-Number(points[points.length-1].split(",")[1]))>H*.62){if(points.length>1)paths.push(points.join(" "));points=[];}
   points.push(cx.toFixed(2)+","+cy.toFixed(2));
 }
 if(points.length>1)paths.push(points.join(" "));
 const markup=`<defs><clipPath id="plotclip"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath><linearGradient id="glowLine" x1="0" x2="1"><stop offset="0" stop-color="${stroke}" stop-opacity=".2"/><stop offset=".5" stop-color="${stroke}" stop-opacity=".35"/><stop offset="1" stop-color="${stroke}" stop-opacity=".1"/></linearGradient></defs><rect x="0" y="0" width="${W}" height="${H}" fill="var(--bg)"/>${lines.join("")}<line x1="${sx(0)}" y1="0" x2="${sx(0)}" y2="${H}" stroke="var(--faint)" opacity=".8"/><line x1="0" y1="${sy(0)}" x2="${W}" y2="${sy(0)}" stroke="var(--faint)" opacity=".8"/><g clip-path="url(#plotclip)">${paths.map(path=>`<polyline points="${path}" stroke="url(#glowLine)" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" fill="none" opacity=".24"/><polyline points="${path}" stroke="${stroke}" stroke-width="2.7" stroke-linejoin="round" stroke-linecap="round" fill="none"/>`).join("")}</g><text x="${W-15}" y="${sy(0)-8}" fill="var(--muted)" font-size="13" font-family="monospace">x</text><text x="${sx(0)+10}" y="16" fill="var(--muted)" font-size="13" font-family="monospace">y</text><line id="plotCrossX" x1="0" y1="0" x2="0" y2="${H}" stroke="${stroke}" stroke-dasharray="4 6" opacity="0"/><line id="plotCrossY" x1="0" y1="0" x2="${W}" y2="0" stroke="${stroke}" stroke-dasharray="4 6" opacity="0"/><circle id="plotCrossDot" cx="0" cy="0" r="4.5" fill="${stroke}" opacity="0"/>`;
 svg.innerHTML=markup;
 return {func,xmax,ymax,W,H,sx,sy};
}
export function crosshair(svg,plot,pointer){const r=svg.getBoundingClientRect(),px=Math.max(0,Math.min(plot.W,(pointer.clientX-r.left)/r.width*plot.W));const x=(px/plot.W-.5)*plot.xmax*2;const y=plot.func(x);if(!Number.isFinite(y))return null;const cy=plot.sy(y);const lineX=svg.querySelector("#plotCrossX"),lineY=svg.querySelector("#plotCrossY"),dot=svg.querySelector("#plotCrossDot");lineX.setAttribute("x1",px);lineX.setAttribute("x2",px);lineY.setAttribute("y1",cy);lineY.setAttribute("y2",cy);dot.setAttribute("cx",px);dot.setAttribute("cy",cy);for(const el of [lineX,lineY,dot])el.setAttribute("opacity",".95");return {x,y};}
