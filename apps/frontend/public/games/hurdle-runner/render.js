/**
 * ============================================================================
 * Hurdle Runner — render.js (Game 05, plan/games/05-continuous-runner.md §6)
 * ============================================================================
 * Procedural draw, no assets (master README §8.7): palette-shifting sky
 * (day → dusk → night → dawn per 500 m, plan §9 P3), drifting clouds, far
 * hills (parallax ×0.2), a pine tree line (×0.5), the scrolling track (×1),
 * hurdles / tall barriers / the 💚 pickup, the animated runner, landing dust,
 * +10 floaters, the HUD (distance, tier bar, hearts, "Speed up!"), the death
 * flash and the ?debug=1 hitboxes + spawner-gap markers (plan §3).
 *
 * Zero DOM access at import time — pure draw functions taking a 2d context,
 * so importing this module (jest / harnesses) has no side effects. All
 * coordinates are in the 900×500 logical viewport (core.js); main.js applies
 * the letterbox/DPR transform before calling drawScene().
 * ============================================================================
 */
import {
  GROUND_Y,
  HITBOX_INSET,
  PICKUP_LIFT,
  PLAYER_X,
  TIER_START_M,
  VIEW_H,
  VIEW_W,
  obstacleBox,
  pickupBox,
  playerBox,
} from './core.js';

/* ---- palettes (plan §9 P3: day/night shift per 500 m) ----------------------- */

const PALETTES = [
  // day
  {
    skyTop: [77, 180, 239],
    skyMid: [142, 216, 248],
    skyLow: [223, 244, 255],
    hillFar: [181, 227, 198],
    hillNear: [143, 214, 164],
    grass: [92, 191, 96],
    grassDark: [62, 156, 71],
    dirt: [201, 141, 90],
    dirtDark: [184, 124, 76],
    stars: 0,
    sun: 1,
  },
  // dusk
  {
    skyTop: [109, 91, 184],
    skyMid: [232, 135, 95],
    skyLow: [255, 217, 161],
    hillFar: [201, 154, 142],
    hillNear: [156, 122, 138],
    grass: [168, 164, 92],
    grassDark: [126, 138, 66],
    dirt: [169, 126, 95],
    dirtDark: [150, 104, 78],
    stars: 0.25,
    sun: 0.45,
  },
  // night
  {
    skyTop: [20, 27, 61],
    skyMid: [39, 49, 107],
    skyLow: [85, 96, 160],
    hillFar: [58, 68, 112],
    hillNear: [44, 53, 96],
    grass: [63, 107, 88],
    grassDark: [46, 82, 68],
    dirt: [107, 100, 128],
    dirtDark: [87, 80, 112],
    stars: 1,
    sun: 0,
  },
  // dawn
  {
    skyTop: [74, 123, 208],
    skyMid: [240, 168, 160],
    skyLow: [255, 228, 200],
    hillFar: [176, 166, 192],
    hillNear: [138, 146, 168],
    grass: [108, 171, 106],
    grassDark: [75, 143, 82],
    dirt: [192, 138, 94],
    dirtDark: [168, 120, 80],
    stars: 0.15,
    sun: 0.8,
  },
];

const rgb = (c) =>
  'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Palette for a run distance in meters: holds one keyframe per 500 m segment
 * and crossfades to the next during the last 18 % of each segment.
 */
export function paletteFor(m) {
  const seg = Math.floor(m / 500) % PALETTES.length;
  const frac = (m % 500) / 500;
  const t = frac < 0.82 ? 0 : smoothstep((frac - 0.82) / 0.18);
  const a = PALETTES[seg];
  const b = PALETTES[(seg + 1) % PALETTES.length];
  const out = { stars: a.stars + (b.stars - a.stars) * t, sun: a.sun + (b.sun - a.sun) * t };
  for (const key of [
    'skyTop',
    'skyMid',
    'skyLow',
    'hillFar',
    'hillNear',
    'grass',
    'grassDark',
    'dirt',
    'dirtDark',
  ]) {
    out[key] = rgb(mix(a[key], b[key], t));
  }
  return out;
}

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

/* ---- background ------------------------------------------------------------------ */

function drawSky(ctx, pal) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, pal.skyTop);
  sky.addColorStop(0.65, pal.skyMid);
  sky.addColorStop(1, pal.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
}

function drawCelestial(ctx, pal, t) {
  const cx = VIEW_W * 0.8;
  const cy = 88;
  if (pal.sun > 0.03) {
    const sun = ctx.createRadialGradient(cx, cy, 8, cx, cy, 110);
    sun.addColorStop(0, 'rgba(255,250,220,' + (0.95 * pal.sun).toFixed(3) + ')');
    sun.addColorStop(0.35, 'rgba(255,244,200,' + (0.5 * pal.sun).toFixed(3) + ')');
    sun.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.fill();
  }
  if (pal.sun < 0.97) {
    // crescent moon, fading in as the sun fades out
    const a = 1 - pal.sun;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#e8ecf8';
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb(mix([77, 180, 239], [39, 49, 107], 1 - pal.sun));
    ctx.beginPath();
    ctx.arc(cx + 11, cy - 5, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (pal.stars > 0.03) {
    ctx.fillStyle = 'rgba(255,255,255,' + pal.stars.toFixed(3) + ')';
    for (let i = 0; i < 42; i++) {
      const sx = hash(i * 3.7) * VIEW_W;
      const sy = hash(i * 7.3) * (GROUND_Y - 120);
      const tw = 0.6 + 0.4 * Math.sin(t * (1.2 + hash(i) * 2) + i);
      ctx.globalAlpha = pal.stars * tw;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

function drawClouds(ctx, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 4; i++) {
    const speed = 8 + i * 4;
    const span = VIEW_W + 280;
    const cx = ((((i * 260 + 70 - t * speed) % span) + span) % span) - 140;
    const cy = 60 + ((i * 113) % 150);
    const s = 0.7 + ((i * 53) % 40) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, 22 * s, 0, Math.PI * 2);
    ctx.arc(cx + 28 * s, cy - 9 * s, 18 * s, 0, Math.PI * 2);
    ctx.arc(cx + 54 * s, cy + 2 * s, 20 * s, 0, Math.PI * 2);
    ctx.arc(cx + 26 * s, cy + 9 * s, 18 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Rolling sine silhouette; `offset` carries the layer's parallax scroll. */
function drawHills(ctx, color, baseY, amp, wavelength, offset) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 2);
  for (let x = 0; x <= VIEW_W; x += 14) {
    const y = baseY - amp * (0.5 + 0.5 * Math.sin(((x + offset) / wavelength) * Math.PI * 2));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y + 2);
  ctx.closePath();
  ctx.fill();
}

/** Pine tree line (parallax ×0.5): deterministic pines repeating every 130 px. */
function drawTrees(ctx, color, trunkColor, camX) {
  const offset = camX * 0.5;
  const startK = Math.floor(offset / 130) - 1;
  ctx.fillStyle = trunkColor;
  for (let k = startK; k < startK + Math.ceil(VIEW_W / 130) + 3; k++) {
    const h = 46 + hash(k * 1.7) * 38;
    const x = k * 130 - offset + hash(k * 2.3) * 46;
    const baseY = GROUND_Y + 2;
    ctx.fillRect(x - 2.5, baseY - 10, 5, 12);
    ctx.fillStyle = color;
    for (let tier = 0; tier < 3; tier++) {
      const tw = 30 - tier * 7;
      const ty = baseY - 8 - tier * (h * 0.26);
      ctx.beginPath();
      ctx.moveTo(x, ty - h * 0.36);
      ctx.lineTo(x - tw, ty);
      ctx.lineTo(x + tw, ty);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = trunkColor;
  }
}

/* ---- ground ------------------------------------------------------------------------ */

function drawGround(ctx, pal, camX) {
  ctx.fillStyle = pal.dirt;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  // scrolling dashes in the dirt — the ×1 speed cue
  ctx.fillStyle = pal.dirtDark;
  const period = 90;
  const shift = camX % period;
  for (let x = -period; x < VIEW_W + period; x += period) {
    ctx.fillRect(x - shift, GROUND_Y + 26, 40, 5);
    ctx.fillRect(x - shift + 45, GROUND_Y + 52, 26, 5);
  }
  // grass band on top of the dirt
  const grass = ctx.createLinearGradient(0, GROUND_Y - 2, 0, GROUND_Y + 16);
  grass.addColorStop(0, pal.grass);
  grass.addColorStop(1, pal.grassDark);
  ctx.fillStyle = grass;
  ctx.fillRect(0, GROUND_Y - 2, VIEW_W, 18);
  // blade fringe
  ctx.fillStyle = pal.grass;
  const gshift = camX % 30;
  for (let x = -30; x < VIEW_W + 30; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x - gshift, GROUND_Y);
    ctx.lineTo(x - gshift + 8, GROUND_Y - 8);
    ctx.lineTo(x - gshift + 16, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  // lane line where the runner's feet land
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, GROUND_Y + 15, VIEW_W, 2);
}

/* ---- obstacles ------------------------------------------------------------------------ */

function drawHurdle(ctx, x, y, w, h, pal) {
  // two posts + striped crossbar — a track hurdle
  ctx.fillStyle = '#5b6470';
  ctx.fillRect(x + 2, y + 8, 4, h - 8);
  ctx.fillRect(x + w - 6, y + 8, 4, h - 8);
  ctx.fillRect(x, y + h - 4, 8, 4);
  ctx.fillRect(x + w - 8, y + h - 4, 8, 4);
  const barH = 10;
  ctx.fillStyle = '#f4f6f8';
  ctx.fillRect(x, y, w, barH);
  ctx.fillStyle = '#e2445c';
  const stripe = w / 3;
  ctx.fillRect(x + stripe / 2, y, stripe, barH);
  ctx.fillRect(x + stripe * 1.9, y, stripe * 0.6, barH);
  ctx.strokeStyle = 'rgba(30,40,55,0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, barH);
  // mid rail
  ctx.fillStyle = '#8b95a3';
  ctx.fillRect(x + 3, y + h * 0.5, w - 6, 3);
  // soft ground shadow
  ctx.fillStyle = 'rgba(20,30,45,0.18)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, GROUND_Y + 3, w * 0.8, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTall(ctx, x, y, w, h) {
  // barricade with warning stripes — the "jump for your life" obstacle
  ctx.fillStyle = '#3f4854';
  ctx.fillRect(x + 3, y, w - 6, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 3, y, w - 6, h - 6);
  ctx.clip();
  ctx.fillStyle = '#f0b429';
  for (let sy = y - w; sy < y + h; sy += 22) {
    ctx.beginPath();
    ctx.moveTo(x + 3, sy + 22);
    ctx.lineTo(x + w - 3, sy);
    ctx.lineTo(x + w - 3, sy + 11);
    ctx.lineTo(x + 3, sy + 33);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#2c333d';
  ctx.fillRect(x, y + h - 7, w, 7);
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x + 3, y + 4, 3, h - 12);
  ctx.fillStyle = 'rgba(20,30,45,0.18)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, GROUND_Y + 3, w, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacles(ctx, obstacles, camX, pal) {
  for (const obs of obstacles) {
    const x = obs.worldX - camX;
    if (x + obs.w < -20 || x > VIEW_W + 20) continue;
    const y = GROUND_Y - obs.h;
    if (obs.kind === 'tall') drawTall(ctx, x, y, obs.w, obs.h);
    else drawHurdle(ctx, x, y, obs.w, obs.h, pal);
  }
}

/* ---- 💚 pickup --------------------------------------------------------------------------- */

function drawPickup(ctx, pickup, camX, t) {
  if (!pickup || pickup.taken) return;
  const x = pickup.worldX - camX;
  if (x < -40 || x > VIEW_W + 40) return;
  const bob = Math.sin(t * 3.1) * 5;
  const cy = GROUND_Y - PICKUP_LIFT + bob;
  const pulse = 1 + 0.08 * Math.sin(t * 5);

  const glow = ctx.createRadialGradient(x, cy, 4, x, cy, 30);
  glow.addColorStop(0, 'rgba(74,222,128,0.4)');
  glow.addColorStop(1, 'rgba(74,222,128,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, cy, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, cy);
  ctx.scale(pulse, pulse);
  heartPath(ctx, 0, 0, 26);
  ctx.fillStyle = '#3fbf5f';
  ctx.fill();
  ctx.strokeStyle = '#eafff0';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-5, -5, 3.4, 2.2, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // orbiting sparkle
  const ang = t * 2.4;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x + Math.cos(ang) * 22, cy + Math.sin(ang) * 14, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

/* ---- runner --------------------------------------------------------------------------------- */

/**
 * The runner (procedural, plan §9 P1): shadow that shrinks with height, a
 * lean-forward body, pumping arms, a two-leg run cycle keyed to the camera
 * (stride locks to distance, so it never "moonwalks"), tuck/extend poses in
 * the air, headband, and an 8 Hz blink while invulnerable.
 */
function drawRunner(ctx, player, camX, t) {
  const x = PLAYER_X;
  const airH = Math.max(0, GROUND_Y - player.y);

  // shadow
  const shScale = Math.max(0.35, 1 - airH / 220);
  ctx.fillStyle = 'rgba(20,30,45,' + (0.25 * shScale).toFixed(3) + ')';
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y + 4, 16 * shScale, 4 * shScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  if (player.invulnS > 0) ctx.globalAlpha = Math.sin(t * 40) > 0 ? 1 : 0.3;

  const phase = camX * 0.105; // run-cycle angle, locked to distance
  const grounded = player.onGround;
  const bob = grounded ? Math.abs(Math.sin(phase)) * 2.2 : 0;
  const hipY = player.y - 20 - bob;
  const shoulderY = player.y - 33 - bob;

  // legs
  ctx.strokeStyle = '#2c3a4e';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const legs = grounded
    ? [Math.sin(phase) * 0.85, Math.sin(phase + Math.PI) * 0.85]
    : player.vy < 0
      ? [0.95, 0.45] // tuck while rising
      : [0.55, -0.25]; // reach while falling
  for (const swing of legs) {
    const footX = x + Math.sin(swing) * 13;
    const footY = grounded
      ? player.y - Math.max(0, Math.cos(swing)) * 4
      : hipY + 14 - Math.cos(swing) * 4;
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
  }

  // torso, leaning into the run
  ctx.strokeStyle = '#e8623d';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(x - 1, hipY - 2);
  ctx.lineTo(x + 2, shoulderY + 2);
  ctx.stroke();

  // arms, opposite phase to the legs
  ctx.strokeStyle = '#f0913d';
  ctx.lineWidth = 5;
  const arms = grounded ? [Math.sin(phase + Math.PI) * 0.9, Math.sin(phase) * 0.9] : [-1.4, -0.9]; // thrown up mid-air
  for (const swing of arms) {
    ctx.beginPath();
    ctx.moveTo(x + 1, shoulderY + 3);
    ctx.lineTo(x + 1 + Math.sin(swing) * 10, shoulderY + 3 + Math.abs(Math.cos(swing)) * 8 + 2);
    ctx.stroke();
  }

  // head + headband
  const headX = x + 4;
  const headY = shoulderY - 9;
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath();
  ctx.arc(headX, headY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2445c';
  ctx.fillRect(headX - 8, headY - 5, 16, 3.6);
  ctx.fillStyle = '#e2445c';
  const tail = Math.min(1, Math.abs(camX) / 300 + (grounded ? 0 : 0.4));
  ctx.beginPath();
  ctx.moveTo(headX - 7, headY - 4);
  ctx.quadraticCurveTo(
    headX - 14 - tail * 4,
    headY - 2 + Math.sin(t * 14) * 2,
    headX - 15 - tail * 6,
    headY + 4
  );
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e2445c';
  ctx.stroke();
  // eye
  ctx.fillStyle = '#17202a';
  ctx.beginPath();
  ctx.arc(headX + 3.5, headY - 0.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ---- particles + floaters ---------------------------------------------------------------------- */

function drawDust(ctx, dust, t) {
  for (const p of dust) {
    const age = t - p.born;
    if (age > 0.45) continue;
    const x = p.x + p.vx * age;
    const y = p.y + p.vy * age + 300 * age * age;
    ctx.fillStyle = 'rgba(210,200,180,' + (0.5 * (1 - age / 0.45)).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(x, y, 2 + 3 * (1 - age / 0.45), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFloaters(ctx, floaters, t) {
  ctx.font = '800 20px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floaters) {
    const age = t - f.born;
    if (age > 0.8) continue;
    ctx.globalAlpha = 1 - age / 0.8;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(15,45,25,0.7)';
    ctx.strokeText('+10', f.x, f.y - 42 * age);
    ctx.fillStyle = '#b7f5c4';
    ctx.fillText('+10', f.x, f.y - 42 * age);
  }
  ctx.globalAlpha = 1;
}

/* ---- HUD ---------------------------------------------------------------------------------------- */

function outlinedText(ctx, text, x, y, font, fill) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(15,30,45,0.7)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawHUD(ctx, s) {
  // distance — the bragging number (plan §1)
  outlinedText(
    ctx,
    s.distanceM + ' m',
    VIEW_W / 2,
    46,
    '800 42px "Segoe UI", system-ui, sans-serif',
    '#fff'
  );

  // next-tier progress bar (plan §3)
  const barW = 190;
  const barX = VIEW_W / 2 - barW / 2;
  const barY = 74;
  ctx.fillStyle = 'rgba(15,30,45,0.35)';
  roundRect(ctx, barX, barY, barW, 6, 3);
  ctx.fill();
  const fillW = Math.max(4, barW * Math.min(1, s.tierProgress));
  const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  grad.addColorStop(0, '#7ee89a');
  grad.addColorStop(1, '#3fbf5f');
  ctx.fillStyle = grad;
  roundRect(ctx, barX, barY, fillW, 6, 3);
  ctx.fill();
  const segLabel =
    s.tier < 3
      ? 'tier ' + s.tier + ' → ' + (s.tier + 1) + ' at ' + TIER_START_M[s.tier] + ' m'
      : 'tier 3 — max speed soon';
  outlinedText(
    ctx,
    segLabel,
    VIEW_W / 2,
    barY + 18,
    '600 11px "Segoe UI", system-ui, sans-serif',
    'rgba(255,255,255,0.85)'
  );

  // hearts — only while the 💚 is held (plan §3)
  if (s.hearts > 0) {
    const bob = Math.sin(s.t * 3.1) * 2;
    ctx.save();
    ctx.translate(34, 42 + bob);
    heartPath(ctx, 0, 0, 24);
    ctx.fillStyle = '#3fbf5f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // tier announcement
  if (s.t < s.announceUntil) {
    const total = 1.6;
    const age = total - (s.announceUntil - s.t);
    const alpha = age < 0.15 ? age / 0.15 : Math.max(0, 1 - (age - 1.1) / 0.5);
    const pop = 1 + 0.18 * Math.max(0, 1 - age / 0.25);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(VIEW_W / 2, 130);
    ctx.scale(pop, pop);
    outlinedText(ctx, 'Speed up!', 0, 0, '900 30px "Segoe UI", system-ui, sans-serif', '#ffd76a');
    ctx.restore();
  }
}

/* ---- debug (?debug=1, plan §3: hitboxes + spawner-gap markers) ----------------------------------- */

function drawDebug(ctx, s) {
  ctx.save();
  ctx.lineWidth = 2;
  // the player's INSET box — exactly what aabbHit() tests (plan §10)
  const pb = playerBox(s.player);
  const insetW = pb.w * (1 - HITBOX_INSET);
  const insetH = pb.h * (1 - HITBOX_INSET);
  ctx.strokeStyle = '#ff2d95';
  ctx.strokeRect(pb.x + (pb.w - insetW) / 2, pb.y + (pb.h - insetH) / 2, insetW, insetH);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pb.x, pb.y, pb.w, pb.h);
  // obstacle boxes are full (no inset)
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 2;
  for (const obs of s.obstacles) {
    const b = obstacleBox(obs);
    ctx.strokeRect(b.x - s.cam.x, b.y, b.w, b.h);
  }
  if (s.pickup && !s.pickup.taken) {
    const b = pickupBox(s.pickup);
    ctx.strokeStyle = '#7dff8a';
    ctx.strokeRect(b.x - s.cam.x, b.y, b.w, b.h);
  }
  // spawner-gap markers: spawn cursor + the minGap frontier the next group
  // can legally start at (gap = cursor + gap ≥ cursor + minGap)
  const cursorX = s.debugInfo.spawnCursor - s.cam.x;
  if (cursorX > -50 && cursorX < VIEW_W + 50) {
    ctx.strokeStyle = '#0a84ff';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, GROUND_Y);
    ctx.stroke();
  }
  const frontierX = s.debugInfo.spawnCursor + s.debugInfo.minGap - s.cam.x;
  if (frontierX > -50 && frontierX < VIEW_W + 50) {
    ctx.strokeStyle = '#ffd76a';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(frontierX, 0);
    ctx.lineTo(frontierX, GROUND_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd76a';
    ctx.fillText('minGap ' + Math.round(s.debugInfo.minGap), frontierX + 4, 14);
  }
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  ctx.font = '600 12px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(
    'speed ' +
      Math.round(s.cam.speed) +
      ' px/s · tier ' +
      s.tier +
      ' · obstacles ' +
      s.obstacles.length,
    12,
    VIEW_H - 12
  );
  ctx.restore();
}

/* ---- entry point ------------------------------------------------------------------------------------- */

/**
 * Draw one frame. `s` carries the scene state main.js assembled:
 * { mode, player, obstacles, pickup, cam, distanceM, hearts, tier,
 *   tierProgress, announceUntil, dust, floaters, debugInfo, flash, shake,
 *   t, paletteM, debug }
 * Modes: 'menu' | 'playing' | 'paused' | 'gameover'.
 */
export function drawScene(ctx, s) {
  const pal = paletteFor(s.paletteM);
  ctx.save();
  ctx.translate(s.shake.x, s.shake.y);
  drawSky(ctx, pal);
  drawCelestial(ctx, pal, s.t);
  drawClouds(ctx, s.t);
  drawHills(ctx, pal.hillFar, GROUND_Y - 52, 58, 300, s.cam.x * 0.2);
  drawTrees(ctx, pal.hillNear, pal.dirtDark, s.cam.x);
  drawGround(ctx, pal, s.cam.x);
  drawObstacles(ctx, s.obstacles, s.cam.x, pal);
  drawPickup(ctx, s.pickup, s.cam.x, s.t);
  drawDust(ctx, s.dust, s.t);
  drawRunner(ctx, s.player, s.cam.x, s.t);
  drawFloaters(ctx, s.floaters, s.t);
  if (s.mode !== 'menu') drawHUD(ctx, s);
  if (s.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + s.flash.toFixed(3) + ')';
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }
  if (s.debug) drawDebug(ctx, s);
  ctx.restore();
}
