/**
 * crazy-eights-mp game shell — the shedding classic on the MP1 party engine.
 * Moves: {card:{v,s}, calledSuit} | {draw:true} | {pass:true}.
 * Server redacts rival hands + the stock; the client renders counts.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, sel: null, view: null };
  var $ = function (id) {
    return document.getElementById(id);
  };
  var SUITS = ['♠', '♥', '♣', '♦'];
  var RANKS = ['?', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

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
          gameSlug: 'crazy-eights-mp',
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
  function cardLabel(c) {
    return RANKS[c.v] + SUITS[c.s];
  }
  function cardEl(c) {
    var el = document.createElement('div');
    el.className = 'ce-card s' + c.s;
    el.innerHTML = '<span>' + RANKS[c.v] + '</span><span class="suit">' + SUITS[c.s] + '</span>';
    return el;
  }
  /** Active suit/value the client must match (mirror of ceActiveSuit/Value). */
  function activeMatch(view) {
    var top = view.state.discard[view.state.discard.length - 1];
    var suit =
      view.state.calledSuit !== null && view.state.calledSuit !== undefined
        ? view.state.calledSuit
        : top.s;
    return { suit: suit, value: top.v };
  }
  function isLegal(view, card) {
    var m = activeMatch(view);
    return card.v === 8 || card.s === m.suit || card.v === m.value;
  }
  function render(view) {
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
        (view.state.handCounts ? view.state.handCounts[i] : '?') +
        ' cards';
      row.appendChild(chip);
    });
    // stock + discard
    $('stock-count').textContent = String(
      view.state.stockCount !== undefined ? view.state.stockCount : '?'
    );
    var top = view.state.discard[view.state.discard.length - 1];
    var disc = $('discard-card');
    disc.className = 'ce-card s' + top.s;
    disc.innerHTML =
      '<span>' + RANKS[top.v] + '</span><span class="suit">' + SUITS[top.s] + '</span>';
    // hand
    var handHost = $('hand');
    handHost.innerHTML = '';
    var hand = view.state.hands[view.yourSeat] || [];
    hand.forEach(function (c) {
      var el = cardEl(c);
      if (!isLegal(view, c)) el.classList.add('dead');
      if (S.sel && S.sel.v === c.v && S.sel.s === c.s) el.classList.add('sel');
      el.addEventListener('click', function () {
        if (!view.yourTurn || view.status !== 'running') return;
        if (!isLegal(S.view, c)) {
          flash($('status'), 'That card does not match suit or value.');
          return;
        }
        if (c.v === 8) {
          S.sel = c;
          render(S.view);
          $('suit-pick').hidden = false;
          return;
        }
        sendPlay(c, null);
      });
      handHost.appendChild(el);
    });
    // buttons
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var canPlay = hand.some(function (c) {
      return isLegal(view, c);
    });
    $('btn-draw').disabled = !(
      view.yourTurn &&
      view.status === 'running' &&
      !canPlay &&
      view.state.stockCount > 0
    );
    $('btn-pass').hidden = !(
      view.yourTurn &&
      view.status === 'running' &&
      !canPlay &&
      view.state.stockCount === 0
    );
    if (view.status !== 'running' || !view.yourTurn) $('suit-pick').hidden = true;
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
      if (view.state.winner !== null && view.state.winner !== undefined)
        return '🏆 ' + names[first.seat] + ' sheds the last card!';
      return '🏆 Deadlock! ' + names[first.seat] + ' wins with the fewest cards.';
    }
    if (view.yourTurn) {
      var hand = view.state.hands[view.yourSeat] || [];
      var can = hand.some(function (c) {
        return isLegal(view, c);
      });
      if (can)
        return (
          'Your turn — play a matching card' + (S.sel ? ' (eight: call a suit below)' : '') + '.'
        );
      if (view.state.stockCount > 0) return 'No match — draw a card.';
      return 'No match and no stock — pass.';
    }
    return 'Waiting…';
  }
  async function sendPlay(card, calledSuit) {
    $('suit-pick').hidden = true;
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { card: card, calledSuit: calledSuit },
      });
      S.view = view;
      S.sel = null;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
      poll();
    }
  }
  [0, 1, 2, 3].forEach(function (s) {
    $('pick-' + s).addEventListener('click', function () {
      if (S.sel) sendPlay(S.sel, s);
    });
  });
  $('btn-draw').addEventListener('click', async function () {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { draw: true },
      });
      S.view = view;
      S.sel = null;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  });
  $('btn-pass').addEventListener('click', async function () {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { pass: true },
      });
      S.view = view;
      S.sel = null;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
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
