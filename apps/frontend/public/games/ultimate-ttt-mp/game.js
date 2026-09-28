/**
 * ultimate-ttt-mp game shell — the send-rule duel on the MP1 party engine.
 */
(function () {
  'use strict';
  const cfg = window.UTTT_CONFIG;
  const core = window.UTTT_CORE;
  const storage = window.UTTT_STORAGE;
  const S = { party: { code: '', guestId: '', name: '', pollTimer: null } };
  const $ = function (id) {
    return document.getElementById(id);
  };
  const SYMBOL = ['●', '▲', '■', '★'];

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
          gameSlug: 'ultimate-ttt-mp',
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
        (i === view.yourSeat ? '★ ' : '') +
        seat.name +
        (seat.kind === 'bot' ? ' 🤖' : '') +
        ' ' +
        SYMBOL[i] +
        '×' +
        view.state.boardOwner.filter(function (v) {
          return v === i + 1;
        }).length;
      row.appendChild(chip);
    });
    $('status').textContent =
      view.status === 'waiting'
        ? 'Waiting for the host to start…'
        : view.status === 'finished'
          ? placementText(view)
          : view.yourTurn
            ? view.state.activeBoard >= 0
              ? 'Your turn — board ' + (view.state.activeBoard + 1) + ' is forced.'
              : 'Your turn — play any board.'
            : 'Waiting…';
    renderBoard(view);
    $('btn-start').hidden = !(view.yourSeat === 0 && view.status === 'waiting');
  }
  function placementText(view) {
    if (!view.placement) return 'Finished.';
    const names = view.seats.map(function (s) {
      return s.name;
    });
    const firsts = view.placement.filter(function (p) {
      return p.rank === 1;
    });
    if (firsts.length === view.placement.length) return 'All boards decided — shared result!';
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
    for (let b = 0; b < 9; b++) {
      const mini = document.createElement('div');
      mini.className = 'mini';
      if (view.state.boardDone[b]) mini.classList.add('dead');
      if (view.status === 'running' && view.state.activeBoard === b) mini.classList.add('active');
      if (view.state.boardOwner[b] !== 0) mini.classList.add('won-' + view.state.boardOwner[b]);
      for (let i = 0; i < 9; i++) {
        const cellEl = document.createElement('button');
        cellEl.className = 'cellb';
        const v = view.state.cells[b * 9 + i];
        if (v !== 0) {
          cellEl.textContent = SYMBOL[v - 1];
          cellEl.style.color = cfg.seatColors[v - 1];
        } else if (
          view.yourTurn &&
          view.status === 'running' &&
          (view.state.activeBoard === -1 || view.state.activeBoard === b)
        ) {
          cellEl.classList.add('open');
          (function (cell) {
            cellEl.addEventListener('click', function () {
              onMove(cell);
            });
          })(b * 9 + i);
        }
        mini.appendChild(cellEl);
      }
      host.appendChild(mini);
    }
  }
  async function onMove(cell) {
    try {
      const view = await api('/' + S.party.code + '/move', {
        guestId: S.party.guestId,
        move: cell,
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
