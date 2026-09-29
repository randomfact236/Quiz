/**
 * blokus-4p game shell — the 20x20 corner-touch original on the MP1 engine.
 * Move = {piece, rot, r, c} (anchor = top-left of the oriented bounding box)
 * or {pass:true}. Legality previewed locally via BLKCORE; server re-validates.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var core = window.BLKCORE;
  var storage = window.GAME_STORAGE;
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    sel: null,
    rot: 0,
    view: null,
  };
  var $ = function (id) {
    return document.getElementById(id);
  };
  var CN = ['c0', 'c1', 'c2', 'c3'];
  var SIZE = 20;

  function show(screen) {
    ['menu', 'game'].forEach(function (s) {
      $('screen-' + s).hidden = s !== screen;
    });
  }
  async function ensureGuest() {
    // Mint/refresh the signed guest pair once per browser (shared bootstrap).
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
  async function initMenu() {
    $('btn-create').addEventListener('click', async function () {
      await ensureGuest();
      var name = $('player-name').value.trim() || S.party.name;
      storage.set('name', name);
      try {
        var r = await api('', {
          gameSlug: 'blokus-4p',
          playerName: name,
          guestId: S.party.guestId,
          seats: 4,
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
    if (cfg.partyCode) {
      $('join-code').value = cfg.partyCode;
    }
  }
  async function enterGame() {
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
    var host = $('board');
    host.innerHTML = '';
    host.style.gridTemplateColumns = 'repeat(' + SIZE + ', 1fr)';
    cellEls = [];
    for (var i = 0; i < SIZE * SIZE; i++) {
      var el = document.createElement('div');
      el.className = 'blk-cell';
      el.addEventListener(
        'mouseover',
        (function (idx) {
          return function () {
            hoverCell(idx);
          };
        })(i)
      );
      el.addEventListener('mouseleave', function () {
        clearPreview();
      });
      el.addEventListener(
        'click',
        (function (idx) {
          return function () {
            clickCell(idx);
          };
        })(i)
      );
      host.appendChild(el);
      cellEls.push(el);
    }
  }
  /** Mini shape preview inside a hand tile. */
  function miniShape(pieceId) {
    var cells = core.orientedCells(pieceId, 0);
    var maxR = 0,
      maxC = 0,
      i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i][0] > maxR) maxR = cells[i][0];
      if (cells[i][1] > maxC) maxC = cells[i][1];
    }
    var grid = document.createElement('div');
    grid.className = 'mini';
    grid.style.gridTemplateColumns = 'repeat(' + (maxC + 1) + ', 1fr)';
    var map = {};
    for (i = 0; i < cells.length; i++) map[cells[i][0] + ',' + cells[i][1]] = true;
    for (var r = 0; r <= maxR; r++)
      for (var c = 0; c <= maxC; c++) {
        var cell = document.createElement('i');
        if (!map[r + ',' + c]) cell.className = 'empty';
        grid.appendChild(cell);
      }
    return grid;
  }
  function render(view) {
    // seats
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (i === view.turn && view.status === 'running' ? ' active' : '');
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : '') +
        ' · ' +
        (view.state.placements ? view.state.placements[i] : 0) +
        ' sq';
      row.appendChild(chip);
    });
    // board squares
    for (var i = 0; i < SIZE * SIZE; i++) {
      var r = Math.floor(i / SIZE),
        c = i % SIZE;
      var v = view.state.grid[r][c];
      var el = cellEls[i];
      el.className = 'blk-cell' + (v > 0 ? ' ' + CN[v - 1] : '');
      if (
        view.yourTurn &&
        view.status === 'running' &&
        view.state.placements[view.yourSeat] === 0
      ) {
        var sc = view.yourSeat;
        var corners = [
          [0, 0],
          [0, 19],
          [19, 0],
          [19, 19],
        ];
        if (r === corners[sc][0] && c === corners[sc][1]) el.classList.add('corner-hint');
      }
    }
    // hand
    var handHost = $('hand');
    handHost.innerHTML = '';
    var hand = view.state.hands[view.yourSeat] || [];
    $('hand-count').textContent = '(' + hand.length + ' left)';
    hand.forEach(function (pieceId) {
      var tile = document.createElement('div');
      tile.className = 'blk-piece' + (S.sel === pieceId ? ' sel' : '');
      tile.style.color = ['#e11d48', '#2563eb', '#059669', '#d97706'][view.yourSeat] || '#888';
      tile.appendChild(miniShape(pieceId));
      tile.addEventListener('click', function () {
        if (!view.yourTurn || view.status !== 'running') return;
        S.sel = pieceId;
        S.rot = 0;
        render(view);
      });
      handHost.appendChild(tile);
    });
    // status + buttons
    $('status').textContent = statusText(view);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var canPass =
      view.yourTurn && view.status === 'running' && !core.hasAnyMove(view.state, view.yourSeat);
    $('btn-pass').hidden = !canPass;
  }
  function statusText(view) {
    if (view.status === 'waiting') return 'Waiting for the host to start…';
    if (view.status === 'finished') {
      if (!view.placement) return 'Finished.';
      var byRank = view.placement.slice().sort(function (a, b) {
        return a.rank - b.rank;
      });
      var names = view.seats.map(function (s) {
        return s.name;
      });
      return (
        '🏆 ' +
        names[byRank[0].seat] +
        ' wins with ' +
        view.state.placements[byRank[0].seat] +
        ' squares!'
      );
    }
    if (view.yourTurn) {
      if (!core.hasAnyMove(view.state, view.yourSeat))
        return 'No legal placement — pass your turn.';
      return S.sel === null
        ? 'Your turn — pick a piece, then click the board.'
        : 'Now click a board cell to place it.';
    }
    return 'Waiting…';
  }
  function clearPreview() {
    if (S.sel === null || !S.view) return;
    for (var i = 0; i < SIZE * SIZE; i++) {
      cellEls[i].classList.remove('preview', 'illegal');
    }
  }
  function hoverCell(idx) {
    if (S.sel === null || !S.view || !S.view.yourTurn || S.view.status !== 'running') return;
    clearPreview();
    var r = Math.floor(idx / SIZE),
      c = idx % SIZE;
    var seat = S.view.yourSeat;
    var ok =
      core.validateMove(S.view.state, seat, { piece: S.sel, rot: S.rot, r: r, c: c }) === null;
    var cells = core.orientedCells(S.sel, S.rot);
    for (var i = 0; i < cells.length; i++) {
      var rr = r + cells[i][0],
        cc = c + cells[i][1];
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) continue;
      cellEls[rr * SIZE + cc].classList.add(ok ? 'preview' : 'illegal');
    }
  }
  async function clickCell(idx) {
    if (S.sel === null || !S.view || !S.view.yourTurn || S.view.status !== 'running') return;
    var r = Math.floor(idx / SIZE),
      c = idx % SIZE;
    var mv = { piece: S.sel, rot: S.rot, r: r, c: c };
    var err = core.validateMove(S.view.state, S.view.yourSeat, mv);
    if (err) {
      flash($('status'), err);
      return;
    }
    try {
      var view = await api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: mv });
      S.view = view;
      S.sel = null;
      S.rot = 0;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
      poll();
    }
  }
  $('btn-rotate').addEventListener('click', function () {
    if (S.sel === null) return flash($('status'), 'Pick a piece first.');
    var n = core.orientations(S.sel).length;
    S.rot = (S.rot + 1) % n;
    render(S.view);
  });
  $('btn-pass').addEventListener('click', async function () {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { pass: true },
      });
      S.view = view;
      S.sel = null;
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
