/**
 * memory-flip-mp game shell — the pairs game on the MP1 party engine.
 * Move = {cell}; match = +1 and another flip; miss = cards flip back.
 */
(function () {
  'use strict';
  const cfg = window.GAME_CFG;
  const core = window.MEMCORE;
  const storage = window.GAME_STORAGE;
  const S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
  const $ = function (id) {
    return document.getElementById(id);
  };
  const SHAPES = [
    '🍎',
    '⭐',
    '🐸',
    '🌙',
    '🚗',
    '🔔',
    '🐙',
    '🌻',
    '🎲',
    '🍋',
    '🦋',
    '🍄',
    '🐬',
    '🎯',
    '🍒',
    '⚡',
    '🐙',
    '⭐',
  ];

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
  async function initMenu() {
    $('btn-create').addEventListener('click', async function () {
      await ensureGuest();
      const name = $('player-name').value.trim() || S.party.name;
      storage.set('name', name);
      try {
        const r = await api('', {
          gameSlug: 'memory-flip-mp',
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
            ? view.state.revealed.length === 1
              ? 'One card up — find its pair!'
              : 'Your turn — flip two cards.'
            : 'Waiting…';
    renderBoard(view);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
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
        return '#' + p.rank + ' ' + names[p.seat] + ' (' + view.state.scores[p.seat] + ')';
      })
      .join(' · ');
  }
  function renderBoard(view) {
    const host = $('board');
    host.innerHTML = '';
    view.state.claimed.forEach(function (owner, i) {
      const cardEl = document.createElement('button');
      cardEl.className = 'card';
      const revealed = view.state.revealed.find(function (r) {
        return r.cell === i;
      });
      if (owner !== 0) {
        cardEl.classList.add('claimed-' + owner);
        cardEl.textContent =
          SHAPES[(view.state.deck && view.state.deck[i] ? view.state.deck[i] : owner) - 1] || '★';
      } else if (revealed) {
        cardEl.classList.add('faceup');
        cardEl.textContent = SHAPES[revealed.value - 1] || '★';
      } else if (view.yourTurn && view.status === 'running') {
        cardEl.classList.add('open');
        (function (cell) {
          cardEl.addEventListener('click', function () {
            onMove(cell);
          });
        })(i);
      }
      host.appendChild(cardEl);
    });
  }
  async function onMove(cell) {
    try {
      const view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: { cell: cell },
      });
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
