/**
 * bulls-race-mp storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('bulls-race-mp:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('bulls-race-mp:' + k, v);
      } catch (_) {}
    },
  };
})();
