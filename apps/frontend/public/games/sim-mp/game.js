/**
 * sim-mp game shell — draw edges, never close a triangle of your colour.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706'];
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    view: null,
    dots: 0,
    built: false,
  };
  var $ = function (id) {
    return document.getElementById(id);
  };

  function dotCount(seatCount) {
    return seatCount >= 4 ? 7 : 6;
  }
  function dotPositions(n) {
    var out = [];
    var cx = 230;
    var cy = 230;
    var radius = n >= 7 ? 165 : 180;
    for (var i = 0; i < Math.min(n, 6); i++) {
      var ang = (-90 + i * 60) * (Math.PI / 180);
      out.push([cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius]);
    }
    if (n >= 7) out.push([cx, cy]);
    return out;
  }
  function edgeList(n) {
    var out = [];
    for (var u = 0; u < n; u++) {
      for (var v = u + 1; v < n; v++) out.push([u, v]);
    }
    return out;
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
          gameSlug: 'sim-mp',
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

  function el(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function render(view) {
    S.view = view;
    var st = view.state;
    var n = dotCount(st.seatCount);
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      var isOut = st.out.indexOf(i) >= 0;
      chip.className =
        'seat-chip' +
        (view.status === 'running' && i === view.turn ? ' active' : '') +
        (isOut ? ' out' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        (isOut ? ' \u2014 out' : '');
      row.appendChild(chip);
    });

    var svg = $('board');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var pos = dotPositions(n);
    var edges = edgeList(n);
    var myTurn = view.status === 'running' && view.yourTurn;
    var lastEdge = st.lastMove ? st.lastMove.edge : -1;
    for (var e = 0; e < edges.length; e++) {
      var a = pos[edges[e][0]];
      var b = pos[edges[e][1]];
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var len = Math.hypot(dx, dy) || 1;
      var ux = dx / len;
      var uy = dy / len;
      var x1 = a[0] + ux * 17;
      var y1 = a[1] + uy * 17;
      var x2 = b[0] - ux * 17;
      var y2 = b[1] - uy * 17;
      var color = st.edgeColor[e];
      if (color >= 0) {
        var line = el('line', {
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2,
          class: 'sim-drawn' + (e === lastEdge ? ' last' : ''),
        });
        line.setAttribute('stroke', COLORS[color] || '#888');
        svg.appendChild(line);
      } else {
        svg.appendChild(el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'sim-free' }));
        if (myTurn) {
          (function (idx) {
            var hit = el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'sim-hit' });
            hit.addEventListener('click', function () {
              send({ edge: idx });
            });
            svg.appendChild(hit);
          })(e);
        }
      }
    }
    pos.forEach(function (p, i) {
      svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 17, class: 'sim-dot' }));
      var t = el('text', { x: p[0], y: p[1] + 5, class: 'sim-label' });
      t.textContent = String(i + 1);
      svg.appendChild(t);
    });

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        'Your turn \u2014 tap a faint line to draw it (never close your own triangle).';
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
    if (st.winnerSeat === null) {
      return (
        '\uD83E\uDD1D Everyone dodged the trap \u2014 no triangles closed! ' + tail.join(' \u00b7 ')
      );
    }
    return (
      '\uD83C\uDFC6 ' +
      names[st.winnerSeat] +
      ' outlasted them all! ' +
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
