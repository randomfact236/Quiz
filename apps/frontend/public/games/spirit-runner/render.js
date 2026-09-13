/**
 * ============================================================================
 * Spirit Runner — render.js (Game 07, plan/games/07-spirit-runner.md §6)
 * ============================================================================
 * Procedural draw, no assets (master README §8.7): the mystical forest —
 * depth palettes (dawn → dusk → night forest, plan §2 Phase A), drifting
 * mist, fireflies at night, a far canopy (×0.2), a near tree line (×0.5), the
 * mossy path (×1); the five obstacle looks (fallen log, hanging
 * branch, wisp-column / wisp-disc guardians, pulsing rune trap); spirit orbs
 * and rune-gate doors drawn with 'lighter' composite glow (plan §6); the
 * hooded runner with per-character tint and a crouch slide pose; particles,
 * floaters, the HUD (hearts · orb meter · distance · depth · shadow-realm
 * countdown · hint banner) and the ?debug=1 hitboxes + gate rule id (§3).
 *
 * Zero DOM access at import time — pure draw functions taking a 2d context.
 * All coordinates are the 900×500 logical viewport (core.js); main.js
 * applies the letterbox/DPR transform before calling drawScene().
 * ============================================================================
 */
import {
  BRANCH_BOTTOM,
  BRANCH_TOP,
  GATE_DOOR_W,
  GATE_GAP,
  GATE_H,
  GROUND_Y,
  GUARDIAN_LOW_BOTTOM,
  GUARDIAN_LOW_TOP,
  HEARTS_MAX,
  HITBOX_INSET,
  METER_FULL,
  ORB_R,
  PLAYER_X,
  SLIDE_H_FACTOR,
  PLAYER_H,
  SHADOW_S,
  TRAP_DARK_S,
  TRAP_WARN_S,
  VIEW_H,
  VIEW_W,
  obstacleBox,
  playerBox,
  trapLit,
  trapPhase,
} from './core.js';
import { ruleLabel } from './gates.js';

/* ---- palettes (plan §2 Phase A: dawn → dusk → night forest) ------------------ */

const PALETTES = [
  // dawn forest
  {
    skyTop: [255, 214, 186],
    skyMid: [255, 236, 200],
    skyLow: [246, 248, 224],
    canopyFar: [126, 176, 149],
    canopyNear: [66, 122, 98],
    trunk: [94, 74, 66],
    grass: [110, 178, 116],
    grassDark: [74, 140, 92],
    path: [214, 196, 158],
    pathDark: [182, 162, 126],
    glow: [255, 244, 214],
    stars: 0,
    motes: [255, 236, 180],
  },
  // dusk forest
  {
    skyTop: [122, 82, 148],
    skyMid: [235, 138, 96],
    skyLow: [255, 206, 148],
    canopyFar: [98, 96, 130],
    canopyNear: [52, 66, 88],
    trunk: [70, 58, 66],
    grass: [92, 128, 96],
    grassDark: [60, 96, 76],
    path: [176, 148, 122],
    pathDark: [142, 116, 96],
    glow: [255, 210, 150],
    stars: 0.35,
    motes: [255, 190, 120],
  },
  // night forest
  {
    skyTop: [12, 20, 44],
    skyMid: [28, 44, 82],
    skyLow: [58, 88, 118],
    canopyFar: [36, 58, 72],
    canopyNear: [20, 38, 50],
    trunk: [34, 34, 48],
    grass: [44, 84, 72],
    grassDark: [28, 60, 52],
    path: [92, 104, 116],
    pathDark: [66, 76, 90],
    glow: [154, 255, 226],
    stars: 1,
    motes: [150, 255, 210],
  },
];

// the shadow realm (plan §2 Phase C: darker palette) — cold violet, red glow
const SHADOW_PALETTE = {
  skyTop: [16, 8, 30],
  skyMid: [34, 14, 52],
  skyLow: [54, 24, 66],
  canopyFar: [38, 20, 52],
  canopyNear: [24, 12, 38],
  trunk: [26, 14, 34],
  grass: [52, 32, 72],
  grassDark: [36, 20, 54],
  path: [64, 42, 84],
  pathDark: [46, 28, 62],
  glow: [255, 110, 170],
  stars: 0.6,
  motes: [230, 120, 255],
};

/** Depth bands: dawn holds to 600 m, dusk to 1500 m, night forever after. */
const DEPTH_BANDS = [0, 600, 1500];
export const DEPTH_LABELS = ['Dawn Forest', 'Dusk Forest', 'Night Forest'];

const rgb = (c) =>
  'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
const rgba = (c, a) =>
  'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')';

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/** Palette for a run distance in meters; crossfades the last 20 % of a band. */
export function paletteFor(m) {
  let band = 0;
  while (band < DEPTH_BANDS.length - 1 && m >= DEPTH_BANDS[band + 1]) band++;
  const segStart = DEPTH_BANDS[band];
  const segEnd = band < DEPTH_BANDS.length - 1 ? DEPTH_BANDS[band + 1] : segStart + 1;
  const frac = segEnd > segStart ? (m - segStart) / (segEnd - segStart) : 1;
  const t = frac < 0.8 ? 0 : smoothstep((frac - 0.8) / 0.2);
  const a = PALETTES[band];
  const b = PALETTES[Math.min(band + 1, PALETTES.length - 1)];
  const out = { stars: a.stars + (b.stars - a.stars) * t };
  for (const key of [
    'skyTop',
    'skyMid',
    'skyLow',
    'canopyFar',
    'canopyNear',
    'trunk',
    'grass',
    'grassDark',
    'path',
    'pathDark',
    'glow',
    'motes',
  ]) {
    out[key] = rgb(mix(a[key], b[key], t));
  }
  out.glowRaw = mix(a.glow, b.glow, t);
  out.motesRaw = mix(a.motes, b.motes, t);
  out.depthIndex = band;
  return out;
}

/** Character tint (cloak trim + eye glow). */
export const CHAR_TINT = {
  spirit: [127, 227, 210],
  hunter: [224, 149, 106],
  monk: [242, 207, 107],
};

/** Orb signal colors (matches gates.js ORB_COLORS). */
const ORB_RGB = {
  cyan: [110, 231, 255],
  violet: [196, 148, 255],
  gold: [255, 208, 106],
};

/* ---- helpers ------------------------------------------------------------------ */

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

/** Deterministic 0..1 hash for scenery variation (no rng state in render). */
function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.45);
  ctx.bezierCurveTo(cx - s * 0.75, cy - s * 0.05, cx - s * 0.45, cy - s * 0.55, cx, cy - s * 0.15);
  ctx.bezierCurveTo(cx + s * 0.45, cy - s * 0.55, cx + s * 0.75, cy - s * 0.05, cx, cy + s * 0.45);
  ctx.closePath();
}

/** Soft additive glow disc — the wisp/orb workhorse (plan §6: glow). */
function glowDisc(ctx, x, y, r, colorRaw, alpha) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, rgba(colorRaw, alpha));
  g.addColorStop(0.55, rgba(colorRaw, alpha * 0.35));
  g.addColorStop(1, rgba(colorRaw, 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function outlinedText(ctx, text, x, y, font, fill, align = 'center') {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,14,26,0.75)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/* ---- background ------------------------------------------------------------------ */

function drawSky(ctx, pal) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, pal.skyTop);
  sky.addColorStop(0.62, pal.skyMid);
  sky.addColorStop(1, pal.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
}

function drawCelestial(ctx, pal, t) {
  // dawn/dusk sun sits low; the night raises a pale spirit moon
  const cx = VIEW_W * 0.78;
  const cy = 92;
  const dayness = pal.depthIndex === 0 ? 1 : pal.depthIndex === 1 ? 0.5 : 0;
  if (dayness > 0.03) {
    const sun = ctx.createRadialGradient(cx, cy, 8, cx, cy, 120);
    sun.addColorStop(0, 'rgba(255,244,210,' + (0.9 * dayness).toFixed(3) + ')');
    sun.addColorStop(0.4, 'rgba(255,214,150,' + (0.4 * dayness).toFixed(3) + ')');
    sun.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,250,232,' + (0.85 * dayness).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  if (dayness < 0.97) {
    // spirit moon with a slow halo breath
    const a = (1 - dayness) * (0.75 + 0.1 * Math.sin(t * 0.8));
    glowDisc(ctx, cx, cy, 90, [220, 255, 240], 0.22 * a);
    ctx.globalAlpha = Math.min(1, a * 1.4);
    ctx.fillStyle = '#e9f2ee';
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb(mix([28, 44, 82], [34, 14, 52], 0.4));
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 6, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (pal.stars > 0.03) {
    ctx.fillStyle = 'rgba(255,255,255,' + pal.stars.toFixed(3) + ')';
    for (let i = 0; i < 46; i++) {
      const sx = hash(i * 3.7) * VIEW_W;
      const sy = hash(i * 7.3) * (GROUND_Y - 140);
      const tw = 0.6 + 0.4 * Math.sin(t * (1.1 + hash(i) * 2) + i);
      ctx.globalAlpha = pal.stars * tw;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

/** Drifting mist bands above the ground (depth feel without layer cost). */
function drawMist(ctx, pal, camX, t) {
  for (let i = 0; i < 3; i++) {
    const speed = 14 + i * 9;
    const span = VIEW_W + 420;
    const x =
      ((((i * 390 + 60 - camX * (0.24 + i * 0.08) - t * speed) % span) + span) % span) - 210;
    const y = GROUND_Y - 150 + i * 34 + Math.sin(t * 0.5 + i * 2) * 6;
    const g = ctx.createRadialGradient(x, y, 10, x, y, 190);
    g.addColorStop(0, rgba([235, 244, 244], 0.1));
    g.addColorStop(1, 'rgba(235,244,244,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 200, y - 90, 400, 180);
  }
}

/** Rounded canopy blobs on a sine silhouette (×0.2 scroll). */
function drawFarCanopy(ctx, color, camX, t) {
  const offset = camX * 0.2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 2);
  for (let x = 0; x <= VIEW_W; x += 16) {
    const wx = x + offset;
    const y =
      GROUND_Y -
      96 -
      40 * (0.5 + 0.5 * Math.sin((wx / 230) * Math.PI * 2)) -
      18 * (0.5 + 0.5 * Math.sin((wx / 97) * Math.PI * 2 + 1.7)) -
      Math.sin(t * 0.6 + x * 0.01) * 2;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y + 2);
  ctx.closePath();
  ctx.fill();
  // blob crowns on top of the silhouette
  for (let k = Math.floor(offset / 150) - 1; k < Math.floor((offset + VIEW_W) / 150) + 2; k++) {
    const x = k * 150 - offset + hash(k * 1.3) * 60;
    const r = 30 + hash(k * 2.9) * 26;
    const y = GROUND_Y - 130 - hash(k * 4.1) * 60;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.8, y + 8, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Near pine line (×0.5 scroll): deterministic pines repeating every 120 px. */
function drawTrees(ctx, pal, camX) {
  const offset = camX * 0.5;
  const startK = Math.floor(offset / 120) - 1;
  for (let k = startK; k < startK + Math.ceil(VIEW_W / 120) + 3; k++) {
    const h = 52 + hash(k * 1.7) * 42;
    const x = k * 120 - offset + hash(k * 2.3) * 40;
    const baseY = GROUND_Y + 2;
    ctx.fillStyle = pal.trunk;
    ctx.fillRect(x - 2.5, baseY - 12, 5, 14);
    ctx.fillStyle = pal.canopyNear;
    for (let tier = 0; tier < 3; tier++) {
      const tw = 32 - tier * 8;
      const ty = baseY - 10 - tier * (h * 0.26);
      ctx.beginPath();
      ctx.moveTo(x, ty - h * 0.38);
      ctx.lineTo(x - tw, ty);
      ctx.lineTo(x + tw, ty);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** Fireflies: only visible as night falls (stars ≥ .5); deterministic drift. */
function drawFireflies(ctx, pal, camX, t) {
  if (pal.stars < 0.5) return;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const bx = hash(i * 9.1) * VIEW_W;
    const x = ((((bx - camX * 0.35) % (VIEW_W + 60)) + VIEW_W + 60) % (VIEW_W + 60)) - 30;
    const y = GROUND_Y - 40 - hash(i * 3.3) * 180 + Math.sin(t * (0.7 + hash(i) + i) + i * 2) * 14;
    const a = (0.35 + 0.3 * Math.sin(t * (2 + hash(i * 5) * 2) + i)) * (pal.stars - 0.5) * 2;
    glowDisc(ctx, x, y, 10, pal.motesRaw, Math.max(0, a) * 0.8);
  }
}

function drawGround(ctx, pal, camX) {
  // mossy forest path
  ctx.fillStyle = pal.path;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = pal.pathDark;
  const period = 96;
  const shift = camX % period;
  for (let x = -period; x < VIEW_W + period; x += period) {
    ctx.fillRect(x - shift, GROUND_Y + 26, 44, 5);
    ctx.fillRect(x - shift + 50, GROUND_Y + 52, 28, 5);
    // scattered pebbles
    const k = Math.floor((x + shift) / period);
    ctx.beginPath();
    ctx.ellipse(
      x - shift + 30 + hash(k * 5.1) * 40,
      GROUND_Y + 40 + hash(k * 7.7) * 40,
      3,
      2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  const grass = ctx.createLinearGradient(0, GROUND_Y - 2, 0, GROUND_Y + 16);
  grass.addColorStop(0, pal.grass);
  grass.addColorStop(1, pal.grassDark);
  ctx.fillStyle = grass;
  ctx.fillRect(0, GROUND_Y - 2, VIEW_W, 18);
  // blade fringe
  ctx.fillStyle = pal.grass;
  const gshift = camX % 28;
  for (let x = -28; x < VIEW_W + 28; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x - gshift, GROUND_Y);
    ctx.lineTo(x - gshift + 7, GROUND_Y - 9);
    ctx.lineTo(x - gshift + 14, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(0, GROUND_Y + 15, VIEW_W, 2);
}

/* ---- obstacles ------------------------------------------------------------------------ */

function drawLog(ctx, x, y, w, h, pal) {
  // fallen log: brown rounded trunk, end rings, a sprout
  ctx.fillStyle = 'rgba(10,16,24,0.22)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, GROUND_Y + 3, w * 0.62, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a3b';
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.fillStyle = '#6e4227';
  roundRect(ctx, x, y + h * 0.55, w, h * 0.45, 6);
  ctx.fill();
  // bark lines
  ctx.strokeStyle = 'rgba(60,34,18,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 6, y + (h * i) / 4 + 2);
    ctx.lineTo(x + w - 8, y + (h * i) / 4 + 3);
    ctx.stroke();
  }
  // cut face on the left end
  ctx.fillStyle = '#c89a6b';
  ctx.beginPath();
  ctx.ellipse(x + 7, y + h / 2, 5, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9c6f45';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + 7, y + h / 2, 2.5, h / 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  // a little moss + sprout
  ctx.fillStyle = pal.grass;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.62, y + 3, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pal.grass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + 1);
  ctx.quadraticCurveTo(x + w * 0.3 + 4, y - 8, x + w * 0.3 + 10, y - 10);
  ctx.stroke();
}

function drawBranch(ctx, x, w, pal) {
  // a bough reaching in from the canopy: box spans BRANCH_TOP…BRANCH_BOTTOM
  const topY = GROUND_Y - BRANCH_TOP;
  const botY = GROUND_Y - BRANCH_BOTTOM;
  const boughY = topY + 14;
  ctx.fillStyle = pal.trunk;
  roundRect(ctx, x - 14, topY - 240, w + 28, boughY - (topY - 240) + 8, 8);
  ctx.fill();
  ctx.fillStyle = '#5d7a4a';
  roundRect(ctx, x, boughY, w, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#46603a';
  roundRect(ctx, x, boughY + 10, w, 6, 3);
  ctx.fill();
  // hanging leaf curtains down to the lethal edge
  ctx.fillStyle = pal.canopyNear;
  const leaves = Math.floor(w / 14);
  for (let i = 0; i <= leaves; i++) {
    const lx = x + i * 14 + hash(i * 3.1 + x) * 5;
    const len = 22 + hash(i * 7.7 + x) * (botY - 26 - (boughY + 16) - 22);
    ctx.beginPath();
    ctx.ellipse(lx, boughY + 16 + len / 2, 5, len / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // bottom fringe — the edge the slide passes under
  ctx.fillStyle = '#3c5433';
  for (let i = 0; i <= leaves; i += 2) {
    const lx = x + i * 14 + 6;
    ctx.beginPath();
    ctx.moveTo(lx - 6, botY + 2);
    ctx.quadraticCurveTo(lx, botY + 10, lx + 6, botY + 2);
    ctx.fill();
  }
}

function drawGuardianTall(ctx, x, w, h, t, shadow) {
  // a column of hovering wisp stones with a glowing core
  const glowColor = shadow ? [255, 110, 170] : [154, 255, 226];
  const baseY = GROUND_Y;
  glowDisc(ctx, x + w / 2, baseY - h * 0.55, 46, glowColor, 0.4 + 0.1 * Math.sin(t * 3));
  for (let i = 0; i < 4; i++) {
    const sy = baseY - 10 - i * (h / 4.4);
    const wob = Math.sin(t * 2.2 + i * 1.4) * 2.5;
    ctx.fillStyle = shadow ? '#4a2c5e' : '#2e5a5e';
    roundRect(ctx, x + 3 + wob, sy - h / 4.6, w - 6, h / 4.8, 6);
    ctx.fill();
    ctx.fillStyle = shadow ? '#c46a9e' : '#8ef0dd';
    ctx.beginPath();
    ctx.arc(x + w / 2 + wob, sy - h / 4.6 / 2 - (h / 4.6) * 0.5 + h / 4.6 / 2, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // eyes in the top stone
  const eyeY = baseY - h + 12;
  ctx.fillStyle = shadow ? '#ffd1e6' : '#eafffb';
  ctx.beginPath();
  ctx.arc(x + w / 2 - 5, eyeY, 2.2, 0, Math.PI * 2);
  ctx.arc(x + w / 2 + 5, eyeY, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // ground rune
  ctx.strokeStyle = rgba(glowColor, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, GROUND_Y + 2, w * 0.9, 4.5, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGuardianLow(ctx, x, w, t, shadow) {
  // a hovering wisp disc with a trail of fading rings above (slide under it)
  const glowColor = shadow ? [255, 110, 170] : [196, 148, 255];
  const cy = GROUND_Y - (GUARDIAN_LOW_BOTTOM + 24);
  const hover = Math.sin(t * 2.6 + x * 0.01) * 4;
  glowDisc(ctx, x + w / 2, cy + hover, 52, glowColor, 0.45 + 0.12 * Math.sin(t * 3.4));
  // trail rings up to GUARDIAN_LOW_TOP (visual reason the jump is sealed)
  ctx.strokeStyle = rgba(glowColor, 0.28);
  for (let i = 1; i <= 4; i++) {
    const ry = cy + hover - i * ((GUARDIAN_LOW_TOP - GUARDIAN_LOW_BOTTOM) / 4.4);
    ctx.lineWidth = 3 - i * 0.5;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, ry, (w / 2) * (1 - i * 0.13), 6 - i, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // the disc
  ctx.fillStyle = shadow ? '#3a2050' : '#37265e';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, cy + hover, w / 2, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shadow ? '#c46a9e' : '#b08ef5';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, cy - 4 + hover, w / 2.6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = '#f3ecff';
  ctx.beginPath();
  ctx.arc(x + w / 2 - 6, cy + 2 + hover, 2.1, 0, Math.PI * 2);
  ctx.arc(x + w / 2 + 6, cy + 2 + hover, 2.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrap(ctx, x, w, h, trap, worldS, t, shadow) {
  // floor rune circle + spikes; 1.2 s cycle: 0.7 dark → warn → 0.5 lit
  const p = trapPhase(trap, worldS);
  const lit = trapLit(trap, worldS);
  const warning = !lit && p >= TRAP_DARK_S - TRAP_WARN_S;
  const glowColor = lit ? [255, 96, 86] : warning ? [255, 176, 80] : [120, 140, 160];
  const intensity = lit ? 0.85 : warning ? 0.4 * (0.5 + 0.5 * Math.sin(t * 24)) : 0.16;
  glowDisc(ctx, x + w / 2, GROUND_Y - 6, 40, glowColor, intensity * 0.6);

  // rune ring
  ctx.strokeStyle = rgba(glowColor, Math.min(1, 0.35 + intensity * 0.6));
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, GROUND_Y - 1, w * 0.62, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // spikes rise out of the circle
  const rise = lit ? 1 : warning ? 0.35 : 0.12;
  const spikeH = h * rise;
  ctx.fillStyle = shadow ? '#8a4a72' : '#5e6a78';
  for (let i = 0; i < 5; i++) {
    const sx = x + 5 + i * ((w - 10) / 4);
    ctx.beginPath();
    ctx.moveTo(sx - 4.5, GROUND_Y);
    ctx.lineTo(sx, GROUND_Y - spikeH - (i % 2) * 3);
    ctx.lineTo(sx + 4.5, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  if (lit) {
    ctx.fillStyle = 'rgba(255,150,120,0.8)';
    for (let i = 0; i < 5; i++) {
      const sx = x + 5 + i * ((w - 10) / 4);
      ctx.beginPath();
      ctx.moveTo(sx - 2, GROUND_Y);
      ctx.lineTo(sx, GROUND_Y - spikeH * 0.7 - (i % 2) * 2);
      ctx.lineTo(sx + 2, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawObstacles(ctx, obstacles, camX, worldS, t, pal, shadow) {
  for (const obs of obstacles) {
    if (obs.destroyed) continue;
    const x = obs.worldX - camX;
    if (x + obs.w < -40 || x > VIEW_W + 40) continue;
    if (obs.kind === 'branch') drawBranch(ctx, x, obs.w, pal);
    else if (obs.kind === 'guardian-tall') drawGuardianTall(ctx, x, obs.w, obs.h, t, shadow);
    else if (obs.kind === 'guardian-low') drawGuardianLow(ctx, x, obs.w, t, shadow);
    else if (obs.kind === 'trap') drawTrap(ctx, x, obs.w, obs.h, obs, worldS, t, shadow);
    else drawLog(ctx, x, GROUND_Y - obs.h, obs.w, obs.h, pal);
  }
}

/* ---- orbs ------------------------------------------------------------------------ */

function drawOrbs(ctx, orbs, camX, t) {
  for (const orb of orbs) {
    if (orb.taken) continue;
    const x = orb.worldX - camX;
    if (x < -40 || x > VIEW_W + 40) continue;
    const color = ORB_RGB[orb.color] || ORB_RGB.cyan;
    const bob = Math.sin(t * 3.4 + orb.worldX * 0.05) * 4;
    const y = orb.y + bob;
    glowDisc(ctx, x, y, 26, color, 0.55 + 0.15 * Math.sin(t * 5 + orb.worldX));
    ctx.fillStyle = rgb(mix(color, [255, 255, 255], 0.55));
    ctx.beginPath();
    ctx.arc(x, y, ORB_R - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(color, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, ORB_R - 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---- rune gates (plan §2 Phase C: the in-world split) ------------------------------ */

/** Door signal: rune / shape glyph / color orb depending on the rule. */
function drawDoorSignal(ctx, gate, side, cx, cy) {
  if (gate.rule === 'sequence' && gate.shapes) {
    outlinedText(
      ctx,
      gate.shapes[side],
      cx,
      cy,
      '800 44px "Segoe UI Symbol", "Segoe UI", sans-serif',
      '#ffe9b0'
    );
    return;
  }
  if (gate.rule === 'color' && gate.colors) {
    const c = ORB_RGB[gate.colors[side]] || ORB_RGB.cyan;
    glowDisc(ctx, cx, cy, 30, c, 0.75);
    ctx.fillStyle = rgb(mix(c, [255, 255, 255], 0.5));
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const rune = gate.runes && gate.runes[side];
  if (rune)
    outlinedText(
      ctx,
      rune,
      cx,
      cy,
      '800 46px "Segoe UI Historic", "Segoe UI Symbol", serif',
      '#d8f4ff'
    );
}

/**
 * The split: two glowing doorframes spanning GATE_H. A living gate pulses a
 * "tap" chevron; a resolved one bursts its outcome color and fades open.
 */
function drawGate(ctx, gate, camX, t) {
  const baseX = gate.worldX - camX;
  if (baseX + GATE_DOOR_W * 2 + GATE_GAP < -60 || baseX > VIEW_W + 60) return;
  const outcomeColor = gate.outcome === 'correct' ? [126, 232, 154] : [230, 110, 200];
  const openT = gate.resolved ? Math.min(1, (t - gate.resolvedAt) / 0.5) : 0;
  const doorGlow = gate.resolved ? outcomeColor : [154, 214, 255];

  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? 'left' : 'right';
    const swing = gate.resolved ? openT * 26 * (i === 0 ? -1 : 1) : 0;
    const x = baseX + i * (GATE_DOOR_W + GATE_GAP) + swing;
    const alpha = gate.resolved ? Math.max(0, 1 - openT) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    const postY = GROUND_Y - GATE_H;

    glowDisc(
      ctx,
      x + GATE_DOOR_W / 2,
      GROUND_Y - GATE_H * 0.5,
      90,
      doorGlow,
      gate.resolved ? 0.5 : 0.28
    );

    // posts + lintel
    ctx.fillStyle = '#20344a';
    ctx.fillRect(x, postY, 10, GATE_H);
    ctx.fillRect(x + GATE_DOOR_W - 10, postY, 10, GATE_H);
    ctx.fillStyle = '#2c4660';
    roundRect(ctx, x - 8, postY - 16, GATE_DOOR_W + 16, 18, 6);
    ctx.fill();
    // shimmer curtain between the posts
    const curtain = ctx.createLinearGradient(x, postY, x, GROUND_Y);
    curtain.addColorStop(0, rgba(doorGlow, 0.34));
    curtain.addColorStop(1, rgba(doorGlow, 0.06));
    ctx.fillStyle = curtain;
    ctx.fillRect(x + 10, postY + 4, GATE_DOOR_W - 20, GATE_H - 4);

    drawDoorSignal(ctx, gate.gate, side, x + GATE_DOOR_W / 2, postY + 86);
    ctx.restore();
  }

  if (!gate.resolved) {
    // tap chevrons pulse toward each door
    const pulse = 0.6 + 0.4 * Math.sin(t * 6);
    for (let i = 0; i < 2; i++) {
      const cx = baseX + i * (GATE_DOOR_W + GATE_GAP) + GATE_DOOR_W / 2;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#eaf6ff';
      const dir = i === 0 ? -1 : 1;
      const y = GROUND_Y - 36;
      ctx.beginPath();
      ctx.moveTo(cx + dir * 12, y);
      ctx.lineTo(cx - dir * 4, y - 12);
      ctx.lineTo(cx - dir * 4, y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // resolved burst is replaced by the hint banner while pending
  }
}

/** The hint ribbon: shows while the gate approaches and until resolution. */
function drawGateBanner(ctx, gate, t) {
  if (gate.resolved) return;
  const alpha = 0.92;
  ctx.save();
  ctx.globalAlpha = alpha;
  const y = 108;
  const text = gate.gate.hintText || '';
  ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
  const w = Math.max(280, ctx.measureText(text).width + (gate.gate.bannerRune ? 66 : 40));
  ctx.fillStyle = 'rgba(12,20,38,0.82)';
  roundRect(ctx, VIEW_W / 2 - w / 2, y - 22, w, 44, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(154,214,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  outlinedText(
    ctx,
    text,
    VIEW_W / 2 - (gate.gate.bannerRune ? 22 : 0),
    y,
    '700 17px "Segoe UI", system-ui, sans-serif',
    '#d9ecff'
  );
  if (gate.gate.bannerRune) {
    outlinedText(
      ctx,
      gate.gate.bannerRune,
      VIEW_W / 2 + w / 2 - 34,
      y,
      '800 24px "Segoe UI Historic", "Segoe UI Symbol", serif',
      '#ffe9b0'
    );
  }
  // Persistent rule-name tag (suggestion 03 item 1): which of the 5 rules is
  // active, visible through the whole choice window — not just the hint.
  const tag = ruleLabel(gate.gate.rule);
  ctx.font = '800 11px "Segoe UI", system-ui, sans-serif';
  const tagW = ctx.measureText(tag.toUpperCase()).width + 20;
  ctx.fillStyle = 'rgba(38,66,110,0.9)';
  roundRect(ctx, VIEW_W / 2 - tagW / 2, y + 26, tagW, 18, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(154,214,255,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  outlinedText(
    ctx,
    tag.toUpperCase(),
    VIEW_W / 2,
    y + 35,
    '800 11px "Segoe UI", system-ui, sans-serif',
    '#9ad6ff'
  );
  ctx.restore();
}

/* ---- runner ------------------------------------------------------------------------ */

/**
 * The runner (procedural): a hooded forest spirit with a glowing cloak trim
 * and eyes; run cycle locked to the camera (never moonwalks), tuck in the
 * air, a low crouch pose while sliding, character tint, and an 8 Hz blink
 * while invulnerable (plan §2 Phase A).
 */
function drawRunner(ctx, player, camX, t, character, shadow) {
  const x = PLAYER_X;
  const airH = Math.max(0, GROUND_Y - player.y);
  const tint = CHAR_TINT[character] || CHAR_TINT.spirit;

  // shadow
  const shScale = Math.max(0.35, 1 - airH / 220);
  ctx.fillStyle = 'rgba(10,16,26,' + (0.3 * shScale).toFixed(3) + ')';
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y + 4, 16 * shScale, 4 * shScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  if (player.invulnS > 0) ctx.globalAlpha = Math.sin(t * 40) > 0 ? 1 : 0.3;

  const phase = camX * 0.105;
  const grounded = player.onGround;
  const cloak = shadow ? '#43285c' : '#2e4a56';
  const cloakDark = shadow ? '#331f47' : '#223a44';

  if (player.sliding) {
    // crouch slide: a low flowing cloak with trailing wisps
    const topY = player.y - PLAYER_H * SLIDE_H_FACTOR;
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(x - 20, player.y);
    ctx.quadraticCurveTo(x - 22, topY - 4, x + 2, topY - 2);
    ctx.quadraticCurveTo(x + 24, topY + 2, x + 22, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cloakDark;
    ctx.beginPath();
    ctx.ellipse(x - 8, player.y - 3, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // hood + eye
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.arc(x + 14, topY + 6, 8, 0, Math.PI * 2);
    ctx.fill();
    glowDisc(ctx, x + 17, topY + 6, 8, tint, 0.8);
    ctx.fillStyle = '#eafffb';
    ctx.beginPath();
    ctx.arc(x + 17, topY + 6, 2, 0, Math.PI * 2);
    ctx.fill();
    // speed wisps behind
    ctx.strokeStyle = rgba(tint, 0.4);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const wy = player.y - 6 - i * 5;
      ctx.beginPath();
      ctx.moveTo(x - 24 - i * 6, wy);
      ctx.lineTo(x - 40 - i * 9 - Math.sin(t * 12 + i) * 3, wy);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const bob = grounded ? Math.abs(Math.sin(phase)) * 2.2 : 0;
  const hipY = player.y - 18 - bob;
  const shoulderY = player.y - 31 - bob;

  // legs
  ctx.strokeStyle = cloakDark;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  const legs = grounded
    ? [Math.sin(phase) * 0.85, Math.sin(phase + Math.PI) * 0.85]
    : player.vy < 0
      ? [0.95, 0.45]
      : [0.55, -0.25];
  for (const swing of legs) {
    const footX = x + Math.sin(swing) * 12;
    const footY = grounded
      ? player.y - Math.max(0, Math.cos(swing)) * 4
      : hipY + 13 - Math.cos(swing) * 4;
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
  }

  // cloak torso, flowing behind
  const flow = grounded ? Math.sin(phase) * 3 : 6;
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.moveTo(x - 3, hipY + 2);
  ctx.quadraticCurveTo(x - 14 - flow, (hipY + shoulderY) / 2, x - 4 - flow * 0.6, shoulderY - 4);
  ctx.quadraticCurveTo(x + 8, shoulderY - 6, x + 7, hipY);
  ctx.closePath();
  ctx.fill();
  // glowing trim
  ctx.strokeStyle = rgba(tint, 0.95);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x - 6 - flow, (hipY + shoulderY) / 2 + 4);
  ctx.quadraticCurveTo(
    x - 10 - flow,
    (hipY + shoulderY) / 2 - 2,
    x - 4 - flow * 0.6,
    shoulderY - 3
  );
  ctx.stroke();

  // arms
  ctx.strokeStyle = cloak;
  ctx.lineWidth = 4.5;
  const arms = grounded ? [Math.sin(phase + Math.PI) * 0.9, Math.sin(phase) * 0.9] : [-1.4, -0.9];
  for (const swing of arms) {
    ctx.beginPath();
    ctx.moveTo(x + 1, shoulderY + 3);
    ctx.lineTo(x + 1 + Math.sin(swing) * 9, shoulderY + 3 + Math.abs(Math.cos(swing)) * 7 + 2);
    ctx.stroke();
  }

  // hood + glowing eyes
  const headX = x + 3;
  const headY = shoulderY - 8;
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.arc(headX, headY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX - 9, headY - 2);
  ctx.quadraticCurveTo(
    headX - 20 - (grounded ? 0 : 5),
    headY - 6 + Math.sin(t * 10) * 2,
    headX - 16,
    headY + 8
  );
  ctx.quadraticCurveTo(headX - 8, headY + 6, headX - 8, headY);
  ctx.closePath();
  ctx.fill();
  glowDisc(ctx, headX + 3, headY + 1, 9, tint, 0.75);
  ctx.fillStyle = '#f2fffc';
  ctx.beginPath();
  ctx.arc(headX + 3.5, headY + 1, 2, 0, Math.PI * 2);
  ctx.fill();

  // dash trail
  if (player.dashTrail) {
    ctx.strokeStyle = rgba(tint, 0.5);
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 10 - i * 12, player.y - 10 - i * 2);
      ctx.lineTo(x - 2 - i * 12, player.y - 26 - i * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---- particles + floaters ------------------------------------------------------------ */

function drawParticles(ctx, particles, t) {
  for (const p of particles) {
    const age = t - p.born;
    if (age > p.life) continue;
    const k = age / p.life;
    const x = p.x + p.vx * age;
    const y = p.y + p.vy * age + (p.gravity ? 320 * age * age : 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(x, y, p.r * (1 - k * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloaters(ctx, floaters, t) {
  ctx.font = '800 20px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floaters) {
    const age = t - f.born;
    if (age > f.life) continue;
    ctx.globalAlpha = 1 - age / f.life;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,14,26,0.75)';
    ctx.strokeText(f.text, f.x, f.y - 44 * age);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - 44 * age);
  }
  ctx.globalAlpha = 1;
}

/* ---- HUD ------------------------------------------------------------------------------ */

export const POWER_GLYPH = { double: '⇈', dash: '»', slow: '⏳' };
export const POWER_LABEL = { double: 'Double Jump', dash: 'Dash', slow: 'Slow Time' };

function drawHUD(ctx, s) {
  // distance — the bragging number
  outlinedText(
    ctx,
    s.distanceM + ' m',
    VIEW_W / 2,
    44,
    '800 40px "Segoe UI", system-ui, sans-serif',
    '#fff'
  );

  // depth tier label (plan §3: distance + depth tier in the HUD)
  outlinedText(
    ctx,
    s.depthLabel,
    VIEW_W / 2,
    72,
    '600 13px "Segoe UI", system-ui, sans-serif',
    'rgba(255,255,255,0.8)'
  );

  // hearts (plan §2: hearts 2)
  for (let i = 0; i < HEARTS_MAX; i++) {
    const filled = i < s.hearts;
    const bob = filled ? Math.sin(s.t * 3.1 + i) * 2 : 0;
    ctx.save();
    ctx.translate(36 + i * 34, 42 + bob);
    heartPath(ctx, 0, 0, 24);
    ctx.fillStyle = filled ? '#e0576e' : 'rgba(224,87,110,0.18)';
    ctx.fill();
    ctx.strokeStyle = filled ? 'rgba(255,235,240,0.95)' : 'rgba(255,235,240,0.35)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  // orb meter: METER_FULL pips + the charged power glyph (plan §2 Phase B)
  const pipW = 13;
  const totalW = METER_FULL * pipW;
  const mx = VIEW_W / 2 - totalW / 2;
  const my = VIEW_H - 34;
  ctx.fillStyle = 'rgba(10,16,28,0.45)';
  roundRect(ctx, mx - 8, my - 12, totalW + 16, 24, 12);
  ctx.fill();
  for (let i = 0; i < METER_FULL; i++) {
    const filled = i < s.powers.meter;
    ctx.beginPath();
    ctx.arc(mx + i * pipW + pipW / 2, my, 4.4, 0, Math.PI * 2);
    ctx.fillStyle = filled ? '#b08ef5' : 'rgba(176,142,245,0.2)';
    ctx.fill();
  }
  const ready = s.powers.meter >= METER_FULL;
  if (ready) {
    const power = s.chargedPower;
    const pulse = 0.75 + 0.25 * Math.sin(s.t * 6);
    outlinedText(
      ctx,
      POWER_GLYPH[power] + ' ' + POWER_LABEL[power] + ' ready — E',
      VIEW_W / 2,
      my - 26,
      '700 15px "Segoe UI", system-ui, sans-serif',
      'rgba(255,233,176,' + pulse.toFixed(3) + ')'
    );
  }
  // active power durations ring the meter
  let activeLabel = '';
  for (const kind of ['double', 'dash', 'slow']) {
    if (s.powers.timers[kind] > 0) {
      activeLabel +=
        (activeLabel ? ' · ' : '') +
        POWER_LABEL[kind] +
        ' ' +
        s.powers.timers[kind].toFixed(1) +
        's';
    }
  }
  if (activeLabel) {
    outlinedText(
      ctx,
      activeLabel,
      VIEW_W / 2,
      my + 24,
      '600 12px "Segoe UI", system-ui, sans-serif',
      'rgba(174,255,229,0.95)'
    );
  }

  // shadow realm countdown banner (plan §2 Phase C: timer HUD countdown)
  if (s.shadowS > 0) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    outlinedText(
      ctx,
      'SHADOW REALM — ' + Math.ceil(s.shadowS) + 's',
      VIEW_W / 2,
      108,
      '900 24px "Segoe UI", system-ui, sans-serif',
      '#f2a0ff'
    );
    // First entry this run (suggestion 03 item 3): name what surviving earns.
    if (s.shadowHint > 0) {
      ctx.globalAlpha = 0.9 * Math.min(1, s.shadowHint);
      outlinedText(
        ctx,
        'Survive for a shard — auto-returns to the forest',
        VIEW_W / 2,
        136,
        '600 13px "Segoe UI", system-ui, sans-serif',
        '#e6c8ff'
      );
    }
    ctx.restore();
    // closing vignette as the timer drains
    const urgency = 1 - s.shadowS / SHADOW_S;
    const vg = ctx.createRadialGradient(
      VIEW_W / 2,
      VIEW_H / 2,
      VIEW_H * 0.4,
      VIEW_W / 2,
      VIEW_H / 2,
      VIEW_W * 0.72
    );
    vg.addColorStop(0, 'rgba(20,6,32,0)');
    vg.addColorStop(
      1,
      'rgba(46,8,60,' +
        (0.32 + 0.2 * urgency * Math.abs(Math.sin(s.t * (2 + urgency * 6)))).toFixed(3) +
        ')'
    );
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // announcement (depth change, "SHADOW REALM", power-ready…)
  if (s.t < s.announceUntil) {
    const total = 1.6;
    const age = total - (s.announceUntil - s.t);
    const alpha = age < 0.15 ? age / 0.15 : Math.max(0, 1 - (age - 1.1) / 0.5);
    const pop = 1 + 0.18 * Math.max(0, 1 - age / 0.25);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(VIEW_W / 2, 150);
    ctx.scale(pop, pop);
    outlinedText(
      ctx,
      s.announceText,
      0,
      0,
      '900 28px "Segoe UI", system-ui, sans-serif',
      s.announceColor || '#ffd76a'
    );
    ctx.restore();
  }
}

/* ---- debug (?debug=1, plan §3: hitboxes + gate rule id) -------------------------------- */

function drawDebug(ctx, s) {
  ctx.save();
  ctx.lineWidth = 2;
  const pb = playerBox(s.player);
  const insetW = pb.w * (1 - HITBOX_INSET);
  const insetH = pb.h * (1 - HITBOX_INSET);
  ctx.strokeStyle = '#ff2d95';
  ctx.strokeRect(pb.x + (pb.w - insetW) / 2, pb.y + (pb.h - insetH) / 2, insetW, insetH);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pb.x, pb.y, pb.w, pb.h);
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 2;
  for (const obs of s.obstacles) {
    if (obs.destroyed) continue;
    const b = obstacleBox(obs);
    ctx.strokeRect(b.x - s.cam.x, b.y, b.w, b.h);
    if (obs.kind === 'trap') {
      ctx.fillStyle = trapLit(obs, s.worldS) ? 'rgba(255,60,50,0.25)' : 'rgba(80,200,120,0.18)';
      ctx.fillRect(b.x - s.cam.x, b.y, b.w, b.h);
    }
  }
  for (const orb of s.orbs) {
    if (orb.taken) continue;
    ctx.strokeStyle = '#7dff8a';
    ctx.strokeRect(orb.worldX - ORB_R - s.cam.x, orb.y - ORB_R, ORB_R * 2, ORB_R * 2);
  }
  if (s.gate && !s.gate.resolved) {
    const bx = s.gate.worldX - s.cam.x;
    ctx.strokeStyle = '#0a84ff';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(bx, GROUND_Y - GATE_H, GATE_DOOR_W, GATE_H);
    ctx.strokeRect(bx + GATE_DOOR_W + GATE_GAP, GROUND_Y - GATE_H, GATE_DOOR_W, GATE_H);
    ctx.setLineDash([]);
    ctx.font = '600 12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0a84ff';
    ctx.fillText(
      'gate rule: ' + s.gate.gate.rule + ' → ' + s.gate.gate.correctSide,
      bx,
      GROUND_Y - GATE_H - 8
    );
  }
  ctx.textAlign = 'left';
  ctx.font = '600 12px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(
    'speed ' +
      Math.round(s.cam.speed) +
      ' px/s · world ×' +
      (s.worldScale || 1).toFixed(2) +
      ' · obstacles ' +
      s.obstacles.length,
    12,
    VIEW_H - 58
  );
  ctx.restore();
}

/* ---- entry point ------------------------------------------------------------------------ */

/**
 * Draw one frame. `s` carries the scene state main.js assembled:
 * { mode, player, obstacles, orbs, gate, cam, worldS, worldScale, distanceM,
 *   hearts, powers, chargedPower, depthLabel, shadowS, announceText,
 *   announceUntil, announceColor, floaters, particles, gate… , t, paletteM,
 *   character, debug }
 * Modes: 'menu' | 'playing' | 'paused' | 'gameover'.
 */
export function drawScene(ctx, s) {
  const shadow = s.shadowS > 0;
  const pal = shadow ? { ...paletteFor(s.paletteM), ...shadowOverride() } : paletteFor(s.paletteM);
  ctx.save();
  ctx.translate(s.shake.x, s.shake.y);
  drawSky(ctx, pal);
  drawCelestial(ctx, pal, s.t);
  drawFarCanopy(ctx, pal.canopyFar, s.cam.x, s.t);
  drawMist(ctx, pal, s.cam.x, s.t);
  drawTrees(ctx, pal, s.cam.x);
  drawGround(ctx, pal, s.cam.x);
  drawFireflies(ctx, pal, s.cam.x, s.t);

  if (s.gate) drawGate(ctx, s.gate, s.cam.x, s.t);
  drawObstacles(ctx, s.obstacles, s.cam.x, s.worldS, s.t, pal, shadow);
  drawOrbs(ctx, s.orbs, s.cam.x, s.t);

  // ambient motes (spirit lights; denser + redder in the shadow realm)
  const moteCount = shadow ? 20 : 10;
  for (let i = 0; i < moteCount; i++) {
    const speed = 26 + hash(i * 13.7) * 40;
    const span = VIEW_W + 80;
    const x = (((hash(i * 3.3) * span - s.cam.x - s.t * speed) % span) + span) % span;
    const y = 60 + hash(i * 7.9) * (GROUND_Y - 120) + Math.sin(s.t * (0.8 + hash(i)) + i) * 18;
    glowDisc(
      ctx,
      x,
      y,
      7,
      shadow ? [230, 120, 255] : pal.motesRaw,
      0.28 + 0.14 * Math.sin(s.t * 2 + i)
    );
  }

  drawParticles(ctx, s.particles, s.t);
  drawRunner(ctx, s.player, s.cam.x, s.t, s.character, shadow);
  drawFloaters(ctx, s.floaters, s.t);
  if (s.gate) drawGateBanner(ctx, s.gate, s.t);
  if (s.mode !== 'menu') drawHUD(ctx, s);
  if (s.flash > 0) {
    // flashColor is an "r,g,b" triple (heart hits and gate outcomes tint it)
    ctx.fillStyle = s.flashColor
      ? 'rgba(' + s.flashColor + ',' + s.flash.toFixed(3) + ')'
      : 'rgba(255,255,255,' + s.flash.toFixed(3) + ')';
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }
  if (s.debug) drawDebug(ctx, s);
  ctx.restore();
}

/** The shadow realm swaps the world colors but keeps the depth-blended sky shape. */
function shadowOverride() {
  const keys = [
    'skyTop',
    'skyMid',
    'skyLow',
    'canopyFar',
    'canopyNear',
    'trunk',
    'grass',
    'grassDark',
    'path',
    'pathDark',
  ];
  const out = {};
  for (const key of keys) out[key] = rgb(SHADOW_PALETTE[key]);
  out.glowRaw = SHADOW_PALETTE.glow.slice();
  out.motesRaw = SHADOW_PALETTE.motes.slice();
  out.stars = SHADOW_PALETTE.stars;
  out.depthIndex = 2;
  return out;
}
