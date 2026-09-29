/**
 * yatzy-mp game shell — scorecard dice on the MP1 party engine.
 * Moves: {roll:true, keep:[idx]} | {score:<category>}.
 * The server rolls and validates; the client renders the shared scorecard.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, hold: [], view: null };
  var $ = function (id) {
    return document.getElementById(id);
  };
  var CATS = [
    ['ones', 'Ones'],
    ['twos', 'Twos'],
    ['threes', 'Threes'],
    ['fours', 'Fours'],
    ['fives', 'Fives'],
    ['sixes', 'Sixes'],
    ['onePair', 'One pair'],
    ['twoPairs', 'Two pairs'],
    ['threeAlike', 'Three alike'],
    ['fourAlike', 'Four alike'],
    ['smallStraight', 'Small straight 1-5'],
    ['largeStraight', 'Large straight 2-6'],
    ['fullHouse', 'Full house'],
    ['chance', 'Chance'],
    ['yatzy', 'YATZY (50)'],
  ];
  var CAT_KEYS = CATS.map(function (c) {
    return c[0];
  });

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
          gameSlug: 'yatzy-mp',
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
      S.view = view;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    } finally {
      clearTimeout(S.party.pollTimer);
      S.party.pollTimer = setTimeout(poll, cfg.pollMs);
    }
  }
  function total(card) {
    var sum = 0;
    var upper = 0;
    CAT_KEYS.forEach(function (k) {
      sum += card[k] || 0;
      if (['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].indexOf(k) >= 0)
        upper += card[k] || 0;
    });
    if (upper >= 63) sum += 50;
    return sum;
  }
  function render(view) {
    // seats with totals
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var chip = document.createElement('span');
      chip.className =
        'seat-chip' + (i === view.turn && view.status === 'running' ? ' active' : '');
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : '') +
        ' · ' +
        total(view.state.scorecards[i]) +
        ' pts';
      row.appendChild(chip);
    });
    // dice
    var diceHost = $('dice-row');
    diceHost.innerHTML = '';
    view.state.dice.forEach(function (v, i) {
      var d = document.createElement('div');
      d.className = 'die' + (S.hold.indexOf(i) >= 0 ? ' held' : '');
      d.textContent = ['·', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][v] || v;
      d.title = 'die ' + (i + 1) + ' — value ' + v;
      d.addEventListener('click', function () {
        if (!view.yourTurn || view.status !== 'running' || view.state.rolls >= 3) return;
        var idx = S.hold.indexOf(i);
        if (idx >= 0) S.hold.splice(idx, 1);
        else S.hold.push(i);
        render(view);
      });
      diceHost.appendChild(d);
    });
    $('rolls-left').textContent = String(3 - view.state.rolls);
    $('btn-roll').disabled = !(view.yourTurn && view.status === 'running' && view.state.rolls < 3);
    // scorecard
    var table = $('score-table');
    table.innerHTML = '';
    var head = document.createElement('tr');
    head.innerHTML =
      '<th>Category</th>' +
      view.seats
        .map(function (s, i) {
          return '<th>' + (i === view.yourSeat ? '★ ' : '') + s.name.replace(/ 🤖$/, '') + '</th>';
        })
        .join('');
    table.appendChild(head);
    CATS.forEach(function (cat) {
      var tr = document.createElement('tr');
      var catCell = document.createElement('td');
      catCell.className = 'cat';
      catCell.textContent = cat[1];
      tr.appendChild(catCell);
      view.seats.forEach(function (_, si) {
        var td = document.createElement('td');
        var val = view.state.scorecards[si][cat[0]];
        td.textContent = val === null || val === undefined ? '·' : String(val);
        tr.appendChild(td);
      });
      // my open category + dice set → click to bank
      var mine = view.state.scorecards[view.yourSeat][cat[0]] === null;
      if (mine && view.yourTurn && view.status === 'running' && view.state.rolls > 0) {
        tr.className = 'mine';
        catCell.addEventListener('click', function () {
          sendScore(cat[0]);
        });
      } else if (mine && view.yourTurn && view.status === 'running') {
        tr.className = 'mine';
      }
      if (!mine) catCell.classList.add('used');
      table.appendChild(tr);
    });
    // totals row
    var totals = document.createElement('tr');
    totals.className = 'bonus';
    totals.innerHTML =
      '<td class="cat">Total (bonus incl.)</td>' +
      view.seats
        .map(function (_, i) {
          return '<td><b>' + total(view.state.scorecards[i]) + '</b></td>';
        })
        .join('');
    table.appendChild(totals);
    // buttons + status
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    $('status').textContent = statusText(view);
  }
  function statusText(view) {
    if (view.status === 'waiting') return 'Waiting for the host to start…';
    if (view.status === 'finished') {
      if (!view.placement) return 'Finished.';
      var names = view.seats.map(function (s) {
        return s.name;
      });
      var first = view.placement.filter(function (p) {
        return p.rank === 1;
      })[0];
      return (
        '🏆 ' +
        names[first.seat] +
        ' tops the scorecard with ' +
        total(view.state.scorecards[first.seat]) +
        ' points!'
      );
    }
    if (view.yourTurn) {
      if (view.state.rolls === 0) return 'Your turn — roll the dice!';
      if (view.state.rolls < 3) return 'Roll again or click a category to bank your dice.';
      return 'No rolls left — click a category to bank.';
    }
    return 'Waiting…';
  }
  async function sendRoll() {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { roll: true, keep: S.hold.slice() },
      });
      S.view = view;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  }
  async function sendScore(cat) {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { score: cat },
      });
      S.view = view;
      S.hold = [];
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  }
  $('btn-roll').addEventListener('click', sendRoll);
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
  function flash(target, msg) {
    if (!target) return;
    target.textContent = msg;
    target.classList.add('flash');
    setTimeout(function () {
      target.classList.remove('flash');
    }, 1200);
  }
  document.addEventListener('DOMContentLoaded', initMenu);
})();
