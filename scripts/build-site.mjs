import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const dist = path.join(root, 'dist');
const pages = ['index.html', 'artifacts.html', 'graph.html', 'tikz.html', 'notebook.html'];
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const page of pages) {
  if (!(await stat(path.join(root, page))).isFile()) throw new Error(`Missing page: ${page}`);
  await cp(path.join(root, page), path.join(dist, page));
}
await cp(path.join(root, 'src'), path.join(dist, 'src'), { recursive: true });
await cp(path.join(root, 'favicon.svg'), path.join(dist, 'favicon.svg'));
await writeFile(path.join(dist, '.nojekyll'), '');
const files = await readdir(dist);
if (!pages.every((p) => files.includes(p))) throw new Error('Incomplete GitHub Pages output');
console.log(`Ready for GitHub Pages: ${pages.length} pages, src/, favicon.svg, .nojekyll`);
