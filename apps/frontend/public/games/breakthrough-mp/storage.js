/**
 * breakthrough-mp storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('breakthrough-mp:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('breakthrough-mp:' + k, v);
      } catch (_) {}
    },
  };
})();
