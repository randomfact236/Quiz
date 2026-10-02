/**
 * quarto-pass game shell — place the piece you were handed, hand the next.
 * Piece id 1..16 -> bits of (id-1): [colour, shape, height, top];
 * 1 = dark / square / tall / solid.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var LINES = (function () {
    var out = [];
    for (var r = 0; r < 4; r++)
      out.push(
        [0, 1, 2, 3].map(function (c) {
          return r * 4 + c;
        })
      );
    for (var c = 0; c < 4; c++)
      out.push(
        [0, 1, 2, 3].map(function (r) {
          return r * 4 + c;
        })
      );
    out.push([0, 5, 10, 15]);
    out.push([3, 6, 9, 12]);
    return out;
  })();
  var ATTR_NAMES = ['same colour', 'same shape', 'same height', 'same top'];
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, view: null, built: false };
  var $ = function (id) {
    return document.getElementById(id);
  };

  function attrs(id) {
    var v = id - 1;
    return [v & 1, (v >> 1) & 1, (v >> 2) & 1, (v >> 3) & 1];
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
          gameSlug: 'quarto-pass',
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

  function pieceEl(id, extraClass) {
    var a = attrs(id);
    var div = document.createElement('div');
    div.className =
      'qp-piece ' +
      (a[1] ? 'sq' : 'rd') +
      (a[0] ? ' dk' : ' lt') +
      (a[2] ? ' tall' : '') +
      (extraClass ? ' ' + extraClass : '');
    var top = document.createElement('div');
    top.className = 'top ' + (a[3] ? 'solid' : 'hollow');
    div.appendChild(top);
    return div;
  }

  function render(view) {
    S.view = view;
    var st = view.state;
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

    var board = $('board');
    if (!S.built || board.children.length !== 16) {
      board.innerHTML = '';
      for (var i = 0; i < 16; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.className = 'qp-cell';
          b.addEventListener('click', function () {
            onCell(idx);
          });
          board.appendChild(b);
        })(i);
      }
      S.built = true;
    }
    var lastIdx = st.lastAction && st.lastAction.kind === 'place' ? st.lastAction.idx : -1;
    for (var k = 0; k < 16; k++) {
      var cell = board.children[k];
      var v = st.board[k];
      var placeable = view.status === 'running' && view.yourTurn && st.hand !== 0 && v === 0;
      cell.className = 'qp-cell' + (placeable ? ' open' : '') + (lastIdx === k ? ' last' : '');
      cell.innerHTML = '';
      if (v !== 0) cell.appendChild(pieceEl(v, ''));
    }

    var tray = $('tray');
    tray.innerHTML = '';
    var canHand = view.status === 'running' && view.yourTurn && st.hand === 0;
    for (var pid = 1; pid <= 16; pid++) {
      var onBoard = st.board.indexOf(pid) >= 0;
      var pe = pieceEl(pid, onBoard ? 'used' : canHand ? '' : 'frozen');
      if (!onBoard && canHand) {
        (function (p) {
          pe.addEventListener('click', function () {
            send({ hand: p });
          });
        })(pid);
      }
      tray.appendChild(pe);
    }

    var handLine = $('hand-line');
    handLine.innerHTML = '';
    if (view.status === 'running') {
      if (st.hand !== 0) {
        handLine.appendChild(
          document.createTextNode(
            view.yourTurn ? 'Place the piece you were handed:' : 'Waiting \u2014 the piece in play:'
          )
        );
        handLine.appendChild(pieceEl(st.hand, ''));
      } else if (view.yourTurn) {
        handLine.textContent = 'Hand a piece to the next player \u2014 tap one in the tray.';
      } else {
        handLine.textContent = 'Waiting for the next piece\u2026';
      }
    }

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        st.hand !== 0
          ? 'Your turn \u2014 place piece #' + st.hand + ' on an empty square.'
          : 'Your turn \u2014 hand a piece to the next player.';
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
    if (w === null) return '\uD83E\uDD1D All sixteen placed, no line \u2014 shared draw.';
    var how = '';
    for (var i = 0; i < LINES.length && !how; i++) {
      var ids = LINES[i].map(function (x) {
        return st.board[x];
      });
      if (
        ids.some(function (x) {
          return x === 0;
        })
      )
        continue;
      var as = ids.map(attrs);
      for (var a = 0; a < 4; a++) {
        var bit = as[0][a];
        var all = as.every(function (x) {
          return x[a] === bit;
        });
        if (all) {
          how = ATTR_NAMES[a];
          break;
        }
      }
    }
    var tail = ordered
      .slice(1)
      .map(function (p) {
        return '#' + p.rank + ' ' + names[p.seat];
      })
      .join(' \u00b7 ');
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' completes the line' +
      (how ? ' \u2014 ' + how + '!' : '!') +
      ' ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function onCell(idx) {
    var view = S.view;
    if (!view || view.status !== 'running' || !view.yourTurn) return;
    if (view.state.hand === 0) {
      flash($('status'), 'Hand a piece first.');
      return;
    }
    if (view.state.board[idx] !== 0) {
      flash($('status'), 'That square is taken.');
      return;
    }
    send({ place: idx });
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
