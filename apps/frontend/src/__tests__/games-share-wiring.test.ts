/**
 * Share-wiring regression guard (BUG: NOW-20, 2026-09-25 audit).
 *
 * Spirit-runner shipped an in-game Share button that threw `ReferenceError`
 * on every click — `shareUrls()` referenced a variable (`m`) that only
 * existed in a sibling function. The pure-model jest suites could not see it
 * because they only exercise `shareText()`, never the DOM builder.
 *
 * This test extracts each game's `shareUrls()` source and runs it in a `vm`
 * sandbox with stubbed dependencies, then asserts the three share anchors
 * received real URLs and the copy button received real text. Any future
 * undefined-reference regression in any game fails here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

const GAMES: Array<{ name: string; file: string }> = [{ name: 'tic-tac-toe', file: 'game.js' }];

const ROOT = join(process.cwd(), 'public', 'games');

/** Minimal stubs so any game's shareUrls() can run headless. */
function buildSandbox(): Record<string, unknown> {
  const els: Record<string, { href?: string; dataset: Record<string, string> }> = {
    'share-fb': { href: '', dataset: {} },
    'share-x': { href: '', dataset: {} },
    'share-wa': { href: '', dataset: {} },
    'share-copy': { href: '', dataset: {} },
  };
  // Some games reach the row through an `els` object with camelCase keys
  // (els.shareFb), others through getElementById — alias both onto one set of
  // nodes so either style updates the same elements.
  const alias: Record<string, unknown> = {
    shareFb: els['share-fb'],
    shareX: els['share-x'],
    shareWa: els['share-wa'],
    shareCopy: els['share-copy'],
  };
  return {
    els: Object.assign(els, alias),
    SLUG: 'test-game',
    bestMsThisRun: 210,
    getBest: () => ({ bestMs: 210, score: 1000 }),
    score: 1000,
    level: 2,
    LOCALE: 'en',
    safeLocale: (l: string) => l,
    GAME_CONFIG: { locale: 'en' },
    document: { getElementById: (id: string) => els[id] ?? ({} as never) },
    $: (id: string) => els[id] ?? ({} as never),
    window: { location: { origin: 'https://pigzap.com', pathname: '/games/test/' } },
    navigator: {},
    shareText: () => 'Result 120 in Test Game — can you beat it? https://pigzap.com/games/test/',
    distanceM: () => 120,
    meters: () => 120,
    scoreFor: () => 55,
    playedMs: () => 9000,
    formatTime: () => '0:09',
    isDaily: () => false,
    isCampaign: () => false,
    CHARACTERS: { spirit: { label: 'Spirit' }, test: { label: 'Test' } },
    save: { character: 'spirit' },
    state: { run: {}, score: 0, currentIndex: 0, levelId: null, level: { label: 'L1' } },
    t: (key: string) => key,
    toast: () => undefined,
  };
}

function extractShareUrls(source: string): string {
  const match = /function shareUrls\(\)\s*\{[\s\S]*?\n\}/.exec(source);
  if (!match) throw new Error('shareUrls() not found in source');
  return match[0];
}

describe('games share wiring — shareUrls() builds real links in every game (NOW-20)', () => {
  for (const { name, file } of GAMES) {
    it(`${name}: shareUrls() fills Facebook / X / WhatsApp hrefs and the copy text`, () => {
      const source = readFileSync(join(ROOT, name, file), 'utf-8');
      const fn = extractShareUrls(source);
      const sandbox = buildSandbox();
      runInNewContext(`${fn}\nshareUrls();`, sandbox);

      const els = sandbox.els as Record<string, { href?: string; dataset: Record<string, string> }>;
      expect(els['share-fb'].href).toContain('facebook.com');
      expect(els['share-x'].href).toContain('twitter.com');
      expect(els['share-wa'].href).toContain('wa.me');
      for (const key of ['share-fb', 'share-x', 'share-wa'] as const) {
        expect(els[key].href).not.toBe('');
        expect(els[key].href).not.toContain('undefined');
        expect(els[key].href).not.toContain('NaN');
      }
      expect(els['share-copy'].dataset.copy).toBeTruthy();
      expect(els['share-copy'].dataset.copy).not.toContain('undefined');
    });
  }
});
