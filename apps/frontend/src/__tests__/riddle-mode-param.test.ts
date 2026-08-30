import { parseModeParam } from '@/lib/riddle-mode-param';

describe('parseModeParam', () => {
  it('maps practice/timer to their modes', () => {
    expect(parseModeParam('practice')).toBe('practice');
    expect(parseModeParam('timer')).toBe('timer');
  });

  it('returns null for unknown or missing values', () => {
    expect(parseModeParam('normal')).toBeNull();
    expect(parseModeParam(null)).toBeNull();
    expect(parseModeParam('')).toBeNull();
  });
});
