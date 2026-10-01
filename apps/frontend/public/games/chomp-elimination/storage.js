/**
 * chomp-elimination storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('chomp-elimination:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('chomp-elimination:' + k, v);
      } catch (_) {}
    },
  };
})();
