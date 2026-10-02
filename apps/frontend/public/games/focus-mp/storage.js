/**
 * focus-mp storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('focus-mp:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('focus-mp:' + k, v);
      } catch (_) {}
    },
  };
})();
