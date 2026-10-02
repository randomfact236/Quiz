/**
 * corners-mp game shell — clone one, jump two, convert the neighbours.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var N = 7;
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
          gameSlug: 'corners-mp',
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

  /** Client mirror of the move generator (for highlighting). */
  function destsFor(st, seat, from) {
    if (st.cells[from] !== seat + 1) return [];
    var fr = Math.floor(from / N);
    var fc = from % N;
    var out = [];
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        var cheb = Math.max(Math.abs(dr), Math.abs(dc));
        if (cheb > 2) continue;
        var nr = fr + dr;
        var nc = fc + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        var to = nr * N + nc;
        if (st.cells[to] !== 0) continue;
        out.push(to);
      }
    }
    return out;
  }

  function render(view) {
    S.view = view;
    var st = view.state;
    var counts = [0, 0, 0, 0];
    st.cells.forEach(function (v) {
      if (v !== 0) counts[v - 1]++;
    });
    var row = $('seats-row');
    row.innerHTML = '';
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
          b.className = 'at-cell';
          b.addEventListener('click', function () {
            onCell(idx);
          });
          grid.appendChild(b);
        })(i);
      }
      S.built = true;
    }
    var dests =
      S.sel >= 0 && view.status === 'running' && view.yourTurn
        ? destsFor(st, view.yourSeat, S.sel)
        : [];
    var last = st.lastMove;
    var flipped = last ? last.flipped : [];
    for (var k = 0; k < N * N; k++) {
      var cell = grid.children[k];
      var v = st.cells[k];
      var cls = 'at-cell';
      cell.style.removeProperty('--st');
      if (v !== 0) {
        cls += ' st';
        cell.style.setProperty('--st', COLORS[v - 1] || '#888');
      }
      if (S.sel === k) cls += ' sel';
      if (dests.indexOf(k) >= 0) cls += ' dest';
      if (last && (last.from === k || last.to === k)) cls += ' tLast';
      if (flipped.indexOf(k) >= 0) cls += ' flip';
      cell.className = cls;
      cell.disabled = !(view.status === 'running' && view.yourTurn);
    }

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        S.sel < 0 ? 'Your turn \u2014 tap one of your pieces.' : 'Now tap a dotted square to land.';
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
      .map(function (p) {
        return '#' + p.rank + ' ' + names[p.seat];
      })
      .join(' \u00b7 ');
    if (w === null) return '\uD83E\uDD1D Dead heat \u2014 shared: ' + tail;
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' commands the biggest army! ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function onCell(idx) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn) return;
    var st = view.state;
    if (S.sel >= 0) {
      if (destsFor(st, view.yourSeat, S.sel).indexOf(idx) >= 0) {
        var from = S.sel;
        S.sel = -1;
        api('/' + S.party.code + '/move', {
          guestId: S.party.guestId,
          move: { from: from, to: idx },
        })
          .then(render)
          .catch(function (e) {
            flash($('status'), e.message);
            poll();
          });
        return;
      }
      if (st.cells[idx] === view.yourSeat + 1) {
        S.sel = idx;
        render(view);
        return;
      }
      flash($('status'), 'That square is not a legal landing.');
      return;
    }
    if (st.cells[idx] === view.yourSeat + 1) {
      S.sel = idx;
      render(view);
    }
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
