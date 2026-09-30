/**
 * bulls-race-mp game shell — bulls-only code race on the MP1 party engine.
 * The maker's 4-digit code is typed once and held server-side; the API only
 * ever returns bulls counts while the race runs.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var LEN = 4;
  var LIMIT = 15;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
  var myCode = [0, 0, 0, 0];
  var myGuess = [0, 0, 0, 0];
  var $ = function (id) {
    return document.getElementById(id);
  };

  function show(screen) {
    ['menu', 'game'].forEach(function (s) {
      $('screen-' + s).hidden = s !== screen;
    });
  }
  async function ensureGuest() {
    try {
      await window.PIG_GUEST_READY;
    } catch (_) {}
    var pair = null;
    try {
      var raw = localStorage.getItem('aiquiz:guest-token');
      if (raw) pair = JSON.parse(raw);
    } catch (_) {}
    if (!pair || !pair.guestId) {
      pair = {
        guestId: 'guest-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
        token: null,
      };
    }
    S.party.guestId = pair.guestId;
    S.party.name = storage.get('name') || 'Player ' + Math.floor(Math.random() * 90 + 10);
    return pair;
  }
  async function api(path, body, method) {
    var pair = await ensureGuest();
    var headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (pair.token) headers['X-Guest-Token'] = pair.token;
    var res = await fetch(
      cfg.apiBase +
        '/party' +
        path +
        (method === 'GET' ? '?guestId=' + encodeURIComponent(S.party.guestId) : ''),
      { method: method || 'POST', headers: headers, body: body ? JSON.stringify(body) : undefined }
    );
    if (!res.ok) {
      var msg = 'Request failed';
      try {
        msg = (await res.json()).message || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }
  function initMenu() {
    $('btn-create').addEventListener('click', async function () {
      await ensureGuest();
      var name = $('player-name').value.trim() || S.party.name;
      storage.set('name', name);
      try {
        var r = await api('', {
          gameSlug: 'bulls-race-mp',
          playerName: name,
          guestId: S.party.guestId,
          seats: parseInt($('seat-count').value, 10),
          tier: $('bot-tier').value,
        });
        S.party.code = r.code;
        enterGame();
      } catch (e) {
        flash($('menu-msg'), e.message);
      }
    });
    $('btn-join').addEventListener('click', async function () {
      await ensureGuest();
      var code = $('join-code').value.trim().toUpperCase();
      var name = $('player-name').value.trim() || S.party.name;
      storage.set('name', name);
      if (!/^[A-Z0-9]{6}$/.test(code)) return flash($('menu-msg'), 'Enter the 6-character code.');
      try {
        await api('/' + code + '/join', { playerName: name, guestId: S.party.guestId });
        S.party.code = code;
        enterGame();
      } catch (e) {
        flash($('menu-msg'), e.message);
      }
    });
    $('btn-leave').addEventListener('click', async function () {
      clearTimeout(S.party.pollTimer);
      try {
        await api('/' + S.party.code + '/leave', { guestId: S.party.guestId });
      } catch (_) {}
      location.href = location.pathname;
    });
    if (cfg.partyCode) $('join-code').value = cfg.partyCode;
  }
  function enterGame() {
    show('game');
    $('code-label').textContent = S.party.code;
    poll();
  }
  async function poll() {
    if ($('screen-game').hidden) return;
    try {
      var view = await api('/' + S.party.code, null, 'GET');
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    } finally {
      clearTimeout(S.party.pollTimer);
      S.party.pollTimer = setTimeout(poll, cfg.pollMs);
    }
  }

  /** Build the 4 cycling digit slots for a target array. */
  function slots(container, arr, disabled) {
    container.innerHTML = '';
    for (var i = 0; i < LEN; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.className = 'slot';
        b.textContent = String(arr[idx]);
        b.disabled = !!disabled;
        b.addEventListener('click', function () {
          arr[idx] = (arr[idx] + 1) % 10;
          b.textContent = String(arr[idx]);
        });
        container.appendChild(b);
      })(i);
    }
  }
  function render(view) {
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' +
        (i === view.turn && view.status === 'running' && view.state.phase === 'racing'
          ? ' active'
          : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        (i === 0
          ? ' (maker)'
          : ' \u00b7 ' + (view.state.rows[String(i)] || []).length + '/' + LIMIT);
      row.appendChild(chip);
    });
    var isMaker = view.yourSeat === 0;
    var racing = view.state.phase === 'racing';
    $('set-phase').hidden = !(isMaker && view.state.phase === 'setting');
    $('race-phase').hidden = !(racing && !isMaker);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    if ($('set-phase').hidden === false && !$('set-slots').children.length) {
      slots($('set-slots'), myCode, false);
    }
    if (!$('race-phase').hidden && !$('guess-slots').children.length) {
      slots($('guess-slots'), myGuess, false);
    }
    $('btn-guess').disabled = !(view.yourTurn && racing && !isMaker);
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start\u2026'
        : view.status === 'finished'
          ? placementText(view)
          : view.state.phase === 'setting'
            ? isMaker
              ? 'Invent your secret code below.'
              : 'The maker is inventing the code\u2026'
            : view.yourTurn
              ? 'Your turn \u2014 set your 4 digits and guess!'
              : 'Waiting for a racer\u2026';
    if (racing && !isMaker) renderMyHistory(view);
    if (view.status === 'finished' && view.state.code) renderReveal(view.state.code);
  }
  function placementText(view) {
    if (!view.placement) return 'Finished.';
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var ordered = view.placement.slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    var myRank = null;
    ordered.forEach(function (p) {
      if (p.seat === view.yourSeat) myRank = p.rank;
    });
    return (
      ordered
        .map(function (p) {
          return '#' + p.rank + ' ' + names[p.seat];
        })
        .join(' \u00b7 ') + (myRank === 1 ? ' \u2014 \uD83C\uDFC6 you took it!' : '')
    );
  }
  function renderMyHistory(view) {
    var host = $('my-history');
    host.innerHTML = '';
    var rows = view.state.rows[String(view.yourSeat)] || [];
    rows.forEach(function (r) {
      var line = document.createElement('div');
      line.className = 'guess-row';
      r.guess.forEach(function (v) {
        var p = document.createElement('span');
        p.className = 'guess-digit';
        p.textContent = String(v);
        line.appendChild(p);
      });
      var fb = document.createElement('span');
      fb.className = 'fb';
      fb.textContent = r.bulls + ' \u25CF bulls';
      line.appendChild(fb);
      host.appendChild(line);
    });
  }
  function renderReveal(code) {
    var host = $('reveal-box');
    if (!host) return;
    host.innerHTML = '';
    code.forEach(function (v) {
      var d = document.createElement('span');
      d.className = 'secret-digit revealed';
      d.textContent = String(v);
      host.appendChild(d);
    });
  }

  $('btn-set-code').addEventListener('click', async function () {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { code: myCode },
      });
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  });
  $('btn-guess').addEventListener('click', async function () {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { guess: myGuess },
      });
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  });
  $('btn-start').addEventListener('click', async function () {
    try {
      await api('/' + S.party.code + '/start', { guestId: S.party.guestId });
      poll();
    } catch (e) {
      flash($('status'), e.message);
    }
  });
  $('btn-copy').addEventListener('click', async function () {
    var url = location.origin + location.pathname + '?party=' + S.party.code;
    try {
      await navigator.clipboard.writeText(url);
      flash($('status'), 'Invite link copied!');
    } catch (_) {
      flash($('status'), url);
    }
  });
  function flash(target, msg) {
    if (!target) return;
    target.textContent = msg;
    target.classList.add('flash');
    setTimeout(function () {
      target.classList.remove('flash');
    }, 1200);
  }
  document.addEventListener('DOMContentLoaded', initMenu);
})();
