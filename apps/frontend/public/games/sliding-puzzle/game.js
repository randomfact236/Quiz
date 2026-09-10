/**
 * ============================================================================
 * Sliding Puzzle — game.js (Game 03, plan/games/03-sliding-puzzle.md)
 * ============================================================================
 * Plain ESM, no build step (same convention as games 01/02). The pure model
 * lives in core.js — the test surface; this file renders it, takes input,
 * runs the timer and keeps per-size records. It only auto-inits when the
 * board exists in the DOM, so importing it (jest / harnesses) has no side
 * effects. Per plan §11, no analytics and no site coupling.
 * ============================================================================
 */
import {
  PREFS_KEY,
  SHUFFLE_MOVES,
  SIZES,
  bestKey,
  blankAt,
  dailyKey,
  dailySeed,
  formatTime,
  isSolved,
  mergeRecord,
  mulberry32,
  scoreFor,
  shuffle,
  slideTile,
  solvedBoard,
} from './core.js';

/* ==========================================================================
 * 0. Pure presentation helpers (test surface — plan §6/§8, P3 picture mode)
 * ======================================================================= */

/**
 * background-size/-position that shows slice `index` of an n×n split of one
 * picture as the tile's whole box. Keyed by the slice a tile OWNS (its value
 * minus one), so every tile always carries the same fixed piece of the
 * picture and the image assembles exactly when the board is solved.
 */
export function sliceBackground(index, n) {
  const col = index % n;
  const row = Math.floor(index / n);
  return {
    size: n * 100 + '% ' + n * 100 + '%',
    position: (col * 100) / (n - 1) + '% ' + (row * 100) / (n - 1) + '%',
  };
}

/** Procedural scenes (README §8.7: procedural art, zero image assets). */
const SCENES = [
  function sceneAurora(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0b1026');
    sky.addColorStop(0.55, '#1b1b4d');
    sky.addColorStop(1, '#3b1d5a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 110; i++) {
      ctx.globalAlpha = 0.35 + Math.random() * 0.6;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h * 0.7, 0.5 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const bands = [
      ['rgba(52,211,153,0.45)', 130, 60],
      ['rgba(59,130,246,0.4)', 220, 80],
      ['rgba(167,139,250,0.32)', 70, 50],
    ];
    for (const [color, y0, amp] of bands) {
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= w; x += 24) ctx.lineTo(x, y0 + Math.sin(x / 130) * amp);
      ctx.lineTo(w, y0 + 170);
      ctx.lineTo(0, y0 + 170);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    const moon = ctx.createRadialGradient(w * 0.78, h * 0.18, 8, w * 0.78, h * 0.18, 100);
    moon.addColorStop(0, 'rgba(255,255,255,0.95)');
    moon.addColorStop(0.3, 'rgba(255,255,240,0.85)');
    moon.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.18, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101532';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.74);
    ctx.lineTo(w * 0.2, h * 0.52);
    ctx.lineTo(w * 0.38, h * 0.72);
    ctx.lineTo(w * 0.58, h * 0.48);
    ctx.lineTo(w * 0.8, h * 0.74);
    ctx.lineTo(w, h * 0.6);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    // snow caps so nearby mountain slices stay tellable apart
    ctx.fillStyle = 'rgba(226,232,240,0.92)';
    for (const [px, py, s] of [
      [w * 0.2, h * 0.52, 1],
      [w * 0.58, h * 0.48, 1.15],
      [w, h * 0.6, 0.7],
    ]) {
      ctx.beginPath();
      ctx.moveTo(px - 34 * s, py + 22 * s);
      ctx.lineTo(px, py);
      ctx.lineTo(px + 34 * s, py + 22 * s);
      ctx.lineTo(px + 20 * s, py + 16 * s);
      ctx.lineTo(px + 6 * s, py + 26 * s);
      ctx.lineTo(px - 10 * s, py + 14 * s);
      ctx.lineTo(px - 24 * s, py + 24 * s);
      ctx.closePath();
      ctx.fill();
    }
    // moonlit lake along the bottom with a reflection stripe
    const lake = ctx.createLinearGradient(0, h * 0.86, 0, h);
    lake.addColorStop(0, '#1b2a52');
    lake.addColorStop(1, '#3f5f8a');
    ctx.fillStyle = lake;
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
    ctx.fillStyle = 'rgba(255,255,240,0.35)';
    ctx.fillRect(w * 0.68, h * 0.885, 60, 5);
    ctx.fillRect(w * 0.72, h * 0.93, 40, 4);
  },
  function sceneSunset(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#2a1a5e');
    sky.addColorStop(0.5, '#c2410c');
    sky.addColorStop(1, '#fbbf24');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.62);
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, 180);
    glow.addColorStop(0, 'rgba(255,241,180,1)');
    glow.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7cf';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 74, 0, Math.PI * 2);
    ctx.fill();
    const sea = ctx.createLinearGradient(0, h * 0.62, 0, h);
    sea.addColorStop(0, '#7c2d12');
    sea.addColorStop(1, '#1e1b4a');
    ctx.fillStyle = sea;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = 'rgba(255,220,140,0.5)';
    for (let i = 0; i < 6; i++) {
      const half = 74 - i * 10;
      ctx.fillRect(w * 0.5 - half, h * 0.65 + i * (h * 0.055), half * 2, 10);
    }
    ctx.strokeStyle = 'rgba(30,20,60,0.8)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const [bx, by, s] of [
      [w * 0.25, h * 0.2, 1],
      [w * 0.34, h * 0.14, 0.8],
      [w * 0.19, h * 0.29, 0.6],
    ]) {
      ctx.beginPath();
      ctx.moveTo(bx - 16 * s, by);
      ctx.quadraticCurveTo(bx - 6 * s, by - 10 * s, bx, by);
      ctx.quadraticCurveTo(bx + 6 * s, by - 10 * s, bx + 16 * s, by);
      ctx.stroke();
    }
  },
  function sceneOcean(ctx, w, h) {
    const sea = ctx.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#38bdf8');
    sea.addColorStop(0.5, '#0284c7');
    sea.addColorStop(1, '#082f49');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      const x = (i + 0.5) * (w / 4);
      ctx.moveTo(x - 60, 0);
      ctx.lineTo(x + 60, 0);
      ctx.lineTo(x + 190, h);
      ctx.lineTo(x - 190, h);
      ctx.closePath();
      ctx.fill();
    }
    const fishColors = ['#f97316', '#facc15', '#f43f5e', '#a3e635', '#e879f9', '#fb923c'];
    const spots = [
      [0.18, 0.22], [0.52, 0.14], [0.82, 0.26], [0.26, 0.52],
      [0.62, 0.46], [0.86, 0.62], [0.14, 0.78],
    ];
    spots.forEach(([fx, fy], i) => {
      const x = fx * w;
      const y = fy * h;
      const s = 0.05 * w + (i % 3) * 8;
      ctx.fillStyle = fishColors[i % fishColors.length];
      ctx.beginPath();
      ctx.ellipse(x, y, s, s * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x - s * 1.6, y - s * 0.55);
      ctx.lineTo(x - s * 1.6, y + s * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y - s * 0.15, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + s * 0.55, y - s * 0.15, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, h * 0.92, w, h * 0.08);
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const fx of [0.08, 0.3, 0.55, 0.78, 0.95]) {
      ctx.beginPath();
      ctx.moveTo(fx * w, h * 0.94);
      ctx.quadraticCurveTo(fx * w - 22, h * 0.8, fx * w + 8, h * 0.68);
      ctx.stroke();
    }
  },
  function sceneForest(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#fef9c3');
    sky.addColorStop(0.45, '#bef264');
    sky.addColorStop(1, '#166534');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (const [fx, s] of [[0.18, 1.15], [0.42, 0.9], [0.68, 1.3], [0.9, 1]]) {
      const x = fx * w;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 14 * s, h * 0.42, 28 * s, h * 0.5);
      const greens = ['#166534', '#15803d', '#22c55e'];
      for (let layer = 0; layer < 3; layer++) {
        ctx.fillStyle = greens[layer];
        ctx.beginPath();
        ctx.arc(x, h * (0.38 - layer * 0.1), (64 - layer * 10) * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(254,240,138,0.55)';
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.12, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, h * 0.88, w, h * 0.12);
    for (const [fx, fy, s] of [[0.3, 0.9, 1], [0.62, 0.93, 0.8], [0.82, 0.9, 1.1]]) {
      const x = fx * w;
      const y = fy * h;
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(x - 8 * s, y - 22 * s, 16 * s, 22 * s);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(x, y - 22 * s, 22 * s, 13 * s, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - 8 * s, y - 27 * s, 3.4 * s, 0, Math.PI * 2);
      ctx.arc(x + 8 * s, y - 25 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, h * 0.3 + Math.random() * h * 0.55, 2.5 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  function sceneCity(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.8);
    sky.addColorStop(0, '#1e1b4a');
    sky.addColorStop(0.6, '#7c3aed');
    sky.addColorStop(1, '#f472b6');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.4 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h * 0.4, 0.5 + Math.random() * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const moon = ctx.createRadialGradient(w * 0.78, h * 0.16, 10, w * 0.78, h * 0.16, 80);
    moon.addColorStop(0, 'rgba(255,255,255,0.95)');
    moon.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.16, 80, 0, Math.PI * 2);
    ctx.fill();
    const heights = [0.42, 0.58, 0.36, 0.66, 0.5, 0.62, 0.4, 0.55, 0.46];
    const bw = w / heights.length;
    heights.forEach((fh, i) => {
      const x = i * bw;
      ctx.fillStyle = i % 2 ? '#0f172a' : '#1e293b';
      ctx.fillRect(x + 2, h - fh * h, bw - 4, fh * h);
      ctx.fillStyle = '#fde047';
      for (let wy = h - fh * h + 14; wy < h - 24; wy += 26) {
        for (let wx = x + 10; wx < x + bw - 14; wx += 20) {
          if (Math.random() > 0.42) ctx.fillRect(wx, wy, 9, 12);
        }
      }
    });
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, h * 0.94, w, h * 0.06);
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(w * 0.12 + i * w * 0.18, h * 0.955, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f87171';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(w * 0.2 + i * w * 0.18, h * 0.985, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  function sceneSpace(ctx, w, h) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);
    const nebula = ctx.createRadialGradient(w * 0.7, h * 0.7, 10, w * 0.7, h * 0.7, 300);
    nebula.addColorStop(0, 'rgba(147,51,234,0.4)');
    nebula.addColorStop(1, 'rgba(147,51,234,0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.3 + Math.random() * 0.7;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 0.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const px = w * 0.34;
    const py = h * 0.44;
    const pr = w * 0.21;
    const planet = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.2, px, py, pr);
    planet.addColorStop(0, '#fdba74');
    planet.addColorStop(0.6, '#ea580c');
    planet.addColorStop(1, '#7c2d12');
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(124,45,18,0.55)';
    for (const [ox, oy, r] of [[-0.3, -0.2, 0.16], [0.25, 0.15, 0.12], [-0.05, 0.4, 0.2]]) {
      ctx.beginPath();
      ctx.arc(px + ox * pr, py + oy * pr, r * pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#fcd34d';
    ctx.lineWidth = 12;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, pr * 1.65, pr * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const moon2 = ctx.createRadialGradient(w * 0.8, h * 0.18, 5, w * 0.8, h * 0.18, 44);
    moon2.addColorStop(0, '#e2e8f0');
    moon2.addColorStop(1, '#64748b');
    ctx.fillStyle = moon2;
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.18, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(226,232,240,0.8)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.82);
    ctx.lineTo(w * 0.26, h * 0.68);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(w * 0.27, h * 0.67, 13, 0, Math.PI * 2);
    ctx.fill();
  },
  function sceneDesert(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#fde68a');
    sky.addColorStop(1, '#fb923c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.34, 62, 0, Math.PI * 2);
    ctx.fill();
    const dunes = [
      ['#f59e0b', 0.56, 0.1],
      ['#d97706', 0.68, 0.14],
      ['#b45309', 0.82, 0.12],
    ];
    for (const [color, y0, amp] of dunes) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * y0);
      for (let x = 0; x <= w; x += 20) {
        ctx.lineTo(x, h * y0 + Math.sin(x / 150) * h * amp);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }
    for (const [fx, fy, s] of [[0.16, 0.62, 1], [0.78, 0.58, 0.85], [0.5, 0.88, 1.15], [0.9, 0.9, 0.9]]) {
      const x = fx * w;
      const y = fy * h;
      ctx.fillStyle = '#166534';
      const armW = 13 * s;
      ctx.fillRect(x - armW / 2, y - 90 * s, armW, 92 * s);
      ctx.fillRect(x - 34 * s, y - 62 * s, armW, 26 * s);
      ctx.fillRect(x - 34 * s, y - 62 * s, armW, 12 * s);
      ctx.fillRect(x - 34 * s, y - 74 * s, armW, 14 * s);
      ctx.fillRect(x + 20 * s, y - 50 * s, armW, 22 * s);
      ctx.fillRect(x + 20 * s, y - 66 * s, armW, 18 * s);
    }
    const bx = w * 0.68;
    const by = h * 0.2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(bx - 46, by);
    ctx.quadraticCurveTo(bx, by - 74, bx + 46, by);
    ctx.quadraticCurveTo(bx, by + 26, bx - 46, by);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx - 14, by + 12);
    ctx.lineTo(bx - 8, by + 40);
    ctx.moveTo(bx + 14, by + 12);
    ctx.lineTo(bx + 8, by + 40);
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(bx - 14, by + 38, 28, 20);
  },
  function sceneBubbles(ctx, w, h) {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#fef3c7');
    bg.addColorStop(1, '#fbcfe8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];
    // big distinct circles on a loose grid so every slice is tellable apart
    const spots = [
      [0.18, 0.2], [0.5, 0.14], [0.82, 0.22],
      [0.14, 0.52], [0.5, 0.5], [0.86, 0.54],
      [0.2, 0.84], [0.52, 0.8], [0.84, 0.86],
    ];
    spots.forEach(([fx, fy], i) => {
      const x = fx * w;
      const y = fy * h;
      const r = (i % 3 === 1 ? 0.17 : 0.13) * w;
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.25, colors[i % colors.length]);
      g.addColorStop(1, colors[(i + 4) % colors.length]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
];

/** Renders one of the scenes to a JPEG data URL; null when canvas is unavailable. */
function makePicture(sceneIndex) {
  try {
    const S = 720;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    SCENES[sceneIndex % SCENES.length](ctx, S, S);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null; // no canvas — silently stay on the numbers look
  }
}

/* ==========================================================================
 * 1. Guarded storage (README §2 — private-mode safe, no records ≠ unplayable)
 * ======================================================================= */

const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__sp_probe__';
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        return window.localStorage;
      }
    } catch {
      /* private mode / disabled — fall through */
    }
    return null;
  }
  return {
    readJson(key, fallbackValue) {
      try {
        const store = backend();
        const raw = store ? store.getItem(key) : fallback[key] || null;
        if (!raw) return fallbackValue;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : fallbackValue;
      } catch {
        return fallbackValue;
      }
    },
    writeJson(key, value) {
      try {
        const store = backend();
        if (store) store.setItem(key, JSON.stringify(value));
        else fallback[key] = JSON.stringify(value);
      } catch {
        /* quota / private mode — the game keeps working without records */
      }
    },
  };
})();

function loadBest(size, variant) {
  const best = storage.readJson(bestKey(size, variant), null);
  if (
    best &&
    typeof best.timeMs === 'number' && best.timeMs >= 0 &&
    typeof best.moves === 'number' && best.moves >= 0
  ) {
    return best;
  }
  return null;
}

/** Personal records live under `best:<size>` (normal) or `best:<size>:hard`. */
function saveBest(size, timeMs, moves, variant) {
  const { best, newTime, newMoves } = mergeRecord(loadBest(size, variant), timeMs, moves);
  storage.writeJson(bestKey(size, variant), best);
  return { best, newTime, newMoves };
}

/** One day's daily-challenge record ({timeMs, moves}) or null. */
function loadDailyRecord(date) {
  return loadDailyRecordRaw(dailyKey(date));
}

function loadDailyRecordRaw(key) {
  const rec = storage.readJson(key, null);
  if (
    rec &&
    typeof rec.timeMs === 'number' && rec.timeMs >= 0 &&
    typeof rec.moves === 'number' && rec.moves >= 0
  ) {
    return rec;
  }
  return null;
}

function loadPrefs() {
  const prefs = storage.readJson(PREFS_KEY, {});
  const size = SIZES.indexOf(prefs.size) !== -1 ? prefs.size : 3;
  return {
    size,
    muted: prefs.muted === true,
    mode: prefs.mode === 'picture' ? 'picture' : 'numbers',
    hard: prefs.hard === true,
  };
}

function savePrefs() {
  storage.writeJson(PREFS_KEY, {
    size: state.size,
    muted: state.muted,
    mode: state.mode,
    hard: state.hard,
  });
}

/* ==========================================================================
 * 2. Audio (README §3 audio.js equivalent — context on first user gesture)
 * ======================================================================= */

let audioCtx = null;

function ensureAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    /* no audio — fine */
  }
  return audioCtx;
}

function blip(freq, ms = 60, type = 'triangle', when = 0) {
  if (state.muted) return;
  try {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.setValueAtTime(0.0001, t);
    gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  } catch {
    /* audio must never break gameplay */
  }
}

/* ==========================================================================
 * 3. State + rendering
 * ======================================================================= */

const state = {
  screen: 'menu', // menu | playing | paused | won
  size: 3,
  board: solvedBoard(3),
  moves: 0,
  started: false, // first move made — the clock only runs from there on
  running: false, // clock is ticking right now
  playedMs: 0, // accumulated played time across pauses
  turnStartedAt: 0, // performance.now() when the current run began
  muted: false,
  mode: 'numbers', // 'numbers' | 'picture' (P3 picture mode)
  hard: false, // pref: hard free play — picture only, no preview, no peek
  hardActive: false, // the current round runs under hard rules
  daily: false, // the current round is today's daily challenge (seeded 4×4)
  picture: null, // data URL of this round's picture (null → numbers look)
  peek: false, // picture mode: show the number pills over the slices
  tiles: new Map(), // tile value → button element
};

const els = {};

/** Played time, exact across pause/resume (plan §10: ±50 ms of wall clock). */
function playedMs() {
  return state.playedMs + (state.running ? performance.now() - state.turnStartedAt : 0);
}

function startClock() {
  if (state.running) return;
  state.running = true;
  state.turnStartedAt = performance.now();
}

function holdClock() {
  if (!state.running) return;
  state.playedMs += performance.now() - state.turnStartedAt;
  state.running = false;
}

// The HUD clock is a readout, not an animation — an interval keeps it
// ticking even when rAF is throttled (occluded panes), and the tab-hidden
// auto-pause makes the hidden case moot anyway.
let hudTimer = null;

function tickHud() {
  if (state.screen !== 'playing') {
    clearInterval(hudTimer);
    hudTimer = null;
    return;
  }
  els.hudTime.textContent = formatTime(playedMs());
}

function ensureHudTicker() {
  if (!hudTimer) hudTimer = setInterval(tickHud, 200);
}

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name !== 'menu');
  els.overlayPause.classList.toggle('hidden', name !== 'paused');
  els.overlayWin.classList.toggle('hidden', name !== 'won');
  if (name === 'menu') {
    closePreview(false);
    // a daily round forces 4×4 — the menu reflects the saved free-play size
    state.size = loadPrefs().size;
    renderMenuBests();
    renderDaily();
  }
  if (name === 'paused') els.btnResume.focus();
  if (name === 'won') els.btnAgain.focus();
  if (name === 'playing') ensureHudTicker();
}

/** Tiles are keyed by value (plan §6); each is told its board cell via --x/--y. */
function renderTiles(delays) {
  const n = state.size;
  const pos = new Array(state.board.length);
  for (let i = 0; i < state.board.length; i++) pos[state.board[i]] = i;
  for (let v = 1; v < state.board.length; v++) {
    const el = state.tiles.get(v);
    const i = pos[v];
    el.style.transitionDelay = delays && delays.has(v) ? delays.get(v) + 'ms' : '';
    el.style.setProperty('--x', String(i % n));
    el.style.setProperty('--y', String(Math.floor(i / n)));
  }
}

function buildBoard() {
  els.board.style.setProperty('--n', String(state.size));
  els.board.setAttribute('aria-label', 'Sliding puzzle board, ' + state.size + ' by ' + state.size);
  els.board.innerHTML = '';
  state.tiles.clear();
  const pictureUsable = !!state.picture; // startRound already decided who gets a picture
  els.board.classList.toggle('board--picture', pictureUsable);
  els.board.classList.toggle('board--peek', pictureUsable && state.peek);
  for (let v = 1; v < state.size * state.size; v++) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.dataset.value = String(v);
    const num = document.createElement('span');
    num.className = 'tile-num';
    num.textContent = String(v);
    num.setAttribute('aria-hidden', 'true'); // the button's label already says it
    tile.appendChild(num);
    if (pictureUsable) {
      // Each tile owns the fixed slice matching its value (plan P3) — the
      // picture assembles exactly when the board reaches the solved state.
      const slice = sliceBackground(v - 1, state.size);
      tile.style.backgroundImage = 'url("' + state.picture + '")';
      tile.style.backgroundSize = slice.size;
      tile.style.backgroundPosition = slice.position;
    }
    tile.setAttribute('aria-label', 'Tile ' + v);
    state.tiles.set(v, tile);
    els.board.appendChild(tile);
  }
  renderTiles();
}

/* ---- menu ---------------------------------------------------------------- */

function bestLine(size) {
  const best = loadBest(size);
  if (!best) return 'No record yet';
  return 'Best ' + formatTime(best.timeMs) + ' · ' + best.moves + ' moves';
}

function renderMenuBests() {
  for (const size of SIZES) {
    document.getElementById('best-' + size).textContent = bestLine(size);
    document.getElementById('card-' + size).setAttribute(
      'aria-checked',
      state.size === size ? 'true' : 'false'
    );
  }
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** The daily button's sub-line: today's date and, once solved, the result. */
function renderDaily() {
  const now = new Date();
  const rec = loadDailyRecord(now);
  let sub = DATE_FMT.format(now) + ' · 4×4';
  if (rec) sub += ' · ✓ ' + formatTime(rec.timeMs) + ' · ' + rec.moves + ' moves';
  els.dailySub.textContent = sub;
}

/* ---- game flow ------------------------------------------------------------ */

/**
 * `daily` starts today's challenge: the classic 4×4, seeded with the date so
 * every player — and every replay — gets the exact same board. Hard free
 * play forces the picture look and takes the aids away (plan: challenge).
 */
function startRound(daily = false) {
  closePreview(false);
  if (daily) state.size = 4;
  state.daily = daily;
  state.hardActive = state.hard && !daily;
  const wantPicture = state.hardActive || state.mode === 'picture';
  state.board = shuffle(
    state.size,
    SHUFFLE_MOVES[state.size],
    daily ? mulberry32(dailySeed(new Date())) : Math.random
  );
  state.moves = 0;
  state.started = false;
  state.playedMs = 0;
  state.running = false;
  state.peek = false;
  // Picture mode renders a fresh procedural scene every round (plan P3);
  // a null result (no canvas) silently falls back to the numbers look.
  state.picture = wantPicture ? makePicture(Math.floor(Math.random() * SCENES.length)) : null;
  els.btnPeek.classList.toggle('hidden', !state.picture || state.hardActive);
  els.btnPeek.setAttribute('aria-pressed', 'false');
  els.picPreview.classList.toggle('hidden', !state.picture || state.hardActive);
  if (state.picture) {
    // corner reference: full target picture + the n×n grid overlaid
    els.picPreview.style.backgroundImage = 'url("' + state.picture + '")';
    els.picPreview.style.setProperty('--n', String(state.size));
  }
  buildBoard();
  els.hudTime.textContent = formatTime(0);
  els.hudMoves.textContent = '0';
  showScreen('playing');
}

/**
 * Values of the tiles a slide displaces, nearest the blank first — read from
 * the pre-move board (after the slide this information is gone). Null for
 * anything that is not a straight slide along the blank's row/column.
 */
function pushedTileValues(board, n, index) {
  const blank = blankAt(board);
  if (index === blank) return null;
  const sameRow = Math.floor(index / n) === Math.floor(blank / n);
  const sameCol = index % n === blank % n;
  if (!sameRow && !sameCol) return null;
  const step = index > blank ? (sameRow ? 1 : n) : sameRow ? -1 : -n;
  const dist = Math.abs(index - blank) / (sameRow ? 1 : n);
  const values = [];
  for (let k = 1; k <= dist; k++) values.push(board[blank + step * k]);
  return values;
}

/**
 * One slide, per plan §7.6: state updates immediately and the transition
 * animation catches up — input is never queued behind animation.
 */
function attemptSlide(index) {
  if (state.screen !== 'playing') return; // menu / paused / won — input locked (§7.7)
  const result = slideTile(state.board, state.size, index);
  if (!result) {
    shakeTile(index);
    return;
  }
  const pushed = result.moved > 1 ? pushedTileValues(state.board, state.size, index) : null;
  if (!state.started) {
    state.started = true;
    startClock();
    ensureHudTicker();
  }
  state.board = result.board;
  state.moves += result.moved;
  els.hudMoves.textContent = String(state.moves);
  renderTiles(staggerDelays(pushed));
  if (result.moved === 1) {
    blip(520, 45);
  } else {
    blip(430, 40);
    blip(520, 40, 'triangle', 0.04);
  }
  if (isSolved(state.board)) win();
}

/** Segment pushes glide tile by tile (plan §7.1): 40 ms stagger, blank-first. */
function staggerDelays(pushed) {
  if (!pushed) return null;
  const delays = new Map();
  for (let k = 0; k < pushed.length; k++) delays.set(pushed[k], k * 40);
  return delays;
}

function shakeTile(index) {
  const v = state.board[index];
  if (!v) return; // blank or out of range — nothing to shake
  const el = state.tiles.get(v);
  el.classList.remove('tile--shake');
  void el.offsetWidth; // restart the animation on rapid repeat taps
  el.classList.add('tile--shake');
  blip(140, 80, 'square');
  setTimeout(() => el.classList.remove('tile--shake'), 320);
}

/* ---- win ------------------------------------------------------------------ */

function win() {
  holdClock();
  const timeMs = Math.round(playedMs());
  const seconds = Math.round(timeMs / 1000);
  const score = scoreFor(state.size, state.moves, seconds);
  const variant = state.hardActive ? 'hard' : null;

  // A daily run updates today's record (badges compare against it) and,
  // since it is a real assisted 4×4 solve, the normal 4×4 best as well.
  let best;
  let newTime;
  let newMoves;
  if (state.daily) {
    const key = dailyKey(new Date());
    const folded = mergeRecord(loadDailyRecordRaw(key), timeMs, state.moves);
    storage.writeJson(key, folded.best);
    best = folded.best;
    newTime = folded.newTime;
    newMoves = folded.newMoves;
    saveBest(state.size, timeMs, state.moves);
  } else {
    ({ best, newTime, newMoves } = saveBest(state.size, timeMs, state.moves, variant));
  }

  els.winStats.textContent =
    formatTime(timeMs) + ' · ' + state.moves + ' moves · ' + score + ' points';
  els.badgeTime.classList.toggle('hidden', !newTime);
  els.badgeMoves.classList.toggle('hidden', !newMoves);
  els.winBest.textContent =
    (state.daily ? "Today's best " : 'Best ') +
    formatTime(best.timeMs) + ' · ' + best.moves + ' moves';
  if (state.size < SIZES[SIZES.length - 1] && !state.daily) {
    els.btnBigger.classList.remove('hidden');
    els.btnBigger.textContent = 'Bigger grid — ' + (state.size + 1) + '×' + (state.size + 1);
  } else {
    els.btnBigger.classList.add('hidden');
  }

  els.hudTime.textContent = formatTime(timeMs);
  blip(523, 90, 'triangle', 0);
  blip(659, 90, 'triangle', 0.1);
  blip(784, 160, 'triangle', 0.2);
  vibrate([30, 50, 30]);

  // Input is locked right now (plan §7.7); in picture mode the blank gets
  // its slice back so the player briefly sees the completed picture before
  // the overlay slides in. The guard keeps a stale reveal from firing after
  // a fast Restart.
  state.screen = 'won';
  if (state.picture) {
    fillBlankSlice();
    setTimeout(() => {
      if (state.screen === 'won') showScreen('won');
    }, 900);
  } else {
    showScreen('won');
  }
}

/** Drops the final slice into the blank socket — the picture completes. */
function fillBlankSlice() {
  const n = state.size;
  const ghost = document.createElement('div');
  ghost.className = 'tile tile--ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const slice = sliceBackground(n * n - 1, n);
  ghost.style.backgroundImage = 'url("' + state.picture + '")';
  ghost.style.backgroundSize = slice.size;
  ghost.style.backgroundPosition = slice.position;
  ghost.style.transform =
    'translate(calc(' + (n - 1) + ' * 100%), calc(' + (n - 1) + ' * 100%))';
  els.board.appendChild(ghost);
}

/* ---- target-picture preview (picture mode): corner thumb → enlarge ------- */

let previewOpen = false;

function openPreview() {
  if (!state.picture || state.screen === 'menu') return;
  els.previewImage.style.backgroundImage = 'url("' + state.picture + '")';
  els.overlayPreview.classList.remove('hidden');
  previewOpen = true;
  els.btnPreviewClose.focus();
}

function closePreview(restoreFocus = true) {
  if (!previewOpen) return;
  previewOpen = false;
  els.overlayPreview.classList.add('hidden');
  if (restoreFocus && !els.picPreview.classList.contains('hidden')) {
    els.picPreview.focus();
  }
}

/* ---- pause (plan §4/§7.3: opaque overlay, board hidden, clock held) -------- */

function pauseGame() {
  if (state.screen !== 'playing') return;
  closePreview(false);
  holdClock();
  showScreen('paused');
}

function resumeGame() {
  if (state.screen !== 'paused') return;
  if (state.started) startClock(); // clock only ever ran after the first move
  showScreen('playing');
}

/* ---- share (README §2 chain: Web Share → clipboard → prompt) --------------- */

function shareText() {
  const url = window.location.origin + window.location.pathname;
  const result =
    formatTime(playedMs()) + ' · ' + state.moves + ' moves';
  if (state.daily) {
    return (
      'I solved today\u2019s Daily Sliding Puzzle in ' + result +
      ' — can you beat me? ' + url
    );
  }
  const mode = state.hardActive ? ' on hard mode' : '';
  return (
    'I solved ' + state.size + '×' + state.size + mode + ' in ' + result +
    ' in Sliding Puzzle — can you beat it? ' + url
  );
}

function share() {
  const text = shareText();
  if (navigator.share) {
    navigator.share({ title: 'Sliding Puzzle', text }).catch(() => {
      /* user dismissed the sheet */
    });
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast('Result copied to clipboard 📋'),
      () => window.prompt('Copy your result:', text)
    );
    return;
  }
  window.prompt('Copy your result:', text);
}

let toastTimer = null;
function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('toast--in');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('toast--in'), 2200);
}

function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported — fine */
  }
}

/* ==========================================================================
 * 4. Input
 * ======================================================================= */

function handleBoardClick(e) {
  const tile = e.target.closest('.tile');
  if (!tile) return;
  attemptSlide(state.board.indexOf(Number(tile.dataset.value)));
}

/**
 * Keyboard play (plan §7.4): arrows move the tile *into* the blank — the
 * tile travels in the arrow direction (ArrowLeft slides the tile right of
 * the blank leftwards). Enter/Space on a focused tile is the native button
 * click. Focus rings stay visible (:focus-visible in CSS).
 */
function handleKeys(e) {
  if (e.key === 'Escape' && previewOpen) {
    e.preventDefault();
    closePreview();
    return;
  }
  if (state.screen !== 'playing' || previewOpen) return; // arrows locked while peeking at the target
  const n = state.size;
  const blank = blankAt(state.board);
  const row = Math.floor(blank / n);
  const col = blank % n;
  let target = null;
  if (e.key === 'ArrowLeft' && col < n - 1) target = blank + 1;
  else if (e.key === 'ArrowRight' && col > 0) target = blank - 1;
  else if (e.key === 'ArrowUp' && row < n - 1) target = blank + n;
  else if (e.key === 'ArrowDown' && row > 0) target = blank - n;
  if (target !== null) {
    e.preventDefault();
    attemptSlide(target);
  }
}

/* ==========================================================================
 * 5. Wiring + init
 * ======================================================================= */

function bindSegmented(container, attr, onPick) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[' + attr + ']');
    if (!btn) return;
    const buttons = container.querySelectorAll('button[' + attr + ']');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-checked', buttons[i] === btn ? 'true' : 'false');
    }
    onPick(btn.getAttribute(attr));
  });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.hudTime = document.getElementById('hud-time');
  els.hudMoves = document.getElementById('hud-moves');
  els.overlayPause = document.getElementById('overlay-pause');
  els.overlayWin = document.getElementById('overlay-win');
  els.winStats = document.getElementById('win-stats');
  els.winBest = document.getElementById('win-best');
  els.badgeTime = document.getElementById('badge-time');
  els.badgeMoves = document.getElementById('badge-moves');
  els.btnResume = document.getElementById('btn-resume');
  els.btnAgain = document.getElementById('btn-again');
  els.btnBigger = document.getElementById('btn-bigger');
  els.btnPeek = document.getElementById('btn-peek');
  els.dailySub = document.getElementById('daily-sub');
  els.picPreview = document.getElementById('pic-preview');
  els.overlayPreview = document.getElementById('overlay-preview');
  els.previewImage = document.getElementById('preview-image');
  els.btnPreviewClose = document.getElementById('btn-preview-close');
  els.toast = document.getElementById('toast');

  const prefs = loadPrefs();
  state.size = prefs.size;
  state.muted = prefs.muted;
  state.mode = prefs.mode;
  state.hard = prefs.hard;
  const muteToggle = document.getElementById('mute-toggle');
  muteToggle.checked = state.muted;
  muteToggle.addEventListener('change', () => {
    state.muted = muteToggle.checked;
    savePrefs();
    if (!state.muted) blip(660, 80); // audible confirmation the sound is back
  });

  const hardToggle = document.getElementById('hard-toggle');
  hardToggle.checked = state.hard;
  hardToggle.addEventListener('change', () => {
    state.hard = hardToggle.checked;
    savePrefs();
  });

  const pictureMode = document.getElementById('picture-mode');
  for (const btn of pictureMode.querySelectorAll('button[data-pmode]')) {
    btn.setAttribute('aria-checked', btn.getAttribute('data-pmode') === state.mode ? 'true' : 'false');
  }
  bindSegmented(pictureMode, 'data-pmode', (mode) => {
    state.mode = mode;
    savePrefs();
  });

  els.btnPeek.addEventListener('click', () => {
    state.peek = !state.peek;
    els.btnPeek.setAttribute('aria-pressed', state.peek ? 'true' : 'false');
    els.board.classList.toggle('board--peek', state.peek && !!state.picture);
  });

  els.picPreview.addEventListener('click', openPreview);
  els.btnPreviewClose.addEventListener('click', () => closePreview());
  els.overlayPreview.addEventListener('click', (e) => {
    if (e.target === els.overlayPreview) closePreview(); // tap on the backdrop
  });

  bindSegmented(document.getElementById('size-cards'), 'data-size', (raw) => {
    state.size = Number(raw);
    savePrefs();
    renderMenuBests();
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    ensureAudio();
    startRound(false);
  });
  document.getElementById('btn-daily').addEventListener('click', () => {
    ensureAudio();
    startRound(true);
  });
  document.getElementById('btn-menu').addEventListener('click', () => showScreen('menu'));
  document.getElementById('btn-pause').addEventListener('click', pauseGame);
  document.getElementById('btn-restart').addEventListener('click', () => startRound(state.daily));
  document.getElementById('btn-shuffle').addEventListener('click', () => startRound(state.daily));
  els.btnResume.addEventListener('click', resumeGame);
  document.getElementById('btn-restart2').addEventListener('click', () => startRound(state.daily));
  document.getElementById('btn-menu2').addEventListener('click', () => showScreen('menu'));
  els.btnAgain.addEventListener('click', () => startRound(state.daily));
  document.getElementById('btn-menu3').addEventListener('click', () => showScreen('menu'));
  els.btnBigger.addEventListener('click', () => {
    state.size = Math.min(state.size + 1, SIZES[SIZES.length - 1]);
    savePrefs();
    startRound(false); // leaves the daily — bigger grids are free play
  });
  document.getElementById('btn-share').addEventListener('click', share);

  els.board.addEventListener('click', handleBoardClick);
  document.addEventListener('keydown', handleKeys);

  // The clock never elapses while the tab is hidden (§2/§7.3).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });

  // WebAudio contexts may only be created from a user gesture.
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  renderMenuBests();
  showScreen('menu');
}

if (typeof document !== 'undefined' && document.getElementById('board')) {
  init();
}
