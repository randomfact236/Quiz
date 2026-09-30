/**
 * connect-four-mp game shell — 3/4-player drop duel on the MP1 party engine.
 */
(function () {
  'use strict';
  const cfg = window.C4MP_CONFIG;
  const storage = window.C4MP_STORAGE;
  const S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
  const $ = function (id) {
    return document.getElementById(id);
  };

  function show(screen) {
    ['menu', 'game'].forEach(function (s) {
      $('screen-' + s).hidden = s !== screen;
    });
  }
  function ensureGuest() {
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
    const pair = ensureGuest();
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (pair.token) headers['X-Guest-Token'] = pair.token;
    // Fresh-visitor guest bootstrap: mint the signed pair before any write.
    let bpair = pair;
    if (!bpair || !bpair.token) {
      try {
        const mint = await fetch(cfg.apiBase + '/guest-users/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ legacyId: (bpair && bpair.guestId) || S.party.guestId || null }),
        });
        if (mint.ok) {
          bpair = await mint.json();
          try {
            localStorage.setItem('aiquiz:guest-token', JSON.stringify(bpair));
          } catch (_) {}
        }
      } catch (_) {}
    }
    if (bpair && bpair.guestId) S.party.guestId = bpair.guestId;
    if (bpair && bpair.token) headers['X-Guest-Token'] = bpair.token;
    if (body && typeof body === 'object' && body.guestId) body.guestId = S.party.guestId;
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
  function initMenu() {
    $('btn-create').addEventListener('click', async function () {
      ensureGuest();
      const name = $('player-name').value.trim() || S.party.name;
      storage.set('name', name);
      try {
        const r = await api('', {
          gameSlug: 'connect-four-mp',
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
  function enterGame() {
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
        'seat-chip' + (i === view.turn && view.status === 'running' ? ' active' : '');
      chip.style.borderColor = cfg.seatColors[i];
      chip.textContent =
        (i === view.yourSeat ? '★ ' : '') + seat.name + (seat.kind === 'bot' ? ' 🤖' : '');
      row.appendChild(chip);
    });
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start…'
        : view.status === 'finished'
          ? placementText(view)
          : view.yourTurn
            ? 'Your turn — tap a column.'
            : 'Waiting…';
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
    renderBoard(view);
  }
  function placementText(view) {
    if (!view.placement) return 'Finished.';
    const names = view.seats.map(function (s) {
      return s.name;
    });
    const firsts = view.placement.filter(function (p) {
      return p.rank === 1;
    });
    if (firsts.length === view.placement.length) return 'Board full — shared result!';
    return (
      '🏆 ' +
      firsts
        .map(function (p) {
          return names[p.seat];
        })
        .join(' & ') +
      ' wins!'
    );
  }
  function renderBoard(view) {
    const host = $('board');
    host.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const cell = 34,
      pad = 8;
    const size = pad * 2 + view.state.cols * cell;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + (pad * 2 + view.state.rows * cell));
    svg.classList.add('lattice');
    for (let r = 0; r < view.state.rows; r++) {
      for (let c = 0; c < view.state.cols; c++) {
        const hole = document.createElementNS(svgNS, 'circle');
        hole.setAttribute('cx', pad + c * cell + cell / 2);
        hole.setAttribute('cy', pad + r * cell + cell / 2);
        hole.setAttribute('r', cell / 2 - 3);
        hole.classList.add('hole');
        svg.appendChild(hole);
        const v = view.state.grid[r][c];
        if (v !== 0) {
          const disc = document.createElementNS(svgNS, 'circle');
          disc.setAttribute('cx', pad + c * cell + cell / 2);
          disc.setAttribute('cy', pad + r * cell + cell / 2);
          disc.setAttribute('r', cell / 2 - 4);
          disc.classList.add('disc-' + v);
          svg.appendChild(disc);
        }
      }
    }
    if (view.yourTurn && view.status === 'running') {
      for (let c = 0; c < view.state.cols; c++) {
        const hit = document.createElementNS(svgNS, 'rect');
        hit.setAttribute('x', pad + c * cell);
        hit.setAttribute('y', 0);
        hit.setAttribute('width', cell);
        hit.setAttribute('height', pad * 2 + view.state.rows * cell);
        hit.classList.add('col-hit');
        hit.addEventListener('click', function () {
          onMove(c);
        });
        svg.appendChild(hit);
      }
    }
    host.appendChild(svg);
  }
  async function onMove(col) {
    try {
      const view = await api('/' + S.party.code + '/move', { guestId: S.party.guestId, move: col });
      render(view);
    } catch (e) {
      flash($('status'), e.message);
    }
  }
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
