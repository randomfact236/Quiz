import {
  SIZES,
  DEFAULT_SIZE,
  edgeCount,
  boxCount,
  hIndex,
  vIndex,
  boxEdges,
  adjacentBoxes,
  boxOpenEdges,
  freeEdges,
  createState,
  drawEdge,
  isComplete,
  gameResult,
  boxesWithOpenEdges,
  findChains,
  easyMove,
  mediumMove,
  hardMove,
  aiMove,
} from '../../public/games/dots-and-boxes/core.js';

/**
 * plan/games/03 — the pure Dots and Boxes model: edge/box geometry, the
 * 4th-edge claim + extra turn, completion/results, chain detection and the
 * three AI tiers' legality. The mirror of the other games' core suites.
 */
describe('dots-and-boxes core', () => {
  const P1 = 1;
  const P2 = 2;

  it('ships 3x3, 4x4 and 5x5 boards with the right edge counts', () => {
    expect(SIZES).toEqual([3, 4, 5]);
    expect(DEFAULT_SIZE).toBe(4);
    expect(edgeCount(4)).toBe(40);
    expect(edgeCount(3)).toBe(24);
    expect(edgeCount(5)).toBe(60);
    expect(boxCount(4)).toBe(16);
  });

  it('maps box edges to the right indices (h top/bottom, v left/right)', () => {
    const n = 4;
    const box = 0; // r0 c0
    expect(boxEdges(n, box)).toEqual([
      hIndex(n, 0, 0), // top
      hIndex(n, 1, 0), // bottom
      vIndex(n, 0, 0), // left
      vIndex(n, 0, 1), // right
    ]);
    // a border edge touches exactly one box, an inner one two
    expect(adjacentBoxes(n, hIndex(n, 0, 0))).toEqual([0]);
    expect(adjacentBoxes(n, hIndex(n, 1, 1))).toEqual([1, 5]);
    expect(adjacentBoxes(n, vIndex(n, 1, 2))).toEqual([5, 6]);
  });

  it('draws an edge, claims the box on the 4th edge and grants the extra turn', () => {
    const state = createState(4);
    const [top, bottom, left, right] = boxEdges(4, 0);
    expect(boxOpenEdges(state, 0)).toBe(4);

    let r = drawEdge(state, top, P1);
    expect(r).toMatchObject({ ok: true, claimed: [], extraTurn: false, score: 0 });
    r = drawEdge(state, left, P2);
    expect(r.extraTurn).toBe(false);
    r = drawEdge(state, bottom, P1);
    expect(r.extraTurn).toBe(false);
    expect(boxOpenEdges(state, 0)).toBe(1);
    r = drawEdge(state, right, P1);
    expect(r.claimed).toEqual([0]);
    expect(r.extraTurn).toBe(true);
    expect(r.score).toBe(1);
    expect(state.owners[0]).toBe(P1);
    expect(state.scores).toEqual([1, 0]);
    expect(boxOpenEdges(state, 0)).toBe(0);
  });

  it('rejects an already-drawn edge', () => {
    const state = createState(3);
    const e = hIndex(3, 0, 0);
    expect(drawEdge(state, e, P1).ok).toBe(true);
    expect(drawEdge(state, e, P2).ok).toBe(false);
    expect(drawEdge(state, 999, P1).ok).toBe(false);
    expect(freeEdges(state)).not.toContain(e);
  });

  it('an inner edge can close two boxes at once (both to the same mover)', () => {
    const state = createState(4);
    // fill both neighbours of vertical edge v(1,1): boxes (1,0)=4 and (1,1)=5
    for (const box of [4, 5]) {
      for (const e of boxEdges(4, box)) {
        if (e !== vIndex(4, 1, 1)) drawEdge(state, e, P1);
      }
    }
    const r = drawEdge(state, vIndex(4, 1, 1), P1);
    expect(r.claimed.sort()).toEqual([4, 5]);
    expect(r.score).toBe(2);
    expect(state.scores).toEqual([2, 0]);
  });

  it('completes only when every edge is drawn, then scores the winner', () => {
    const state = createState(3);
    // P1 takes the top row of boxes, P2 the rest — a decided 3x3
    const fillBox = (box, mark) => {
      for (const e of boxEdges(3, box)) drawEdge(state, e, mark);
    };
    fillBox(0, P1); // edges 0,1,3,4
    fillBox(1, P1);
    fillBox(2, P1);
    fillBox(3, P2);
    fillBox(4, P2);
    fillBox(5, P2);
    fillBox(6, P1);
    fillBox(7, P1);
    fillBox(8, P1);
    expect(isComplete(state)).toBe(true);
    const res = gameResult(state);
    expect(res.scores).toEqual([6, 3]);
    expect(res.winner).toBe(P1);
  });

  it('reports a draw on equal scores (4x4, 8–8)', () => {
    const state = createState(4);
    const p1 = new Set([0, 1, 4, 5, 10, 11, 14, 15]);
    for (let box = 0; box < 16; box++) {
      const mark = p1.has(box) ? P1 : P2;
      for (const e of boxEdges(4, box)) drawEdge(state, e, mark);
    }
    const res = gameResult(state);
    expect(res.scores).toEqual([8, 8]);
    expect(res.winner).toBe(0);
  });

  it('finds chains of three-open-edge boxes (the classic handover)', () => {
    const state = createState(4);
    // a chain box has THREE OPEN edges → draw exactly ONE edge per box, and
    // connect the two boxes with a shared DRAWN edge (the top of box 1)
    drawEdge(state, boxEdges(4, 0)[0], P1); // box 0's top
    drawEdge(state, boxEdges(4, 1)[0], P1); // box 1's top — the bridge
    expect(boxesWithOpenEdges(state, 3).sort()).toEqual([0, 1]);
    const chains = findChains(state, 3);
    expect(chains.length).toBe(1);
    expect(chains[0].sort()).toEqual([0, 1]); // adjacent boxes form one chain
  });

  it('every AI tier returns a free edge and takes an available box', () => {
    const n = 4;
    // a free box has two drawn edges (two open) — every tier must complete it
    // (fresh board per tier: re-arming in place would open other boxes)
    const box = 5;
    const edges = boxEdges(n, box);
    for (const tier of ['easy', 'medium', 'hard']) {
      const state = createState(n);
      drawEdge(state, edges[0], P1);
      drawEdge(state, edges[1], P1);
      const move = aiMove(state, P2, tier);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(state.edges[move]).toBe(0);
      expect(edges).toContain(move); // it plays ON the free box
    }
  });

  it('medium avoids handing over a chain when a safe move exists', () => {
    const n = 4;
    const state = createState(n);
    // box 0 gets its top edge drawn → playing its bottom would make a chain
    // (3 open edges) — the handover. Plenty of other edges stay safe.
    const b0 = boxEdges(n, 0);
    drawEdge(state, b0[0], P1);
    const trap = b0[1];
    const move = mediumMove(state, P2);
    expect(state.edges[move]).toBe(0);
    expect(move).not.toBe(trap); // it does not open the chain for the opponent
  });

  it('hard AI takes the free box before anything else', () => {
    const n = 4;
    const state = createState(n);
    const box = 9;
    const edges = boxEdges(n, box);
    for (const e of edges.slice(0, 2)) drawEdge(state, e, P1); // two drawn → free
    const move = hardMove(state, P2);
    expect(edges).toContain(move);
  });
});
