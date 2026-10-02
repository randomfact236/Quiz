/**
 * quarto-pass storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('quarto-pass:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('quarto-pass:' + k, v);
      } catch (_) {}
    },
  };
})();
