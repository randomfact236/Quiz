/**
 * farkle-lite game shell — six dice, bank or roll on, never farkle.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, view: null };
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
          gameSlug: 'farkle-lite',
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

  /** Mirror of the server's lite scoring (for the green rims). */
  function scoredDice(dice) {
    var counts = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach(function (d) {
      counts[d] += 1;
    });
    var out = [];
    var n = dice.length;
    if (
      n === 6 &&
      counts.slice(1).every(function (c) {
        return c === 1;
      })
    ) {
      return dice.map(function (_, i) {
        return i;
      });
    }
    var pairs = counts.slice(1).filter(function (c) {
      return c === 2;
    }).length;
    if (n === 6 && pairs === 3) {
      return dice.map(function (_, i) {
        return i;
      });
    }
    dice.forEach(function (d, i) {
      var c = counts[d];
      if (c >= 3) out.push(i);
      else if (d === 1 || d === 5) out.push(i);
    });
    return out;
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
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        ' \u00b7 ' +
        st.bank[i];
      row.appendChild(chip);
    });
    var diceEl = $('dice');
    diceEl.innerHTML = '';
    var scored = scoredDice(st.dice);
    st.dice.forEach(function (d, i) {
      var el2 = document.createElement('div');
      el2.className = 'fk-die' + (scored.indexOf(i) >= 0 ? ' scored' : '');
      el2.textContent = String(d);
      diceEl.appendChild(el2);
    });
    $('pot').textContent = String(st.pot);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var myTurn = view.status === 'running' && view.yourTurn;
    $('btn-roll').disabled = !myTurn;
    $('btn-bank').disabled = !myTurn || st.phaseTurn !== 'decide';
    $('btn-roll').textContent =
      st.phaseTurn === 'decide' ? 'Roll ' + st.diceLeft + ' \uD83C\uDFB2' : 'Roll 6 \uD83C\uDFB2';
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        st.lastEvent === 'farkle'
          ? 'FARKLE! The pot burned \u2014 shake it off and roll again.'
          : st.phaseTurn === 'decide'
            ? 'Bank the pot or roll on (' + st.diceLeft + ' dice).'
            : 'Your turn \u2014 roll!';
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
        return '#' + p.rank + ' ' + names[p.seat] + ' (' + view.state.bank[p.seat] + ')';
      })
      .join(' \u00b7 ');
    if (w === null)
      return (
        '\uD83E\uDD1D Shared \u2014 ' +
        ordered
          .map(function (p) {
            return '#' + p.rank + ' ' + names[p.seat];
          })
          .join(' \u00b7 ')
      );
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      ' banks ' +
      view.state.bank[w] +
      ' and takes it! ' +
      tail +
      (w === view.yourSeat ? ' \u2014 that\u2019s you!' : '')
    );
  }

  function act(move) {
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

  $('btn-roll').addEventListener('click', function () {
    act({ roll: true });
  });
  $('btn-bank').addEventListener('click', function () {
    act({ bank: true });
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
