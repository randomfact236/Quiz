/**
 * fleet-royale storage — family standard.
 */
(function () {
  'use strict';
  window.GAME_STORAGE = {
    get: function (k) {
      try {
        return localStorage.getItem('fleet-royale:' + k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem('fleet-royale:' + k, v);
      } catch (_) {}
    },
  };
})();
