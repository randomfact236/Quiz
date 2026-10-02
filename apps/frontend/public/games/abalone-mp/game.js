/**
 * abalone-mp game shell — select a line of marbles, then pick a direction.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var R = 3;
  var SIZE = 38;
  var COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706'];
  var DIR_LABELS = ['\u2198', '\u2197', '\u2191', '\u2196', '\u2199', '\u2193'];
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    view: null,
    sel: [],
    built: false,
  };
  var $ = function (id) {
    return document.getElementById(id);
  };

  var LAYOUT = (function () {
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
    return { cells: cells, key: map };
  })();

  function adjIdx(a, b) {
    var ca = LAYOUT.cells[a];
    var cb = LAYOUT.cells[b];
    var dq = cb[0] - ca[0];
    var dr = cb[1] - ca[1];
    var dirs = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];
    for (var i = 0; i < 6; i++) {
      if (dirs[i][0] === dq && dirs[i][1] === dr) return i;
    }
    return -1;
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
          gameSlug: 'abalone-mp',
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
    buildDirButtons();
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

  function buildDirButtons() {
    var row = $('dir-row');
    row.innerHTML = '';
    for (var d = 0; d < 6; d++) {
      (function (dir) {
        var b = document.createElement('button');
        b.className = 'dir-btn';
        b.textContent = DIR_LABELS[dir];
        b.addEventListener('click', function () {
          onDir(dir);
        });
        row.appendChild(b);
      })(d);
    }
  }

  function el(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function hexPoints(cx, cy, size) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var a = ((90 + 60 * i) * Math.PI) / 180;
      pts.push([cx + Math.cos(a) * size, cy + Math.sin(a) * size]);
    }
    return pts
      .map(function (p) {
        return p[0].toFixed(1) + ',' + p[1].toFixed(1);
      })
      .join(' ');
  }

  function render(view) {
    S.view = view;
    var st = view.state;
    var row = $('seats-row');
    row.innerHTML = '';
    var target = st.seatCount >= 4 ? 3 : 4;
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (view.status === 'running' && i === view.turn ? ' active' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        ' \u00b7 \uD83C\uDFAF' +
        st.ejected[i] +
        '/' +
        target;
      row.appendChild(chip);
    });
    var svg = $('board');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var positions = [];
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    LAYOUT.cells.forEach(function (c) {
      var x = Math.sqrt(3) * SIZE * (c[0] + c[1] / 2);
      var y = 1.5 * SIZE * c[1];
      positions.push([x, y]);
      minX = Math.min(minX, x - SIZE);
      minY = Math.min(minY, y - SIZE);
      maxX = Math.max(maxX, x + SIZE);
      maxY = Math.max(maxY, y + SIZE);
    });
    var pad = 12;
    svg.setAttribute(
      'viewBox',
      '0 0 ' + (maxX - minX + pad * 2).toFixed(0) + ' ' + (maxY - minY + pad * 2).toFixed(0)
    );
    var offX = -minX + pad;
    var offY = -minY + pad;
    var myTurn = view.status === 'running' && view.yourTurn;
    LAYOUT.cells.forEach(function (c, i) {
      var p = positions[i];
      svg.appendChild(
        el('polygon', { points: hexPoints(p[0] + offX, p[1] + offY, SIZE * 0.97), class: 'ab-hex' })
      );
    });
    LAYOUT.cells.forEach(function (c, i) {
      var p = positions[i];
      var cx = p[0] + offX;
      var cy = p[1] + offY;
      var v = st.cells[i];
      if (v !== 0) {
        var marble = el('circle', {
          cx: cx,
          cy: cy,
          r: SIZE * 0.58,
          fill: COLORS[v - 1] || '#888',
          class: 'ab-marble' + (S.sel.indexOf(i) >= 0 ? ' sel' : ''),
        });
        if (myTurn && v === view.yourSeat + 1) {
          (function (idx) {
            marble.addEventListener('click', function () {
              onMarble(idx);
            });
          })(i);
        }
        svg.appendChild(marble);
      }
      if (st.lastMove) {
        var lm = st.lastMove;
        if (lm.ejected.indexOf(i) >= 0 || lm.marbles.indexOf(i) >= 0) {
          svg.appendChild(
            el('circle', {
              cx: cx,
              cy: cy,
              r: SIZE * 0.78,
              fill: 'none',
              stroke: '#f59e0b',
              'stroke-width': 3,
            })
          );
        }
      }
    });

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var dirBtns = $('dir-row').children;
    for (var b2 = 0; b2 < dirBtns.length; b2++) {
      dirBtns[b2].disabled = !(myTurn && S.sel.length > 0);
    }
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        S.sel.length === 0
          ? 'Your turn \u2014 tap one of your marbles (add up to two more in a line).'
          : S.sel.length +
            ' marble' +
            (S.sel.length > 1 ? 's' : '') +
            ' ready \u2014 pick a direction below.';
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
    var w = st.winnerSeat;
    var ordered = (view.placement || []).slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    if (!ordered.length) return 'Finished.';
    var tail = ordered
      .map(function (p) {
        return '#' + p.rank + ' ' + names[p.seat] + ' (' + st.ejected[p.seat] + ' thrown)';
      })
      .join(' \u00b7 ');
    if (w === null) return '\uD83E\uDD1D Shared \u2014 ' + tail;
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' throws four off the ring! ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function onMarble(idx) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn) return;
    var st = view.state;
    if (st.cells[idx] !== view.yourSeat + 1) return;
    if (S.sel.indexOf(idx) >= 0) {
      // remove from selection (keep contiguous — simplest: reset to this one)
      S.sel = [idx];
      render(view);
      return;
    }
    if (!S.sel.length) {
      S.sel = [idx];
      render(view);
      return;
    }
    if (S.sel.length >= 3) {
      S.sel = [idx];
      render(view);
      return;
    }
    // extend: must continue the same line
    var last = S.sel[S.sel.length - 1];
    var dirNext = adjIdx(last, idx);
    if (dirNext < 0) {
      flash($('status'), 'Marbles must stand in a line \u2014 starting over.');
      S.sel = [idx];
      render(view);
      return;
    }
    if (S.sel.length >= 2) {
      var dirPrev = adjIdx(S.sel[0], S.sel[1]);
      if (dirNext !== dirPrev) {
        flash($('status'), 'Keep the line straight \u2014 starting over.');
        S.sel = [idx];
        render(view);
        return;
      }
    }
    S.sel.push(idx);
    render(view);
  }

  function onDir(dir) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn || !S.sel.length) return;
    var marbles = S.sel.slice();
    S.sel = [];
    api('/' + S.party.code + '/move', {
      guestId: S.party.guestId,
      move: { marbles: marbles, dir: dir },
    })
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
