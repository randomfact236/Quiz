/**
 * farkle-lite storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('farkle-lite:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('farkle-lite:' + k, v);
      } catch (_) {}
    },
  };
})();
