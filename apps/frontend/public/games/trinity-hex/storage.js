/**
 * trinity-hex storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('trinity-hex:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('trinity-hex:' + k, v);
      } catch (_) {}
    },
  };
})();
