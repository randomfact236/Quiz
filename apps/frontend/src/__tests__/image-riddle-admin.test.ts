import type { ImageRiddle } from '@/app/admin/types';
import {
  computeCategoryCounts,
  computeDifficultyCounts,
  computeStatusCounts,
  filterAdminRiddles,
  nextSortConfig,
  nextStatusCycle,
  sortAdminRiddles,
  type AdminFilterParams,
} from '@/features/image-riddles/admin/lib/filters';
import {
  defaultFormState,
  isRiddleFormComplete,
  parseTimerSeconds,
  riddleToFormState,
  type RiddleFormState,
} from '@/features/image-riddles/admin/lib/form';
import {
  imageRiddlesToCSV,
  parseImageRiddleCSV,
} from '@/features/image-riddles/admin/lib/import-export';

function makeRiddle(overrides: Partial<ImageRiddle>): ImageRiddle {
  return {
    id: 'r1',
    title: 'Test Riddle',
    imageUrl: 'https://example.com/img.webp',
    answer: 'umbrella',
    hint: '',
    difficulty: 'easy',
    category: { name: 'Nature', emoji: '🌳' },
    status: 'draft',
    timerSeconds: null,
    showTimer: true,
    isActive: true,
    categoryId: null,
    altText: null,
    ...overrides,
  };
}

const emptyFilters: AdminFilterParams = {
  filterDifficulty: '',
  filterCategory: '',
  searchTerm: '',
  statusFilter: 'all',
};

describe('admin filters lib', () => {
  const riddles = [
    makeRiddle({ id: '1', title: 'Apple', difficulty: 'easy', status: 'published' }),
    makeRiddle({ id: '2', title: 'Banana', difficulty: 'hard', status: 'draft' }),
    makeRiddle({
      id: '3',
      title: 'Cherry',
      difficulty: 'easy',
      status: 'trash',
      category: { name: 'City', emoji: '🏙️' },
    }),
  ];

  it('filters by difficulty, category, search, and status', () => {
    expect(filterAdminRiddles(riddles, emptyFilters)).toHaveLength(3);
    expect(
      filterAdminRiddles(riddles, { ...emptyFilters, filterDifficulty: 'easy' }).map((r) => r.id)
    ).toEqual(['1', '3']);
    expect(
      filterAdminRiddles(riddles, { ...emptyFilters, filterCategory: 'City' }).map((r) => r.id)
    ).toEqual(['3']);
    expect(
      filterAdminRiddles(riddles, { ...emptyFilters, searchTerm: 'ban' }).map((r) => r.id)
    ).toEqual(['2']);
    expect(
      filterAdminRiddles(riddles, { ...emptyFilters, statusFilter: 'published' }).map((r) => r.id)
    ).toEqual(['1']);
  });

  it('status counts ignore the status filter (original cross-filter semantics)', () => {
    const counts = computeStatusCounts(riddles, { ...emptyFilters, statusFilter: 'trash' });
    expect(counts).toEqual({ total: 3, published: 1, draft: 1, trash: 1 });
  });

  it('category counts ignore the category filter', () => {
    const counts = computeCategoryCounts(riddles, { ...emptyFilters, filterCategory: 'City' });
    expect(counts['Nature']).toBe(2);
    expect(counts['City']).toBe(1);
  });

  it('difficulty counts ignore the difficulty filter', () => {
    const counts = computeDifficultyCounts(riddles, { ...emptyFilters, filterDifficulty: 'hard' });
    expect(counts['easy']).toBe(2);
    expect(counts['hard']).toBe(1);
  });

  it('sorts by difficulty rank and toggles asc → desc → off', () => {
    expect(
      sortAdminRiddles(riddles, { field: 'difficulty', direction: 'asc' }).map((r) => r.id)
    ).toEqual(['1', '3', '2']);
    expect(nextSortConfig({ field: 'difficulty', direction: 'asc' }, 'difficulty')).toEqual({
      field: 'difficulty',
      direction: 'desc',
    });
    expect(nextSortConfig({ field: 'difficulty', direction: 'desc' }, 'difficulty')).toBeNull();
    expect(nextSortConfig(null, 'title')).toEqual({ field: 'title', direction: 'asc' });
  });

  it('cycles status published → draft → trash → published', () => {
    expect(nextStatusCycle('published')).toBe('draft');
    expect(nextStatusCycle('draft')).toBe('trash');
    expect(nextStatusCycle('trash')).toBe('published');
  });
});

describe('admin form lib', () => {
  it('default form is incomplete', () => {
    expect(isRiddleFormComplete(defaultFormState)).toBe(false);
  });

  it('requires title, imageUrl, answer, and categoryName', () => {
    const base: RiddleFormState = {
      ...defaultFormState,
      title: 'T',
      imageUrl: 'https://x/img',
      answer: 'A',
      categoryName: 'Nature',
    };
    expect(isRiddleFormComplete(base)).toBe(true);
    expect(isRiddleFormComplete({ ...base, title: '  ' })).toBe(false);
    expect(isRiddleFormComplete({ ...base, categoryName: '' })).toBe(false);
  });

  it('maps a riddle onto the form state', () => {
    const form = riddleToFormState(
      makeRiddle({ title: 'T', answer: 'A', hint: '', timerSeconds: 45 })
    );
    expect(form.title).toBe('T');
    expect(form.timerSeconds).toBe('45');
    expect(form.status).toBe('draft');
  });

  it('parses timer seconds (empty → null)', () => {
    expect(parseTimerSeconds('')).toBeNull();
    expect(parseTimerSeconds('45')).toBe(45);
  });
});

describe('admin import-export lib', () => {
  it('exports CSV with escaping and metadata comment line', () => {
    const riddles = [makeRiddle({ id: 'x', title: 'Riddle, with comma', answer: 'one "two"' })];
    const csv = imageRiddlesToCSV(riddles);
    expect(csv).toContain('# count: 1');
    expect(csv).toContain('"Riddle, with comma"');
    expect(csv).toContain('"one ""two"""');
  });

  it('parses well-formed CSV rows with defaults', () => {
    const csv = [
      'ID,Title,ImageUrl,Answer,Hint,Difficulty,Category,TimerSeconds,ShowTimer,IsActive',
      'id1,T1,https://x/i,A,,, optics ,,true,',
    ].join('\n');
    const result = parseImageRiddleCSV(csv);
    expect(result.imported).toHaveLength(1);
    const imported = result.imported[0] as ImageRiddle;
    expect(imported.title).toBe('T1');
    expect(imported.difficulty).toBe('medium');
    // Original mapper does not trim cell values — preserved as-is.
    expect(imported.category?.name).toBe(' optics ');
    expect(imported.timerSeconds).toBe(90);
    expect(imported.isActive).toBe(true);
  });

  it('parses quoted fields with embedded commas per RFC 4180', () => {
    const csv = [
      'ID,Title,ImageUrl,Answer,Hint,Difficulty,Category,TimerSeconds,ShowTimer,IsActive',
      // Note: an unquoted field containing quotes ("two") loses the quotes —
      // original tokenizer semantics, preserved as-is.
      'id1,"Riddle, with comma",https://x/i,one "two",,easy,Nature,90,true,false',
    ].join('\n');
    const result = parseImageRiddleCSV(csv);
    expect(result.imported).toHaveLength(1);
    const imported = result.imported[0] as ImageRiddle;
    expect(imported.title).toBe('Riddle, with comma');
    expect(imported.answer).toBe('one two');
    expect(imported.difficulty).toBe('easy');
    expect(imported.isActive).toBe(false);
  });

  it('rejects CSV without header + data rows', () => {
    const result = parseImageRiddleCSV('only,a,header');
    expect(result.success).toBe(false);
    expect(result.imported).toHaveLength(0);
  });
});
