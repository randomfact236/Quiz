/**
 * ============================================================================
 * Flying Snake — render.js (Game 06, plan/games/06-flying-snake.md §6)
 * ============================================================================
 * Procedural draw, no assets (README §8.7): sky, drifting clouds, parallax
 * hills, vine pairs, scrolling ground, the snake (tilted head + 5 trailing
 * segments with a sinusoidal wiggle), the HUD score with its pop animation,
 * the death flash, the `ready` hint and the ?debug=1 hitboxes.
 *
 * Zero DOM access at import time — pure draw functions taking a 2d context,
 * so importing this module (jest / harnesses) has no side effects. All
 * coordinates are in the 720×960 logical viewport (core.js); main.js applies
 * the letterbox/DPR transform before calling drawScene().
 * ============================================================================
 */
import {
  EDGE_MARGIN,
  GROUND_H,
  PIPE_W,
  SNAKE_R,
  VIEW_H,
  VIEW_W,
  groundY,
  hitRadius,
  pipeRects,
  snakeX,
  tiltFor,
} from './core.js';

/* ---- palette --------------------------------------------------------------- */

const SKY = { top: '#4db4ef', mid: '#8ed8f8', low: '#dff4ff' };
const HILLS_FAR = '#b5e3c6';
const HILLS_NEAR = '#8fd6a4';
const VINE = { body: '#2f9e4f', dark: '#1f6b34', light: '#48b562', cap: '#3cb45c' };
const GROUND = { grass: '#5cbf60', grassDark: '#3e9c47', dirt: '#c98d5a', dirtDark: '#b87c4c' };
const SNAKE = { light: '#8fe89a', base: '#3aa857', dark: '#1d7a38', belly: '#d8f5d8' };

/* ---- helpers ---------------------------------------------------------------- */

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ---- background -------------------------------------------------------------- */

function drawSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, groundY());
  sky.addColorStop(0, SKY.top);
  sky.addColorStop(0.65, SKY.mid);
  sky.addColorStop(1, SKY.low);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, groundY());

  // soft sun, top right
  const sun = ctx.createRadialGradient(VIEW_W * 0.82, 110, 12, VIEW_W * 0.82, 110, 120);
  sun.addColorStop(0, 'rgba(255,252,230,0.95)');
  sun.addColorStop(0.35, 'rgba(255,250,214,0.55)');
  sun.addColorStop(1, 'rgba(255,250,214,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(VIEW_W * 0.82, 110, 120, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  // four cloud slots drifting slowly leftwards, wrapping around
  for (let i = 0; i < 4; i++) {
    const speed = 10 + i * 3;
    const span = VIEW_W + 260;
    const cx = ((((i * 230 + 90 - t * speed) % span) + span) % span) - 130;
    const cy = 90 + ((i * 137) % 260);
    const s = 0.75 + ((i * 53) % 40) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, 26 * s, 0, Math.PI * 2);
    ctx.arc(cx + 30 * s, cy - 10 * s, 21 * s, 0, Math.PI * 2);
    ctx.arc(cx + 58 * s, cy + 2 * s, 24 * s, 0, Math.PI * 2);
    ctx.arc(cx + 28 * s, cy + 10 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Rolling sine silhouette; `offset` carries the parallax scroll. */
function drawHills(ctx, color, baseY, amp, wavelength, offset) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, groundY() + 2);
  for (let x = 0; x <= VIEW_W; x += 12) {
    const y = baseY - amp * (0.5 + 0.5 * Math.sin(((x + offset) / wavelength) * Math.PI * 2));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, groundY() + 2);
  ctx.closePath();
  ctx.fill();
}

/* ---- vines (pipe pairs) ------------------------------------------------------- */

function drawVineBody(ctx, x, y, w, h) {
  if (h <= 0) return;
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, VINE.dark);
  grad.addColorStop(0.28, VINE.light);
  grad.addColorStop(0.55, VINE.body);
  grad.addColorStop(1, VINE.dark);
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  // alternating leaf bumps along both edges — reads as a vine, zero assets
  ctx.fillStyle = VINE.light;
  const start = Math.ceil(y / 52) * 52;
  for (let by = start; by < y + h - 10; by += 52) {
    const side = Math.floor(by / 52) % 2 === 0;
    ctx.beginPath();
    ctx.ellipse(side ? x + 2 : x + w - 2, by, 9, 15, side ? 0.5 : -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVines(ctx, pipes) {
  for (const pipe of pipes) {
    const rects = pipeRects(pipe);
    drawVineBody(ctx, rects[0].x, rects[0].y, rects[0].w, rects[0].h);
    drawVineBody(ctx, rects[1].x, rects[1].y, rects[1].w, rects[1].h);
    // lips framing the gap — the part the eye tracks
    ctx.fillStyle = VINE.cap;
    ctx.strokeStyle = VINE.dark;
    ctx.lineWidth = 2.5;
    const top = rects[0];
    roundRect(ctx, top.x - 5, top.y + top.h - 16, PIPE_W + 10, 18, 8);
    ctx.fill();
    ctx.stroke();
    const bottom = rects[1];
    roundRect(ctx, bottom.x - 5, bottom.y, PIPE_W + 10, 18, 8);
    ctx.fill();
    ctx.stroke();
  }
}

/* ---- ground -------------------------------------------------------------------- */

function drawGround(ctx, worldX) {
  ctx.fillStyle = GROUND.dirt;
  ctx.fillRect(0, groundY(), VIEW_W, GROUND_H);
  // scrolling diagonal stripes in the dirt
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, groundY() + 18, VIEW_W, GROUND_H - 18);
  ctx.clip();
  ctx.fillStyle = GROUND.dirtDark;
  const period = 48;
  const shift = worldX % period;
  for (let x = -period; x < VIEW_W + period; x += period) {
    ctx.beginPath();
    ctx.moveTo(x - shift, groundY() + 18);
    ctx.lineTo(x - shift + 20, groundY() + 18);
    ctx.lineTo(x - shift + 20 + 26, VIEW_H);
    ctx.lineTo(x - shift + 26, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // grass band on top
  const grass = ctx.createLinearGradient(0, groundY(), 0, groundY() + 18);
  grass.addColorStop(0, GROUND.grass);
  grass.addColorStop(1, GROUND.grassDark);
  ctx.fillStyle = grass;
  ctx.fillRect(0, groundY(), VIEW_W, 18);
  // blade fringe
  ctx.fillStyle = GROUND.grass;
  const gshift = worldX % 26;
  for (let x = -26; x < VIEW_W + 26; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x - gshift, groundY() + 2);
    ctx.lineTo(x - gshift + 9, groundY() - 7);
    ctx.lineTo(x - gshift + 18, groundY() + 2);
    ctx.closePath();
    ctx.fill();
  }
}

/* ---- snake ----------------------------------------------------------------------- */

function drawSnake(ctx, s) {
  const x = snakeX();
  // trailing segments first, so the head overlaps them — newest sample first
  for (let i = 0; i < s.trail.length; i++) {
    const seg = s.trail[i];
    const wiggle = Math.sin(s.t * 9 + (i + 1) * 1.4) * 2.5;
    const r = 12.5 - i * 1.15;
    ctx.globalAlpha = 0.9 - i * 0.13;
    ctx.fillStyle = i % 2 === 0 ? SNAKE.base : SNAKE.dark;
    ctx.beginPath();
    ctx.arc(x - 22 * (i + 1), seg.y + wiggle, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(x, s.snakeY);
  ctx.rotate((tiltFor(s.snakeVy) * Math.PI) / 180);
  // head
  const grad = ctx.createRadialGradient(-4, -5, 3, 0, 0, SNAKE_R + 3);
  grad.addColorStop(0, SNAKE.light);
  grad.addColorStop(1, SNAKE.base);
  ctx.fillStyle = grad;
  ctx.strokeStyle = SNAKE.dark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, SNAKE_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // belly glint
  ctx.fillStyle = SNAKE.belly;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(2, 7, 7, 3.4, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(4.5, -4.5, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#17202a';
  ctx.beginPath();
  ctx.arc(5.8, -4.9, 2.1, 0, Math.PI * 2);
  ctx.fill();
  // flicking tongue
  if (s.t % 3.2 < 0.28) {
    ctx.strokeStyle = '#e2445c';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(SNAKE_R - 1, 3);
    ctx.lineTo(SNAKE_R + 7, 4.5);
    ctx.moveTo(SNAKE_R + 7, 4.5);
    ctx.lineTo(SNAKE_R + 11, 2.5);
    ctx.moveTo(SNAKE_R + 7, 4.5);
    ctx.lineTo(SNAKE_R + 11, 7);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---- HUD --------------------------------------------------------------------------- */

function drawScore(ctx, s) {
  ctx.save();
  ctx.translate(VIEW_W / 2, 118);
  ctx.scale(s.scorePop, s.scorePop);
  ctx.font = '800 68px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(15,45,25,0.75)';
  // A threaded-by-a-hair pass flashes the score gold with a glow instead of
  // plain white (suggestion 03 item 1).
  if (s.nearMiss > 0) {
    ctx.shadowColor = 'rgba(255, 215, 0, ' + Math.min(1, s.nearMiss).toFixed(3) + ')';
    ctx.shadowBlur = 26 * s.nearMiss;
  }
  ctx.strokeText(String(s.score), 0, 0);
  ctx.fillStyle = s.nearMiss > 0 ? '#ffd700' : '#fff';
  ctx.fillText(String(s.score), 0, 0);
  ctx.restore();
}

/** Quick gold edge glow around the viewport after a near-miss pass. */
function drawNearMissGlow(ctx, s) {
  if (!(s.nearMiss > 0)) return;
  const glow = ctx.createRadialGradient(
    VIEW_W / 2,
    VIEW_H / 2,
    VIEW_H * 0.35,
    VIEW_W / 2,
    VIEW_H / 2,
    VIEW_H * 0.72
  );
  glow.addColorStop(0, 'rgba(255,215,0,0)');
  glow.addColorStop(1, 'rgba(255,215,0,' + (0.28 * s.nearMiss).toFixed(3) + ')');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawHint(ctx, t, text) {
  const pulse = 0.65 + 0.35 * Math.sin(t * 3.4);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 34px "Segoe UI", system-ui, sans-serif';
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(15,45,25,0.7)';
  ctx.strokeText(text, VIEW_W / 2, VIEW_H * 0.6);
  ctx.fillStyle = '#fff';
  ctx.fillText(text, VIEW_W / 2, VIEW_H * 0.6);
  // little up arrow under the text
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2, VIEW_H * 0.6 + 58);
  ctx.lineTo(VIEW_W / 2 - 13, VIEW_H * 0.6 + 82);
  ctx.lineTo(VIEW_W / 2 + 13, VIEW_H * 0.6 + 82);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDebug(ctx, s) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ff2d95';
  ctx.beginPath();
  ctx.arc(snakeX(), s.snakeY, hitRadius(), 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ff3b30';
  for (const pipe of s.pipes) {
    for (const r of pipeRects(pipe)) ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
  ctx.strokeStyle = '#0a84ff';
  ctx.beginPath();
  ctx.moveTo(0, groundY());
  ctx.lineTo(VIEW_W, groundY());
  ctx.stroke();
  ctx.strokeStyle = '#5e5ce6';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, EDGE_MARGIN);
  ctx.lineTo(VIEW_W, EDGE_MARGIN);
  ctx.moveTo(0, groundY() - EDGE_MARGIN);
  ctx.lineTo(VIEW_W, groundY() - EDGE_MARGIN);
  ctx.stroke();
  ctx.restore();
}

/* ---- entry point --------------------------------------------------------------------- */

/**
 * Draw one frame. `s` carries the scene state main.js assembled:
 * { mode, snakeY, snakeVy, trail, pipes, score, worldX, t, flash,
 *   shake: {x, y}, scorePop, nearMiss, hintText, debug }
 * Modes: 'menu' | 'ready' | 'playing' | 'dying' | 'paused' | 'gameover'.
 */
export function drawScene(ctx, s) {
  ctx.save();
  ctx.translate(s.shake.x, s.shake.y);
  drawSky(ctx);
  drawClouds(ctx, s.t);
  drawHills(ctx, HILLS_FAR, groundY() - 46, 64, 260, s.worldX * 0.3);
  drawHills(ctx, HILLS_NEAR, groundY() - 10, 44, 170, s.worldX * 0.55);
  drawVines(ctx, s.pipes);
  drawGround(ctx, s.worldX);
  drawSnake(ctx, s);
  drawNearMissGlow(ctx, s);
  if (s.mode === 'playing' || s.mode === 'dying') drawScore(ctx, s);
  if (s.mode === 'ready') drawHint(ctx, s.t, s.hintText || 'Tap to flap');
  if (s.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + s.flash.toFixed(3) + ')';
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }
  if (s.debug) drawDebug(ctx, s);
  ctx.restore();
}
