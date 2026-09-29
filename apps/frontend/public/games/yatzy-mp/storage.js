/**
 * yatzy storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('yatzy-mp:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('yatzy-mp:' + k, v);
      } catch (_) {}
    },
  };
})();
