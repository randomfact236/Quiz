#!/usr/bin/env node
// Generates print-ready HTML (A4 documents) for the game plans into plan/games/pdf/.
// Convert to PDF with the pdf skill's html2pdf-next.js afterwards.
// Usage: node plan/games/build-pdf.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES, planMdFiles, parseBlocks, docTitle, esc } from './md2html.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const OUT = join(root, 'pdf');

// Print CSS — single indigo family, ≤5 colors, no decorative borders, A4 flow.
const CSS = `
@page { size: A4; margin: 16mm 15mm 18mm; }
html, body { margin:0; padding:0; background:#ffffff; }
body { color:#1c1f33; font:10.5pt/1.55 'Segoe UI', system-ui, -apple-system, 'Segoe UI Emoji', sans-serif; }
.kicker { font-size:8pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#4744b8; margin:0 0 6pt; }
h1 { font-size:20pt; line-height:1.25; margin:0 0 4pt; }
.meta { color:#5f6377; font-size:9pt; margin:0 0 10pt; }
.meta span { margin-right:14pt; }
.rule { border:none; border-top:2.5px solid #4744b8; margin:0 0 14pt; }
h2 { font-size:13pt; margin:18pt 0 6pt; padding-bottom:3pt; border-bottom:1px solid #e2e4ee; break-after:avoid; }
h3 { font-size:11pt; margin:12pt 0 4pt; break-after:avoid; }
p { margin:5pt 0; }
a { color:#4744b8; text-decoration:none; }
blockquote { margin:8pt 0; padding:6pt 10pt; border-left:3px solid #4744b8; background:#f3f3fb; }
blockquote p { margin:2pt 0; }
code { font-family:Consolas, ui-monospace, monospace; font-size:8.5pt; background:#f1f2f8; border:1px solid #e2e4ee; border-radius:3px; padding:0 3pt; }
pre { background:#f5f6fa; border:1px solid #e2e4ee; border-radius:5px; padding:8pt 10pt; break-inside:avoid; }
pre code { background:none; border:none; padding:0; font-size:8pt; line-height:1.5; white-space:pre-wrap; }
table { border-collapse:collapse; width:100%; margin:8pt 0; font-size:9pt; }
thead { display:table-header-group; }
tr { break-inside:avoid; }
th, td { border:1px solid #d8dae8; padding:4pt 6pt; text-align:left; vertical-align:top; }
th { background:#eef0f8; }
ul, ol { margin:5pt 0; padding-left:16pt; }
li { margin:2.5pt 0; break-inside:avoid; }
li > ul, li > ol { margin:2pt 0; }
.cb { display:inline-block; width:8pt; height:8pt; border:1.5px solid #4744b8; border-radius:2px; margin-right:4pt; }
.cb.done { background:#4744b8; }
hr { border:none; border-top:1px solid #e2e4ee; margin:14pt 0; }
.footnote { color:#5f6377; font-size:8pt; margin-top:16pt; border-top:1px solid #e2e4ee; padding-top:5pt; }
`;

function docPage(title, meta, bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<p class="kicker">2D Games · Sample Build Plan</p>
<h1>${esc(title)}</h1>
<p class="meta">${meta}</p>
<hr class="rule">
${bodyHtml}
<p class="footnote">Source: plan/games markdown · generated 2026-09-09 · part of the 2D Games sample plans (plan/games/pdf).</p>
</body>
</html>`;
}

function metaLine(g) {
  const parts = g
    ? [`Game ${g.no} of 7`, `Complexity: ${g.complexity}`, `Estimate: ${g.est}`, 'Status: not started']
    : ['Overview & shared conventions', 'Status: reference document'];
  return parts.map((p) => `<span>${esc(p)}</span>`).join('');
}

mkdirSync(OUT, { recursive: true });
const bySlug = Object.fromEntries(GAMES.map((g) => [g.file, g]));
for (const f of planMdFiles(root)) {
  const md = readFileSync(join(root, f), 'utf8');
  const title = docTitle(md, f);
  // The template renders the title block; drop the markdown's own H1 to avoid duplication.
  const body = parseBlocks(md.replace(/^#\s+[^\n]*\n+/, '').split(/\r?\n/));
  const g = bySlug[f.replace(/\.md$/, '')];
  const html = docPage(title, metaLine(g), body);
  const out = join(OUT, f.replace(/\.md$/, '.print.html'));
  writeFileSync(out, html);
  console.log('wrote', out);
}
console.log('done');
