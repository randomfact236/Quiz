/**
 * quadwall game shell — multiplayer Quoridor: race home, wall the rest.
 * Walls are picked in a mode, then dropped on the highlighted slot.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var N = 9;
  var M = 23;
  var CELL = 46;
  var PAWN_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706'];
  var GOAL_LABEL = { 0: 'top', 1: 'bottom', 2: 'right', 3: 'left' };
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    view: null,
    mode: 'move',
    built: false,
  };
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
          gameSlug: 'quadwall',
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

  /* ---- local mirror of the movement rules (for highlighting) ---- */
  function destsFor(st, seat) {
    var me = st.pawns[seat];
    var hb = function (rb, c) {
      var r = rb - 1;
      if (c <= 7 && st.hw[r * 8 + c]) return true;
      if (c >= 1 && st.hw[r * 8 + c - 1]) return true;
      return false;
    };
    var vb = function (r, cb) {
      var c2 = cb - 1;
      if (r <= 7 && st.vw[r * 8 + c2]) return true;
      if (r >= 1 && st.vw[(r - 1) * 8 + c2]) return true;
      return false;
    };
    var at = function (r, c) {
      for (var i = 0; i < st.pawns.length; i++) {
        if (st.pawns[i][0] === r && st.pawns[i][1] === c) return i;
      }
      return -1;
    };
    var out = [];
    var dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (var k = 0; k < 4; k++) {
      var dr = dirs[k][0];
      var dc = dirs[k][1];
      var tr = me[0] + dr;
      var tc = me[1] + dc;
      if (tr < 0 || tr > 8 || tc < 0 || tc > 8) continue;
      var blocked =
        dr === -1
          ? hb(me[0], me[1])
          : dr === 1
            ? hb(me[0] + 1, me[1])
            : dc === -1
              ? vb(me[0], me[1])
              : vb(me[0], me[1] + 1);
      if (blocked) continue;
      if (at(tr, tc) < 0) {
        out.push([tr, tc]);
        continue;
      }
      var br = tr + dr;
      var bc = tc + dc;
      var jumped = false;
      if (br >= 0 && br <= 8 && bc >= 0 && bc <= 8 && at(br, bc) < 0) {
        var bBlk =
          dr === -1
            ? hb(tr, tc)
            : dr === 1
              ? hb(tr + 1, tc)
              : dc === -1
                ? vb(tr, tc)
                : vb(tr, tc + 1);
        if (!bBlk) {
          out.push([br, bc]);
          jumped = true;
        }
      }
      if (!jumped) {
        var sides =
          dr === 0
            ? [
                [1, 0],
                [-1, 0],
              ]
            : [
                [0, 1],
                [0, -1],
              ];
        for (var s = 0; s < 2; s++) {
          var lr = tr + sides[s][0];
          var lc = tc + sides[s][1];
          if (lr < 0 || lr > 8 || lc < 0 || lc > 8) continue;
          if (at(lr, lc) >= 0) continue;
          out.push([lr, lc]);
        }
      }
    }
    return out;
  }

  function cx(c) {
    return M + CELL / 2 + c * CELL;
  }
  function el(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function render(view) {
    S.view = view;
    var st = view.state;
    var row = $('seats-row');
    row.innerHTML = '';
    st.pawns.forEach(function (p, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (view.status === 'running' && i === view.turn ? ' active' : '');
      var seat = view.seats[i];
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        (seat ? seat.name : 'Seat ' + i) +
        (seat && seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        ' \u00b7 ' +
        st.left[i] +
        ' walls';
      row.appendChild(chip);
    });

    var svg = $('board');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // grid lines
    for (var i = 0; i <= N; i++) {
      svg.appendChild(
        el('line', {
          x1: M,
          y1: M + i * CELL,
          x2: M + N * CELL,
          y2: M + i * CELL,
          class: 'qw-cellline',
        })
      );
      svg.appendChild(
        el('line', {
          x1: M + i * CELL,
          y1: M,
          x2: M + i * CELL,
          y2: M + N * CELL,
          class: 'qw-cellline',
        })
      );
    }
    // my goal edge highlight
    if (view.yourSeat !== null && view.yourSeat >= 0) {
      var goal = goalFor(st.seatCount, view.yourSeat);
      var g;
      if (goal === 0) g = { x1: M + 4, y1: M, x2: M + N * CELL - 4, y2: M };
      else if (goal === 1)
        g = { x1: M + 4, y1: M + N * CELL, x2: M + N * CELL - 4, y2: M + N * CELL };
      else if (goal === 2)
        g = { x1: M + N * CELL, y1: M + 4, x2: M + N * CELL, y2: M + N * CELL - 4 };
      else g = { x1: M, y1: M + 4, x2: M, y2: M + N * CELL - 4 };
      g.class = 'qw-goal';
      svg.appendChild(el('line', g));
    }
    // walls
    var lastWall = st.lastMove && st.lastMove.kind === 'wall' ? st.lastMove : null;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (st.hw[r * 8 + c]) {
          var isLast = lastWall && lastWall.o === 'h' && lastWall.r === r && lastWall.c === c;
          svg.appendChild(
            el('rect', {
              x: M + c * CELL + 3,
              y: M + (r + 1) * CELL - 5,
              width: 2 * CELL - 6,
              height: 10,
              rx: 3,
              class: 'qw-wall' + (isLast ? ' last' : ''),
            })
          );
        }
        if (st.vw[r * 8 + c]) {
          var isLastV = lastWall && lastWall.o === 'v' && lastWall.r === r && lastWall.c === c;
          svg.appendChild(
            el('rect', {
              x: M + (c + 1) * CELL - 5,
              y: M + r * CELL + 3,
              width: 10,
              height: 2 * CELL - 6,
              rx: 3,
              class: 'qw-wall' + (isLastV ? ' last' : ''),
            })
          );
        }
      }
    }
    // my destinations
    var myDests = [];
    if (view.status === 'running' && view.yourTurn && S.mode === 'move') {
      myDests = destsFor(st, view.yourSeat);
      myDests.forEach(function (d) {
        svg.appendChild(el('circle', { cx: cx(d[1]), cy: cx(d[0]), r: 17, class: 'qw-dest' }));
      });
    }
    // pawns
    var lastPawn = st.lastMove && st.lastMove.kind === 'pawn' ? st.lastMove : null;
    st.pawns.forEach(function (p, i) {
      var isTurn = view.status === 'running' && i === view.turn;
      var cls = 'qw-pawn' + (i === view.yourSeat ? ' mine' : '') + (isTurn ? ' turn' : '');
      var c2 = el('circle', {
        cx: cx(p[1]),
        cy: cx(p[0]),
        r: 15,
        fill: PAWN_COLORS[i] || '#888',
        class: cls,
      });
      if (lastPawn && lastPawn.seat === i) {
        c2.setAttribute('stroke', '#6d5bd0');
      }
      svg.appendChild(c2);
      var t = el('text', {
        x: cx(p[1]),
        y: cx(p[0]) + 5,
        'text-anchor': 'middle',
        'font-size': '14',
        'font-weight': '700',
        fill: '#fff',
      });
      t.textContent = String(i + 1);
      svg.appendChild(t);
    });
    // wall slots (mode)
    if (view.status === 'running' && view.yourTurn && (S.mode === 'h' || S.mode === 'v')) {
      for (var r2 = 0; r2 < 8; r2++) {
        for (var c3 = 0; c3 < 8; c3++) {
          var attrs;
          if (S.mode === 'h') {
            attrs = {
              x: M + c3 * CELL + 4,
              y: M + (r2 + 1) * CELL - 9,
              width: 2 * CELL - 8,
              height: 18,
              class: 'qw-slot',
            };
          } else {
            attrs = {
              x: M + (c3 + 1) * CELL - 9,
              y: M + r2 * CELL + 4,
              width: 18,
              height: 2 * CELL - 8,
              class: 'qw-slot',
            };
          }
          (function (r, c, a) {
            var slot = el('rect', a);
            slot.addEventListener('click', function () {
              send({ wall: S.mode, r: r, c: c });
            });
            svg.appendChild(slot);
          })(r2, c3, attrs);
        }
      }
    }
    // cell click layer (move mode)
    if (view.status === 'running' && view.yourTurn && S.mode === 'move') {
      for (var r3 = 0; r3 < N; r3++) {
        for (var c4 = 0; c4 < N; c4++) {
          (function (r, c) {
            var hit = el('rect', {
              x: M + c * CELL + 2,
              y: M + r * CELL + 2,
              width: CELL - 4,
              height: CELL - 4,
              class: 'qw-hit',
            });
            hit.addEventListener('click', function () {
              var ok = myDests.some(function (d) {
                return d[0] === r && d[1] === c;
              });
              if (ok) send({ pawn: [r, c] });
              else flash($('status'), 'Your pawn cannot go there.');
            });
            svg.appendChild(hit);
          })(r3, c4);
        }
      }
    }
    // wall mode slot layer must sit above pawns for grabs; fine as-is (drawn last for move; slots above)
    updateModeButtons(view);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        S.mode === 'move'
          ? 'Your turn \u2014 tap a highlighted square to move.'
          : 'Your turn \u2014 tap a wall slot to drop a ' + S.mode.toUpperCase() + ' wall.';
    } else {
      var who = view.seats[view.turn] ? view.seats[view.turn].name : 'the table';
      statusEl.textContent = 'Waiting for ' + who + '\u2026';
    }
  }

  function goalFor(seatCount, seat) {
    var goals = seatCount >= 4 ? [0, 1, 2, 3] : [0, 1, 2];
    return goals[seat];
  }

  function updateModeButtons(view) {
    var mine = view.yourSeat !== null && view.yourSeat >= 0 ? view.state.left[view.yourSeat] : 0;
    var active = view.status === 'running' && view.yourTurn;
    var mBtn = $('mode-move');
    var hBtn = $('mode-h');
    var vBtn = $('mode-v');
    mBtn.className = 'mode-btn' + (S.mode === 'move' ? ' on' : '');
    hBtn.className = 'mode-btn' + (S.mode === 'h' ? ' on' : '');
    vBtn.className = 'mode-btn' + (S.mode === 'v' ? ' on' : '');
    mBtn.disabled = !active;
    hBtn.disabled = !active || mine <= 0;
    vBtn.disabled = !active || mine <= 0;
    hBtn.textContent = '\uD83E\uDDF1 \u2014 wall (' + mine + ')';
    vBtn.textContent = '\uD83E\uDDF1 | wall (' + mine + ')';
  }

  function finishText(view) {
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var ordered = (view.placement || []).slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    if (!ordered.length) return 'Finished.';
    var w = view.state.winnerSeat;
    var tail = ordered
      .slice(1)
      .map(function (p) {
        return '#' + p.rank + ' ' + names[p.seat];
      })
      .join(' \u00b7 ');
    if (w === null) return '\uD83E\uDD1D Shared finish \u2014 ' + tail;
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' reaches the ' +
      GOAL_LABEL[goalFor(view.state.seatCount, w)] +
      ' edge first! ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function send(move) {
    api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: move })
      .then(function (view) {
        if (move.wall) S.mode = 'move';
        render(view);
      })
      .catch(function (e) {
        flash($('status'), e.message);
        poll();
      });
  }

  function flash(target, msg) {
    if (!target) return;
    target.textContent = msg;
    target.classList.add('flash');
    setTimeout(function () {
      target.classList.remove('flash');
    }, 1400);
  }

  $('mode-move').addEventListener('click', function () {
    S.mode = 'move';
    if (S.view) render(S.view);
  });
  $('mode-h').addEventListener('click', function () {
    S.mode = 'h';
    if (S.view) render(S.view);
  });
  $('mode-v').addEventListener('click', function () {
    S.mode = 'v';
    if (S.view) render(S.view);
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
  document.addEventListener('DOMContentLoaded', initMenu);
})();
