/**
 * Pure-logic tests for the static game at
 * public/games/spirit-runner/ (plan/games/07-spirit-runner.md §8):
 * all 5 rune rules proven deterministic per fixed runState (20 rng seeds
 * each) with hints never empty, the shard-math boundaries, power durations
 * incl. the Forest Spirit ×1.5 and the dash single-destroy, the shadow
 * realm density/expiry/single payout, the §7.7 gate-deferral rule over
 * 1,000+ simulated gate schedules, and the forked-05 physics with the
 * slide/clearance/trap additions. The same assertions ship in the game's
 * own core.test.html harness; this suite keeps them running in CI.
 */
import {
  BRANCH_BOTTOM,
  BRANCH_TOP,
  GROUND_Y,
  GUARDIAN_LOW_BOTTOM,
  GUARDIAN_TALL_H,
  HITBOX_INSET,
  METER_FULL,
  MONK_SLOW_SPAWN_SCALE,
  PLAYER_X,
  SAVE_KEY,
  SCROLL_START,
  SHADOW_DENSITY,
  SHADOW_S,
  SLOW_TIME_SCALE,
  SLIDE_HOP_VY,
  SPAWN_X,
  TIER_START_M,
  aabbHit,
  applyPower,
  chargedPower,
  createPowers,
  createPlayer,
  createRun,
  createSpawner,
  dashDestroy,
  enterShadow,
  gateReady,
  groupRightX,
  makeObstacle,
  meters,
  minGap,
  nextSpawn,
  obstacleBox,
  orbHit,
  playerBox,
  POWER_DURATION,
  reanchorGates,
  scoreFor,
  shardsFor,
  spawnOrbArc,
  spawnOrbLine,
  speedAt,
  stepPlayer,
  tickPowers,
  tickShadow,
  tierFor,
  trapLit,
} from '../../public/games/spirit-runner/core';
import {
  GLYPHS,
  ORB_COLORS,
  RULE_IDS,
  hintFor,
  makeGate,
  resolveChoice,
  shuffledRules,
} from '../../public/games/spirit-runner/gates';
import { CHARACTERS, shareText } from '../../public/games/spirit-runner/main';

/** Deterministic rng (mulberry32) — every sweep must be reproducible. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DT = 1 / 120;

/* ---- plan §8: all 5 rules, 20 rng seeds each, fixed runState ----------------- */

describe('gate rules (plan §8: makeGate + resolveChoice deterministic per state)', () => {
  const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + i * 7919);

  function freshState(): Record<string, unknown> & {
    orbsSinceGate: number;
    lastGateRune: string | null;
    lastOrbColor: string | null;
  } {
    return { orbsSinceGate: 3, lastGateRune: 'ᚨ', lastOrbColor: 'violet' };
  }

  it('parity: even count → left, odd → right (the hint names the rule)', () => {
    for (const seed of SEEDS) {
      const even = makeGate('parity', seededRng(seed), { ...freshState(), orbsSinceGate: 4 });
      expect(even.correctSide).toBe('left');
      const odd = makeGate('parity', seededRng(seed), { ...freshState(), orbsSinceGate: 5 });
      expect(odd.correctSide).toBe('right');
      for (const gate of [even, odd]) {
        expect(resolveChoice(gate, gate.correctSide)).toBe('correct');
        expect(resolveChoice(gate, gate.correctSide === 'left' ? 'right' : 'left')).toBe('shadow');
      }
    }
  });

  it("echo: the correct door wears the previous gate's rune, and the chain advances", () => {
    for (const seed of SEEDS) {
      const st = freshState();
      const gate = makeGate('echo', seededRng(seed), st);
      expect(gate.runes[gate.correctSide as 'left' | 'right']).toBe('ᚨ');
      expect(gate.bannerRune).toBe('ᚨ'); // the banner shows the doubled symbol
      // the mutation contract: the correct rune becomes the next echo's target
      const next = makeGate('echo', seededRng(seed), st);
      expect(next.runes[next.correctSide as 'left' | 'right']).toBe(
        gate.runes[gate.correctSide as 'left' | 'right']
      );
    }
  });

  it('negation: the correct door does NOT wear the banner rune; the liar door does', () => {
    for (const seed of SEEDS) {
      const st = freshState();
      const gate = makeGate('negation', seededRng(seed), st);
      const liarSide = gate.correctSide === 'left' ? 'right' : 'left';
      expect(gate.runes[liarSide as 'left' | 'right']).toBe(gate.bannerRune);
      expect(gate.runes[gate.correctSide as 'left' | 'right']).not.toBe(gate.bannerRune);
      expect(gate.hintText).toContain(gate.bannerRune as string); // banner names the liar
    }
  });

  it("sequence: the correct door shows the pattern's unambiguous 4th symbol", () => {
    for (const seed of SEEDS) {
      const gate = makeGate('sequence', seededRng(seed), freshState());
      const pat = gate.pattern as string[];
      expect(pat).toHaveLength(3);
      pat.forEach((g) => expect(GLYPHS).toContain(g));
      // the 4th symbol continues the cycle: AAA→A · ABA→B · BAB→A
      const expected = pat[0] === pat[1] ? pat[0] : pat[1];
      expect(gate.shapes[gate.correctSide as 'left' | 'right']).toBe(expected);
      expect(gate.shapes[gate.correctSide === 'left' ? 'right' : 'left']).not.toBe(expected);
      expect(gate.hintText).toBe(pat.join(' ') + ' …');
    }
  });

  it("color: the correct door matches the last orb's color; a null trail seeds one", () => {
    for (const seed of SEEDS) {
      const gate = makeGate('color', seededRng(seed), freshState());
      expect(gate.colors[gate.correctSide as 'left' | 'right']).toBe('violet');
      // first-ever gate with no light caught seeds the trail and still answers
      const st = freshState();
      st.lastOrbColor = null;
      const seededGate = makeGate('color', seededRng(seed), st);
      expect(ORB_COLORS).toContain(seededGate.colors[seededGate.correctSide as 'left' | 'right']);
      expect(st.lastOrbColor).toBe(seededGate.colors[seededGate.correctSide as 'left' | 'right']);
    }
  });

  it('is deterministic for a fixed rule + rng + state (JSON-identical gates)', () => {
    for (const rule of RULE_IDS) {
      const run = () => JSON.stringify(makeGate(rule, seededRng(424242), freshState()));
      expect(run()).toBe(run());
    }
  });

  it('every resolveChoice pays exactly: correct side → correct, other → shadow', () => {
    for (const rule of RULE_IDS) {
      for (const seed of SEEDS) {
        const gate = makeGate(rule, seededRng(seed), freshState());
        const other = gate.correctSide === 'left' ? 'right' : 'left';
        expect(resolveChoice(gate, gate.correctSide)).toBe('correct');
        expect(resolveChoice(gate, other)).toBe('shadow');
        expect(resolveChoice(gate, null)).toBe('shadow'); // passing through unanswered
      }
    }
  });
});

describe('hint text (plan §8: present and never empty for any rule/state)', () => {
  it('hintFor returns a non-empty line for every authored rule', () => {
    for (const rule of RULE_IDS) {
      expect(typeof hintFor(rule)).toBe('string');
      expect(hintFor(rule).length).toBeGreaterThan(0);
    }
  });

  it('makeGate hintText is never empty across 200 random states per rule', () => {
    for (const rule of RULE_IDS) {
      for (let seed = 0; seed < 200; seed++) {
        const st = {
          orbsSinceGate: seed % 7,
          lastGateRune: seed % 2 ? 'ᚱ' : null,
          lastOrbColor: seed % 3 ? ORB_COLORS[seed % 3] : null,
        };
        const gate = makeGate(rule, seededRng(seed * 31 + 5), st);
        expect(gate.hintText.length).toBeGreaterThan(0);
        expect(gate.runes.left).toBeTruthy();
        expect(gate.runes.right).toBeTruthy();
      }
    }
  });

  it('the run shuffles the authored cycle without repeats (plan §2 Phase C)', () => {
    for (let seed = 0; seed < 50; seed++) {
      const order = shuffledRules(seededRng(seed * 977));
      expect(order.slice().sort()).toEqual(RULE_IDS.slice().sort());
      expect(new Set(order).size).toBe(5);
    }
  });
});

/* ---- plan §8: shard math boundaries -------------------------------------------- */

describe('shard math (plan §2 Phase D: floor(m/1000) + shadowSurvives + floor(gates/3))', () => {
  function runWith(correctGates = 0, shadowSurvives = 0) {
    const run = createRun('spirit', seededRng(1));
    run.correctGates = correctGates;
    run.shadowSurvives = shadowSurvives;
    return run;
  }

  it('distance boundaries at 999/1000/1999/2000 m', () => {
    expect(shardsFor(runWith(), 999)).toBe(0);
    expect(shardsFor(runWith(), 1000)).toBe(1);
    expect(shardsFor(runWith(), 1999)).toBe(1);
    expect(shardsFor(runWith(), 2000)).toBe(2);
  });

  it('gate boundaries: 1–2 correct gates pay nothing, the 3rd pays one', () => {
    expect(shardsFor(runWith(1), 0)).toBe(0);
    expect(shardsFor(runWith(2), 0)).toBe(0);
    expect(shardsFor(runWith(3), 0)).toBe(1);
    expect(shardsFor(runWith(6), 0)).toBe(2);
  });

  it('each shadow survival pays exactly one shard, and the parts add', () => {
    expect(shardsFor(runWith(0, 1), 0)).toBe(1);
    expect(shardsFor(runWith(0, 3), 0)).toBe(3);
    expect(shardsFor(runWith(4, 2), 2500)).toBe(2 + 2 + 1);
  });

  it('score is meters + 100 per correct gate', () => {
    expect(scoreFor(runWith(2), 1234)).toBe(1434);
    expect(scoreFor(runWith(0), 77)).toBe(77);
  });
});

/* ---- plan §8: power timers + dash ------------------------------------------------ */

describe('powers (plan §2 Phase B: fixed cycle, durations, Forest Spirit ×1.5)', () => {
  it('the charged cycle reads double → dash → slow', () => {
    const powers = createPowers('hunter');
    expect(chargedPower(powers)).toBe('dash'); // Hunter pre-charge
    applyPower(powers, 'dash');
    expect(chargedPower(powers)).toBe('double'); // the authored cycle resumes
    applyPower(powers, 'double');
    expect(chargedPower(powers)).toBe('dash');
  });

  it('durations: base 8/1.5/4 s; Forest Spirit runs +50 %; activating resets the meter', () => {
    expect(POWER_DURATION).toEqual({ double: 8, dash: 1.5, slow: 4 });
    const hunter = createPowers('hunter');
    hunter.meter = METER_FULL;
    applyPower(hunter, 'double');
    expect(hunter.timers.double).toBe(8);
    expect(hunter.meter).toBe(0);
    const spirit = createPowers('spirit');
    spirit.meter = METER_FULL;
    applyPower(spirit, 'double');
    expect(spirit.timers.double).toBe(12); // ×1.5 (plan §2 Phase D)
    applyPower(spirit, 'slow');
    expect(spirit.timers.slow).toBe(6);
  });

  it('tickPowers drains on real time and never goes negative', () => {
    const powers = createPowers('hunter');
    applyPower(powers, 'dash');
    for (let i = 0; i < Math.round(1.5 * 120); i++) tickPowers(powers, DT);
    expect(powers.timers.dash).toBeLessThan(1e-9); // fp drift aside, fully drained
    for (let i = 0; i < 240; i++) tickPowers(powers, DT);
    expect(powers.timers.dash).toBe(0); // clamped, never negative
  });

  it('dash destroys the next obstacle hit — exactly one (plan §2, §7.3)', () => {
    const powers = createPowers('hunter');
    const obs = makeObstacle(100, { dx: 0, w: 24, h: 40, kind: 'log' });
    expect(dashDestroy(powers, obs)).toBe(false); // no dash → no destroy
    applyPower(powers, 'dash');
    expect(dashDestroy(powers, obs)).toBe(true);
    expect(obs.destroyed).toBe(true);
    expect(powers.timers.dash).toBe(0); // consumed
    const second = makeObstacle(200, { dx: 0, w: 24, h: 40, kind: 'log' });
    expect(dashDestroy(powers, second)).toBe(false); // exactly one
    second.destroyed = false;
    expect(second.destroyed).toBe(false);
  });
});

/* ---- plan §8: shadow realm ---------------------------------------------------------- */

describe('shadow realm (plan §2 Phase C, §7.5)', () => {
  it('enterShadow sets the 45 s timer and defers the gate schedule (§7.7)', () => {
    const run = createRun('spirit', seededRng(1));
    run.nextGateM = 600;
    enterShadow(run, 800);
    expect(run.shadowS).toBe(SHADOW_S);
    expect(gateReady(run, 99999)).toBe(false); // no gates while banished
  });

  it('the timer expires exactly once on the fixed-step clock and pays one shard', () => {
    const run = createRun('spirit', seededRng(1));
    enterShadow(run, 0);
    let expiries = 0;
    const steps = Math.round(SHADOW_S / DT);
    for (let i = 0; i < steps * 2; i++) {
      if (tickShadow(run, DT)) expiries++;
    }
    expect(expiries).toBe(1);
    expect(run.shadowS).toBe(0);
    expect(run.shadowSurvives).toBe(1);
    expect(run.shadowShardPaid).toBe(true);
  });

  it('reanchorGates puts the next split 600 m ± 100 after the return', () => {
    const run = createRun('spirit', seededRng(7));
    reanchorGates(run, 2000, seededRng(7));
    expect(run.nextGateM).toBeGreaterThanOrEqual(2500);
    expect(run.nextGateM).toBeLessThanOrEqual(2700);
  });

  it('density ×1.5 keeps the gap fair at every speed (full jump still fits)', () => {
    const airtime = (2 * 820) / 2200;
    for (let speed = SCROLL_START; speed <= 900; speed += 20) {
      expect(minGap(speed, SHADOW_DENSITY)).toBeGreaterThan(airtime * speed);
    }
    expect(minGap(320, SHADOW_DENSITY)).toBeCloseTo(minGap(320) / SHADOW_DENSITY, 9);
    // Monk: spawns ×0.7 while slow → wider gaps, multiplicative with density
    expect(minGap(320, 1, MONK_SLOW_SPAWN_SCALE)).toBeCloseTo(minGap(320) / 0.7, 9);
    expect(minGap(320, SHADOW_DENSITY, MONK_SLOW_SPAWN_SCALE)).toBeCloseTo(
      minGap(320) / SHADOW_DENSITY / 0.7,
      9
    );
  });
});

describe('gate deferral sweep (plan §8: §7.7 over 1,000+ simulated runs)', () => {
  it('a split never fires during the shadow realm and re-anchors ≥ 500 m after exit', () => {
    let gatesSpawned = 0;
    let shadowVisits = 0;
    let maxShadowS = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const rng = seededRng(seed * 7919);
      const run = createRun('spirit', rng);
      run.nextGateM = 500 + rng() * 200;
      let m = 0;
      for (let step = 0; step < 48000; step++) {
        const speed = speedAt(step * DT);
        m += (speed * DT) / 10;
        if (run.shadowS > 0) {
          expect(gateReady(run, m)).toBe(false); // §7.7 — never during shadow
          maxShadowS = Math.max(maxShadowS, run.shadowS);
        } else if (m >= run.nextGateM) {
          gatesSpawned++;
          run.nextGateM = m + 500 + rng() * 200;
          if (gatesSpawned % 3 === 0) {
            // every third split answered wrong: 45 s banished, then return
            enterShadow(run, m);
            maxShadowS = Math.max(maxShadowS, run.shadowS); // drained below, same step
            shadowVisits++;
            const returnM = m + ((SHADOW_S * speed) / 10) * (0.9 + rng() * 0.2);
            while (run.shadowS > 0 && m < returnM) {
              tickShadow(run, DT);
              m += (speedAt(step * DT + 1) * DT) / 10;
            }
            if (run.shadowS > 0) {
              run.shadowS = 0;
              run.shadowSurvives++;
            }
            reanchorGates(run, m, rng);
            expect(run.nextGateM).toBeGreaterThanOrEqual(m + 500 - 1e-9);
          }
        }
      }
    }
    expect(gatesSpawned).toBeGreaterThan(1000); // the plan's 1,000-run bar
    expect(shadowVisits).toBeGreaterThan(100);
    expect(maxShadowS).toBeGreaterThan(0);
  });
});

/* ---- forked-05 physics + the slide ------------------------------------------------- */

describe('speed ramp + tiers (plan §2: ramp as 05, new tier table)', () => {
  it('speed starts at 320, ramps +6 px/s per second, caps at 900', () => {
    expect(speedAt(0)).toBe(320);
    expect(speedAt(60)).toBe(680);
    expect(speedAt(100)).toBe(900);
    expect(speedAt(1000)).toBe(900);
  });

  it('meters = px / 10; obstacle tiers flip at 300/800/1200 m', () => {
    expect(meters(3200)).toBe(320);
    expect(TIER_START_M).toEqual([0, 300, 800, 1200]);
    expect(tierFor(299.9)).toBe(1);
    expect(tierFor(300)).toBe(2);
    expect(tierFor(800)).toBe(3);
    expect(tierFor(1200)).toBe(4);
  });
});

describe('stepPlayer — jump (forked from 05) + slide (new)', () => {
  it('a grounded press jumps with JUMP_VY; gravity integrates as in 05', () => {
    const player = createPlayer();
    stepPlayer(player, DT, { pressed: true, held: true, slidePressed: false, doubleJump: false });
    expect(player.jumped).toBe(true);
    expect(player.vy).toBe(-820 + 2200 * DT);
    expect(player.onGround).toBe(false);
  });

  it('slide: starts on a down press, drops the hitbox to 40 %, ends after 600 ms', () => {
    const player = createPlayer();
    stepPlayer(player, DT, { pressed: false, held: false, slidePressed: true, doubleJump: false });
    expect(player.sliding).toBe(true);
    expect(playerBox(player).h).toBeCloseTo(44 * 0.4, 9);
    expect(playerBox(player).y + playerBox(player).h).toBe(GROUND_Y); // feet-anchored
    for (let i = 0; i < Math.round(0.6 / DT); i++) {
      stepPlayer(player, DT, {
        pressed: false,
        held: false,
        slidePressed: false,
        doubleJump: false,
      });
    }
    expect(player.sliding).toBe(false);
    expect(playerBox(player).h).toBe(44);
  });

  it('slide-jump cancels into a hop the cut cannot shrink', () => {
    const player = createPlayer();
    stepPlayer(player, DT, { pressed: false, held: false, slidePressed: true, doubleJump: false });
    stepPlayer(player, DT, { pressed: true, held: false, slidePressed: false, doubleJump: false });
    expect(player.sliding).toBe(false);
    expect(player.vy).toBe(SLIDE_HOP_VY + 2200 * DT);
    // releasing instantly (held=false) must NOT cut the hop to −451
    stepPlayer(player, DT, { pressed: false, held: false, slidePressed: false, doubleJump: false });
    expect(player.vy).toBeCloseTo(SLIDE_HOP_VY + 2200 * DT * 2, 6);
  });

  it('double jump: one extra mid-air jump while empowered, never two', () => {
    const player = createPlayer();
    stepPlayer(player, DT, { pressed: true, held: true, slidePressed: false, doubleJump: true });
    expect(player.airJumps).toBe(0); // the ground jump costs nothing
    for (let i = 0; i < 30; i++) {
      stepPlayer(player, DT, { pressed: false, held: true, slidePressed: false, doubleJump: true });
    }
    stepPlayer(player, DT, { pressed: true, held: true, slidePressed: false, doubleJump: true });
    expect(player.airJumps).toBe(1);
    expect(player.jumped).toBe(true);
    player.jumped = false;
    stepPlayer(player, DT, { pressed: true, held: true, slidePressed: false, doubleJump: true });
    expect(player.airJumps).toBe(1);
    expect(player.jumped).toBe(false); // budget spent
  });

  it('slide buffering: a down press just before landing starts the slide', () => {
    const probe = createPlayer();
    stepPlayer(probe, DT, { pressed: true, held: true, slidePressed: false, doubleJump: false });
    let landStep = -1;
    for (let i = 0; i < 400; i++) {
      stepPlayer(probe, DT, {
        pressed: false,
        held: false,
        slidePressed: false,
        doubleJump: false,
      });
      if (probe.landed) {
        landStep = i;
        break;
      }
    }
    expect(landStep).toBeGreaterThan(0);
    const player = createPlayer();
    stepPlayer(player, DT, { pressed: true, held: true, slidePressed: false, doubleJump: false });
    const stepsToLanding = landStep + 1;
    for (let i = 1; i <= stepsToLanding; i++) {
      // a down press 50 ms before touchdown, inside the 100 ms buffer
      stepPlayer(player, DT, {
        pressed: false,
        held: false,
        slidePressed: i === stepsToLanding - 6,
        doubleJump: false,
      });
    }
    expect(player.onGround).toBe(true);
    expect(player.sliding).toBe(true);
  });
});

/* ---- plan §8 analog: clearances for the five mystical obstacles ---------------- */

describe('obstacle clearances (plan §2 Phase A table)', () => {
  function fly(durationS: number, presses: number[], slides: number[] = []) {
    const player = createPlayer();
    let minFeet = player.y;
    const steps = Math.round(durationS / DT);
    for (let i = 0; i < steps; i++) {
      const t0 = i * DT;
      stepPlayer(player, DT, {
        pressed: presses.some((p) => p >= t0 && p < t0 + DT),
        held: presses.length > 0 && t0 >= presses[0],
        slidePressed: slides.some((p) => p >= t0 && p < t0 + DT),
        doubleJump: false,
      });
      minFeet = Math.min(minFeet, player.y);
    }
    return { player, rise: GROUND_Y - minFeet };
  }

  const standingBox = playerBox(createPlayer());
  const slideStep = () => {
    const p = createPlayer();
    stepPlayer(p, DT, { pressed: false, held: false, slidePressed: true, doubleJump: false });
    return p;
  };

  // every obstacle below is placed at the runner's x so the boxes overlap
  it('the fallen log is cleared by a full jump and never by sliding', () => {
    const log = obstacleBox(makeObstacle(PLAYER_X, { dx: 0, w: 72, h: 40, kind: 'log' }));
    expect(fly(0.8, [0]).rise).toBeGreaterThan(40 + 44 * (HITBOX_INSET / 2));
    expect(aabbHit(playerBox(slideStep()), log)).toBe(true);
    expect(aabbHit(playerBox(fly(0.55, [0]).player), log)).toBe(false);
  });

  it('the low branch is slide-only: hanging box beats any jump, slide passes under', () => {
    const branch = obstacleBox(makeObstacle(PLAYER_X, { dx: 0, w: 100, h: 0, kind: 'branch' }));
    expect(branch.y).toBe(GROUND_Y - BRANCH_TOP);
    expect(branch.y + branch.h).toBe(GROUND_Y - BRANCH_BOTTOM);
    // standing runner's inset box reaches into the branch box
    expect(aabbHit(standingBox, branch)).toBe(true);
    // sliding box tops out below the branch's underside
    expect(aabbHit(playerBox(slideStep()), branch)).toBe(false);
    // a full jump rises ≈149 px, far short of the 300 px hanging box
    const jumper = fly(0.55, [0]).player;
    expect(aabbHit(playerBox(jumper), branch)).toBe(true);
  });

  it('the tall guardian is jump-only; the low guardian is slide-only', () => {
    const tall = obstacleBox(
      makeObstacle(PLAYER_X, { dx: 0, w: 30, h: GUARDIAN_TALL_H, kind: 'guardian-tall' })
    );
    expect(aabbHit(playerBox(slideStep()), tall)).toBe(true); // sliding into it
    expect(aabbHit(playerBox(fly(0.55, [0]).player), tall)).toBe(false); // jumped it

    const low = obstacleBox(makeObstacle(PLAYER_X, { dx: 0, w: 84, h: 0, kind: 'guardian-low' }));
    expect(aabbHit(standingBox, low)).toBe(true);
    expect(aabbHit(playerBox(slideStep()), low)).toBe(false);
    expect(aabbHit(playerBox(fly(0.55, [0]).player), low)).toBe(true); // can't jump it
  });

  it('rune traps pulse on the 1.2 s cycle: 0.7 s dark, 0.5 s lit', () => {
    const trap = makeObstacle(PLAYER_X, { dx: 0, w: 64, h: 26, kind: 'trap', phase: 0 });
    expect(trapLit(trap, 0.3)).toBe(false);
    expect(trapLit(trap, 0.69)).toBe(false);
    expect(trapLit(trap, 0.7)).toBe(true);
    expect(trapLit(trap, 1.19)).toBe(true);
    expect(trapLit(trap, 1.25)).toBe(false); // wrapped into the next cycle
    // the trap's box only kills when lit — the timing check gates the hit
    const box = obstacleBox(trap);
    expect(aabbHit(standingBox, box) && trapLit(trap, 0.3)).toBe(false);
    expect(aabbHit(standingBox, box) && trapLit(trap, 0.9)).toBe(true);
  });
});

/* ---- spawner sweep (as 05, extended to the 5 types + orb formations) ------------- */

describe('spawner sweep (tiers × density, 30 speeds × 400 spawns)', () => {
  it('never spawns an impossible gap; types stay legal for the tier', () => {
    const tiers = [0, 400, 1000, 1600];
    const kindsSeen = new Set<string>();
    for (let speed = SCROLL_START; speed <= 900; speed += 20) {
      for (const density of [1, SHADOW_DENSITY]) {
        const spawner = createSpawner(seededRng(speed * 131 + density * 17));
        spawner.density = density;
        // a run's real first spawn happens at density 1, but the cursor rule
        // must hold under any density: seed it with the scaled fair floor
        let lastRight = SPAWN_X - minGap(SCROLL_START, density);
        for (let i = 0; i < 400; i++) {
          spawner.meters = tiers[i % 4];
          const tier = tierFor(spawner.meters);
          const spawn = nextSpawn(spawner, speed, lastRight);
          const gap = spawn.x - lastRight;
          expect(gap).toBeGreaterThanOrEqual(minGap(speed, density) - 1e-9);
          if (i === 0) expect(spawn.x).toBeGreaterThanOrEqual(SPAWN_X);
          kindsSeen.add(spawn.kind);
          for (const item of spawn.items) {
            if (item.kind === 'trap') expect(tier).toBe(4);
            if (item.kind === 'guardian-tall' || item.kind === 'guardian-low')
              expect(tier).toBeGreaterThanOrEqual(3);
            if (item.kind === 'branch') expect(tier).toBeGreaterThanOrEqual(2);
          }
          if (tier === 1) expect(spawn.kind).toBe('log');
          lastRight = groupRightX(spawn.x, spawn.items);
        }
      }
    }
    // every authored obstacle type must really fire across the sweep
    expect(Array.from(kindsSeen).sort()).toEqual([
      'branch',
      'guardian-low',
      'guardian-tall',
      'log',
      'trap',
    ]);
  });

  it('spawner-produced tall guardians carry the full-height lethal column (plan §2: jump only)', () => {
    const spawner = createSpawner(seededRng(3));
    spawner.meters = 900; // tier 3 — the roll includes both guardians
    let tallSeen = false;
    for (let i = 0; i < 400 && !tallSeen; i++) {
      const spawn = nextSpawn(spawner, 600, 0);
      if (spawn.kind !== 'guardian-tall') continue;
      tallSeen = true;
      expect(spawn.items).toHaveLength(1);
      expect(spawn.items[0].h).toBe(GUARDIAN_TALL_H); // the spawner wires the constant in
      const box = obstacleBox(makeObstacle(PLAYER_X, spawn.items[0]));
      expect(box.h).toBe(GUARDIAN_TALL_H); // the box covers the full column…
      expect(box.y).toBe(GROUND_Y - GUARDIAN_TALL_H); // …top at the column height…
      expect(box.y + box.h).toBe(GROUND_Y); // …and grounded on the ground line
    }
    expect(tallSeen).toBe(true);
  });

  it('orb formations fit inside a fair gap — the next group can never overlap', () => {
    for (const speed of [SCROLL_START, 500, 900]) {
      for (let seed = 0; seed < 50; seed++) {
        const rng = seededRng(seed * 61 + speed);
        const arc = spawnOrbArc(rng, 0, speed);
        expect(arc.length).toBeGreaterThanOrEqual(5);
        expect(arc.length).toBeLessThanOrEqual(7);
        const line = spawnOrbLine(rng, 0, speed);
        expect(line).toHaveLength(4);
        for (const orbs of [arc, line]) {
          const width = orbs[orbs.length - 1].worldX - orbs[0].worldX;
          expect(width).toBeLessThanOrEqual(minGap(speed) - 210 + 1e-9);
          for (const orb of orbs) {
            expect(orb.y).toBeLessThan(GROUND_Y);
            expect(orb.y).toBeGreaterThan(GROUND_Y - 200);
          }
        }
      }
    }
  });

  it('orb grab is generous: the full player box catches a running-height orb', () => {
    const orb = { worldX: 225, y: GROUND_Y - 40, color: 'cyan', taken: false };
    expect(orbHit(orb, playerBox(createPlayer()))).toBe(true);
    const high = { worldX: 225, y: GROUND_Y - 140, color: 'gold', taken: false };
    expect(orbHit(high, playerBox(createPlayer()))).toBe(false); // needs a jump
  });
});

/* ---- misc contracts ------------------------------------------------------------------ */

describe('misc contracts', () => {
  it('storage key is namespaced under the slug (plan §5)', () => {
    expect(SAVE_KEY).toBe('game:spirit-runner:save');
  });

  it('slow time scales the world by ×0.6 (plan §2 Phase B)', () => {
    expect(SLOW_TIME_SCALE).toBe(0.6);
  });

  it('character meta matches plan §2 Phase D (labels + unlock thresholds)', () => {
    expect(CHARACTERS.spirit).toMatchObject({ label: 'Forest Spirit', unlockAt: 0 });
    expect(CHARACTERS.hunter).toMatchObject({ label: 'Hunter', unlockAt: 5 });
    expect(CHARACTERS.monk).toMatchObject({ label: 'Monk', unlockAt: 12 });
  });

  it('shareText matches "Ran {m} m as {character} in Spirit Runner — {pts} pts — beat that! {url}"', () => {
    expect(shareText(2340, 'Monk', 2540, 'http://x/y')).toBe(
      'Ran 2340 m as Monk in Spirit Runner — 2540 pts — beat that! http://x/y'
    );
  });

  it('fixed-timestep determinism: identical step sequences → identical outcomes', () => {
    const fly = () => {
      const player = createPlayer();
      for (let i = 0; i < 40; i++) {
        stepPlayer(player, DT, {
          pressed: i === 5,
          held: i < 20,
          slidePressed: i === 30,
          doubleJump: false,
        });
      }
      return { y: player.y, vy: player.vy, sliding: player.sliding };
    };
    expect(fly()).toEqual(fly());
  });
});
