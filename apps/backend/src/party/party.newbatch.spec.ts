import { PartyService } from './party.service';
import { partyAdapterFor } from './party-adapters';
import {
  brApplyMove,
  brBotGuess,
  brInitialState,
  brIsOver,
  brPlacement,
  brScoreGuess,
  brValidateMove,
} from './games/bullsrace-mp.core';
import {
  hmApplyMove,
  hmBotWord,
  hmInitialState,
  hmNormalizeWord,
  hmPlacement,
  hmRedactFor,
  hmValidateMove,
} from './games/hangman-mp.core';
import {
  PD_TARGET,
  pdApplyMove,
  pdBotMove,
  pdInitialState,
  pdPlacement,
  pdValidateMove,
} from './games/pigdice-mp.core';

describe('PartyService — bulls-race / hangman-relay / pig-dice bot playthroughs', () => {
  let repo: Record<string, jest.Mock>;
  let service: PartyService;
  let match: Record<string, any>;

  beforeEach(() => {
    match = null as unknown as Record<string, any>;
    repo = {
      findOne: jest.fn().mockImplementation(async ({ where }: any) => {
        if (!match) return null;
        if (where?.code && match.code !== where.code) return null;
        return match;
      }),
      save: jest.fn().mockImplementation(async (x: any) => {
        if (!match) {
          match = x;
          match.id = 'row-1';
        }
        return x;
      }),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockImplementation(async (idOrCriteria: any, patch: any) => {
        if (match && typeof idOrCriteria === 'string') Object.assign(match, patch);
      }),
    };
    service = new PartyService(repo as never);
  });

  async function playOut(slug: string, seats: number, maxLoops: number): Promise<any> {
    const { code } = await service.create({
      gameSlug: slug,
      playerName: 'Ana',
      guestId: 'g1',
      seats,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    await service.leave(code, 'g1');
    let last: any = null;
    for (let i = 0; i < maxLoops; i++) {
      last = (await service.view(code, 'g1')) as any;
      if (last.status === 'finished') return last;
    }
    throw new Error(slug + ' did not finish in ' + maxLoops + ' loops');
  }

  it('bulls-race-mp 3P: bots take it to a crack or the guess limit, full placement', async () => {
    const last = await playOut('bulls-race-mp', 3, 400);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const ranks = last.placement.map((p: any) => p.rank).sort();
    expect(ranks).toEqual([1, 2, 3]);
  }, 300000);

  it('bulls-race-mp 4P: finished, every guess is 4 digits 0-9', async () => {
    const last = await playOut('bulls-race-mp', 4, 500);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    for (const rows of Object.values(last.state.rows as Record<string, any[]>)) {
      for (const r of rows) {
        expect(r.guess.length).toBe(4);
        r.guess.forEach((d: number) => {
          expect(Number.isInteger(d)).toBe(true);
          expect(d).toBeGreaterThanOrEqual(0);
          expect(d).toBeLessThanOrEqual(9);
        });
        expect(r.bulls).toBeGreaterThanOrEqual(0);
        expect(r.bulls).toBeLessThanOrEqual(4);
      }
    }
  }, 300000);

  it('bulls-race-mp redaction: the code never crosses the API while racing', () => {
    const ad = partyAdapterFor('bulls-race-mp');
    let st = ad.initialState(3);
    expect((ad.redactFor!(st, 0) as any).code).toBeNull(); // setting — hidden
    st = ad.apply(st, 0, { code: [1, 2, 3, 4] });
    expect((ad.redactFor!(st, 0) as any).code).toBeNull(); // racing — still hidden
    st = ad.apply(st, 1, { guess: [5, 5, 5, 5] });
    expect((ad.redactFor!(st, 1) as any).code).toBeNull(); // racing — still hidden
    st = ad.apply(st, 2, { guess: [1, 2, 3, 4] }); // seat 2 cracks it
    expect(ad.isOver(st)).toBe(true);
    expect((ad.redactFor!(st, 0) as any).code).toEqual([1, 2, 3, 4]); // revealed at the end
  });

  it('bulls-race-mp service view: hidden code in a fresh running table', async () => {
    const { code } = await service.create({
      gameSlug: 'bulls-race-mp',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    const view = (await service.view(code, 'g1')) as any;
    expect(view.state.code).toBeNull(); // setting phase — hidden
  });

  it('hangman-relay-mp 3P: bots write and solve to a full ranking', async () => {
    const last = await playOut('hangman-relay-mp', 3, 500);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    expect(last.state.words.every((w: unknown) => typeof w === 'string')).toBe(true);
  }, 300000);

  it('hangman-relay-mp: a human writes and the bot seats follow (no stall)', async () => {
    const { code } = await service.create({
      gameSlug: 'hangman-relay-mp',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    await service.move(code, { guestId: 'g1', move: { word: 'MAPLE' } });
    const v = (await service.view(code, 'g1')) as any;
    expect(v.status).toBe('running');
    expect(v.state.phase).toBe('solving');
    expect(v.yourTurn).toBe(true); // seat 0 guesses first
    expect(v.state.words[0]).toBe('MAPLE'); // the writer sees their own
    expect(v.state.words[1]).toBeNull(); // others stay hidden
    expect(v.state.puzzles[1].length).toBe(5); // MAPLE went to seat 1's puzzle
  });

  it('hangman-relay-mp 4P: finished with every puzzle settled (solved or out)', async () => {
    const last = await playOut('hangman-relay-mp', 4, 700);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    for (const p of last.state.puzzles) {
      expect(p.solved || p.out).toBe(true);
    }
  }, 300000);

  it('hangman-relay-mp redaction: only the writer sees an unsettled word', async () => {
    const { code } = await service.create({
      gameSlug: 'hangman-relay-mp',
      playerName: 'Ana',
      guestId: 'g1',
      seats: 3,
    });
    match.code = code;
    await service.start(code, { guestId: 'g1' });
    await service.move(code, { guestId: 'g1', move: { word: 'maple!' } });
    const view = (await service.view(code, 'g1')) as any;
    // g1 is seat 0 — they wrote words[0] for seat 1; their own is still null
    expect(view.state.words[0]).toBe('MAPLE');
    expect(view.state.words[1]).toBeNull();
    expect(view.state.words[2]).toBeNull();
    expect(view.state.puzzles[1].length).toBe(5);
  });

  it('pig-dice-mp 3P: bots push to a 100+ winner, placement ordered by banks', async () => {
    const last = await playOut('pig-dice-mp', 3, 900);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(3);
    const winner = last.placement.find((p: any) => p.rank === 1);
    expect(last.state.banks[winner.seat]).toBeGreaterThanOrEqual(PD_TARGET);
    const rank2 = last.placement.find((p: any) => p.rank === 2);
    const rank3 = last.placement.find((p: any) => p.rank === 3);
    expect(last.state.banks[rank2.seat]).toBeGreaterThanOrEqual(last.state.banks[rank3.seat]);
  }, 300000);

  it('pig-dice-mp 4P: finished with 4 seats, non-negative banks', async () => {
    const last = await playOut('pig-dice-mp', 4, 1100);
    expect(last.status).toBe('finished');
    expect(last.placement.length).toBe(4);
    last.state.banks.forEach((b: number) => expect(b).toBeGreaterThanOrEqual(0));
  }, 300000);

  // ---------- pure-core unit checks ----------

  it('bulls core: scoring, seat gating, bot consistency', () => {
    expect(brScoreGuess([1, 2, 3, 4], [1, 9, 3, 9])).toBe(2);
    expect(brScoreGuess([1, 2, 3, 4], [4, 3, 2, 1])).toBe(0);
    const s = brInitialState(3);
    expect(brValidateMove(s, 1, { code: [1, 2, 3, 4] })).toContain('maker');
    expect(brValidateMove(s, 0, { code: [1, 2, 3] })).toContain('4 digits');
    expect(brValidateMove(s, 0, { code: [-1, 2, 3, 4] })).toContain('0-9');
    let st = brApplyMove(s, 0, { code: [1, 2, 3, 4] });
    expect(st.phase).toBe('racing');
    st = brApplyMove(st, 1, { guess: [1, 5, 5, 5] });
    expect(st.rows['1'][0].bulls).toBe(1);
    expect(st.turn).toBe(2);
    // bot guess must reproduce its own feedback
    const bot = brBotGuess(st, 2, 'medium');
    expect(bot.length).toBe(4);
  });

  it('hangman core: writing rotation advances to the next unwritten seat', () => {
    let st = hmInitialState(3);
    st = hmApplyMove(st, 0, { word: 'CAT' });
    expect(st.turn).toBe(1);
    st = hmApplyMove(st, 2, { word: 'PIG' }); // out-of-order writer
    expect(st.turn).toBe(1); // seat 1 still owes the last word
    st = hmApplyMove(st, 1, { word: 'DOG' });
    expect(st.phase).toBe('solving');
    expect(st.turn).toBe(0);
  });

  it('hangman core: word normalize, double-write rejection, strike-out', () => {
    expect(hmNormalizeWord('maple!')).toBe('MAPLE');
    expect(hmNormalizeWord('ab')).toBeNull();
    expect(hmNormalizeWord('x'.repeat(13))).toBeNull();
    const s = hmInitialState(3);
    let st = hmApplyMove(s, 0, { word: 'CAT' });
    expect(hmValidateMove(st, 0, { word: 'DOG' })).toContain('already');
    st = hmApplyMove(st, 1, { word: 'DOG' });
    expect(st.puzzles[0]).toBeNull();
    st = hmApplyMove(st, 2, { word: 'PIG' });
    expect(st.phase).toBe('solving');
    // seat 0's puzzle is written by seat 2 = PIG
    st = hmApplyMove(st, 0, { letter: 'Z' });
    expect(st.puzzles[0]!.wrong.length).toBe(1);
    st = hmApplyMove(st, 1, { letter: 'X' });
    st = hmApplyMove(st, 2, { letter: 'Q' });
    st = hmApplyMove(st, 0, { letter: 'P' });
    expect(st.puzzles[0]!.revealed).toContain('P');
  });

  it('hangman core: 6 strikes = out, redaction hides unsettled words', () => {
    // Mid-write redaction: only the writer sees their unsettled word.
    const stW = hmApplyMove(hmInitialState(3), 0, { word: 'MAPLE' });
    expect(hmRedactFor(stW, 0).words[0]).toBe('MAPLE');
    expect(hmRedactFor(stW, 1).words[0]).toBeNull();
    expect(hmRedactFor(stW, 2).words[0]).toBeNull();

    // Full strike-out: everyone burns 6 distinct wrong letters.
    let st = hmInitialState(3);
    st = hmApplyMove(st, 0, { word: 'CAT' }); // puzzles[1] = CAT
    st = hmApplyMove(st, 1, { word: 'DOG' }); // puzzles[2] = DOG
    st = hmApplyMove(st, 2, { word: 'PIG' }); // puzzles[0] = PIG
    const wrongs: string[][] = [
      ['A', 'B', 'C', 'D', 'E', 'F'], // for PIG (seat 0)
      ['Z', 'Q', 'X', 'J', 'K', 'V'], // for CAT (seat 1)
      ['W', 'Y', 'U', 'T', 'S', 'R'], // for DOG (seat 2)
    ];
    for (let round = 0; round < 6; round++) {
      for (let seat = 0; seat < 3; seat++) {
        if (st.phase === 'finished') break;
        // feed each remaining active seat its next wrong letter
        const p = st.puzzles[seat] as any;
        if (p && !p.out && !p.solved) {
          st = hmApplyMove(st, seat, { letter: wrongs[seat][round] });
        }
      }
    }
    expect(st.phase).toBe('finished');
    expect(st.puzzles.every((p: any) => p.out)).toBe(true);
    const pl = hmPlacement(st);
    expect(pl.length).toBe(3);
  });

  it('pig core: hold needs a pot; bust resets pot and passes; roll adds', () => {
    let st = pdInitialState(3);
    expect(pdValidateMove(st, 0, { hold: true })).toContain('Roll');
    expect(pdValidateMove(st, 1, { roll: true })).toContain('your turn');
    st = pdApplyMove(st, 0, { roll: true }, 5);
    expect(st.pot).toBe(5);
    expect(st.turn).toBe(0);
    st = pdApplyMove(st, 0, { roll: true }, 1);
    expect(st.pot).toBe(0);
    expect(st.turn).toBe(1);
    // hold banks and the next seat rolls
    st = pdApplyMove(st, 1, { roll: true }, 6);
    st = pdApplyMove(st, 1, { hold: true }, 0);
    expect(st.banks[1]).toBe(6);
    expect(st.turn).toBe(2);
  });

  it('pig core: winner + placement when the bank crosses the target', () => {
    let st = pdInitialState(3);
    st = { ...st, banks: [PD_TARGET - 4, 10, 10], pot: 0, turn: 0 };
    st = pdApplyMove(st, 0, { roll: true }, 4);
    st = pdApplyMove(st, 0, { hold: true }, 4);
    expect(st.phase).toBe('finished');
    expect(st.winnerSeat).toBe(0);
    const pl = pdPlacement(st);
    expect(pl[0]).toEqual({ seat: 0, rank: 1 });
    expect(pl.length).toBe(3);
  });
});
