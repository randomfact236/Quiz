/**
 * Guest identity bootstrap — shared by every static MP game page.
 * Mints the signed {guestId, token} pair once per browser (via the same
 * /guest-users/token endpoint the main app uses) and stores it under the
 * family key the game shells already read. game.js ensureGuest() then finds
 * a complete pair and every party call carries X-Guest-Token.
 */
(function () {
  'use strict';
  var KEY = 'aiquiz:guest-token';
  function getPair() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
  function host() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3012/api/v1'
      : 'https://api.pigzap.com/api/v1';
  }
  window.PIG_GUEST_READY = (async function () {
    var pair = getPair();
    if (pair && pair.guestId && pair.token) return pair;
    var res = await fetch(host() + '/guest-users/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legacyId: null }),
    });
    if (!res.ok) throw new Error('Guest bootstrap failed (' + res.status + ')');
    pair = await res.json();
    try {
      window.localStorage.setItem(KEY, JSON.stringify(pair));
    } catch (_) {}
    return pair;
  })();
})();
