/**
 * hangman-relay-mp game shell — trust-relayed hangman on the MP1 engine.
 * Phase 1: every seat writes a word for the NEXT seat. Phase 2: the relay
 * races — one letter per turn for your OWN puzzle, 6 strikes and you are out.
 */
(function () {
  'use strict';
  var cfg = window.GAME_CFG;
  var storage = window.GAME_STORAGE;
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var MAX_STRIKES = 6;
  var S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
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
          gameSlug: 'hangman-relay-mp',
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
    var row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      var p = view.state.puzzles[i];
      var chip = document.createElement('span');
      var cls = 'seat-chip';
      if (view.status === 'running' && view.state.phase === 'solving' && i === view.turn)
        cls += ' active';
      if (p && p.solved) cls += ' done';
      if (p && p.out) cls += ' out';
      chip.className = cls;
      var prog = '';
      if (p) {
        if (p.solved) prog = ' \u2713 solved';
        else if (p.out) prog = ' \u2717 out';
        else prog = ' \u00b7 ' + (p.wrong ? p.wrong.length : 0) + '/' + MAX_STRIKES;
      }
      chip.textContent =
        (i === view.yourSeat ? '\u2605 ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' \uD83E\uDD16' : '') +
        prog;
      row.appendChild(chip);
    });

    var writing = view.state.phase === 'writing';
    var solving = view.state.phase === 'solving';
    var mine = view.state.words[view.yourSeat];
    var iCanWrite = writing && view.status === 'running' && mine === null;
    $('write-phase').hidden = !iCanWrite;
    $('solve-phase').hidden = !(solving && view.status === 'running');
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');

    if (iCanWrite) {
      var n = view.seats.length;
      $('write-for').textContent =
        'Write a secret word for ' + view.seats[(view.yourSeat + 1) % n].name + ':';
    }
    if (solving && view.status === 'running') {
      var p = view.state.puzzles[view.yourSeat];
      var n2 = view.seats.length;
      var setter = view.seats[(view.yourSeat - 1 + n2) % n2];
      var stateTxt =
        p && p.solved
          ? 'solved \u2713'
          : p && p.out
            ? 'struck out'
            : (p ? p.wrong.length : 0) + '/' + MAX_STRIKES + ' strikes';
      $('your-word-line').textContent =
        'Your puzzle (' + setter.name + ' wrote it) \u00b7 ' + stateTxt;
      renderPattern(p);
      $('puzzle-wrong').textContent = p && p.wrong.length ? 'Misses: ' + p.wrong.join(' ') : '';
      renderLetters(view, p);
      renderOthers(view);
    }
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start\u2026'
        : view.status === 'finished'
          ? placementText(view)
          : writing
            ? mine === null
              ? 'Scribble phase \u2014 lock in your word.'
              : 'Word locked. Waiting for the other seats\u2026'
            : view.yourTurn
              ? 'Your turn \u2014 guess a letter!'
              : 'Waiting for a solver\u2026';
    if (view.status === 'finished') renderReveal(view);
  }

  function renderPattern(p) {
    var host = $('puzzle-pattern');
    host.innerHTML = '';
    if (!p) return;
    var mask = p.mask || [];
    for (var i = 0; i < p.length; i++) {
      var el = document.createElement('span');
      el.className = 'p-letter';
      var ch = mask[i];
      el.textContent = ch ? ch : '\u2022';
      host.appendChild(el);
    }
  }

  function renderLetters(view, p) {
    var canGuess = !!(view.yourTurn && p && !p.solved && !p.out);
    var host = $('letter-grid');
    if (host.children.length !== LETTERS.length) {
      host.innerHTML = '';
      LETTERS.forEach(function (ch) {
        var b = document.createElement('button');
        b.className = 'letter-btn';
        b.textContent = ch;
        b.addEventListener('click', function () {
          guess(ch);
        });
        host.appendChild(b);
      });
    }
    var used = {};
    ((p && p.revealed) || []).forEach(function (ch) {
      used[ch] = true;
    });
    ((p && p.wrong) || []).forEach(function (ch) {
      used[ch] = true;
    });
    Array.prototype.forEach.call(host.children, function (b) {
      b.disabled = !canGuess || !!used[b.textContent];
      b.classList.toggle('used', !!used[b.textContent]);
    });
  }

  function renderOthers(view) {
    var host = $('others-box');
    host.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      if (i === view.yourSeat) return;
      var p = view.state.puzzles[i];
      if (!p) return;
      var row = document.createElement('div');
      row.className = 'row';
      var status = p.solved
        ? 'solved'
        : p.out
          ? 'out'
          : p.wrong.length + '/' + MAX_STRIKES + ' strikes';
      var pattern = (p.mask || [])
        .map(function (ch) {
          return ch || '\u2022';
        })
        .join(' ');
      row.textContent = seat.name + ': ' + pattern + ' \u2014 ' + status;
      host.appendChild(row);
    });
  }

  function placementText(view) {
    if (!view.placement) return 'Finished.';
    var names = view.seats.map(function (s) {
      return s.name;
    });
    var ordered = view.placement.slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    var mine = null;
    ordered.forEach(function (p) {
      if (p.seat === view.yourSeat) mine = p.rank;
    });
    return (
      ordered
        .map(function (p) {
          return '#' + p.rank + ' ' + names[p.seat];
        })
        .join(' \u00b7 ') + (mine === 1 ? ' \u2014 \uD83C\uDFC6 you win the relay!' : '')
    );
  }

  function renderReveal(view) {
    var host = $('reveal-box');
    host.innerHTML = '';
    var n = view.seats.length;
    view.seats.forEach(function (seat, i) {
      var writtenBy = view.state.words[i];
      if (typeof writtenBy !== 'string') return;
      var target = view.seats[(i + 1) % n].name;
      var row = document.createElement('div');
      row.textContent = 'For ' + target + ': ';
      var chip = document.createElement('span');
      chip.className = 'word-chip';
      chip.textContent = writtenBy;
      row.appendChild(chip);
      host.appendChild(row);
    });
  }

  async function guess(letter) {
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { letter: letter },
      });
      render(view);
    } catch (e) {
      flash($('status'), e.message);
      poll();
    }
  }
  $('btn-set-word').addEventListener('click', async function () {
    var word = $('word-input').value.trim();
    try {
      var view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { word: word },
      });
      $('word-input').value = '';
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
