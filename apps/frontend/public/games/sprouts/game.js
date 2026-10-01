/**
 * sprouts game shell — draw lines between live dots; every line plants a
 * new dot; when nobody can draw, the last mover wins.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    view: null,
    sel: null,
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
          gameSlug: 'sprouts',
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

  function polyPath(poly, closed) {
    var d = '';
    for (var i = 0; i < poly.length; i++) {
      d += (i === 0 ? 'M' : 'L') + poly[i][0].toFixed(1) + ' ' + poly[i][1].toFixed(1);
      if (i < poly.length - 1) d += ' ';
    }
    return d + (closed ? ' Z' : '');
  }

  function buildBoard() {
    var svg = $('board');
    var gEdges = document.createElementNS(SVG_NS, 'g');
    var gDots = document.createElementNS(SVG_NS, 'g');
    svg.appendChild(gEdges);
    svg.appendChild(gDots);
    S.built = true;
    return { gEdges: gEdges, gDots: gDots };
  }

  function render(view) {
    S.view = view;
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (view.status === 'running' && i === view.turn ? ' active' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '');
      row.appendChild(chip);
    });

    var layers = S.built
      ? { gEdges: $('board').children[0], gDots: $('board').children[1] }
      : buildBoard();
    layers.gEdges.innerHTML = '';
    layers.gDots.innerHTML = '';
    var st = view.state;
    var edges = st.edges;
    edges.forEach(function (e, i) {
      var path = document.createElementNS(SVG_NS, 'path');
      var isLast = view.status === 'running' && i === edges.length - 1;
      path.setAttribute('class', 'sp-edge' + (isLast ? ' last' : ''));
      path.setAttribute('d', polyPath(e.poly, e.a === e.b));
      layers.gEdges.appendChild(path);
    });
    st.dots.forEach(function (dot, i) {
      var free = Math.max(0, 3 - dot.deg);
      var isLastDot = view.status === 'running' && i === st.dots.length - 1 && st.moves.length > 0;
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', dot.x);
      c.setAttribute('cy', dot.y);
      c.setAttribute('r', '16');
      c.setAttribute(
        'class',
        'sp-dot' +
          (free <= 0 ? ' full' : '') +
          (S.sel === i ? ' sel' : '') +
          (isLastDot ? ' lastdot' : '')
      );
      c.addEventListener('click', function () {
        onDot(i);
      });
      layers.gDots.appendChild(c);
      var t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', dot.x);
      t.setAttribute('y', dot.y + 5);
      t.setAttribute('class', 'sp-lives');
      t.textContent = String(free);
      layers.gDots.appendChild(t);
    });

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var lines = st.dots.reduce(function (acc, d) {
      return acc + Math.max(0, 3 - d.deg);
    }, 0);
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        S.sel === null
          ? 'Your turn \u2014 tap a dot to start a line.'
          : 'Now tap the partner dot \u2014 or tap the same dot again to loop it around itself.';
    } else {
      var who = view.seats[view.turn] ? view.seats[view.turn].name : 'the table';
      statusEl.textContent = 'Waiting for ' + who + '\u2026';
    }
    var hint = $('hint') || document.querySelector('.hint');
    if (hint)
      hint.textContent =
        'free line-ends left on the drawing: ' + lines + ' \u00b7 lines drawn: ' + edges.length;
  }

  function finishText(view) {
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var ordered = (view.placement || []).slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    if (!ordered.length) return 'Finished.';
    var first = ordered[0];
    var tail = ordered.slice(1).map(function (p) {
      return '#' + p.rank + ' ' + names[p.seat];
    });
    return (
      '\uD83C\uDFC6 ' +
      names[first.seat] +
      ' draws the last line and takes it! ' +
      tail.join(' \u00b7 ') +
      ' \u00b7 lines: ' +
      view.state.edges.length +
      (first.seat === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function flash(target, msg) {
    if (!target) return;
    target.textContent = msg;
    target.classList.add('flash');
    setTimeout(function () {
      target.classList.remove('flash');
    }, 1400);
  }

  function onDot(i) {
    var view = S.view;
    if (!view || view.status !== 'running') return;
    if (!view.yourTurn) {
      flash($('status'), 'Not your turn yet.');
      return;
    }
    var free = Math.max(0, 3 - view.state.dots[i].deg);
    if (S.sel === null) {
      if (free < 1) {
        flash($('status'), 'That dot is full \u2014 no free line-ends.');
        return;
      }
      S.sel = i;
      render(view);
      return;
    }
    if (S.sel === i) {
      if (free < 2) {
        S.sel = null;
        render(view);
        flash($('status'), 'A loop needs two free line-ends on the dot.');
        return;
      }
      send({ a: i, b: i });
      return;
    }
    if (free < 1) {
      flash($('status'), 'That dot is full.');
      return;
    }
    send({ a: S.sel, b: i });
  }

  function send(move) {
    api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: move })
      .then(function (view) {
        S.sel = null;
        render(view);
      })
      .catch(function (e) {
        S.sel = null;
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
  document.addEventListener('DOMContentLoaded', initMenu);
})();
