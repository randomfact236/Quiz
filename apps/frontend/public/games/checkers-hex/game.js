/**
 * checkers-mp game shell — shared by checkers-hex (3P) and checkers-4p (4P).
 * Move = {from, to} cell indexes; legality mirrored locally via CMPCORE,
 * server re-validates everything.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var core = window.CMPCORE;
  var storage = window.GAME_STORAGE;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, sel: null, legal: [] };
  var $ = function (id) {
    return document.getElementById(id);
  };
  var PN = ['p0', 'p1', 'p2', 'p3'];

  function show(screen) {
    ['menu', 'game'].forEach(function (s) {
      $('screen-' + s).hidden = s !== screen;
    });
  }
  function ensureGuest() {
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
    var pair = ensureGuest();
    var headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (pair.token) headers['X-Guest-Token'] = pair.token;
    var res = await fetch(
      cfg.apiBase +
        '/party' +
        path +
        (method === 'GET' ? '?guestId=' + encodeURIComponent(S.party.guestId) : ''),
      {
        method: method || 'POST',
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
      }
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
      ensureGuest();
      var name = $('player-name').value.trim() || S.party.name;
      storage.set('name', name);
      try {
        var r = await api('', {
          gameSlug: cfg.gameSlug,
          playerName: name,
          guestId: S.party.guestId,
          seats: cfg.seats,
          tier: $('bot-tier').value,
        });
        S.party.code = r.code;
        enterGame();
      } catch (e) {
        flash($('menu-msg'), e.message);
      }
    });
    $('btn-join').addEventListener('click', async function () {
      ensureGuest();
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
    if (cfg.partyCode) {
      $('join-code').value = cfg.partyCode;
    }
  }
  function enterGame() {
    show('game');
    $('code-label').textContent = S.party.code;
    buildBoard();
    poll();
  }
  async function poll() {
    if ($('screen-game').hidden) return;
    try {
      var view = await api('/' + S.party.code, null, 'GET');
      S.view = view;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    } finally {
      clearTimeout(S.party.pollTimer);
      S.party.pollTimer = setTimeout(poll, cfg.pollMs);
    }
  }
  var cellEls = [];
  function buildBoard() {
    var size = cfg.size;
    var host = $('board');
    host.innerHTML = '';
    host.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
    cellEls = [];
    for (var i = 0; i < size * size; i++) {
      var el = document.createElement('div');
      el.className = 'cmp-cell ' + (i % 2 === 0 ? 'light' : 'dark');
      el.addEventListener(
        'click',
        (function (idx) {
          return function () {
            onCellClick(idx);
          };
        })(i)
      );
      host.appendChild(el);
      cellEls.push(el);
    }
  }
  function render(view) {
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      var out = (view.state.eliminated || []).indexOf(i) >= 0;
      chip.className =
        'seat-chip' +
        (i === view.turn && view.status === 'running' ? ' active' : '') +
        (out ? ' out' : '');
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : '') +
        (out ? ' ✖' : '');
      row.appendChild(chip);
    });
    $('status').textContent = statusText(view);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    renderBoard(view);
  }
  function statusText(view) {
    if (view.status === 'waiting') return 'Waiting for the host to start…';
    if (view.status === 'finished') {
      if (!view.placement) return 'Finished.';
      var names = view.seats.map(function (s) {
        return s.name;
      });
      var first = view.placement.filter(function (p) {
        return p.rank === 1;
      })[0];
      return '🏆 ' + names[first.seat] + ' is the last seat standing!';
    }
    if (view.yourTurn) {
      if (view.state.chainCell !== null && view.state.chainCell !== undefined)
        return 'Keep jumping! Chain continues with the marked piece.';
      return 'Your turn — click one of your pieces.';
    }
    return 'Waiting…';
  }
  function renderBoard(view) {
    var size = view.state.size;
    var grid = view.state.grid;
    S.legal = [];
    if (view.yourTurn && view.status === 'running') {
      S.legal = core.legalMoves(view.state, view.yourSeat);
    }
    var targets = {};
    var selFrom = null;
    if (S.sel !== null) {
      selFrom = S.sel;
      S.legal.forEach(function (m) {
        if (m.from === selFrom) targets[m.to] = true;
      });
    }
    for (var i = 0; i < size * size; i++) {
      var el = cellEls[i];
      el.className = 'cmp-cell ' + (i % 2 === 0 ? 'light' : 'dark');
      el.innerHTML = '';
      var v = grid[Math.floor(i / size)][i % size];
      if (v > 0) {
        var piece = document.createElement('span');
        piece.className = 'cmp-piece ' + PN[v - 1];
        el.appendChild(piece);
      }
      if (view.yourTurn && view.status === 'running') {
        var mine = false;
        for (var k = 0; k < S.legal.length; k++) if (S.legal[k].from === i) mine = true;
        if (mine) el.classList.add('clickable');
        if (S.sel === i) el.classList.add('sel');
        if (targets[i]) el.classList.add('target');
      }
    }
  }
  function onCellClick(idx) {
    var view = S.view;
    if (!view || !view.yourTurn || view.status !== 'running') return;
    // target of the selected piece?
    if (S.sel !== null) {
      var hit = S.legal.filter(function (m) {
        return m.from === S.sel && m.to === idx;
      })[0];
      if (hit) {
        sendMove({ from: S.sel, to: idx });
        S.sel = null;
        return;
      }
    }
    // select a piece with legal moves
    var canSelect = S.legal.some(function (m) {
      return m.from === idx;
    });
    S.sel = canSelect ? idx : null;
    render(view);
  }
  async function sendMove(move) {
    try {
      var view = await api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: move });
      S.view = view;
      S.sel = null;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
      poll();
    }
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
