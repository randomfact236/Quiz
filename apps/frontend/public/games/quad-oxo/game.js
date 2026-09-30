/**
 * quad-oxo game shell — 4-player four-in-a-row on the MP1 party engine.
 * Local-first: hot-seat plays with zero network; the ONLINE party table uses
 * /api/v1/party (server-authoritative, empty seats = bots by owner rule).
 * Network budget (AGENTS.md): party endpoints only, plus the family shared
 * files. No other outbound calls.
 */
(function () {
  'use strict';

  const cfg = window.QUADOXO_CONFIG;
  const core = window.QUADOXO_CORE;
  const storage = window.QUADOXO_STORAGE;

  // ---------- state ----------
  const S = {
    mode: 'menu', // menu | hotseat | party
    hot: null, // hot-seat local state
    party: {
      code: '',
      guestId: '',
      name: '',
      pollTimer: null,
      last: null, // last server view
    },
  };

  const $ = (sel) => document.querySelector(sel);

  function el(id) {
    return document.getElementById(id);
  }

  function show(screen) {
    for (const s of ['menu', 'hotseat', 'party-lobby', 'party-game']) {
      el('screen-' + s).hidden = s !== screen;
    }
  }

  // ---------- guest identity (same storage pattern as the family) ----------
  function ensureGuest() {
    // HARD-03: writes need the server-signed {guestId, token} pair. Cache it in
    // localStorage (same key as the family games) and mint via /guest-users/token.
    let pair = null;
    try {
      const raw = localStorage.getItem('aiquiz:guest-token');
      if (raw) pair = JSON.parse(raw);
    } catch (_) {
      /* private mode */
    }
    if (!pair || !pair.guestId || !pair.token) {
      // Sync fallback: the async mint happens in api(); identity below is the id we request.
      pair = {
        guestId: 'guest-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
        token: null,
      };
    }
    S.party.guestId = pair.guestId;
    S.party.name = storage.get('name') || 'Player ' + Math.floor(Math.random() * 90 + 10);
    return pair;
  }

  // ---------- API ----------
  async function api(path, body, method) {
    const pair = ensureGuest();
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
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }
    );
    if (res.status === 401 || res.status === 403) {
      // Token stale: mint a fresh pair once and retry.
      const minted = await fetch(cfg.apiBase + '/guest-users/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legacyId: pair.token ? null : pair.guestId }),
      });
      if (minted.ok) {
        const fresh = await minted.json();
        try {
          localStorage.setItem('aiquiz:guest-token', JSON.stringify(fresh));
        } catch (_) {}
        S.party.guestId = fresh.guestId;
        const retry = await fetch(
          cfg.apiBase +
            '/party' +
            path +
            (method === 'GET' ? '?guestId=' + encodeURIComponent(S.party.guestId) : ''),
          {
            method: method || 'POST',
            headers: {
              ...(body ? { 'Content-Type': 'application/json' } : {}),
              'X-Guest-Token': fresh.token,
            },
            body: body ? JSON.stringify(body) : undefined,
          }
        );
        if (!retry.ok) throw new Error('Request failed');
        return retry.json();
      }
    }
    if (!res.ok) {
      let msg = 'Request failed';
      try {
        msg = (await res.json()).message || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  // ---------- menu ----------
  function initMenu() {
    el('btn-hotseat').addEventListener('click', startHotseat);
    el('btn-party').addEventListener('click', () => {
      ensureGuest();
      el('party-name').value = S.party.name;
      const deep = cfg.partyCode;
      if (deep) {
        el('party-code').value = deep;
        el('party-create-box').hidden = true;
        el('party-join-box').hidden = false;
      }
      show('party-lobby');
    });
    el('party-create').addEventListener('click', createTable);
    el('party-join').addEventListener('click', joinTable);
    el('party-lobby-back').addEventListener('click', () => show('menu'));
    if (cfg.partyCode) {
      // Deep link (?party=CODE): jump straight to joining.
      ensureGuest();
      el('party-code').value = cfg.partyCode;
      show('party-lobby');
    }
  }

  // ---------- hot-seat (offline, no network) ----------
  function startHotseat() {
    S.hot = {
      state: { cells: Array(core.CELLS).fill(null), playerCount: 4 },
      turn: 0,
      names: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    };
    renderHotseat();
    show('hotseat');
  }

  function renderHotseat() {
    const h = S.hot;
    el('hot-turn').textContent = h.names[h.turn] + "'s turn";
    renderBoard(el('hot-board'), h.state, h.turn, async (cell) => {
      const err = core.validateMove(h.state, cell);
      if (err) return flash(el('hot-msg'), err);
      h.state = core.applyMove(h.state, h.turn, cell);
      const winSeat = core.anyWinningSeat(h.state);
      if (winSeat !== null) return finishHotseat(winSeat, core.winningLine(h.state, winSeat));
      if (core.isFull(h.state)) return finishHotseat(null, null);
      h.turn = (h.turn + 1) % 4;
      renderHotseat();
    });
  }

  function finishHotseat(winSeat, line) {
    el('hot-board').innerHTML = '';
    const board = el('hot-board');
    drawFinalBoard(board, S.hot.state, line);
    const msg = winSeat === null ? 'Board full — shared win!' : S.hot.names[winSeat] + ' wins!';
    el('hot-turn').textContent = msg;
    el('btn-hot-again').hidden = false;
  }

  el('btn-hot-again').addEventListener('click', () => {
    el('btn-hot-again').hidden = true;
    startHotseat();
  });

  // ---------- party lobby ----------
  async function createTable() {
    const name = el('party-name').value.trim() || S.party.name;
    storage.set('name', name);
    const seats = parseInt(el('party-seats').value, 10) || 4;
    const tier = el('party-tier').value;
    try {
      const r = await api('', {
        gameSlug: 'quad-oxo',
        playerName: name,
        guestId: S.party.guestId,
        seats,
        tier,
      });
      S.party.code = r.code;
      enterGame();
    } catch (e) {
      flash(el('party-msg'), e.message);
    }
  }

  async function joinTable() {
    const code = el('party-code').value.trim().toUpperCase();
    const name = el('party-name').value.trim() || S.party.name;
    storage.set('name', name);
    if (!/^[A-Z0-9]{6}$/.test(code)) return flash(el('party-msg'), 'Enter the 6-character code.');
    try {
      await api('/' + code + '/join', { playerName: name, guestId: S.party.guestId });
      S.party.code = code;
      enterGame();
    } catch (e) {
      flash(el('party-msg'), e.message);
    }
  }

  function enterGame() {
    el('screen-party-lobby').hidden = true;
    el('screen-party-game').hidden = false;
    el('party-code-label').textContent = S.party.code;
    poll();
  }

  // ---------- party game ----------
  async function poll() {
    if ((S.mode !== 'party' && !el('screen-party-game')) || el('screen-party-game').hidden) return;
    try {
      const view = await api('/' + S.party.code, null, 'GET');
      S.party.last = view;
      renderParty(view);
    } catch (e) {
      flash(el('party-status'), e.message);
    } finally {
      clearTimeout(S.party.pollTimer);
      S.party.pollTimer = setTimeout(poll, cfg.pollMs);
    }
  }

  function renderParty(view) {
    // seats row
    const seatsEl = el('party-seats-row');
    seatsEl.innerHTML = '';
    view.seats.forEach((seat, i) => {
      const chip = document.createElement('span');
      chip.className =
        'seat-chip ' +
        (i === view.turn && view.status === 'running' ? 'seat-active' : '') +
        ' ' +
        core.SYMBOLS[i].toLowerCase();
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : seat.kind === 'closed' ? ' ✖' : '');
      seatsEl.appendChild(chip);
    });

    el('party-status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start…'
        : view.status === 'finished'
          ? placementText(view)
          : view.yourTurn
            ? 'Your turn — place your mark!'
            : 'Waiting for ' + (view.seats[view.turn] ? view.seats[view.turn].name : '…') + '…';

    if (view.status === 'finished') {
      const winSeat = view.placement && view.placement.find((p) => p.rank === 1);
      drawFinalBoard(
        el('party-board'),
        view.state,
        winSeat && view.placement.length === 1 ? null : null
      );
    } else {
      renderBoard(el('party-board'), view.state, view.yourSeat, onPartyMove);
    }

    // host controls
    const isHost = view.yourSeat === 0;
    el('party-start').hidden = !(isHost && view.status === 'waiting');
    el('party-configure').hidden = !(isHost && view.status === 'waiting');
    if (isHost && view.status === 'waiting') renderConfigure(view);
    el('party-copy').hidden = false;
  }

  function placementText(view) {
    if (!view.placement) return 'Finished.';
    const names = view.seats.map((s) => s.name);
    const firsts = view.placement.filter((p) => p.rank === 1);
    if (firsts.length === view.placement.length) return 'Shared win — nobody lined up!';
    return (
      '🏆 ' +
      firsts.map((p) => names[p.seat]).join(' & ') +
      ' wins!  2nd: ' +
      view.placement
        .filter((p) => p.rank === 2)
        .map((p) => names[p.seat])
        .join(', ')
    );
  }

  function renderConfigure(view) {
    const box = el('party-configure');
    box.innerHTML = '';
    view.seats.forEach((seat, i) => {
      if (i === 0) return;
      const btn = document.createElement('button');
      btn.className = 'seat-toggle';
      btn.textContent =
        'Seat ' +
        (i + 1) +
        ': ' +
        (seat.kind === 'bot' ? 'Bot → Closed' : seat.kind === 'closed' ? 'Closed → Bot' : 'Human');
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
          flash(el('party-status'), e.message);
        }
      });
      box.appendChild(btn);
    });
  }

  async function onPartyMove(cell) {
    try {
      const view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: cell,
      });
      S.party.last = view;
      renderParty(view);
    } catch (e) {
      flash(el('party-status'), e.message);
    }
  }

  el('party-start').addEventListener('click', async () => {
    try {
      await api('/' + S.party.code + '/start', { guestId: S.party.guestId });
      poll();
    } catch (e) {
      flash(el('party-status'), e.message);
    }
  });

  el('party-copy').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '?party=' + S.party.code;
    try {
      await navigator.clipboard.writeText(url);
      flash(el('party-status'), 'Invite link copied!');
    } catch (_) {
      flash(el('party-status'), url);
    }
  });

  el('party-leave').addEventListener('click', async () => {
    clearTimeout(S.party.pollTimer);
    try {
      await api('/' + S.party.code + '/leave', { guestId: S.party.guestId });
    } catch (_) {
      /* best effort */
    }
    location.href = location.pathname;
  });

  // ---------- shared board rendering ----------
  function renderBoard(container, state, mySeat, onCell) {
    container.innerHTML = '';
    container.classList.add('board');
    const mySym = mySeat !== null && mySeat !== undefined ? core.SYMBOLS[mySeat] : null;
    for (let i = 0; i < core.CELLS; i++) {
      const cellEl = document.createElement('button');
      cellEl.className = 'cell';
      const v = state.cells[i];
      if (v !== null) {
        cellEl.classList.add('taken', v.toLowerCase());
        cellEl.textContent = symbolGlyph(v);
      } else if (mySym !== null && onCell) {
        cellEl.classList.add('open');
        cellEl.addEventListener('click', () => onCell(i));
      }
      container.appendChild(cellEl);
    }
  }

  function drawFinalBoard(container, state, line) {
    container.innerHTML = '';
    container.classList.add('board');
    const winLine = core.LINES.find((l) => {
      const v = state.cells[l[0]];
      return v !== null && l.every((i) => state.cells[i] === v);
    });
    for (let i = 0; i < core.CELLS; i++) {
      const cellEl = document.createElement('span');
      cellEl.className = 'cell taken';
      const v = state.cells[i];
      if (v !== null) {
        cellEl.classList.add(v.toLowerCase());
        cellEl.textContent = symbolGlyph(v);
      }
      if (winLine && winLine.includes(i)) cellEl.classList.add('win');
      container.appendChild(cellEl);
    }
  }

  function symbolGlyph(sym) {
    return { A: '●', B: '▲', C: '■', D: '★' }[sym] || sym;
  }

  function flash(target, msg) {
    if (!target) return;
    target.textContent = msg;
    target.classList.add('flash');
    setTimeout(() => target.classList.remove('flash'), 1200);
  }

  // ---------- boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    show('menu');
  });
})();
