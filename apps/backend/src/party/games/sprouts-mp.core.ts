/**
 * Sprouts MP (T16 3P + F21 4P, ONE core) — PURE core, backend-owned.
 *
 * The pencil-and-paper classic as a party game: every dot has three
 * line-ends. A move draws a line between two live dots (or loops one dot
 * back to itself) and plants a NEW dot on that line. Lines may not cross
 * or graze other dots. When the table runs out of drawable lines the game
 * ends — the LAST MOVER wins (placement = reverse move order).
 *
 * Straight-line rendering model: every edge is a polyline; crossing and
 * clearance checks run on the polylines so validate(), apply() and the bots
 * all agree bit-for-bit. Loops are circles through the dot; near-dot
 * segments are exempt from crossing checks (the loop wraps the free corner).
 *
 * EMPTY-BOARD: pure geometry — no words, no served content. No hidden info.
 */

export const SPR_W = 600;
export const SPR_H = 460;
export const SPR_LIVES = 3;
const RMIN = 16; // dot radius used to trim lines at the dots
const MIN_GAP = 40; // new dot clearance to every other dot
const GRAZE = 14; // a line must stay this far from other dot centers
const MARGIN = 26; // canvas margin for new geometry
const LOOP_R = 52; // distance from the dot to the new dot of a loop
const EPS = 1e-9;

export interface SprDot {
  x: number;
  y: number;
  deg: number;
}
export interface SprEdge {
  a: number;
  b: number;
  /** Polyline in canvas coordinates; loops are closed (first == last). */
  poly: number[][];
}
export interface SprMove {
  seat: number;
  a: number;
  b: number;
}
export interface SprState {
  dots: SprDot[];
  edges: SprEdge[];
  moves: SprMove[];
  turn: number;
  seatCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface SprPlacement {
  seat: number;
  rank: number;
}
export interface SprCheckResult {
  err: string | null;
  poly?: number[][];
  pos?: [number, number];
}

const SEED_POS: Record<number, number[][]> = {
  3: [
    [300, 104],
    [150, 336],
    [450, 336],
  ],
  4: [
    [150, 102],
    [450, 102],
    [450, 334],
    [150, 334],
  ],
};

export function sprInitialState(seatCount: number): SprState {
  const n = seatCount >= 4 ? 4 : 3;
  const seeds = SEED_POS[n] ?? SEED_POS[4];
  return {
    dots: seeds.map((p) => ({ x: p[0], y: p[1], deg: 0 })),
    edges: [],
    moves: [],
    turn: 0,
    seatCount,
    phase: 'playing',
    winnerSeat: null,
  };
}

export function sprFree(state: SprState, i: number): number {
  return SPR_LIVES - state.dots[i].deg;
}

/* ------------------------------ geometry ------------------------------ */

function ptSegDist(px: number, py: number, a: number[], b: number[]): number {
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}
function onSeg(a: number[], b: number[], px: number, py: number): boolean {
  return (
    Math.min(a[0], b[0]) - 1e-6 <= px &&
    px <= Math.max(a[0], b[0]) + 1e-6 &&
    Math.min(a[1], b[1]) - 1e-6 <= py &&
    py <= Math.max(a[1], b[1]) + 1e-6
  );
}
/** True when segments a-b and c-d intersect (including collinear touch). */
function segCross(a: number[], b: number[], c: number[], d: number[]): boolean {
  const o1 = orient(a[0], a[1], b[0], b[1], c[0], c[1]);
  const o2 = orient(a[0], a[1], b[0], b[1], d[0], d[1]);
  const o3 = orient(c[0], c[1], d[0], d[1], a[0], a[1]);
  const o4 = orient(c[0], c[1], d[0], d[1], b[0], b[1]);
  if (
    ((o1 > EPS && o2 < -EPS) || (o1 < -EPS && o2 > EPS)) &&
    ((o3 > EPS && o4 < -EPS) || (o3 < -EPS && o4 > EPS))
  )
    return true;
  if (Math.abs(o1) <= EPS && onSeg(a, b, c[0], c[1])) return true;
  if (Math.abs(o2) <= EPS && onSeg(a, b, d[0], d[1])) return true;
  if (Math.abs(o3) <= EPS && onSeg(c, d, a[0], a[1])) return true;
  if (Math.abs(o4) <= EPS && onSeg(c, d, b[0], b[1])) return true;
  return false;
}

/** Test polyline for an edge: loops drop the segments that hug their dot. */
function edgeTestPoly(state: SprState, e: SprEdge): number[][] {
  if (e.a !== e.b) return e.poly;
  const P = state.dots[e.a];
  const kept = e.poly.filter((p) => Math.hypot(p[0] - P.x, p[1] - P.y) >= 25);
  return kept.length >= 2 ? kept : [];
}

function crossesAny(state: SprState, poly: number[][]): boolean {
  for (const e of state.edges) {
    const ep = edgeTestPoly(state, e);
    for (let i = 0; i + 1 < poly.length; i++) {
      for (let k = 0; k + 1 < ep.length; k++) {
        if (segCross(poly[i], poly[i + 1], ep[k], ep[k + 1])) return true;
      }
    }
  }
  return false;
}

function grazesAny(state: SprState, poly: number[][], skipA: number, skipB: number): boolean {
  for (let i = 0; i + 1 < poly.length; i++) {
    for (let d = 0; d < state.dots.length; d++) {
      if (d === skipA || d === skipB) continue;
      if (ptSegDist(state.dots[d].x, state.dots[d].y, poly[i], poly[i + 1]) < GRAZE) return true;
    }
  }
  return false;
}

function dotClearsDots(state: SprState, pos: number[], skipA: number, skipB: number): boolean {
  for (let d = 0; d < state.dots.length; d++) {
    if (d === skipA || d === skipB) continue;
    if (Math.hypot(pos[0] - state.dots[d].x, pos[1] - state.dots[d].y) < MIN_GAP) return false;
  }
  return true;
}

function dotClearsLines(state: SprState, pos: number[], exemptDot: number): boolean {
  for (const e of state.edges) {
    const ep = edgeTestPoly(state, e);
    for (let k = 0; k + 1 < ep.length; k++) {
      if (ptSegDist(pos[0], pos[1], ep[k], ep[k + 1]) < 10) return false;
    }
    // lines incident to the exempt dot still count, but with a lighter rule
    void exemptDot;
  }
  return true;
}

function inCanvas(pos: number[], margin: number): boolean {
  return (
    pos[0] >= margin && pos[0] <= SPR_W - margin && pos[1] >= margin && pos[1] <= SPR_H - margin
  );
}

function sprEdgeGeometry(state: SprState, a: number, b: number): SprCheckResult {
  const P = state.dots[a];
  const Q = state.dots[b];
  const dx = Q.x - P.x;
  const dy = Q.y - P.y;
  const len = Math.hypot(dx, dy);
  if (len < RMIN * 2 + 8) return { err: 'Those dots are too close to draw between.' };
  const ux = dx / len;
  const uy = dy / len;
  const A1 = [P.x + ux * RMIN, P.y + uy * RMIN];
  const B1 = [Q.x - ux * RMIN, Q.y - uy * RMIN];
  if (grazesAny(state, [A1, B1], a, b)) return { err: 'The line would graze another dot.' };
  if (crossesAny(state, [A1, B1])) return { err: 'That line would cross existing lines.' };
  const mid: number[] = [(A1[0] + B1[0]) / 2, (A1[1] + B1[1]) / 2];
  const px = -(B1[1] - A1[1]);
  const py = B1[0] - A1[0];
  const plen = Math.hypot(px, py) || 1;
  const nx = px / plen;
  const ny = py / plen;
  const cand: number[][] = [mid];
  for (const t of [0.34, 0.66])
    cand.push([A1[0] + (B1[0] - A1[0]) * t, A1[1] + (B1[1] - A1[1]) * t]);
  for (const off of [22, 36, 52]) {
    for (const sgn of [1, -1]) cand.push([mid[0] + nx * off * sgn, mid[1] + ny * off * sgn]);
  }
  for (const c of cand) {
    if (!inCanvas(c, MARGIN)) continue;
    if (!dotClearsDots(state, c, a, b)) continue;
    if (!dotClearsLines(state, c, a)) continue;
    const p1 = [A1, c];
    const p2 = [c, B1];
    if (grazesAny(state, p1, a, b) || grazesAny(state, p2, a, b)) continue;
    if (crossesAny(state, p1) || crossesAny(state, p2)) continue;
    return { err: null, poly: [A1, c, B1], pos: [c[0], c[1]] };
  }
  return { err: 'There is no room left to plant a new dot on that line.' };
}

function sprLoopGeometry(state: SprState, a: number): SprCheckResult {
  const P = state.dots[a];
  let cx = 0;
  let cy = 0;
  for (const d of state.dots) {
    cx += d.x;
    cy += d.y;
  }
  cx /= state.dots.length;
  cy /= state.dots.length;
  let base = Math.atan2(P.y - cy, P.x - cx);
  if (Math.hypot(P.x - cx, P.y - cy) < 1) base = Math.PI / 2;
  const degs = [0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180];
  for (const off of degs) {
    const th = base + (off * Math.PI) / 180;
    const pos = [P.x + Math.cos(th) * LOOP_R, P.y + Math.sin(th) * LOOP_R];
    if (!inCanvas(pos, MARGIN + 10)) continue;
    if (!dotClearsDots(state, pos, a, -1)) continue;
    if (!dotClearsLines(state, pos, a)) continue;
    const Cm = [(P.x + pos[0]) / 2, (P.y + pos[1]) / 2];
    const R = LOOP_R / 2;
    const samples: number[][] = [];
    for (let t = 0; t < 32; t++) {
      const ang = (t / 32) * Math.PI * 2;
      samples.push([Cm[0] + Math.cos(ang) * R, Cm[1] + Math.sin(ang) * R]);
    }
    let ok = true;
    for (const s of samples) {
      if (s[0] < 14 || s[0] > SPR_W - 14 || s[1] < 14 || s[1] > SPR_H - 14) {
        ok = false;
        break;
      }
      const nearP = Math.hypot(s[0] - P.x, s[1] - P.y) < RMIN + 2;
      if (nearP) continue;
      for (let d = 0; d < state.dots.length; d++) {
        if (d === a) continue;
        if (Math.hypot(s[0] - state.dots[d].x, s[1] - state.dots[d].y) < GRAZE) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
    }
    if (!ok) continue;
    for (let t = 0; t < 32 && ok; t++) {
      const s1 = samples[t];
      const s2 = samples[(t + 1) % 32];
      if (Math.hypot(s1[0] - P.x, s1[1] - P.y) < RMIN + 2) continue;
      if (Math.hypot(s2[0] - P.x, s2[1] - P.y) < RMIN + 2) continue;
      for (const e of state.edges) {
        if (e.a === a || e.b === a) continue; // the loop wraps around its own lines
        const ep = edgeTestPoly(state, e);
        for (let k = 0; k + 1 < ep.length; k++) {
          if (segCross(s1, s2, ep[k], ep[k + 1])) {
            ok = false;
            break;
          }
        }
        if (!ok) break;
      }
    }
    if (!ok) continue;
    const poly = samples.concat([samples[0]]);
    return { err: null, poly, pos: [pos[0], pos[1]] };
  }
  return { err: 'That loop would cross existing lines.' };
}

export function sprCheck(state: SprState, a: number, b: number): SprCheckResult {
  const n = state.dots.length;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= n || b >= n) {
    return { err: 'Pick two dots on the board.' };
  }
  if (a === b) {
    if (sprFree(state, a) < 2)
      return { err: 'A loop needs two free line-ends — that dot has fewer.' };
    return sprLoopGeometry(state, a);
  }
  if (sprFree(state, a) < 1 || sprFree(state, b) < 1)
    return { err: 'That dot has no free line-end left.' };
  return sprEdgeGeometry(state, a, b);
}

/* ------------------------------ game flow ------------------------------ */

export interface SprLegalMove {
  a: number;
  b: number;
  poly: number[][];
  pos: [number, number];
}

export function sprAllMoves(state: SprState): SprLegalMove[] {
  const out: SprLegalMove[] = [];
  const n = state.dots.length;
  for (let a = 0; a < n; a++) {
    if (sprFree(state, a) < 1) continue;
    for (let b = a; b < n; b++) {
      if (b === a) {
        if (sprFree(state, a) < 2) continue;
      } else if (sprFree(state, b) < 1) continue;
      const chk = sprCheck(state, a, b);
      if (!chk.err && chk.poly && chk.pos) out.push({ a, b, poly: chk.poly, pos: chk.pos });
    }
  }
  return out;
}

export function sprValidateMove(state: SprState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { a?: unknown; b?: unknown } | null;
  if (!m || !Number.isInteger(m.a) || !Number.isInteger(m.b)) return 'Send { a, b }.';
  return sprCheck(state, m.a as number, m.b as number).err;
}

export function sprApplyMove(state: SprState, seat: number, move: unknown): SprState {
  const m = move as { a: number; b: number };
  const chk = sprCheck(state, m.a, m.b);
  if (chk.err || !chk.poly || !chk.pos)
    throw new Error('sprouts: illegal move in apply (' + chk.err + ')');
  const a = m.a;
  const b = m.b;
  const dots = state.dots.map((d, i) => ({
    ...d,
    deg: d.deg + (i === a ? 1 : 0) + (i === b ? 1 : 0),
  }));
  dots.push({ x: chk.pos[0], y: chk.pos[1], deg: 2 });
  const next: SprState = {
    ...state,
    dots,
    edges: state.edges.concat([{ a, b, poly: chk.poly }]),
    moves: state.moves.concat([{ seat, a, b }]),
    turn: (seat + 1) % state.seatCount,
  };
  if (sprAllMoves(next).length === 0) {
    next.phase = 'finished';
    next.winnerSeat = seat; // the last mover takes it
  }
  return next;
}

export function sprIsOver(state: SprState): boolean {
  return state.phase === 'finished';
}

export function sprWinner(state: SprState): number | null {
  return state.winnerSeat;
}

export function sprPlacement(state: SprState): SprPlacement[] {
  const last = new Array(state.seatCount).fill(-1);
  state.moves.forEach((m, i) => {
    last[m.seat] = i;
  });
  const order = Array.from({ length: state.seatCount }, (_, seat) => ({
    seat,
    last: last[seat] as number,
  }));
  order.sort((x, y) => y.last - x.last || x.seat - y.seat);
  return order.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

export function sprBotMove(
  state: SprState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): unknown {
  void seat;
  const all = sprAllMoves(state);
  if (all.length === 0) return { a: 0, b: 0 };
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  if (tier === 'easy') {
    const m = pick(all);
    return { a: m.a, b: m.b };
  }
  let cx = 0;
  let cy = 0;
  for (const d of state.dots) {
    cx += d.x;
    cy += d.y;
  }
  cx /= state.dots.length;
  cy /= state.dots.length;
  const scored = all.map((m) => {
    let killed = 0;
    const needA = m.a === m.b ? 2 : 1;
    if (sprFree(state, m.a) === needA) killed++;
    if (m.a !== m.b && sprFree(state, m.b) === 1) killed++;
    return { m, killed, dist: Math.hypot(m.pos[0] - cx, m.pos[1] - cy) };
  });
  if (tier === 'medium') {
    const best = Math.max(...scored.map((s) => s.killed));
    const m = pick(scored.filter((s) => s.killed === best)).m;
    return { a: m.a, b: m.b };
  }
  scored.sort((x, y) => y.killed - x.killed || x.dist - y.dist);
  const top = scored.filter(
    (s) => s.killed === scored[0].killed && Math.abs(s.dist - scored[0].dist) < 0.5
  );
  const m = pick(top).m;
  return { a: m.a, b: m.b };
}
