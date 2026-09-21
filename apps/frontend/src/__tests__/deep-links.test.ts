/**
 * ============================================================================
 * deep-links.test.ts — per-item share-URL readers (SHARE-01 #8/#9 + BUG-064)
 * ============================================================================
 * Both URL forms must resolve to the linked item's id:
 *  - the legacy ?riddle= / ?joke= section links shipped by the BUG-064 fix
 *  - the per-item /image-riddles/<id> and /jokes/<id> share URLs
 * ============================================================================
 */

import { readImageRiddleDeepLinkId, readJokeDeepLinkId } from '@/lib/deep-links';

const RID = '83002354-d9ab-41d4-a716-e843a43c1ad7';
const JID = 'ffe77d83-8a3e-47e6-9cb4-7becbcd5bc49';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('readImageRiddleDeepLinkId', () => {
  it('reads the legacy ?riddle= param', () => {
    window.history.replaceState(null, '', `/image-riddles?riddle=${RID}`);
    expect(readImageRiddleDeepLinkId()).toBe(RID);
  });

  it('reads the per-riddle /image-riddles/<id> path', () => {
    window.history.replaceState(null, '', `/image-riddles/${RID}`);
    expect(readImageRiddleDeepLinkId()).toBe(RID);
  });

  it('prefers the explicit param when both forms are present', () => {
    window.history.replaceState(null, '', `/image-riddles/${RID}?riddle=other`);
    expect(readImageRiddleDeepLinkId()).toBe('other');
  });

  it('returns null on the section page without params', () => {
    window.history.replaceState(null, '', '/image-riddles');
    expect(readImageRiddleDeepLinkId()).toBeNull();
  });

  it('returns null for non-item paths', () => {
    window.history.replaceState(null, '', '/image-riddles/not-a-uuid');
    expect(readImageRiddleDeepLinkId()).toBeNull();
  });
});

describe('readJokeDeepLinkId', () => {
  it('reads the legacy ?joke= param', () => {
    window.history.replaceState(null, '', `/jokes?joke=${JID}`);
    expect(readJokeDeepLinkId()).toBe(JID);
  });

  it('reads the per-joke /jokes/<id> path', () => {
    window.history.replaceState(null, '', `/jokes/${JID}`);
    expect(readJokeDeepLinkId()).toBe(JID);
  });

  it('returns null on the section page without params', () => {
    window.history.replaceState(null, '', '/jokes?category=some-cat');
    expect(readJokeDeepLinkId()).toBeNull();
  });
});
