/**
 * coderace config — family standard. Network: /api/v1/party only.
 */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const API_BASE =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3012/api/v1'
      : 'https://api.pigzap.com/api/v1';
  window.GAME_CFG = {
    debug: params.get('debug') === '1',
    partyCode: params.get('party') || '',
    apiBase: API_BASE,
    pollMs: 3000,
  };
})();
