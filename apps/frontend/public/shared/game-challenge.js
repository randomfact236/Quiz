/* ==========================================================================
 * PigZap game challenges (plan/18 phase 4) — dependency-free widget for the
 * static games. Two flows, one script:
 *
 *  ACCEPT  — the page URL carries ?challenge=<token>: the script fetches the
 *            challenge (target score, same-board seed when the game is
 *            seeded), mounts a slim target banner, and the game's
 *            PigChallenge.reportRun({...}) call posts the acceptor's run.
 *  CREATE  — when a run is reported outside a challenge, a "⚔️ Challenge a
 *            friend" button mounts on the game-over card; clicking creates
 *            the challenge and offers the link (navigator.share / clipboard).
 *
 * Games wire it with: the <script> tag + one PigChallenge.reportRun call at
 * game over. Seeded games pass their seed in the run; the share link then
 * carries ?seed=… so the friend replays the exact board (word-puzzle's QA
 * hook reads it natively; sliding/memory ride their daily boards).
 * Bump ?v=N in each index.html when editing.
 * ========================================================================== */
(function () {
  'use strict';

  var API_BASE = (function () {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3012/api/v1';
    }
    return 'https://api.pigzap.com/api/v1';
  })();

  var GAME = (window.location.pathname.match(/\/games\/([^/]+)\//) || [])[1] || 'unknown-game';
  var NAME_KEY = 'pigzap:challenge-name';
  var CHALLENGE_TTL_DAYS = 14;

  var lastRun = null; // most recent PigChallenge.reportRun data
  var accepted = null; // challenge view when ?challenge= is present
  var submitted = false; // acceptor's run posted (once per page load)

  // ---- tiny helpers --------------------------------------------------------

  function guestId() {
    try {
      var key = 'aiquiz:guest-id';
      var id = localStorage.getItem(key);
      if (id) return id;
      id = 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
      return id;
    } catch (e) {
      return 'guest_anon';
    }
  }

  function playerName() {
    try {
      return localStorage.getItem(NAME_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function rememberName(name) {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch (e) {
      /* private mode */
    }
  }

  function askName() {
    var name = playerName();
    if (!name) {
      name = window.prompt('Your name (shown to your friend):', '') || '';
      name = name.trim().slice(0, 24);
      if (name) rememberName(name);
    }
    return name;
  }

  function api(path, options) {
    return fetch(API_BASE + path, options).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  function siteUrl() {
    return window.location.hostname === 'localhost'
      ? window.location.origin + window.location.pathname
      : 'https://pigzap.com' + window.location.pathname;
  }

  function fmt(run) {
    if (!run) return '';
    if (typeof run.moves === 'number' && typeof run.score === 'number') {
      return run.score + ' pts · ' + run.moves + ' moves';
    }
    if (typeof run.moves === 'number') return run.moves + ' moves';
    if (typeof run.score === 'number') return run.score + ' pts';
    return '';
  }

  function better(a, b) {
    // Higher score wins; tie-break on fewer moves, then shorter time.
    var as = a ? a.score || 0 : -1;
    var bs = b ? b.score || 0 : -1;
    if (as !== bs) return as > bs;
    var am = a && typeof a.moves === 'number' ? a.moves : Infinity;
    var bm = b && typeof b.moves === 'number' ? b.moves : Infinity;
    if (am !== bm) return am < bm;
    var ad = a && typeof a.durationMs === 'number' ? a.durationMs : Infinity;
    var bd = b && typeof b.durationMs === 'number' ? b.durationMs : Infinity;
    return ad <= bd;
  }

  // ---- UI ------------------------------------------------------------------

  var STYLES =
    '.pig-ch{position:fixed;top:0;left:0;right:0;z-index:99980;display:none;justify-content:center;pointer-events:none}' +
    '.pig-ch__card{pointer-events:auto;margin-top:8px;background:#312e81;color:#fff;border-radius:12px;' +
    'padding:8px 14px;font:600 12.5px/1.4 system-ui,sans-serif;box-shadow:0 6px 18px rgba(49,46,129,.45);' +
    'display:flex;gap:10px;align-items:center;max-width:92vw}' +
    '.pig-ch__x{background:transparent;border:0;color:#c7d2fe;font:700 14px system-ui;cursor:pointer;padding:2px 6px}' +
    '.pig-ch-btn{display:flex;justify-content:center;margin-top:12px}' +
    '.pig-ch-btn button{background:#e11d48;color:#fff;border:0;border-radius:10px;padding:9px 16px;' +
    'font:700 12.5px system-ui,sans-serif;letter-spacing:.04em;cursor:pointer}' +
    '.pig-ch-btn button:hover{background:#f43f5e}' +
    '.pig-ch-note{margin-top:8px;text-align:center;font:600 12px/1.5 system-ui,sans-serif;opacity:.85}';

  function injectStyles() {
    var tag = document.createElement('style');
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }

  function mountBanner(view) {
    var host = document.createElement('div');
    host.className = 'pig-ch';
    var label = fmt(view.challengeRun) || 'your friend waits';
    host.innerHTML =
      '<div class="pig-ch__card"><span>⚔️ Beat <b></b>: ' +
      label +
      '</span><button class="pig-ch__x" aria-label="Dismiss">✕</button></div>';
    host.querySelector('b').textContent = view.challengerName || 'a friend';
    host.querySelector('.pig-ch__x').addEventListener('click', function () {
      host.style.display = 'none';
    });
    document.body.appendChild(host);
    host.style.display = 'flex';
  }

  function mountButton(card, label, onClick) {
    if (!card || card.querySelector('.pig-ch-btn')) return;
    var row = document.createElement('div');
    row.className = 'pig-ch-btn';
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    row.appendChild(btn);
    card.appendChild(row);
  }

  function mountNote(card, text) {
    var p = card.querySelector('.pig-ch-note');
    if (!p) {
      p = document.createElement('p');
      p.className = 'pig-ch-note';
      card.appendChild(p);
    }
    p.textContent = text;
  }

  // Same card-finding lists as pig-feedback.js (the games' over/pause cards).
  var OVER_CARDS = [
    '#overlay-over .card',
    '#overlay-gameover .overlay-card',
    '#overlay-result .overlay-card',
    '#overlay-win .overlay-card',
    '#overlay .overlay-card',
    '#overlay-levelclear .overlay-card',
  ];

  function overCard() {
    for (var i = 0; i < OVER_CARDS.length; i += 1) {
      var card = document.querySelector(OVER_CARDS[i]);
      if (card) return card;
    }
    return null;
  }

  function share(url, text) {
    if (navigator.share) {
      navigator.share({ title: 'PigZap challenge', text: text, url: url }).catch(function () {});
      return;
    }
    navigator.clipboard
      .writeText(text + ' ' + url)
      .then(function () {
        window.alert('Challenge link copied — send it to a friend!');
      })
      .catch(function () {
        window.prompt('Copy this challenge link:', url);
      });
  }

  // ---- flows ---------------------------------------------------------------

  function createChallenge() {
    if (!lastRun) return;
    var name = askName();
    if (!name) return;
    var payload = {};
    if (typeof lastRun.seed === 'number') payload.seed = lastRun.seed;
    if (typeof lastRun.level === 'number' || typeof lastRun.level === 'string') {
      payload.level = lastRun.level;
    }
    if (typeof lastRun.theme === 'string' && lastRun.theme) payload.theme = lastRun.theme;
    if (lastRun.daily) payload.daily = lastRun.daily;
    api('/game-challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameSlug: GAME,
        payload: payload,
        run: {
          score: lastRun.score,
          durationMs: lastRun.durationMs,
          moves: lastRun.moves,
          detail: lastRun.detail,
        },
        playerName: name,
        guestId: guestId(),
      }),
    })
      .then(function (res) {
        var url =
          siteUrl() +
          '?challenge=' +
          res.token +
          (typeof payload.seed === 'number' ? '&seed=' + payload.seed : '') +
          (payload.level !== undefined ? '&level=' + payload.level : '') +
          (payload.theme ? '&theme=' + payload.theme : '');
        var text = 'Can you beat my ' + GAME.replace(/-/g, ' ') + ' run? ' + fmt(lastRun);
        share(url, text + ' — ' + 'valid ' + CHALLENGE_TTL_DAYS + ' days');
      })
      .catch(function () {
        window.alert('Could not create the challenge — check your connection.');
      });
  }

  function acceptSubmit() {
    if (!accepted || submitted || !lastRun) return;
    submitted = true;
    var name = playerName() || 'Guest';
    api('/game-challenges/' + accepted.token + '/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: name,
        guestId: guestId(),
        run: {
          score: lastRun.score,
          durationMs: lastRun.durationMs,
          moves: lastRun.moves,
          detail: lastRun.detail,
        },
      }),
    })
      .then(function () {
        var card = overCard();
        var won = better(lastRun, accepted.challengeRun);
        if (card) {
          mountNote(
            card,
            won
              ? '🏆 You beat ' + (accepted.challengerName || 'your friend') + '!'
              : 'So close — ' +
                  (accepted.challengerName || 'your friend') +
                  ' had ' +
                  fmt(accepted.challengeRun) +
                  '.'
          );
        }
      })
      .catch(function () {
        submitted = false; // transient failure — allow a retry on the next run
      });
  }

  // ---- bootstrap -----------------------------------------------------------

  injectStyles();

  var params = new URLSearchParams(window.location.search);
  var token = params.get('challenge');
  if (token) {
    api('/game-challenges/' + encodeURIComponent(token))
      .then(function (view) {
        accepted = view;
        mountBanner(view);
      })
      .catch(function () {
        /* expired or offline — the game just plays normally */
      });
  }

  window.PigChallenge = {
    /** Games call this once when a run ends (win, game over, daily solved). */
    reportRun: function (data) {
      lastRun = data || null;
      if (!lastRun) return;
      if (accepted) {
        acceptSubmit();
        return;
      }
      var card = overCard();
      if (card) {
        mountButton(card, '⚔️ Challenge a friend', createChallenge);
      }
    },
  };
})();
