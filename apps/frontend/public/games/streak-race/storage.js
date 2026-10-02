/**
 * streak-race storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('streak-race:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('streak-race:' + k, v);
      } catch (_) {}
    },
  };
})();
