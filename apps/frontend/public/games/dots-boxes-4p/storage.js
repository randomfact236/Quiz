/**
 * dots-boxes-4p storage — family localStorage pattern (guest identity only).
 */
(function () {
  'use strict';
  const KEY = '***';
  function get(k) {
    try {
      return window.localStorage.getItem(KEY + k);
    } catch (_) {
      return null;
    }
  }
  function set(k, v) {
    try {
      window.localStorage.setItem(KEY + k, v);
    } catch (_) {
      /* ok */
    }
  }
  window.DB4_STORAGE = { get, set };
})();
