/**
 * connect-four-mp storage — family localStorage pattern.
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
    } catch (_) {}
  }
  window.C4MP_STORAGE = { get, set };
})();
