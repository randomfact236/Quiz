/**
 * sim-mp storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('sim-mp:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('sim-mp:' + k, v);
      } catch (_) {}
    },
  };
})();
