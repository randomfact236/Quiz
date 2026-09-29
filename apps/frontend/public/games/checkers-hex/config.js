/**
 * checkers-hex config — family standard. 3P variant.
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var API_BASE =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3012/api/v1'
      : 'https://api.pigzap.com/api/v1';
  window.GAME_CFG = {
    debug: params.get('debug') === '1',
    partyCode: params.get('party') || '',
    apiBase: API_BASE,
    pollMs: 3000,
    gameSlug: 'checkers-hex',
    seats: 3,
    size: 8,
  };
})();
