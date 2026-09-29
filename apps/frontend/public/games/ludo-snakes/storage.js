/**
 * ludo-snakes storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('ludo-snakes:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('ludo-snakes:' + k, v);
      } catch (_) {}
    },
  };
})();
