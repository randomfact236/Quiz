/**
 * ludo-mp game shell — the classic race on the MP1 party engine.
 * Move = {} — the SERVER rolls the die and picks the legal token.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var core = window.LUDOCORE;
  var storage = window.GAME_STORAGE;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
  var $ = function (id) {
    return document.getElementById(id);
  };
  var PAWN = ['p0', 'p1', 'p2', 'p3'];
  var SEATNAME = ['Red', 'Blue', 'Green', 'Amber'];

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
          gameSlug: 'ludo-mp',
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
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    } finally {
      clearTimeout(S.party.pollTimer);
      S.party.pollTimer = setTimeout(poll, cfg.pollMs);
    }
  }
  /** Build the static 15x15 board once. */
  var cellEls = null;
  function buildBoard() {
    var host = $('board');
    host.innerHTML = '';
    cellEls = [];
    for (var r = 0; r < 15; r++) {
      cellEls.push([]);
      for (var c = 0; c < 15; c++) {
        var el = document.createElement('div');
        el.className = 'lc';
        el.style.gridRow = String(r + 1);
        el.style.gridColumn = String(c + 1);
        // color path cells
        el.classList.add('path');
        el.classList.add('s' + seatZone(r, c));
        (function (rr, cc) {
          var pawns = document.createElement('span');
          pawns.className = 'pawns';
          pawns.id = 'pc-' + rr + '-' + cc;
          el.appendChild(pawns);
          el.classList.add('pc-cell');
        })(r, c);
        host.appendChild(el);
        cellEls[r].push(el);
      }
    }
    // mark home columns
    for (var s = 0; s < 4; s++) {
      for (var d = 52; d <= 55; d++) {
        var rc = core.homeRC(s, d);
        cellEls[rc.r][rc.c].classList.add('hcol');
      }
      var y = core.YARD[s];
      cellEls[y.r][y.c].classList.add('home');
    }
  }
  /** Which seat zone a cell belongs to (for coloring): yard quadrant by position. */
  function seatZone(r, c) {
    if (r < 6 && c < 6) return 0;
    if (r < 6 && c > 8) return 1;
    if (r > 8 && c < 6) return 2;
    if (r > 8 && c > 8) return 3;
    return 4; // cross paths — plain
  }
  function render(view) {
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (i === view.turn && view.status === 'running' ? ' active' : '');
      chip.style.borderColor = ['', '#e11d48', '#2563eb', '#059669', '#d97706'][i] || 'transparent';
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') +
        SEATNAME[i] +
        ' · ' +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : '') +
        ' · home ' +
        countHome(view.state, i) +
        '/2';
      row.appendChild(chip);
    });
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start…'
        : view.status === 'finished'
          ? placementText(view)
          : view.yourTurn
            ? 'Your turn — roll the die!'
            : 'Waiting…';
    renderPawns(view);
    $('die').textContent = view.state.lastRoll ? '🎲' + view.state.lastRoll : '?';
    $('btn-roll').disabled = !(view.yourTurn && view.status === 'running');
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
  }
  function countHome(state, seat) {
    var n = 0;
    for (var t = 0; t < 2; t++) if (state.dist[seat * 2 + t] === 56) n += 1;
    return n;
  }
  function placementText(view) {
    if (!view.placement) return 'Finished.';
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var first = view.placement.filter(function (p) {
      return p.rank === 1;
    })[0];
    return '🏆 ' + names[first.seat] + ' gets both tokens home first!';
  }
  function renderPawns(view) {
    // clear all pawn holders
    for (var r = 0; r < 15; r++)
      for (var c = 0; c < 15; c++) {
        var holder = $('pc-' + r + '-' + c);
        if (holder) holder.innerHTML = '';
      }
    var dist = view.state.dist;
    var yardCount = [0, 0, 0, 0];
    for (var seat = 0; seat < view.state.seatCount; seat++) {
      for (var t = 0; t < 2; t++) {
        var d = dist[seat * 2 + t];
        var rc = null;
        var yard = false;
        if (d === -1) {
          var y = core.YARD[seat];
          var off = yardCount[seat];
          yardCount[seat] += 1;
          rc = { r: y.r + (off === 0 ? -1 : 1), c: y.c };
          yard = true;
        } else if (d === 56) {
          rc = core.homeRC(seat, 55);
        } else if (d >= 52) {
          rc = core.homeRC(seat, d);
        } else if (d >= 1) {
          var ring = core.ringCell(seat, d);
          rc = core.ringRC(ring);
        }
        if (!rc) continue;
        var holder2 = $('pc-' + rc.r + '-' + rc.c);
        if (!holder2) continue;
        var el = document.createElement('span');
        el.className = 'pawn ' + PAWN[seat] + (yard ? ' yard' : '');
        el.title = SEATNAME[seat] + ' token ' + (t + 1);
        holder2.appendChild(el);
      }
    }
  }
  $('btn-roll').addEventListener('click', async function () {
    $('btn-roll').disabled = true;
    try {
      var view = await api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: {} });
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
