/**
 * two-dice-pig game shell — roll, watch the pot, hold to bank.
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
          gameSlug: 'two-dice-pig',
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
    var d1 = st.lastRoll ? st.lastRoll[0] : null;
    var d2 = st.lastRoll ? st.lastRoll[1] : null;
    var e1 = $('die1');
    var e2 = $('die2');
    e1.textContent = d1 === null ? '\u2013' : String(d1);
    e2.textContent = d2 === null ? '\u2013' : String(d2);
    e1.className = 'die' + (d1 === 1 ? ' pip1' : '');
    e2.className = 'die' + (d2 === 1 ? ' pip1' : '');
    $('pot').textContent = String(st.pot);
    var ev = $('event-line');
    if (st.lastEvent === 'roll')
      ev.textContent = d1 === d2 ? '\u2728 DOUBLES \u2014 double pay!' : 'Nice roll.';
    else if (st.lastEvent === 'bust') ev.textContent = '\uD83D\uDCA5 BUST \u2014 pot gone.';
    else if (st.lastEvent === 'pig')
      ev.textContent = '\uD83D\uDC16 THE PIG \u2014 the trough is empty!';
    else if (st.lastEvent === 'hold') ev.textContent = '\uD83C\uDFE6 Banked!';
    else ev.textContent = '';

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var myTurn = view.status === 'running' && view.yourTurn;
    $('btn-roll').disabled = !myTurn;
    $('btn-hold').disabled = !myTurn || st.pot <= 0;
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        st.pot >= 21
          ? 'Your turn \u2014 getting greedy. Roll or hold?'
          : 'Your turn \u2014 roll for the pot.';
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
  $('btn-hold').addEventListener('click', function () {
    act({ hold: true });
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
