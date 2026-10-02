/**
 * two-dice-pig storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('two-dice-pig:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('two-dice-pig:' + k, v);
      } catch (_) {}
    },
  };
})();
