#!/usr/bin/env node
// Generates openable HTML versions of the game plans into plan/games/html/.
// Usage: node plan/games/build-html.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES, planMdFiles, parseBlocks, docTitle, esc } from './md2html.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const OUT = join(root, 'html');

// (screen CSS + page template unchanged from the working version)
const CSS = `
:root { --ink:#20233a; --muted:#6b6f85; --accent:#5450c8; --line:#e3e4ef; --card:#fff; --bg:#f4f5fa; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
header { background:linear-gradient(120deg,#191c3a,#32307a); color:#fff; padding:14px 20px; display:flex; gap:16px; align-items:baseline; flex-wrap:wrap; }
header a { color:#c7c9ff; text-decoration:none; font-weight:600; }
header a:hover { text-decoration:underline; }
header .tag { font-size:.85rem; opacity:.75; }
main { max-width:880px; margin:28px auto 60px; padding:0 20px; }
.page { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:28px 34px; box-shadow:0 1px 3px rgba(25,28,58,.06); }
h1 { font-size:1.7rem; margin:.1em 0 .4em; }
h2 { font-size:1.22rem; margin-top:1.8em; padding-bottom:.25em; border-bottom:2px solid var(--line); }
h3 { font-size:1.05rem; margin-top:1.4em; }
a { color:var(--accent); }
blockquote { margin:1em 0; padding:.7em 1.1em; border-left:4px solid var(--accent); background:#f3f3fd; border-radius:0 8px 8px 0; }
blockquote p { margin:.3em 0; }
code { background:#eef0f8; border:1px solid var(--line); border-radius:5px; padding:.1em .35em; font-size:.88em; font-family:ui-monospace,Consolas,monospace; }
pre { background:#171a30; color:#e8e9ff; padding:16px 18px; border-radius:10px; overflow-x:auto; }
pre code { background:none; border:none; color:inherit; padding:0; font-size:.85rem; line-height:1.55; }
table { border-collapse:collapse; width:100%; margin:1em 0; font-size:.93rem; }
th, td { border:1px solid var(--line); padding:.5em .7em; text-align:left; vertical-align:top; }
th { background:#eef0f8; }
tbody tr:nth-child(even) { background:#fafbff; }
ul, ol { padding-left:1.5em; }
li { margin:.3em 0; }
li > ul, li > ol { margin:.25em 0; }
.cb { display:inline-block; width:.95em; height:.95em; border:2px solid var(--accent); border-radius:4px; margin-right:.45em; vertical-align:-.08em; }
.cb.done { background:var(--accent); color:#fff; font-size:.75em; line-height:1; text-align:center; }
hr { border:none; border-top:1px solid var(--line); margin:2em 0; }
footer { max-width:880px; margin:0 auto 40px; padding:0 20px; color:var(--muted); font-size:.8rem; }
@media print { body { background:#fff; } header, footer { display:none; } .page { border:none; box-shadow:none; padding:0; } }
`;

function page(title, bodyHtml, sourceName) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<header><a href="index.html">&#8592; All game plans</a><span class="tag">2D Games &middot; sample build plans</span></header>
<main><article class="page">
${bodyHtml}
</article></main>
<footer>Generated from <code>plan/games/${sourceName}</code> &middot; 2026-09-09 &middot; regenerate with <code>node plan/games/build-html.mjs</code></footer>
</body>
</html>`;
}

function indexPage() {
  const cards = GAMES.map((g) => `
  <a class="card" href="${g.file}.html">
    <div class="num">Game ${g.no}</div>
    <h3>${esc(g.title)}</h3>
    <p>${esc(g.blurb)}</p>
    <div class="meta"><span>${g.complexity}</span><span>${g.est}</span><span class="status">not started</span></div>
  </a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>2D Games — Build Plans</title>
<style>${CSS}
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:16px; }
.card { display:block; text-decoration:none; color:inherit; transition:transform .12s, box-shadow .12s; }
.card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(25,28,58,.12); }
.card .num { font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); }
.card h3 { margin:.2em 0 .3em; font-size:1.08rem; }
.card p { margin:0 0 .8em; font-size:.88rem; color:var(--muted); }
.meta { display:flex; gap:10px; flex-wrap:wrap; font-size:.78rem; color:var(--muted); }
.status { background:#eef0f8; border-radius:20px; padding:.15em .7em; }
.intro { margin-bottom:22px; color:var(--muted); font-size:.95rem; }
</style>
</head>
<body>
<header><a href="../../../README.md">&#8592; Repo home</a><span class="tag">2D Games &middot; sample build plans &middot; 2026-09-09</span></header>
<main>
<div class="intro"><strong>7 game plans</strong> derived from <code>2d games plan.md</code>. Click a card to open its plan.
Markdown sources live in <code>plan/games/</code>; regenerate these pages with <code>node plan/games/build-html.mjs</code>.</div>
<div class="grid">${cards}
</div>
</main>
</body>
</html>`;
}

mkdirSync(OUT, { recursive: true });
for (const f of planMdFiles(root)) {
  const md = readFileSync(join(root, f), 'utf8');
  const title = docTitle(md, f);
  writeFileSync(join(OUT, f.replace(/\.md$/, '.html')), page(title, parseBlocks(md.split(/\r?\n/)), f));
  console.log('wrote', f.replace(/\.md$/, '.html'));
}
writeFileSync(join(OUT, 'index.html'), indexPage());
console.log('wrote index.html');
