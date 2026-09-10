// Shared markdown → HTML parsing for the 2D games plan builders.
// Used by build-html.mjs (screen pages) and build-pdf.mjs (print documents).
import { readdirSync } from 'node:fs';

export const GAMES = [
  { file: '01-tap-or-dont-tap', no: 1, title: "Tap or Don't Tap", complexity: '⭐ Low', est: '1–2 days', blurb: 'Go/No-Go reaction test — the shareable number is your best reaction time in ms.' },
  { file: '02-tic-tac-toe', no: 2, title: 'Tic Tac Toe', complexity: '⭐ Low', est: '1 day', blurb: 'Pass-and-play classic with an optional minimax AI and a series scoreboard.' },
  { file: '03-sliding-puzzle', no: 3, title: 'Sliding Puzzle', complexity: '⭐⭐ Medium', est: '1–2 days', blurb: '15-puzzle with guaranteed-solvable shuffles, move counter and timer.' },
  { file: '04-word-puzzle', no: 4, title: 'Word Puzzle', complexity: '⭐⭐ Medium', est: '2–3 days', blurb: 'Themed word search — drag to highlight found words, hints and star ratings.' },
  { file: '05-continuous-runner', no: 5, title: 'Continuous Runner / Hurdles', complexity: '⭐⭐ Medium', est: '2–3 days', blurb: 'Endless hurdle runner. Its engine is the foundation for Spirit Runner.' },
  { file: '06-flying-snake', no: 6, title: 'Flying Snake (Flappy)', complexity: '⭐⭐ Medium', est: '1–2 days', blurb: 'One-tap flap-through-gaps arcade game with medals and instant retry.' },
  { file: '07-spirit-runner', no: 7, title: 'Spirit Runner', complexity: '⭐⭐⭐ High', est: '5–7 days', blurb: 'Mystical runner with orb powers, rune-gate puzzles and the shadow realm.' },
];

export const planMdFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');

export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function mdLink(href) {
  const base = href.split('/').pop();
  if (base === 'README.md') return 'index.html';
  if (base === '2d games plan.md') return '../../../2d%20games%20plan.md';
  if (base === 'STANDARDS.md') return '../../STANDARDS.md';
  if (base.endsWith('.md')) return base.replace(/\.md$/, '.html');
  return href;
}

export function inline(text) {
  const codes = [];
  let t = text.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  t = esc(t);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${esc(mdLink(href))}">${label}</a>`);
  t = t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return t;
}

const isBullet = (l) => /^(\s*)([-*])\s+/.exec(l);
const isNumbered = (l) => /^(\s*)(\d+[.)])\s+/.exec(l);
const isListItem = (l) => isBullet(l) || isNumbered(l);

function parseList(lines, i) {
  const first = lines[i].match(/^(\s*)([-*]|\d+[.)])\s+/);
  const baseIndent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const items = [];
  while (i < lines.length) {
    const m = isListItem(lines[i]);
    if (!m) {
      // Wrapped continuation of the previous item (indented, non-empty, not a new item).
      if (items.length && /^\s*\S/.test(lines[i]) && lines[i].search(/\S/) >= baseIndent) {
        items[items.length - 1].text += ' ' + lines[i].trim();
        i++;
        continue;
      }
      break;
    }
    if (m[1].length < baseIndent) break;
    // A marker-type change at the same indent starts a new list (bullets vs numbers).
    if (items.length && m[1].length === baseIndent && /\d/.test(m[2]) !== ordered) break;
    if (m[1].length > baseIndent) {
      const sub = parseList(lines, i);
      items[items.length - 1].sub.push(sub.html);
      i = sub.next;
      continue;
    }
    items.push({ text: lines[i].slice(m[0].length), sub: [] });
    i++;
  }
  const lis = items.map((it) => {
    let task = '', text = it.text;
    const tm = text.match(/^\[( |x)\]\s+/i);
    if (tm) {
      task = tm[1].toLowerCase() === 'x' ? '<span class="cb done">✓</span> ' : '<span class="cb"></span> ';
      text = text.slice(tm[0].length);
    }
    return `<li>${task}${inline(text)}${it.sub.join('')}</li>`;
  });
  const tag = ordered ? 'ol' : 'ul';
  return { html: `<${tag}>${lis.join('')}</${tag}>`, next: i };
}

function parseTable(lines, i) {
  const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = cells(lines[i]);
  i += 2; // skip separator row
  const rows = [];
  while (i < lines.length && lines[i].startsWith('|')) { rows.push(cells(lines[i])); i++; }
  const th = head.map((c) => `<th>${inline(c)}</th>`).join('');
  const tb = rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
  return { html: `<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`, next: i };
}

function parseFence(lines, i) {
  const lang = lines[i].match(/^```\s*(\S*)/)[1];
  const body = [];
  i++;
  while (i < lines.length && !lines[i].startsWith('```')) { body.push(lines[i]); i++; }
  return { html: `<pre><code${lang ? ` class="lang-${esc(lang)}"` : ''}>${esc(body.join('\n'))}</code></pre>`, next: i + 1 };
}

function parseQuote(lines, i) {
  const inner = [];
  while (i < lines.length && lines[i].startsWith('>')) { inner.push(lines[i].replace(/^>\s?/, '')); i++; }
  return { html: `<blockquote>${parseBlocks(inner)}</blockquote>`, next: i };
}

export function parseBlocks(lines) {
  let html = '', para = [], i = 0;
  const flush = () => { if (para.length) { html += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) { flush(); const f = parseFence(lines, i); html += f.html; i = f.next; continue; }
    if (/^#{1,6}\s/.test(l)) { flush(); const m = l.match(/^(#{1,6})\s+(.*)$/); html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; i++; continue; }
    if (/^\s*---+\s*$/.test(l)) { flush(); html += '<hr>'; i++; continue; }
    if (l.startsWith('|') && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) { flush(); const t = parseTable(lines, i); html += t.html; i = t.next; continue; }
    if (l.startsWith('>')) { flush(); const q = parseQuote(lines, i); html += q.html; i = q.next; continue; }
    if (isListItem(l)) { flush(); const li = parseList(lines, i); html += li.html; i = li.next; continue; }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l); i++;
  }
  flush();
  return html;
}

export const docTitle = (md, fallback) => (md.match(/^#\s+(.+)$/m) || [, fallback])[1].trim();
