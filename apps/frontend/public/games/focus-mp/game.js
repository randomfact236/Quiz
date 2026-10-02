/**
 * focus-mp game shell — enter, stack, merge, capture by height.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var N = 6;
  var MAX_STACK = 5;
  var COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706'];
  var S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
    view: null,
    sel: -1,
    mode: 'top',
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
          gameSlug: 'focus-mp',
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

  function neighbors(idx) {
    var r = Math.floor(idx / N);
    var c = idx % N;
    var out = [];
    if (r > 0) out.push(idx - N);
    if (r < N - 1) out.push(idx + N);
    if (c > 0) out.push(idx - 1);
    if (c < N - 1) out.push(idx + 1);
    return out;
  }

  function destsFor(view, from) {
    var st = view.state;
    var seat = view.yourSeat;
    if (st.cells[from].length === 0 || st.cells[from][0] !== seat) return [];
    var all = S.mode === 'stack';
    var moving = all ? st.cells[from].length : 1;
    var out = [];
    neighbors(from).forEach(function (to) {
      var dst = st.cells[to];
      if (!dst.length) {
        out.push(to);
        return;
      }
      if (dst[0] === seat) {
        if (dst.length + moving <= MAX_STACK) out.push(to);
        return;
      }
      if (dst.length <= moving) out.push(to);
    });
    return out;
  }

  function render(view) {
    S.view = view;
    var st = view.state;
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var onBoard = 0;
      st.cells.forEach(function (stack) {
        stack.forEach(function (s) {
          if (s === i) onBoard++;
        });
      });
      var dead = st.out.indexOf(i) >= 0;
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' +
        (view.status === 'running' && i === view.turn ? ' active' : '') +
        (dead ? ' out' : '');
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        ' \u00b7 \u270B' +
        st.hand[i] +
        ' \u00b7 \u25CF' +
        onBoard;
      row.appendChild(chip);
    });

    var grid = $('grid');
    if (!S.built || grid.children.length !== N * N) {
      grid.innerHTML = '';
      for (var i = 0; i < N * N; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.className = 'fc-cell';
          b.addEventListener('click', function () {
            onCell(idx);
          });
          grid.appendChild(b);
        })(i);
      }
      S.built = true;
    }
    var dests =
      S.sel >= 0 && view.status === 'running' && view.yourTurn ? destsFor(view, S.sel) : [];
    for (var k = 0; k < N * N; k++) {
      var cell = grid.children[k];
      var stack = st.cells[k];
      var cls = 'fc-cell';
      if (S.sel === k) cls += ' sel';
      if (dests.indexOf(k) >= 0) cls += ' dest';
      if (
        st.lastMove &&
        ((st.lastMove.kind === 'place' && st.lastMove.idx === k) ||
          (st.lastMove.kind === 'move' && (st.lastMove.from === k || st.lastMove.to === k)))
      )
        cls += ' last';
      cell.className = cls;
      cell.innerHTML = '';
      for (var s = 0; s < stack.length; s++) {
        var pc = document.createElement('span');
        pc.className = 'fc-pc';
        pc.style.background = COLORS[stack[s]] || '#888';
        cell.appendChild(pc);
      }
    }

    // mode buttons
    var heightSel = S.sel >= 0 ? st.cells[S.sel].length : 0;
    var mTop = $('mode-top');
    var mStack = $('mode-stack');
    mTop.className = 'mode-btn' + (S.mode === 'top' ? ' on' : '');
    mStack.className = 'mode-btn' + (S.mode === 'stack' ? ' on' : '');
    mStack.disabled = S.sel >= 0 && heightSel <= 1;

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        S.sel < 0
          ? st.hand[view.yourSeat] > 0
            ? 'Your turn \u2014 tap an empty square to enter, or tap your stack to move it.'
            : 'Your turn \u2014 tap one of your stacks.'
          : 'Now tap a lit square (' + (S.mode === 'stack' ? 'whole stack' : 'top piece') + ').';
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
        '\uD83E\uDD1D Shared finish \u2014 ' +
        ordered
          .map(function (p) {
            return '#' + p.rank + ' ' + names[p.seat];
          })
          .join(' \u00b7 ')
      );
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' holds the last pieces on the board! ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function onCell(idx) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn) return;
    var st = view.state;
    if (S.sel >= 0) {
      if (destsFor(view, S.sel).indexOf(idx) >= 0) {
        var move = { from: S.sel, to: idx };
        if (S.mode === 'stack') move.stack = true;
        send(move);
        return;
      }
      if (st.cells[idx].length && st.cells[idx][0] === view.yourSeat) {
        S.sel = idx;
        render(view);
        return;
      }
      flash($('status'), 'That square is not a legal target.');
      return;
    }
    if (st.cells[idx].length && st.cells[idx][0] === view.yourSeat) {
      S.sel = idx;
      render(view);
      return;
    }
    if (st.cells[idx].length === 0 && st.hand[view.yourSeat] > 0) {
      send({ place: idx });
      return;
    }
    if (st.cells[idx].length === 0) {
      flash($('status'), 'Your hand is empty.');
    }
  }

  function send(move) {
    api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: move })
      .then(function (view) {
        S.sel = -1;
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

  $('mode-top').addEventListener('click', function () {
    S.mode = 'top';
    if (S.view) render(S.view);
  });
  $('mode-stack').addEventListener('click', function () {
    S.mode = 'stack';
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
