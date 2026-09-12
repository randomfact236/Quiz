/**
 * ============================================================================
 * Sliding Puzzle — scenes.js (Game 03, plan/games/03-sliding-puzzle.md §6)
 * ============================================================================
 * Procedural painters + makePicture + sliceBackground (plan P3 picture mode).
 * Importing has no side effects — the canvas is only touched inside
 * makePicture — so the jest suite can import sliceBackground directly.
 * ============================================================================
 */

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
export const SCENES = [
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
      ctx.arc(
        Math.random() * w,
        Math.random() * h * 0.7,
        0.5 + Math.random() * 2.2,
        0,
        Math.PI * 2
      );
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
      [0.18, 0.22],
      [0.52, 0.14],
      [0.82, 0.26],
      [0.26, 0.52],
      [0.62, 0.46],
      [0.86, 0.62],
      [0.14, 0.78],
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
    for (const [fx, s] of [
      [0.18, 1.15],
      [0.42, 0.9],
      [0.68, 1.3],
      [0.9, 1],
    ]) {
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
    for (const [fx, fy, s] of [
      [0.3, 0.9, 1],
      [0.62, 0.93, 0.8],
      [0.82, 0.9, 1.1],
    ]) {
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
      ctx.arc(
        Math.random() * w,
        h * 0.3 + Math.random() * h * 0.55,
        2.5 + Math.random() * 4,
        0,
        Math.PI * 2
      );
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
      ctx.arc(
        Math.random() * w,
        Math.random() * h * 0.4,
        0.5 + Math.random() * 1.8,
        0,
        Math.PI * 2
      );
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
    for (const [ox, oy, r] of [
      [-0.3, -0.2, 0.16],
      [0.25, 0.15, 0.12],
      [-0.05, 0.4, 0.2],
    ]) {
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
    for (const [fx, fy, s] of [
      [0.16, 0.62, 1],
      [0.78, 0.58, 0.85],
      [0.5, 0.88, 1.15],
      [0.9, 0.9, 0.9],
    ]) {
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
    const colors = [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#0ea5e9',
      '#6366f1',
      '#a855f7',
      '#ec4899',
    ];
    // big distinct circles on a loose grid so every slice is tellable apart
    const spots = [
      [0.18, 0.2],
      [0.5, 0.14],
      [0.82, 0.22],
      [0.14, 0.52],
      [0.5, 0.5],
      [0.86, 0.54],
      [0.2, 0.84],
      [0.52, 0.8],
      [0.84, 0.86],
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
export function makePicture(sceneIndex) {
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
