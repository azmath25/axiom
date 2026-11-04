/** The preview is an intentionally illustrative SVG — NOT a TikZ compiler. */
export const TIKZ_PRESETS={
 triangle:{label:"Geometry · triangle",code:String.raw`\documentclass[tikz,border=7pt]{standalone}
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[scale=1.25]
  \coordinate (A) at (0,0);
  \coordinate (B) at (4,0);
  \coordinate (C) at (1.5,2.8);
  \draw[very thick,blue!65] (A)--(B)--(C)--cycle;
  \fill (A) circle (2pt) node[below left] {$A$};
  \fill (B) circle (2pt) node[below right] {$B$};
  \fill (C) circle (2pt) node[above] {$C$};
\end{tikzpicture}
\end{document}`,svg:`<svg viewBox="0 0 320 195" role="img" aria-label="Triangle with vertices A B and C"><path d="M47 151H274L127 35Z" fill="rgba(166,148,255,.08)" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/><g fill="var(--text)"><circle cx="47" cy="151" r="4"/><circle cx="274" cy="151" r="4"/><circle cx="127" cy="35" r="4"/></g><g fill="var(--muted)" font-size="15" font-family="Georgia,serif"><text x="29" y="169">A</text><text x="283" y="168">B</text><text x="118" y="24">C</text></g></svg>`},
 circle:{label:"Geometry · unit circle",code:String.raw`\documentclass[tikz,border=7pt]{standalone}
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[scale=1.7]
  \draw[->,gray] (-1.4,0)--(1.4,0) node[right] {$x$};
  \draw[->,gray] (0,-1.3)--(0,1.3) node[above] {$y$};
  \draw[thick,blue!70] (0,0) circle (1);
  \draw[thick,red!70] (0,0)--(45:1);
  \fill (45:1) circle (1.6pt) node[above right] {$P$};
\end{tikzpicture}
\end{document}`,svg:`<svg viewBox="0 0 320 195" role="img" aria-label="Unit circle with radius"><path d="M37 98H285M160 182V13" stroke="var(--faint)" stroke-width="1.3"/><path d="m280 94 6 4-6 4M156 19l4-6 4 6" fill="none" stroke="var(--faint)" stroke-width="1.4"/><circle cx="160" cy="98" r="69" fill="none" stroke="var(--accent)" stroke-width="2.5"/><path d="M160 98 208.8 49.2" stroke="var(--accent2)" stroke-width="2.8"/><circle cx="208.8" cy="49.2" r="4" fill="var(--accent2)"/><g fill="var(--muted)" font-size="14" font-family="Georgia,serif"><text x="219" y="44">P</text><text x="285" y="115">x</text><text x="171" y="20">y</text></g></svg>`},
 axes:{label:"Graph · coordinate axes",code:String.raw`\documentclass[tikz,border=7pt]{standalone}
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[scale=.8]
  \draw[step=1cm,gray!20,very thin] (-3,-2) grid (3,2);
  \draw[->] (-3.2,0)--(3.4,0) node[right] {$x$};
  \draw[->] (0,-2.2)--(0,2.4) node[above] {$y$};
  \draw[domain=-2.3:2.3,samples=100,smooth,blue!70,thick]
    plot (\x,{.30*\x*\x-1});
\end{tikzpicture}
\end{document}`,svg:`<svg viewBox="0 0 320 195" role="img" aria-label="Parabolic function on coordinate axes"><defs><pattern id="tgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="var(--border)"/></pattern></defs><rect x="10" y="10" width="300" height="175" fill="url(#tgrid)"/><path d="M10 104H309M160 10V185" stroke="var(--faint)" stroke-width="1.4"/><path d="m303 100 6 4-6 4M156 16l4-6 4 6" fill="none" stroke="var(--faint)" stroke-width="1.4"/><path d="M35 12Q160 202 285 12" fill="none" stroke="var(--accent)" stroke-width="3"/><g fill="var(--muted)" font-size="13" font-family="Georgia,serif"><text x="297" y="120">x</text><text x="170" y="17">y</text></g></svg>`}
};
