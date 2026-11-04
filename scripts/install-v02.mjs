import {readFileSync,writeFileSync,mkdirSync,rmSync} from "node:fs";
import {dirname} from "node:path";
import {inflateSync} from "node:zlib";
const files=JSON.parse(inflateSync(readFileSync(".axiom/source-v02.zlib")).toString("utf8"));
for(const [p,s] of Object.entries(files)){
 if(!p||p.startsWith("/")||p.includes("..")||p.includes("\\")||typeof s!=="string")throw Error("Unsafe source path");
 mkdirSync(dirname(p),{recursive:true});writeFileSync(p,s,"utf8");
}
let d=readFileSync("README.md","utf8");
d=d.replace("![Axiom v0.2 desktop workspace](docs/v02-index-1440.png)","**Axiom v0.2:** Chat, Artifacts, Graph, TikZ and Notebook.");
d=d.replace("[Phone layout](docs/v02-index-390.png) · [Inline graph response](docs/v02-chat-graph-1440.png) · [Independent artifacts](docs/v02-artifacts-1440.png) · [Graph on mobile](docs/v02-graph-390.png) · [Design decisions](docs/DESIGN_DECISIONS.md)","[Earlier desktop preview](docs/desktop-preview.png) · [Design decisions](docs/DESIGN_DECISIONS.md)");
d=d.replace("## GitHub Pages deployment (prepared, not published)","## GitHub Pages deployment");
d=d.replaceAll("azmath25/axiom-math-studio","azmath25/axiom").replaceAll("https://azmath25.github.io/axiom-math-studio/","https://azmath25.github.io/axiom/");
d+="\n\n**Canonical repository:** https://github.com/azmath25/axiom. Graphing and notebooks are browser-only.\n";
writeFileSync("README.md",d);
const p="docs/FRONTEND_V02_CHECKPOINT.md";let c=readFileSync(p,"utf8");
c=c.replaceAll("azmath25/axiom-math-studio","azmath25/axiom");writeFileSync(p,c);
rmSync(".axiom",{recursive:true,force:true});
rmSync(".github/workflows/import-v02.yml",{force:true});
rmSync("scripts/install-v02.mjs",{force:true});
console.log("Imported",Object.keys(files).length,"source files");
