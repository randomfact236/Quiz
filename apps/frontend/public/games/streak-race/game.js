/**
 * streak-race game shell — call higher or lower, keep the run alive.
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
          gameSlug: 'streak-race',
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
      var out = st.missed[i];
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' +
        (view.status === 'running' && i === view.turn ? ' active' : '') +
        (out ? ' out' : '');
      var streak = out ? st.best[i] : st.streak[i];
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        ' \u00b7 ' +
        streak +
        (out ? ' (ended)' : ' streak');
      row.appendChild(chip);
    });
    $('card').textContent = String(st.value);
    var ev = $('event-line');
    if (st.lastCorrect === true)
      ev.textContent =
        '\u2705 ' + (st.lastRoll === 13 || st.lastRoll === 1 ? 'Perfect call!' : 'Correct!');
    else if (st.lastCorrect === false) ev.textContent = '\u274C Run ended.';
    else ev.textContent = '';

    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var myTurn = view.status === 'running' && view.yourTurn;
    $('btn-higher').disabled = !myTurn;
    $('btn-lower').disabled = !myTurn;
    var statusEl = $('status');
    if (view.status === 'waiting') {
      statusEl.textContent = 'Waiting for the host to start\u2026';
    } else if (view.status === 'finished') {
      statusEl.textContent = finishText(view);
    } else if (view.yourTurn) {
      statusEl.textContent =
        'Your turn \u2014 will the next draw be higher or lower than ' + st.value + '?';
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
        var n = Math.max(st.best[p.seat], st.streak[p.seat]);
        return '#' + p.rank + ' ' + names[p.seat] + ' (' + n + ')';
      })
      .join(' \u00b7 ');
    if (w === null) return '\uD83E\uDD1D Shared \u2014 ' + tail;
    var capped = st.streak[w] >= 6;
    return (
      '\uD83C\uDFC6 ' +
      names[w] +
      (capped ? ' runs off SIX in a row!' : ' has the longest streak!') +
      ' ' +
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

  $('btn-higher').addEventListener('click', function () {
    act({ call: 'h' });
  });
  $('btn-lower').addEventListener('click', function () {
    act({ call: 'l' });
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
