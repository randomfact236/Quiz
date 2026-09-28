/**
 * quad-oxo storage — the family localStorage pattern (names/guest id only).
 * No game content is stored: boards live server-side for party tables and
 * in-memory for hot-seat.
 */
(function () {
  'use strict';

  const KEY = 'quadoxo.';

  function get(k) {
    try {
      return window.localStorage.getItem(KEY + k);
    } catch (_) {
      return null;
    }
  }

  function set(k, v) {
    try {
      window.localStorage.setItem(KEY + k, v);
    } catch (_) {
      /* storage unavailable — guests regenerate each visit */
    }
  }

  window.QUADOXO_STORAGE = { get, set };
})();
