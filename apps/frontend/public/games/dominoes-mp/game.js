/**
 * dominoes-mp game shell — block dominoes on the MP1 party engine.
 * Moves: {tile:[a,b], side} | {draw:true} | {pass:true}.
 * Server redacts other hands; the client renders counts for rivals.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null }, sel: null, view: null };
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
          gameSlug: 'dominoes-mp',
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

  /** Pip layout map: which grid cells of the 3x3 half are filled for n pips. */
  var PIPS = {
    0: [],
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  function halfEl(n, small) {
    var half = document.createElement('span');
    half.className = 'dom-half' + (small ? ' small' : '');
    var on = PIPS[n] || [];
    for (var i = 0; i < 9; i++) {
      var pip = document.createElement('span');
      pip.className = 'dom-pip' + (on.indexOf(i) >= 0 ? ' on' : '');
      half.appendChild(pip);
    }
    return half;
  }
  function tileEl(tile, vertical) {
    var el = document.createElement('span');
    el.className = 'dom-tile' + (vertical ? ' vert' : '');
    el.appendChild(halfEl(tile[0], vertical));
    el.appendChild(halfEl(tile[1], vertical));
    return el;
  }

  /** Legal tiles for my seat given the ends (client mirror). */
  function legalTiles(view) {
    var hand = view.state.hands[view.yourSeat] || [];
    if (!view.state.line || view.state.line.length === 0) return hand.slice();
    var left = view.state.line[0][0];
    var right = view.state.line[view.state.line.length - 1][1];
    return hand.filter(function (t) {
      return t[0] === left || t[1] === left || t[0] === right || t[1] === right;
    });
  }
  function isLegal(view, tile) {
    return legalTiles(view).some(function (t) {
      return t[0] === tile[0] && t[1] === tile[1];
    });
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
        ' tiles';
      row.appendChild(chip);
    });
    // line
    var line = $('line');
    line.innerHTML = '';
    (view.state.line || []).forEach(function (t) {
      line.appendChild(tileEl(t, false));
    });
    if (!view.state.line || view.state.line.length === 0) {
      line.innerHTML =
        '<span style="opacity:.5">The line starts with your first tile — anything goes.</span>';
    }
    $('boneyard-count').textContent = String(
      view.state.boneyardCount !== undefined ? view.state.boneyardCount : '?'
    );
    // hand
    var handHost = $('hand');
    handHost.innerHTML = '';
    var hand = view.state.hands[view.yourSeat] || [];
    hand.forEach(function (t) {
      var el = tileEl(t, true);
      var legal = isLegal(view, t);
      if (!legal) el.classList.add('dead');
      if (S.sel && S.sel[0] === t[0] && S.sel[1] === t[1]) el.classList.add('sel');
      el.addEventListener('click', function () {
        if (!view.yourTurn || view.status !== 'running') return;
        if (!isLegal(S.view, t)) {
          flash($('status'), 'That tile does not match an open end.');
          return;
        }
        S.sel = t;
        render(S.view);
        // single legal side? send immediately; both? ask
        var ends = endsFor(S.view, t);
        if (ends.length === 1) sendPlay(t, ends[0]);
        else if (ends.length > 1) $('side-pick').hidden = false;
      });
      handHost.appendChild(el);
    });
    // buttons
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    var canPlay = legalTiles(view).length > 0;
    $('btn-draw').disabled = !(
      view.yourTurn &&
      view.status === 'running' &&
      !canPlay &&
      view.state.boneyardCount > 0
    );
    $('btn-pass').hidden = !(
      view.yourTurn &&
      view.status === 'running' &&
      !canPlay &&
      view.state.boneyardCount === 0
    );
    if (view.status !== 'running' || !view.yourTurn) $('side-pick').hidden = true;
    // status
    $('status').textContent = statusText(view);
  }
  /** Which ends does this tile fit? (client mirror) */
  function endsFor(view, tile) {
    if (!view.state.line || view.state.line.length === 0) return ['right'];
    var left = view.state.line[0][0];
    var right = view.state.line[view.state.line.length - 1][1];
    var out = [];
    if (tile[0] === left || tile[1] === left) out.push('left');
    if (tile[0] === right || tile[1] === right) out.push('right');
    return out;
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
      if (view.state.domino !== null && view.state.domino !== undefined)
        return '🏆 ' + names[first.seat] + ' plays the last tile — domino!';
      return '🏆 Blocked! ' + names[first.seat] + ' wins with the lowest pip count.';
    }
    if (view.yourTurn) {
      var can = legalTiles(view).length > 0;
      if (can) return S.sel ? 'Now pick the end to place it.' : 'Your turn — pick a tile.';
      if (view.state.boneyardCount > 0) return 'No matching tile — draw from the boneyard.';
      return 'No matching tile and the boneyard is empty — pass.';
    }
    return 'Waiting…';
  }
  async function sendPlay(tile, side) {
    $('side-pick').hidden = true;
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { tile: tile, side: side },
      });
      S.view = view;
      S.sel = null;
      render(view);
    } catch (e) {
      flash($('status'), e.message);
      poll();
    }
  }
  $('btn-left').addEventListener('click', function () {
    if (S.sel) sendPlay(S.sel, 'left');
  });
  $('btn-right').addEventListener('click', function () {
    if (S.sel) sendPlay(S.sel, 'right');
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
