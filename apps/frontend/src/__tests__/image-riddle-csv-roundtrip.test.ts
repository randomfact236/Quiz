/**
 * Round-trip tests for the image-riddles CSV exporter/importer.
 *
 * Regression (plan/cosmetics-and-gaps-scan-2026-09-08.md F04 #1): the exporter
 * derived object keys by lowercasing display headers, so camelCase columns
 * (ImageUrl, TimerSeconds, ShowTimer, IsActive) exported empty and Category
 * exported as "[object Object]" — and the leading `#` metadata line became the
 * header row on re-import.
 */

import type { ImageRiddle } from '@/app/admin/types';
import {
  imageRiddlesToCSV,
  parseImageRiddleCSV,
} from '@/features/image-riddles/admin/lib/import-export';

const riddle: ImageRiddle = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Hidden face',
  imageUrl: 'https://example.com/face.webp',
  answer: 'a face in the trees',
  alternativeAnswers: ['face', 'tree face'],
  altText: 'Optical illusion of a face hidden in branches',
  hint: 'Look closely at the branches',
  difficulty: 'medium',
  category: { name: 'Optical Illusions', emoji: '🔍' },
  status: 'published',
  timerSeconds: 60,
  showTimer: true,
  isActive: true,
};

describe('imageRiddlesToCSV / parseImageRiddleCSV round-trip', () => {
  it('exports camelCase fields and the category name (not [object Object])', () => {
    const csv = imageRiddlesToCSV([riddle]);
    expect(csv).toContain('https://example.com/face.webp');
    expect(csv).toContain('Optical Illusions');
    expect(csv).toContain('TimerSeconds,ShowTimer,IsActive');
    expect(csv).toContain(',60,true,true');
    expect(csv).toContain('face|tree face');
    expect(csv).not.toContain('[object Object]');
  });

  it('re-imports an exported file back into the same riddle data', () => {
    const csv = imageRiddlesToCSV([riddle]);
    const result = parseImageRiddleCSV(csv);
    expect(result.imported).toHaveLength(1);

    const parsed = result.imported[0]!;
    expect(parsed.title).toBe('Hidden face');
    expect(parsed.imageUrl).toBe('https://example.com/face.webp');
    expect(parsed.answer).toBe('a face in the trees');
    expect(parsed.alternativeAnswers).toEqual(['face', 'tree face']);
    expect(parsed.altText).toBe('Optical illusion of a face hidden in branches');
    expect(parsed.category?.name).toBe('Optical Illusions');
    expect(parsed.timerSeconds).toBe(60);
    expect(parsed.showTimer).toBe(true);
    expect(parsed.isActive).toBe(true);
  });
});
