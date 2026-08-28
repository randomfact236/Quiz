import type { ImageRiddle } from '@/lib/image-riddles-api';
import {
  applyMixSort,
  filterRiddles,
  formatTime,
  resolveTimerSeconds,
  seededPosition,
  UNSUPPORTED_ACTION_IDS,
} from '@/features/image-riddles/lib/game';

function makeRiddle(overrides: Partial<ImageRiddle>): ImageRiddle {
  return {
    id: 'r1',
    title: 'Test Riddle',
    imageUrl: 'https://example.com/img.webp',
    answer: 'umbrella',
    hint: null,
    difficulty: 'easy',
    status: 'published',
    timerSeconds: null,
    showTimer: true,
    altText: null,
    isActive: true,
    categoryId: null,
    category: null,
    ...overrides,
  };
}

describe('resolveTimerSeconds', () => {
  it('uses the explicit timer when set', () => {
    expect(resolveTimerSeconds({ timerSeconds: 45, difficulty: 'easy' })).toBe(45);
  });

  it('falls back to the difficulty default', () => {
    expect(resolveTimerSeconds({ timerSeconds: null, difficulty: 'expert' })).toBe(180);
    expect(resolveTimerSeconds({ timerSeconds: null, difficulty: 'easy' })).toBe(60);
  });

  it('falls back to 90 for unknown difficulties', () => {
    expect(resolveTimerSeconds({ timerSeconds: null, difficulty: 'mystery' })).toBe(90);
  });
});

describe('formatTime', () => {
  it('formats m:ss', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(95)).toBe('1:35');
    expect(formatTime(0)).toBe('0:00');
  });
});

describe('seededPosition / applyMixSort', () => {
  it('is deterministic for the same id + seed', () => {
    expect(seededPosition('abc', 1)).toBe(seededPosition('abc', 1));
    expect(seededPosition('abc', 1)).not.toBe(seededPosition('abc', 2));
  });

  it('produces a stable order independent of input order', () => {
    const a = makeRiddle({ id: 'a' });
    const b = makeRiddle({ id: 'b' });
    const c = makeRiddle({ id: 'c' });
    const seed = 7;
    expect(applyMixSort([a, b, c], seed)).toEqual(applyMixSort([c, a, b], seed));
  });

  it('keeps relative order stable when items are removed (no reshuffle on filter)', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map((id) => makeRiddle({ id }));
    const seed = 3;
    const full = applyMixSort(items, seed).map((r) => r.id);
    const partial = applyMixSort(items.slice(0, 3), seed).map((r) => r.id);
    expect(full.filter((id) => partial.includes(id))).toEqual(partial);
  });

  it('does not mutate the input array', () => {
    const items = [makeRiddle({ id: 'b' }), makeRiddle({ id: 'a' })];
    const copy = [...items];
    applyMixSort(items, 42);
    expect(items).toEqual(copy);
  });
});

describe('filterRiddles', () => {
  const published = (overrides: Partial<ImageRiddle>) =>
    makeRiddle({ status: 'published', ...overrides });

  it('only shows published riddles', () => {
    const riddles = [published({ id: '1' }), makeRiddle({ id: '2', status: 'draft' })];
    expect(
      filterRiddles(riddles, { activeCategory: null, difficulty: 'all', searchQuery: '' })
    ).toHaveLength(1);
  });

  it('filters by category name, difficulty, and search text', () => {
    const riddles = [
      published({ id: '1', category: { name: 'Nature', emoji: '🌳' }, difficulty: 'easy' }),
      published({
        id: '2',
        category: { name: 'City', emoji: '🏙️' },
        difficulty: 'hard',
        answer: 'traffic light',
      }),
    ];
    const base = { activeCategory: null, difficulty: 'all', searchQuery: '' };
    expect(filterRiddles(riddles, { ...base, activeCategory: 'Nature' }).map((r) => r.id)).toEqual([
      '1',
    ]);
    expect(filterRiddles(riddles, { ...base, difficulty: 'hard' }).map((r) => r.id)).toEqual(['2']);
    expect(filterRiddles(riddles, { ...base, searchQuery: 'TRAFFIC' }).map((r) => r.id)).toEqual([
      '2',
    ]);
    expect(filterRiddles(riddles, { ...base, searchQuery: 'nothing' })).toHaveLength(0);
  });
});

describe('UNSUPPORTED_ACTION_IDS', () => {
  it('lists the presets that render inert (dropped at render time)', () => {
    expect(UNSUPPORTED_ACTION_IDS.has('report')).toBe(true);
    expect(UNSUPPORTED_ACTION_IDS.has('fullscreen')).toBe(true);
    expect(UNSUPPORTED_ACTION_IDS.has('pause-timer')).toBe(true);
    expect(UNSUPPORTED_ACTION_IDS.has('share')).toBe(false);
    expect(UNSUPPORTED_ACTION_IDS.has('skip')).toBe(false);
  });
});
