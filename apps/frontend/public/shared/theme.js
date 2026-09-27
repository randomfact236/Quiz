/**
 * Theme bootstrap — resolves the site's theme (ai-quiz-theme: light|dark|system)
 * before first paint so no game ever flashes the wrong scheme.
 *
 * Extracted from seven identical inline copies (2026-09-25 audit): the copies
 * were hand-synced into the games CSP as sha256 allow-list hashes, which broke
 * silently whenever a checkout normalized line endings. Loading this file
 * externally (script-src 'self') removes the allow-list — and the duplication —
 * for good.
 */
(function () {
  try {
    var stored = localStorage.getItem('ai-quiz-theme');
    var dark =
      stored === 'dark' ||
      ((!stored || stored === 'system') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
