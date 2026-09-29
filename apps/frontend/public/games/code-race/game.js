/**
 * code-race game shell — hidden-code duel on the MP1 party engine.
 * The maker's code is typed on their phone and POSTed once; the server holds
 * it and the API only ever returns black/white counts (view is redacted).
 */
(function () {
  'use strict';
  const cfg = window.GAME_CFG;
  const core = window.CRCORE;
  const storage = window.GAME_STORAGE;
  const S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
  const $ = function (id) {
    return document.getElementById(id);
  };
  let myCode = [1, 1, 1, 1];
  let myGuess = [1, 1, 1, 1];
  let pickedValue = 1;

  function show(screen) {
    ['menu', 'game'].forEach(function (s) {
      $('screen-' + s).hidden = s !== screen;
    });
  }
  async function ensureGuest() {
    // Mint/refresh the signed guest pair once per browser (shared bootstrap).
    try {
      await window.PIG_GUEST_READY;
    } catch (_) {}
    let pair = null;
    try {
      const raw = localStorage.getItem('aiquiz:guest-token');
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
    const pair = await ensureGuest();
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (pair.token) headers['X-Guest-Token'] = pair.token;
    const res = await fetch(
      cfg.apiBase +
        '/party' +
        path +
        (method === 'GET' ? '?guestId=' + encodeURIComponent(S.party.guestId) : ''),
      {
        method: method || 'POST',
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
      }
    );
    if (!res.ok) {
      let msg = 'Request failed';
      try {
        msg = (await res.json()).message || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }
  function pegButtons(container, values, onPick) {
    container.innerHTML = '';
    for (let v = 1; v <= values; v++) {
      const b = document.createElement('button');
      b.className = 'peg p' + v;
      b.addEventListener('click', function () {
        pickedValue = v;
        container.querySelectorAll('.peg').forEach(function (x) {
          x.classList.toggle('picked', x === b);
        });
        if (onPick) onPick(v);
      });
      container.appendChild(b);
    }
  }
  async function initMenu() {
    $('btn-create').addEventListener('click', async function () {
      await ensureGuest();
      const name = $('player-name').value.trim() || S.party.name;
      storage.set('name', name);
      try {
        const r = await api('', {
          gameSlug: 'code-race',
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
      const code = $('join-code').value.trim().toUpperCase();
      const name = $('player-name').value.trim() || S.party.name;
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
    if (cfg.partyCode) {
      $('join-code').value = cfg.partyCode;
    }
  }
  async function enterGame() {
    show('game');
    $('code-label').textContent = S.party.code;
    poll();
  }
  async function poll() {
    if ($('screen-game').hidden) return;
    try {
      const view = await api('/' + S.party.code, null, 'GET');
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    } finally {
      clearTimeout(S.party.pollTimer);
      S.party.pollTimer = setTimeout(poll, cfg.pollMs);
    }
  }
  function render(view) {
    const row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach(function (seat, i) {
      const chip = document.createElement('span');
      chip.className =
        'seat-chip' +
        (i === view.turn && view.status === 'running' && view.state.phase === 'racing'
          ? ' active'
          : '');
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : '') +
        (i === 0
          ? ' (maker)'
          : ' · ' + (view.state.rows[String(i)] || []).length + '/' + core.LIMIT);
      row.appendChild(chip);
    });
    const isMaker = view.yourSeat === 0;
    $('set-phase').hidden = !(isMaker && view.state.phase === 'setting');
    $('race-phase').hidden = !(view.state.phase === 'racing' && !isMaker);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start…'
        : view.status === 'finished'
          ? placementText(view)
          : view.state.phase === 'setting'
            ? isMaker
              ? 'Invent your secret code below.'
              : 'The maker is inventing the code…'
            : view.yourTurn
              ? 'Your turn — set your 4 pegs and guess!'
              : 'Waiting for a racer…';
    if (view.state.phase === 'racing' && !isMaker) {
      renderMyHistory(view);
    }
    if (view.status === 'finished' && view.state.code) {
      renderReveal(view.state.code);
    }
  }
  function placementText(view) {
    if (!view.placement) return 'Finished.';
    const names = view.seats.map(function (s) {
      return s.name;
    });
    return view.placement
      .slice()
      .sort(function (a, b) {
        return a.rank - b.rank;
      })
      .map(function (p) {
        return '#' + p.rank + ' ' + names[p.seat];
      })
      .join(' · ');
  }
  function renderReveal(code) {
    const host = document.createElement('div');
    host.className = 'secret-dots';
    code.forEach(function (v) {
      const d = document.createElement('span');
      d.className = 'secret-dot revealed p' + v;
      host.appendChild(d);
    });
    $('status').before(host);
  }
  function renderMyHistory(view) {
    const host = $('my-history');
    host.innerHTML = '';
    const mine = view.state.rows[String(view.yourSeat)] || [];
    mine
      .slice()
      .reverse()
      .slice(0, 5)
      .forEach(function (row) {
        const line = document.createElement('div');
        line.className = 'guess-row';
        row.guess.forEach(function (v) {
          const p = document.createElement('span');
          p.className = 'guess-peg p' + v;
          line.appendChild(p);
        });
        const fb = document.createElement('span');
        fb.className = 'fb';
        fb.textContent = row.black + '● ' + row.white + '○';
        line.appendChild(fb);
        host.appendChild(line);
      });
  }
  // setting phase pegs
  pegButtons($('set-pegs'), core.VALUES);
  $('set-pegs').addEventListener('click', function (e) {
    const idx = Array.prototype.indexOf.call($('set-pegs').children, e.target);
    if (idx >= 0) myCode[idx] = pickedValue;
  });
  $('btn-set-code').addEventListener('click', async function () {
    try {
      const view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { code: myCode },
      });
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  });
  // guessing phase pegs
  pegButtons($('guess-pegs'), core.VALUES);
  $('guess-pegs').addEventListener('click', function (e) {
    const idx = Array.prototype.indexOf.call($('guess-pegs').children, e.target);
    if (idx >= 0) myGuess[idx] = pickedValue;
  });
  $('btn-guess').addEventListener('click', async function () {
    try {
      const view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { guess: myGuess },
      });
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
    const url = location.origin + location.pathname + '?party=' + S.party.code;
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
