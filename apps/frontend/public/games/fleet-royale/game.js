/**
 * fleet-royale game shell — shared-sea battleship on the MP1 engine.
 * Moves: {fleet:[{cells}..]} while placing | {shot: cell} in battle.
 * The server hides live fleets; eliminated fleets (and the finish) reveal.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var ROWS = 8;
  var COLS = 8;
  var SIZES = [3, 2, 2];
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, view: null };
  var placing = { k: 0, rot: 'h', ships: [null, null, null] };
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
          gameSlug: 'fleet-royale',
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

  function cellIndex(r, c) {
    return r * COLS + c;
  }
  function myFleetFrom(view) {
    var f = view.state.fleets[view.yourSeat];
    return f || null;
  }
  function committed(view) {
    return !!view.state.fleets[view.yourSeat];
  }

  function render(view) {
    S.view = view;
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var out = view.state.eliminated.indexOf(i) >= 0;
      var left = view.state.segmentsLeft ? view.state.segmentsLeft[i] : '?';
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' +
        (view.status === 'running' && view.state.phase === 'battle' && i === view.turn
          ? ' active'
          : '') +
        (out ? ' out' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        (out ? ' down' : ' \u00b7 ' + left + '/' + 7 + ' seg');
      row.appendChild(chip);
    });

    var placingPhase = view.status === 'running' && view.state.phase === 'placing';
    var battlePhase = view.status === 'running' && view.state.phase === 'battle';
    var iAmPlacing = placingPhase && !committed(view);
    $('placing-bar').hidden = !iAmPlacing;
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');

    // grid
    var grid = $('grid');
    if (grid.children.length !== ROWS * COLS) {
      grid.innerHTML = '';
      for (var i = 0; i < ROWS * COLS; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.className = 'fr-cell';
          b.addEventListener('click', function () {
            onCell(idx);
          });
          grid.appendChild(b);
        })(i);
      }
    }
    var own = myFleetFrom(view) || placing.ships.filter(Boolean);
    var ownSet = {};
    (own || []).forEach(function (ship) {
      if (ship && ship.cells)
        ship.cells.forEach(function (x) {
          ownSet[x] = true;
        });
    });
    // eliminated fleets (revealed) for faint outlines
    var revealedSet = {};
    view.state.fleets.forEach(function (f, seat) {
      if (!f || seat === view.yourSeat) return;
      if (view.state.eliminated.indexOf(seat) >= 0) {
        f.forEach(function (ship) {
          ship.cells.forEach(function (x) {
            revealedSet[x] = true;
          });
        });
      }
    });
    for (var k = 0; k < ROWS * COLS; k++) {
      var cell = grid.children[k];
      var fired = view.state.fired[k];
      var cls = 'fr-cell';
      var txt = '';
      if (fired === 1) {
        cls += ' miss';
        txt = '\u00b7';
      } else if (fired === 2) {
        cls += ' hit';
        txt = '\u2715';
      } else {
        if (ownSet[k]) cls += ' own';
        else if (revealedSet[k]) cls += ' revealed';
      }
      cell.className = cls;
      cell.textContent = txt;
      var clickable = false;
      if (iAmPlacing) clickable = true;
      // any unfired cell is fireable — own waters included (fleets overlap,
      // and the server allows it so shared cells can never deadlock)
      else if (battlePhase && view.yourTurn && fired === 0) clickable = true;
      cell.disabled = !clickable;
    }
    $('phase-hint').textContent = iAmPlacing
      ? 'Lay your fleet: ' +
        (placing.k < SIZES.length
          ? 'ship ' +
            (placing.k + 1) +
            ' (' +
            SIZES[placing.k] +
            ' cells, ' +
            (placing.rot === 'h' ? 'horizontal' : 'vertical') +
            ')'
          : 'all ships ready \u2014 lay the fleet!')
      : battlePhase
        ? 'Fire at any cell that has not been fired at. Hits are public \u2014 and your own waters are fair game (careful!).'
        : '';
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start\u2026'
        : view.status === 'finished'
          ? placementText(view)
          : placingPhase
            ? committed(view)
              ? 'Fleet laid \u2014 waiting for the other captains\u2026'
              : 'Lay your secret fleet.'
            : view.yourTurn
              ? 'Your turn \u2014 fire!'
              : 'Waiting for the next shot\u2026';
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
      ' rules the sea! ' +
      ordered
        .map(function (p) {
          return '#' + p.rank + ' ' + names[p.seat];
        })
        .join(' \u00b7 ') +
      (mine === 1 ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function onCell(idx) {
    var view = S.view;
    if (!view) return;
    if ($('placing-bar').hidden === false && !committed(view)) {
      placeShipAt(view, idx);
      return;
    }
    if (view.status !== 'running' || view.state.phase !== 'battle' || !view.yourTurn) return;
    fire(idx);
  }
  function placeShipAt(view, idx) {
    if (placing.k >= SIZES.length) return;
    var size = SIZES[placing.k];
    var r = Math.floor(idx / COLS);
    var c = idx % COLS;
    var cells = [];
    for (var i = 0; i < size; i++) {
      var rr = placing.rot === 'h' ? r : r + i;
      var cc = placing.rot === 'h' ? c + i : c;
      if (rr >= ROWS || cc >= COLS) return flash($('status'), 'That does not fit there.');
      var ci = cellIndex(rr, cc);
      for (var j = 0; j < placing.k; j++) {
        if (placing.ships[j].cells.indexOf(ci) >= 0)
          return flash($('status'), 'Ships cannot overlap.');
      }
      cells.push(ci);
    }
    placing.ships[placing.k] = { cells: cells };
    placing.k++;
    if (placing.k === SIZES.length) $('btn-submit').disabled = false;
    render(view);
  }
  function randomFleet() {
    var ships = [];
    for (var s = 0; s < SIZES.length; s++) {
      var size = SIZES[s];
      var placedShip = null;
      for (var tryN = 0; tryN < 400 && !placedShip; tryN++) {
        var horiz = Math.random() < 0.5;
        var r = Math.floor(Math.random() * (horiz ? ROWS : ROWS - size + 1));
        var c = Math.floor(Math.random() * (horiz ? COLS - size + 1 : COLS));
        var cells = [];
        var ok = true;
        for (var i = 0; i < size; i++) {
          var ci = cellIndex(horiz ? r : r + i, horiz ? c + i : c);
          cells.push(ci);
          for (var j = 0; j < ships.length; j++) {
            if (ships[j].cells.indexOf(ci) >= 0) {
              ok = false;
              break;
            }
          }
          if (!ok) break;
        }
        if (ok) placedShip = { cells: cells };
      }
      ships.push(placedShip);
    }
    return ships;
  }
  function fire(idx) {
    api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: { shot: idx } })
      .then(render)
      .catch(function (e) {
        flash($('status'), e.message);
        poll();
      });
  }
  $('btn-random').addEventListener('click', function () {
    if (!S.view || committed(S.view)) return;
    placing.ships = randomFleet();
    placing.k = SIZES.length;
    $('btn-submit').disabled = false;
    poll();
  });
  $('btn-rotate').addEventListener('click', function () {
    if (!S.view || committed(S.view)) return;
    placing.rot = placing.rot === 'h' ? 'v' : 'h';
    poll();
  });
  $('btn-clear').addEventListener('click', function () {
    if (!S.view || committed(S.view)) return;
    placing = { k: 0, rot: placing.rot, ships: [null, null, null] };
    $('btn-submit').disabled = true;
    poll();
  });
  $('btn-submit').addEventListener('click', async function () {
    try {
      var fleet = placing.ships.map(function (s) {
        return { cells: s.cells.slice() };
      });
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { fleet: fleet },
      });
      placing = { k: 0, rot: placing.rot, ships: [null, null, null] };
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
