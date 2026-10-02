/**
 * quads-trips game shell — yavalath-style: four wins, exactly three loses.
 * Client mirrors the hex layout to show win/trip hints on empty hexes.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706'];
  var DIRS = [
    [1, 0],
    [0, 1],
    [1, -1],
    [-1, 0],
    [0, -1],
    [-1, 1],
  ];
  var SIZE = 34;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, view: null, built: false };
  var $ = function (id) {
    return document.getElementById(id);
  };

  function layout(seatCount) {
    var R = 3; // the core plays hexhex-3 for both seat counts
    var cells = [];
    var map = {};
    for (var q = -R; q <= R; q++) {
      for (var r = -R; r <= R; r++) {
        if (Math.abs(q + r) <= R) {
          map[q + ',' + r] = cells.length;
          cells.push([q, r]);
        }
      }
    }
    return {
      cells: cells,
      idx: function (q, r) {
        var v = map[q + ',' + r];
        return v === undefined ? -1 : v;
      },
    };
  }

  function px(pos) {
    var q = pos[0];
    var r = pos[1];
    return [Math.sqrt(3) * SIZE * (q + r / 2), 1.5 * SIZE * r];
  }

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
          gameSlug: 'quads-trips',
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

  function runLen(cells, L, idx, color, dir) {
    var c = L.cells[idx];
    var total = 1;
    for (var s = 0; s < 2; s++) {
      var sgn = s === 0 ? 1 : -1;
      var k = 1;
      for (;;) {
        var ni = L.idx(c[0] + dir[0] * k * sgn, c[1] + dir[1] * k * sgn);
        if (ni < 0 || cells[ni] !== color) break;
        k += 1;
      }
      total += k - 1;
    }
    return total;
  }

  function hexPoints(cx, cy) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var a = ((90 + 60 * i) * Math.PI) / 180;
      pts.push([cx + Math.cos(a) * SIZE, cy + Math.sin(a) * SIZE]);
    }
    return pts
      .map(function (p) {
        return p[0].toFixed(1) + ',' + p[1].toFixed(1);
      })
      .join(' ');
  }

  function el(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function render(view) {
    S.view = view;
    var st = view.state;
    var L = layout(st.seatCount);
    var row = $('seats-row');
    row.innerHTML = '';
    var counts = [0, 0, 0, 0];
    st.cells.forEach(function (v) {
      if (v !== 0) counts[v - 1]++;
    });
    view.seats.forEach(function (seat, i) {
      var isOut = st.out.indexOf(i) >= 0;
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' +
        (view.status === 'running' && i === view.turn ? ' active' : '') +
        (isOut ? ' out' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        (isOut ? ' \u2014 out' : ' \u00b7 ' + counts[i]);
      row.appendChild(chip);
    });

    var svg = $('board');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // compute pixel positions + bounds
    var positions = [];
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    L.cells.forEach(function (c) {
      var p = px(c);
      positions.push(p);
      minX = Math.min(minX, p[0] - SIZE);
      minY = Math.min(minY, p[1] - SIZE);
      maxX = Math.max(maxX, p[0] + SIZE);
      maxY = Math.max(maxY, p[1] + SIZE);
    });
    var pad = 12;
    svg.setAttribute(
      'viewBox',
      '0 0 ' + (maxX - minX + pad * 2).toFixed(0) + ' ' + (maxY - minY + pad * 2).toFixed(0)
    );
    var offX = -minX + pad;
    var offY = -minY + pad;
    var myTurn = view.status === 'running' && view.yourTurn;
    var me = view.yourSeat !== null && view.yourSeat >= 0 ? view.yourSeat + 1 : 0;
    // hints for my turn
    var hints = {};
    if (myTurn && me) {
      for (var i = 0; i < st.cells.length; i++) {
        if (st.cells[i] !== 0) continue;
        var sim = st.cells.slice();
        sim[i] = me;
        var win = false;
        var trip = false;
        for (var d = 0; d < DIRS.length; d++) {
          var len = runLen(sim, L, i, me, DIRS[d]);
          if (len >= 4) win = true;
          else if (len === 3) trip = true;
        }
        if (win) hints[i] = 'win';
        else if (trip) hints[i] = 'trip';
      }
    }
    L.cells.forEach(function (c, i) {
      var p = positions[i];
      var cx = p[0] + offX;
      var cy = p[1] + offY;
      var cls =
        'qt-hex' +
        (hints[i] === 'win' ? ' win-hint' : hints[i] === 'trip' ? ' trip-hint' : '') +
        (myTurn && st.cells[i] === 0 ? ' qt-open' : '');
      var hex = el('polygon', { points: hexPoints(cx, cy), class: cls });
      if (myTurn && st.cells[i] === 0) {
        (function (idx) {
          hex.addEventListener('click', function () {
            send({ cell: idx });
          });
        })(i);
      }
      svg.appendChild(hex);
    });
    L.cells.forEach(function (c, i) {
      var p = positions[i];
      var cx = p[0] + offX;
      var cy = p[1] + offY;
      if (st.cells[i] !== 0) {
        svg.appendChild(
          el('circle', {
            cx: cx,
            cy: cy,
            r: SIZE * 0.56,
            fill: COLORS[st.cells[i] - 1] || '#888',
            class: 'qt-stone',
          })
        );
      }
      if (st.lastMove && st.lastMove.idx === i) {
        svg.appendChild(
          el('circle', {
            cx: cx,
            cy: cy,
            r: SIZE * 0.72,
            fill: 'none',
            stroke: '#f59e0b',
            'stroke-width': 3,
            class: 'qt-last',
          })
        );
      }
    });

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent = 'Your turn \u2014 tap a hex (green wins, red trips, plain is safe).';
    } else {
      var who = view.seats[view.turn] ? view.seats[view.turn].name : 'the table';
      statusEl.textContent = 'Waiting for ' + who + '\u2026';
    }
  }

  function finishText(view) {
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var st = view.state;
    var ordered = (view.placement || []).slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    if (!ordered.length) return 'Finished.';
    var tail = ordered.map(function (p) {
      return '#' + p.rank + ' ' + names[p.seat] + (st.out.indexOf(p.seat) >= 0 ? ' (out)' : '');
    });
    if (st.winnerSeat === null)
      return '\uD83E\uDD1D Board full, nobody cracked it \u2014 shared. ' + tail.join(' \u00b7 ');
    return (
      '\uD83C\uDFC6 ' +
      names[st.winnerSeat] +
      ' lines up FOUR! ' +
      tail.join(' \u00b7 ') +
      (st.winnerSeat === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function send(move) {
    api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: move })
      .then(render)
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
