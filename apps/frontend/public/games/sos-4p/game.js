/**
 * sos-4p game shell — 4-player SOS on the MP1 party engine.
 * 7×7 grid (5×5 at 3 seats), letter picker S/O, extra-turn chains.
 */
(function () {
  'use strict';

  const cfg = window.SOS4_CONFIG;
  const core = window.SOS4_CORE;
  const storage = window.SOS4_STORAGE;

  const S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
  const $ = (id) => document.getElementById(id);

  function show(screen) {
    for (const s of ['menu', 'game']) $('screen-' + s).hidden = s !== screen;
  }

  function ensureGuest() {
    let g = storage.get('guestId');
    if (!g) {
      g = 'guest-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      storage.set('guestId', g);
    }
    let n = storage.get('name');
    if (!n) n = 'Player ' + Math.floor(Math.random() * 90 + 10);
    storage.set('name', n);
    S.party.guestId = g;
    S.party.name = n;
  }

  async function api(path, body, method) {
    // HARD-03: writes carry the server-signed guest pair (X-Guest-Token).
    let pair = null;
    try {
      const raw = localStorage.getItem('aiquiz:guest-token');
      if (raw) pair = JSON.parse(raw);
    } catch (_) {
      /* private mode */
    }
    if (!pair || !pair.guestId) {
      const mint = await fetch(cfg.apiBase + '/guest-users/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legacyId: S.party.guestId || null }),
      });
      if (mint.ok) {
        pair = await mint.json();
        try {
          localStorage.setItem('aiquiz:guest-token', JSON.stringify(pair));
        } catch (_) {}
      } else {
        pair = { guestId: S.party.guestId, token: null };
      }
    }
    if (pair.guestId) S.party.guestId = pair.guestId;
    const headers = { ...(body ? { 'Content-Type': 'application/json' } : {}) };
    if (pair.token) headers['X-Guest-Token'] = pair.token;
    const res = await fetch(cfg.apiBase + '/party' + path, {
      method: method || 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let msg = 'Request failed';
      try {
        msg = (await res.json()).message || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  function initMenu() {
    $('btn-create').addEventListener('click', createTable);
    $('btn-join').addEventListener('click', joinTable);
    $('btn-leave').addEventListener('click', leave);
    if (cfg.partyCode) $('join-code').value = cfg.partyCode;
  }

  async function createTable() {
    ensureGuest();
    const name = $('player-name').value.trim() || S.party.name;
    storage.set('name', name);
    const seats = parseInt($('seat-count').value, 10) || 4;
    const tier = $('bot-tier').value;
    try {
      const r = await api('', {
        gameSlug: 'sos-4p',
        playerName: name,
        guestId: S.party.guestId,
        seats,
        tier,
      });
      S.party.code = r.code;
      enterGame();
    } catch (e) {
      flash($('menu-msg'), e.message);
    }
  }

  async function joinTable() {
    ensureGuest();
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
  }

  function enterGame() {
    show('game');
    $('code-label').textContent = S.party.code;
    poll();
  }

  async function leave() {
    clearTimeout(S.party.pollTimer);
    try {
      await api('/' + S.party.code + '/leave', { guestId: S.party.guestId });
    } catch (_) {
      /* ok */
    }
    location.href = location.pathname;
  }

  async function poll() {
    if ($('screen-game').hidden) return;
    try {
      const view = await api(
        '/' + S.party.code + '?guestId=' + encodeURIComponent(S.party.guestId),
        null,
        'GET'
      );
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
    view.seats.forEach((seat, i) => {
      const chip = document.createElement('span');
      chip.className =
        'seat-chip' + (i === view.turn && view.status === 'running' ? ' active' : '');
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : '') +
        ' · ' +
        view.state.scores[i];
      row.appendChild(chip);
    });
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start…'
        : view.status === 'finished'
          ? placementText(view)
          : view.yourTurn
            ? 'Your turn — pick a letter, tap a cell. SOS = +1 and go again!'
            : 'Waiting…';
    renderBoard(view);
    const isHost = view.yourSeat === 0;
    $('btn-start').hidden = !(isHost && view.status === 'waiting');
    if (isHost && view.status === 'waiting') renderConfigure(view);
    else $('configure-row').innerHTML = '';
  }

  function placementText(view) {
    if (!view.placement) return 'Finished.';
    const names = view.seats.map((s) => s.name);
    return view.placement
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((p) => '#' + p.rank + ' ' + names[p.seat] + ' (' + view.state.scores[p.seat] + ')')
      .join(' · ');
  }

  function renderConfigure(view) {
    const box = $('configure-row');
    box.innerHTML = '';
    view.seats.forEach((seat, i) => {
      if (i === 0) return;
      const btn = document.createElement('button');
      btn.className = 'seat-toggle';
      btn.textContent =
        'Seat ' +
        (i + 1) +
        ': ' +
        (seat.kind === 'bot'
          ? 'Bot → Closed'
          : seat.kind === 'closed'
            ? 'Closed → Bot'
            : seat.name);
      btn.disabled = seat.kind === 'human';
      btn.addEventListener('click', async () => {
        try {
          await api('/' + S.party.code + '/configure', {
            guestId: S.party.guestId,
            seat: i,
            kind: seat.kind === 'bot' ? 'closed' : 'bot',
          });
          poll();
        } catch (e) {
          flash($('status'), e.message);
        }
      });
      box.appendChild(btn);
    });
  }

  function renderBoard(view) {
    const host = $('board');
    const g = view.state.grid;
    host.innerHTML = '';
    host.style.gridTemplateColumns = 'repeat(' + g + ', 1fr)';
    const mySym = view.yourSeat !== null ? null : null; // letter chosen per move
    for (let i = 0; i < g * g; i++) {
      const cellEl = document.createElement('button');
      cellEl.className = 'cell';
      const v = view.state.cells[i];
      if (v !== null) {
        cellEl.classList.add('taken', v === 'S' ? 's' : 'o');
        cellEl.textContent = v;
      } else if (view.yourTurn && view.status === 'running') {
        cellEl.classList.add('open');
        cellEl.addEventListener('click', () => onMove(i));
      }
      host.appendChild(cellEl);
    }
    void mySym;
  }

  async function onMove(cell) {
    const letter = $('letter-picker').dataset.letter === 'O' ? 'O' : 'S';
    try {
      const view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { cell, letter },
      });
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  }

  $('letter-s').addEventListener('click', () => setLetter('S'));
  $('letter-o').addEventListener('click', () => setLetter('O'));
  function setLetter(l) {
    $('letter-picker').dataset.letter = l;
    $('letter-s').classList.toggle('picked', l === 'S');
    $('letter-o').classList.toggle('picked', l === 'O');
  }
  setLetter('S');

  $('btn-start').addEventListener('click', async () => {
    try {
      await api('/' + S.party.code + '/start', { guestId: S.party.guestId });
      poll();
    } catch (e) {
      flash($('status'), e.message);
    }
  });

  $('btn-copy').addEventListener('click', async () => {
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
    setTimeout(() => target.classList.remove('flash'), 1200);
  }

  document.addEventListener('DOMContentLoaded', initMenu);
})();
