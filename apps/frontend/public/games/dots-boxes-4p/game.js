/**
 * dots-boxes-4p game shell — 4-player dots & boxes on the MP1 party engine.
 * Local-first hot-seat; online table via /api/v1/party (bots fill empty seats).
 */
(function () {
  'use strict';

  const cfg = window.DB4_CONFIG;
  const core = window.DB4_CORE;
  const storage = window.DB4_STORAGE;

  const S = {
    party: { code: '', guestId: '', name: '', pollTimer: null },
  };

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

  // ---------- menu ----------
  function initMenu() {
    $('btn-create').addEventListener('click', createTable);
    $('btn-join').addEventListener('click', joinTable);
    $('btn-leave').addEventListener('click', leave);
    if (cfg.partyCode) {
      ensureGuest();
      $('join-code').value = cfg.partyCode;
    }
  }

  async function createTable() {
    ensureGuest();
    const name = $('player-name').value.trim() || S.party.name;
    storage.set('name', name);
    const seats = parseInt($('seat-count').value, 10) || 4;
    const tier = $('bot-tier').value;
    try {
      const r = await api('', {
        gameSlug: 'dots-boxes-4p',
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
      /* best effort */
    }
    location.href = location.pathname;
  }

  // ---------- poll + render ----------
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
    // seats
    const row = $('seats-row');
    row.innerHTML = '';
    view.seats.forEach((seat, i) => {
      const chip = document.createElement('span');
      chip.className =
        'seat-chip' + (i === view.turn && view.status === 'running' ? ' active' : '');
      chip.style.borderColor = cfg.seatColors[i];
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') + seat.name + (seat.kind === 'bot' ? ' 🤖' : '');
      row.appendChild(chip);
    });
    // scores
    const scoreEl = $('scores');
    scoreEl.innerHTML = '';
    view.state.scores.forEach((s, i) => {
      const chip = document.createElement('span');
      chip.className = 'score-chip';
      chip.style.color = cfg.seatColors[i];
      chip.textContent = cfg.seatNames[i] + ' ' + s;
      scoreEl.appendChild(chip);
    });
    // status
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start…'
        : view.status === 'finished'
          ? placementText(view)
          : view.yourTurn
            ? 'Your turn — draw an edge!'
            : 'Waiting…';
    // board
    renderBoard(view);
    // host controls
    const isHost = view.yourSeat === 0;
    $('btn-start').hidden = !(isHost && view.status === 'waiting');
    $('btn-copy').hidden = view.status === 'finished';
    if (isHost && view.status === 'waiting') renderConfigure(view);
    else $('configure-row').innerHTML = '';
  }

  function placementText(view) {
    if (!view.placement) return 'Finished.';
    const names = view.seats.map((s) => s.name);
    return view.placement
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((p) => '#' + p.rank + ' ' + names[p.seat])
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

  // board: SVG lattice; edges clickable when free + your turn
  function renderBoard(view) {
    const host = $('board');
    const n = cfg.n;
    const cell = 34;
    const pad = 14;
    const size = pad * 2 + n * cell;
    const hCount = n * (n + 1);
    const svgNS = 'http://www.w3.org/2000/svg';
    host.innerHTML = '';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.classList.add('lattice');

    const edgeLine = (e) => {
      let x1;
      let y1;
      let x2;
      let y2;
      if (e < hCount) {
        const r = Math.floor(e / n);
        const c = e % n;
        x1 = pad + c * cell;
        y1 = pad + r * cell;
        x2 = x1 + cell;
        y2 = y1;
      } else {
        const k = e - hCount;
        const r = Math.floor(k / (n + 1));
        const c = k % (n + 1);
        x1 = pad + c * cell;
        y1 = pad + r * cell;
        x2 = x1;
        y2 = y1 + cell;
      }
      return { x1, y1, x2, y2 };
    };

    // claimed box fills
    for (let b = 0; b < n * n; b++) {
      const owner = view.state.owners[b];
      if (owner === 0) continue;
      const r = Math.floor(b / n);
      const c = b % n;
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', pad + c * cell + 4);
      rect.setAttribute('y', pad + r * cell + 4);
      rect.setAttribute('width', cell - 8);
      rect.setAttribute('height', cell - 8);
      rect.setAttribute('rx', 4);
      rect.setAttribute('fill', cfg.seatColors[owner - 1]);
      rect.setAttribute('opacity', '0.55');
      svg.appendChild(rect);
    }

    // edges
    for (let e = 0; e < cfg.edgeCount; e++) {
      const drawn = view.state.edges[e];
      const { x1, y1, x2, y2 } = edgeLine(e);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke-linecap', 'round');
      if (drawn !== 0) {
        line.setAttribute('stroke', cfg.seatColors[drawn - 1]);
        line.setAttribute('stroke-width', '4');
      } else {
        line.setAttribute('stroke', 'rgba(128,128,128,0.35)');
        line.setAttribute('stroke-width', '2');
        if (view.yourTurn && view.status === 'running') {
          line.classList.add('edge-open');
          const hit = document.createElementNS(svgNS, 'line');
          hit.setAttribute('x1', x1);
          hit.setAttribute('y1', y1);
          hit.setAttribute('x2', x2);
          hit.setAttribute('y2', y2);
          hit.setAttribute('stroke', 'transparent');
          hit.setAttribute('stroke-width', '12');
          hit.style.cursor = 'pointer';
          hit.addEventListener('click', () => onMove(e));
          svg.appendChild(line);
          svg.appendChild(hit);
          continue;
        }
      }
      svg.appendChild(line);
    }

    // dots
    for (let r = 0; r <= n; r++) {
      for (let c = 0; c <= n; c++) {
        const dot = document.createElementNS(svgNS, 'circle');
        dot.setAttribute('cx', pad + c * cell);
        dot.setAttribute('cy', pad + r * cell);
        dot.setAttribute('r', 2.5);
        dot.setAttribute('fill', 'currentColor');
        svg.appendChild(dot);
      }
    }
    host.appendChild(svg);
  }

  async function onMove(edge) {
    try {
      const view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: edge,
      });
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  }

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
