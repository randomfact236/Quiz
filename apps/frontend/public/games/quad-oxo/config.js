/**
 * quad-oxo config — the family standard (plan/games/README.md §4).
 * API origin comes from the site config; this game talks ONLY to the party
 * endpoints it needs (AGENTS.md network rule).
 */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const API_BASE =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3012/api/v1'
      : 'https://api.pigzap.com/api/v1';

  window.QUADOXO_CONFIG = {
    /** ?debug=1 shows seat/turn internals on screen. */
    debug: params.get('debug') === '1',
    /** ?party=CODE deep-link straight into a table. */
    partyCode: params.get('party') || '',
    /** ?v=N cache-busting passthrough (read-only). */
    v: params.get('v') || '',
    apiBase: API_BASE,

    /** Board geometry (mirrors quad-oxo.core.ts). */
    cells: 25,
    lineLen: 4,
    maxSeats: 4,
    symbols: ['A', 'B', 'C', 'D'],
    glyphClass: ['sym-a', 'sym-b', 'sym-c', 'sym-d'],
    seatNames: ['You', 'Player 2', 'Player 3', 'Player 4'],

    pollMs: 3000,
    ttlHours: 1,
  };
})();
