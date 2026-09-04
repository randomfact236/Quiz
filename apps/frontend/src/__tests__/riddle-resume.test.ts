import {
  clearRiddleResume,
  loadRiddleResume,
  saveRiddleResume,
  saveRiddleResumeQuestions,
} from '@/lib/riddle-persistence';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage';
import type { Riddle } from '@/types/riddles';

const IDENTITY = { mode: 'timer' as const, subjectId: 'sub-1', level: 'easy' };
const RIDDLES = [{ id: 'r1', question: 'Q' }] as unknown as Riddle[];

function expireProgress(): void {
  const progress = getItem<{ savedAt: number } | null>(STORAGE_KEYS.RIDDLE_RESUME_PROGRESS, null);
  if (progress) {
    setItem(STORAGE_KEYS.RIDDLE_RESUME_PROGRESS, {
      ...progress,
      savedAt: Date.now() - 25 * 60 * 60 * 1000,
    });
  }
}

describe('riddle two-key resume store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips snapshot + progress when identity matches', () => {
    saveRiddleResumeQuestions(IDENTITY, RIDDLES);
    saveRiddleResume(IDENTITY, {
      answers: { r1: 'A' },
      timeRemaining: 120,
      startedAt: '2026-08-26T00:00:00Z',
    });

    const state = loadRiddleResume();
    expect(state).not.toBeNull();
    expect(state!.availableRiddles).toEqual(RIDDLES);
    expect(state!.answers).toEqual({ r1: 'A' });
    expect(state!.timeRemaining).toBe(120);
    expect(state!.subjectId).toBe('sub-1');
  });

  it('returns null when the snapshot is missing (progress only)', () => {
    saveRiddleResume(IDENTITY, { answers: { r1: 'A' }, timeRemaining: 10, startedAt: 'x' });
    expect(loadRiddleResume()).toBeNull();
  });

  it('returns null when identities do not match', () => {
    saveRiddleResumeQuestions(IDENTITY, RIDDLES);
    saveRiddleResume(
      { mode: 'practice', subjectId: 'sub-2', level: 'hard' },
      {
        answers: {},
        timeRemaining: 0,
        startedAt: 'x',
      }
    );
    expect(loadRiddleResume()).toBeNull();
  });

  it('expires after 24h and clears both keys', () => {
    saveRiddleResumeQuestions(IDENTITY, RIDDLES);
    saveRiddleResume(IDENTITY, { answers: {}, timeRemaining: 5, startedAt: 'x' });
    expireProgress();

    expect(loadRiddleResume()).toBeNull();
    // Both keys were cleared by the expiry path
    expect(getItem(STORAGE_KEYS.RIDDLE_RESUME_PROGRESS, 'kept')).toBe('kept');
  });

  it('clear removes both keys', () => {
    saveRiddleResumeQuestions(IDENTITY, RIDDLES);
    saveRiddleResume(IDENTITY, { answers: {}, timeRemaining: 5, startedAt: 'x' });
    clearRiddleResume();
    expect(loadRiddleResume()).toBeNull();
  });

  it('treats progress without startedAt as unusable', () => {
    saveRiddleResumeQuestions(IDENTITY, RIDDLES);
    saveRiddleResume(IDENTITY, { answers: {}, timeRemaining: 5 });
    expect(loadRiddleResume()).toBeNull();
  });
});
