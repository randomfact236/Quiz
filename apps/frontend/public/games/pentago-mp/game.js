/**
 * pentago-mp game shell — place a marble, twist a quadrant.
 * Flow: tap an empty square (arm it), then tap a twist button.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var N = 6;
  var COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706'];
  var QUAD_NAMES = ['Q1', 'Q2', 'Q3', 'Q4'];
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    view: null,
    sel: -1,
    built: false,
    rotBuilt: false,
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
          gameSlug: 'pentago-mp',
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

  function buildRotButtons() {
    var row = $('rot-row');
    row.innerHTML = '';
    for (var q = 0; q < 4; q++) {
      for (var d = 0; d < 2; d++) {
        var dir = d === 0 ? 'cw' : 'ccw';
        var b = document.createElement('button');
        b.className = 'rot-btn';
        b.textContent = (d === 0 ? '\u21BB ' : '\u21BA ') + QUAD_NAMES[q];
        (function (quad, dirName) {
          b.addEventListener('click', function () {
            onRotate(quad, dirName);
          });
        })(q, dir);
        row.appendChild(b);
      }
    }
    S.rotBuilt = true;
  }

  function render(view) {
    S.view = view;
    var st = view.state;
    var row = $('seats-row');
    row.innerHTML = '';
    var counts = [0, 0, 0, 0];
    st.cells.forEach(function (v) {
      if (v !== 0) counts[v - 1]++;
    });
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (view.status === 'running' && i === view.turn ? ' active' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        ' \u00b7 ' +
        counts[i];
      row.appendChild(chip);
    });

    var grid = $('grid');
    if (!S.built || grid.children.length !== N * N) {
      grid.innerHTML = '';
      for (var i = 0; i < N * N; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.className = 'pg-cell';
          b.addEventListener('click', function () {
            onCell(idx);
          });
          grid.appendChild(b);
        })(i);
      }
      S.built = true;
      buildRotButtons();
    }
    var last = st.lastMove;
    for (var k = 0; k < N * N; k++) {
      var cell = grid.children[k];
      var v = st.cells[k];
      var cls = 'pg-cell';
      var r = Math.floor(k / N);
      var c = k % N;
      if (r === 3) cls += ' q2'; // thicker top border between rows 2/3
      if (c === 3) cls += ' q4'; // thicker left border between cols 2/3
      cell.style.removeProperty('--st');
      if (v !== 0) {
        cls += ' st';
        cell.style.setProperty('--st', COLORS[v - 1] || '#888');
      }
      if (S.sel === k) cls += ' sel';
      if (last && last.place === k) cls += ' last';
      cell.className = cls;
      cell.disabled = !(view.status === 'running' && view.yourTurn && v === 0);
    }
    // arm state on rotate buttons
    var armed = view.status === 'running' && view.yourTurn && S.sel >= 0;
    var rotBtns = $('rot-row').children;
    for (var b2 = 0; b2 < rotBtns.length; b2++) {
      rotBtns[b2].disabled = !armed;
      rotBtns[b2].className = 'rot-btn' + (armed ? ' armed' : '');
    }

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        S.sel < 0
          ? 'Your turn \u2014 tap an empty square to drop your marble.'
          : 'Marble armed \u2014 now pick a twist below!';
    } else {
      var who = view.seats[view.turn] ? view.seats[view.turn].name : 'the table';
      statusEl.textContent = 'Waiting for ' + who + '\u2026';
    }
  }

  function finishText(view) {
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var w = view.state.winnerSeat;
    var ordered = (view.placement || []).slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    if (!ordered.length) return 'Finished.';
    var tail = ordered
      .slice(1)
      .map(function (p) {
        return '#' + p.rank + ' ' + names[p.seat];
      })
      .join(' \u00b7 ');
    if (w === null)
      return (
        '\uD83E\uDD1D Board full with no five \u2014 shared. ' +
        ordered
          .map(function (p) {
            return '#' + p.rank + ' ' + names[p.seat];
          })
          .join(' \u00b7 ')
      );
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' spins up FIVE in a row! ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function onCell(idx) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn) return;
    if (view.state.cells[idx] !== 0) {
      if (S.sel === idx) {
        S.sel = -1;
        render(view);
        return;
      }
      flash($('status'), 'That square is taken.');
      return;
    }
    S.sel = idx;
    render(view);
  }

  function onRotate(quad, dir) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn) return;
    if (S.sel < 0) {
      flash($('status'), 'Tap an empty square first.');
      return;
    }
    api('/' + S.party.code + '/move', {
      guestId: S.party.guestId,
      move: { place: S.sel, quad: quad, dir: dir },
    })
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
