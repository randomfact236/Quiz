/**
 * morris-mp game shell — place, slide, mill, pull. Four-ring board.
 * point = ring*8 + i; i: 0 N, 1 NE, 2 E, 3 SE, 4 S, 5 SW, 6 W, 7 NW.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var RINGS = 4;
  var COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706'];
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    view: null,
    sel: -1,
    built: false,
  };
  var $ = function (id) {
    return document.getElementById(id);
  };

  /* geometry: ring squares inset by 100px; canvas 520 */
  function pointPos(ring, i) {
    var lo = 60 + ring * 100;
    var hi = 460 - ring * 100;
    var mid = 260;
    var pairs = [
      [mid, lo],
      [hi, lo],
      [hi, mid],
      [hi, hi],
      [mid, hi],
      [lo, hi],
      [lo, mid],
      [lo, lo],
    ];
    return pairs[i];
  }
  function adj(a, b) {
    var ra = Math.floor(a / 8);
    var ia = a % 8;
    var rb = Math.floor(b / 8);
    var ib = b % 8;
    if (ra === rb && (Math.abs(ia - ib) === 1 || Math.abs(ia - ib) === 7)) return true;
    if (ia === ib && Math.abs(ra - rb) === 1) return true;
    return false;
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
          gameSlug: 'morris-mp',
          playerName: name,
          guestId: S.party.guestId,
          seats: 3,
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
    var onBoard = [0, 0, 0, 0];
    st.points.forEach(function (v) {
      if (v !== 0) onBoard[v - 1]++;
    });
    view.seats.forEach(function (seat, i) {
      var isOut = st.out.indexOf(i) >= 0;
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (view.status === 'running' && i === view.turn ? ' active' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        ' \u00b7 ' +
        st.hand[i] +
        ' hand \u00b7 ' +
        onBoard[i] +
        (isOut ? ' \u2014 out' : '');
      row.appendChild(chip);
    });

    var svg = $('board');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (var ring = 0; ring < RINGS; ring++) {
      var lo = 60 + ring * 100;
      var hi = 460 - ring * 100;
      svg.appendChild(
        el('rect', { x: lo, y: lo, width: hi - lo, height: hi - lo, class: 'ml-ring' })
      );
    }
    for (var i = 0; i < 8; i++) {
      var a = pointPos(0, i);
      var b = pointPos(RINGS - 1, i);
      svg.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'ml-spoke' }));
    }
    var myTurn = view.status === 'running' && view.yourTurn;
    var me = view.yourSeat !== null && view.yourSeat >= 0 ? view.yourSeat + 1 : 0;
    var dests = [];
    if (S.sel >= 0 && myTurn && st.phaseTurn === 'move') {
      for (var p2 = 0; p2 < st.points.length; p2++) {
        if (st.points[p2] === 0 && adj(S.sel, p2)) dests.push(p2);
      }
    }
    for (var p = 0; p < st.points.length; p++) {
      var ringP = Math.floor(p / 8);
      var iP = p % 8;
      var pos = pointPos(ringP, iP);
      var v = st.points[p];
      var circle = el('circle', { cx: pos[0], cy: pos[1], r: 12, class: 'ml-point' });
      if (v !== 0) circle.setAttribute('fill', COLORS[v - 1] || '#888');
      if (S.sel === p) circle.setAttribute('class', 'ml-point sel');
      if (dests.indexOf(p) >= 0) circle.setAttribute('class', 'ml-point dest');
      if (myTurn) {
        (function (idx) {
          circle.addEventListener('click', function () {
            onPoint(idx);
          });
        })(p);
      }
      svg.appendChild(circle);
      if (v !== 0) {
        var t = el('text', {
          x: pos[0],
          y: pos[1] + 4,
          'text-anchor': 'middle',
          'font-size': '11',
          'font-weight': '800',
          fill: '#fff',
          'pointer-events': 'none',
        });
        t.textContent = String(iP + 1);
        svg.appendChild(t);
      }
    }
    void me;

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      if (st.pending > 0) {
        statusEl.textContent = 'A MILL! Tap an enemy stone to pull it off the board.';
      } else if (st.phaseTurn === 'place') {
        statusEl.textContent = 'Placing \u2014 tap an empty point (mill three in a line!).';
      } else if (S.sel < 0) {
        statusEl.textContent = 'Sliding \u2014 tap one of your stones.';
      } else {
        statusEl.textContent = 'Now tap a dashed neighbour.';
      }
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
        return '#' + p.rank + ' ' + names[p.seat] + (st.out.indexOf(p.seat) >= 0 ? ' (out)' : '');
      })
      .join(' \u00b7 ');
    if (w === null) return '\uD83E\uDD1D Shared \u2014 ' + tail;
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' mills the last colour down! ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function onPoint(idx) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn) return;
    var st = view.state;
    var me = view.yourSeat + 1;
    if (st.pending > 0) {
      if (st.points[idx] !== 0 && st.points[idx] !== me) {
        send({ remove: idx });
      } else {
        flash($('status'), 'Pull an ENEMY stone.');
      }
      return;
    }
    if (st.phaseTurn === 'place') {
      if (st.points[idx] === 0) send({ place: idx });
      else flash($('status'), 'That point is taken.');
      return;
    }
    // movement
    if (S.sel >= 0) {
      if (st.points[idx] === 0 && adj(S.sel, idx)) {
        send({ from: S.sel, to: idx });
        return;
      }
      if (st.points[idx] === me) {
        S.sel = idx;
        render(view);
        return;
      }
      flash($('status'), 'Stones slide to a dashed neighbour.');
      return;
    }
    if (st.points[idx] === me) {
      S.sel = idx;
      render(view);
    }
  }

  function send(move) {
    api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: move })
      .then(function (v) {
        S.sel = -1;
        render(v);
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
