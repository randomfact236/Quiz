/**
 * chomp-elimination game shell — the chomp survival round on the MP1 engine.
 * Move = {cell: [row, col]}. All information is public.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var ROWS = 6;
  var COLS = 6;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
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
          gameSlug: 'chomp-elimination',
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
  function render(view) {
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var out = view.state.eliminated.indexOf(i) >= 0;
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' +
        (i === view.turn && view.status === 'running' ? ' active' : '') +
        (out ? ' out' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        (out ? ' out' : ' \u2713');
      row.appendChild(chip);
    });
    $('round-line').textContent =
      view.status === 'running'
        ? 'Round ' + view.state.round + ' \u00b7 ' + view.state.alive.length + ' alive'
        : '';
    // grid
    var grid = $('grid');
    grid.style.gridTemplateColumns = 'repeat(' + COLS + ', 46px)';
    var isPlaying = view.status === 'running' && view.state.phase === 'playing';
    var canBite = isPlaying && view.yourTurn;
    if (grid.children.length !== ROWS * COLS) {
      grid.innerHTML = '';
      for (var i = 0; i < ROWS * COLS; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.className = 'ch-cell';
          b.addEventListener('click', function () {
            bite(idx);
          });
          grid.appendChild(b);
        })(i);
      }
    }
    for (var k = 0; k < ROWS * COLS; k++) {
      var r = Math.floor(k / COLS);
      var c = k % COLS;
      var cell = grid.children[k];
      var open = view.state.open[r][c];
      var poison = r === 0 && c === 0;
      cell.className = 'ch-cell' + (open ? '' : ' gone') + (poison && open ? ' poison' : '');
      cell.textContent = open ? (poison ? '\u2620' : '\u00b7') : '';
      cell.disabled = !(canBite && open);
    }
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start\u2026'
        : view.status === 'finished'
          ? placementText(view)
          : view.yourTurn
            ? 'Your turn \u2014 take a bite!'
            : 'Waiting for the next bite\u2026';
  }
  function placementText(view) {
    if (!view.placement) return 'Finished.';
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var ordered = view.placement.slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    var mine = null;
    ordered.forEach(function (p) {
      if (p.seat === view.yourSeat) mine = p.rank;
    });
    return (
      '\uD83C\uDFC6 ' +
      names[ordered[0].seat] +
      ' survives! ' +
      ordered
        .map(function (p) {
          return '#' + p.rank + ' ' + names[p.seat];
        })
        .join(' \u00b7 ') +
      (mine === 1 ? ' \u2014 that\u2019s you!' : '')
    );
  }
  function bite(idx) {
    var r = Math.floor(idx / COLS);
    var c = idx % COLS;
    api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: { cell: [r, c] } })
      .then(render)
      .catch(function (e) {
        flash($('status'), e.message);
        poll();
      });
  }
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
