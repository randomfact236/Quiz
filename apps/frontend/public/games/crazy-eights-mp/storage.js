/**
 * crazy-eights storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('crazy-eights-mp:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('crazy-eights-mp:' + k, v);
      } catch (_) {}
    },
  };
})();
