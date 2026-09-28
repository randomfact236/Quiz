/**
 * ============================================================================
 * game.js — Battleship (plan/games/04-battleship.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (the games convention). The pure model lives in
 * core.js (jest-tested), persistence in storage.js, flags/strings in
 * config.js. This file is screens + DOM wiring; it auto-inits only when its
 * board exists in the DOM.
 *
 * The fleet is PLAYER-CREATED (plan §4: nothing pre-filled — the only
 * "content" is what you place). Modes (the family template): solo vs computer
 * (easy/medium/hard), 2-player hot-seat, and ⚔️ online duels on the
 * server-authoritative poll backend — where the server holds both fleets and
 * the read view is redacted (the enemy fleet never crosses the API).
 * Deep link: ?bs=CODE. Marks: 1 = 🔴 Red (creator, opens), 2 = 🔵 Blue.
 * ============================================================================
 */

import {
  SIZE,
  CELLS,
  FLEET,
  HITS,
  rowCol,
  cellOf,
  isLegalPlacement,
  placeShip,
  randomFleet,
  fleetComplete,
  resolveShot,
  fire,
  allSunk,
  aiTarget,
} from './core.js?v=1';
import {
  emptyTally,
  seriesSetupKey,
  loadSeries,
  saveSeries,
  loadPrefs,
  savePrefs,
} from './storage.js';
import { GAME_CONFIG } from './config.js';

/* ==========================================================================
 * UI — auto-inits only when the board exists (never under jest/node)
 * ======================================================================= */

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p' | 'online'
  difficulty: 'medium',
  phase: 'placing', // 'placing' | 'battle' | 'finished'
  placing: 0, // index of the ship being placed
  orientation: 'h',
  iAm: 1, // which side this device plays in a local match (2p: the last placer)
  myFleet: [null, null, null],
  theirFleet: [null, null, null], // local modes only; online keeps this null
  myShots: new Uint8Array(CELLS), // shots I fired at their waters (1 = hit)
  theirShots: new Uint8Array(CELLS), // shots they fired at me (1 miss | 2 hit)
  myTurn: true,
  winner: 0, // 0 none | 1 me | 2 them
  placingFor: 1, // hot-seat: which player is placing (1 Red, 2 Blue)
  series: emptyTally(),
  aiTimer: null,
  // plan/games/04: live online duel — server-authoritative, 3-s poll.
  online: null, // { code, mark, pollTimer, busy, ready }
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty);
}

const markLabel = (m) => (m === 1 ? '🔴' : '🔵');
const markName = (m) => (m === 1 ? 'Red' : 'Blue');
const myMark = () => (state.mode === 'online' && state.online ? state.online.mark : state.iAm);
const themMark = () => (myMark() === 1 ? 2 : 1);

/* ---- screens -------------------------------------------------------------- */

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name === 'playing');
  if (name === 'menu') renderSeriesCard();
}

function renderSeriesCard() {
  let scope =
    state.mode === '1p'
      ? 'vs computer · ' + state.difficulty
      : state.mode === 'online'
        ? 'online duel'
        : '2 players';
  els.seriesScope.textContent = scope;
  els.seriesR.textContent = String(state.series.r);
  els.seriesB.textContent = String(state.series.b);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.r + state.series.b + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '🔴 ' + state.series.r + ' · 🤝 ' + state.series.draw + ' · 🔵 ' + state.series.b;
}

/* ---- board rendering --------------------------------------------------------- */

function buildGrid(container) {
  container.innerHTML = '';
  for (let i = 0; i < CELLS; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.cell = String(i);
    cell.setAttribute(
      'aria-label',
      'Row ' + (Math.floor(i / SIZE) + 1) + ', column ' + ((i % SIZE) + 1)
    );
    container.appendChild(cell);
  }
}

function paintGrid(container, classesFor) {
  for (let i = 0; i < CELLS; i++) {
    const cell = container.children[i];
    cell.className = 'cell';
    cell.disabled = false;
    const { row, col } = rowCol(i);
    cell.setAttribute(
      'aria-label',
      `Row ${row + 1}, column ${col + 1}${classesFor(i) ? ', marked' : ''}`
    );
    const extra = classesFor(i);
    if (extra) cell.className = `cell ${extra}`;
  }
}

function renderPlacement() {
  els.seaMine.style.display = '';
  els.seaTheirs.style.display = 'none';
  els.placementBar.classList.remove('hidden');
  const len = FLEET[state.placing];
  els.placementLabel.textContent = `Ship ${state.placing + 1} of ${FLEET.length} — length ${len} (${state.orientation === 'h' ? 'horizontal' : 'vertical'})`;
  els.seaMineTitle.textContent = 'Place your fleet';
  els.turn.textContent = 'Place your ships';
  els.turn.dataset.mark = String(myMark());

  paintGrid(els.seaMine, (i) => {
    // live preview: the current ship would fit at this cell
    if (
      state.placing < FLEET.length &&
      isLegalPlacement(state.myFleet, state.placing, i, state.orientation)
    ) {
      return 'cell--preview';
    }
    return fleetCellsHas(state.myFleet, i) ? 'cell--mine' : '';
  });
}

function fleetCellsHas(fleet, cell) {
  for (const ship of fleet) if (ship && ship.cells.includes(cell)) return true;
  return false;
}

function renderBattle(view) {
  els.placementBar.classList.add('hidden');
  els.seaMine.style.display = '';
  els.seaTheirs.style.display = '';
  els.seaMineTitle.textContent =
    state.mode === '1p' ? 'Your waters' : myMark() === 1 ? 'Red waters' : 'Blue waters';
  els.seaTheirsTitle.textContent =
    state.mode === '1p' ? 'Enemy waters' : myMark() === 1 ? 'Blue waters' : 'Red waters';

  const myFleet = state.myFleet;
  const sunkYours = new Set(sunkShipCells(myFleet, state.theirShots));
  paintGrid(els.seaMine, (i) => {
    if (state.theirShots[i] === 2) return sunkYours.has(i) ? 'cell--sunk' : 'cell--hit';
    if (state.theirShots[i] === 1) return 'cell--miss';
    if (fleetCellsHas(myFleet, i)) return 'cell--mine';
    return '';
  });
  for (let i = 0; i < CELLS; i++) els.seaMine.children[i].disabled = state.theirShots[i] !== 0;

  const reveal = state.phase === 'finished';
  paintGrid(els.seaTheirs, (i) => {
    if (state.myShots[i] === HITS) {
      const theirSunk = reveal && sunkShipCellsFor(state.theirFleet, state.myShots).has(i);
      return theirSunk ? 'cell--sunk' : 'cell--hit';
    }
    if (state.myShots[i] !== 0) return 'cell--miss';
    if (reveal && fleetCellsHas(state.theirFleet, i)) return 'cell--mine';
    return '';
  });
  // only the player on turn may fire
  for (let i = 0; i < CELLS; i++) {
    els.seaTheirs.children[i].disabled = !state.myTurn || state.myShots[i] !== 0;
  }
  void view;

  els.turn.textContent =
    state.phase === 'finished'
      ? 'Battle over'
      : state.myTurn
        ? 'Your shot — pick a cell in ' +
          (state.mode === '1p' ? 'enemy waters' : themMark() === 1 ? 'Blue waters' : 'Red waters')
        : state.mode === '1p'
          ? 'Computer is aiming…'
          : markLabel(themMark()) + ' ' + markName(themMark()) + ' is aiming…';
  els.turn.dataset.mark = String(state.myTurn ? myMark() : themMark());
}

function sunkShipCells(fleet, incoming) {
  const out = new Set();
  for (const ship of fleet) {
    if (ship && ship.cells.every((c) => incoming[c] === 2)) for (const c of ship.cells) out.add(c);
  }
  return out;
}

function sunkShipCellsFor(fleet, shots) {
  const out = new Set();
  for (const ship of fleet) {
    if (ship && ship.cells.every((c) => shots[c] === HITS)) for (const c of ship.cells) out.add(c);
  }
  return out;
}

/* ---- placement + local battle -------------------------------------------------- */

function tryPlace(cell) {
  const placed = placeShip(
    { fleet: state.myFleet, orientation: state.orientation },
    state.placing,
    cell,
    state.orientation
  );
  if (!placed) {
    toast('That ship will not fit there');
    return;
  }
  state.myFleet = placed.fleet;
  state.placing += 1;
  if (fleetComplete(state.myFleet)) {
    onFleetComplete();
    return;
  }
  renderPlacement();
}

function onFleetComplete() {
  if (state.mode === 'online') {
    submitOnlineFleet();
    return;
  }
  if (state.mode === '1p') {
    // the computer places its own fleet
    state.theirFleet = randomFleet();
    startBattle();
    return;
  }
  // 2p hot-seat: the FIRST completion hands the device to the other player
  // (their fleet becomes the enemy fleet); the second one starts the battle.
  if (state.placingFor === 1) {
    state.theirFleet = state.myFleet;
    state.myFleet = [null, null, null];
    state.placingFor = 2;
    state.phase = 'placing';
    state.placing = 0;
    renderPlacement();
    els.turn.textContent = 'Blue places their fleet';
    els.turn.dataset.mark = '2';
    return;
  }
  startBattle();
}

function startBattle() {
  state.phase = 'battle';
  state.myTurn = myMark() === 1; // the creator/red opens
  renderBattle();
  if (!state.myTurn) scheduleTheirShot();
}

function localFire(cell) {
  if (state.phase !== 'battle' || !state.myTurn || state.myShots[cell] !== 0) return;
  state.myShots = fire(state.myShots, cell);
  const { result, sunk } = resolveShot(state.theirFleet, state.myShots, cell);
  if (result === 'hit' && sunk) toast('You sank a ' + sunk + '-cell ship!');
  if (allSunk(state.theirFleet, state.myShots)) {
    finishLocal(1);
    return;
  }
  state.myTurn = false;
  renderBattle();
  scheduleTheirShot();
}

function scheduleTheirShot() {
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    els.thinkingBadge.classList.add('hidden');
    if (state.phase !== 'battle' || state.myTurn) return;
    theirFire(aiTarget(state.theirShots, state.myFleet, state.difficulty));
  }, GAME_CONFIG.aiThinkDelayMs);
}

function theirFire(cell) {
  if (cell < 0) return;
  const { result, sunk } = resolveShot(state.myFleet, state.theirShots, cell);
  if (result === 'invalid') return;
  state.theirShots = Uint8Array.from(state.theirShots);
  state.theirShots[cell] = result === 'hit' ? 2 : 1;
  if (result === 'hit' && sunk) {
    toast(
      (state.mode === '1p' ? 'The computer sank' : markName(themMark()) + ' sank') +
        ' your ' +
        sunk +
        '-cell ship!'
    );
  }
  if (allSunk(state.myFleet, state.theirShots)) {
    finishLocal(2);
    return;
  }
  state.myTurn = true;
  renderBattle();
}

/** `iWon` = the player on this device won → the winner is a SIDE (2p plays 🔵). */
function finishLocal(iWon) {
  state.phase = 'finished';
  const winner = iWon ? myMark() : themMark();
  state.winner = winner;
  if (winner === 1) state.series.r++;
  else if (winner === 2) state.series.b++;
  else state.series.draw++;
  saveSeries(currentSetupKey(), state.series);
  renderBattle();
  renderMiniSeries();
  showOverlay(winner === myMark(), winner);
}

/* ---- round overlay ------------------------------------------------------------- */

function showOverlay(youWon, winner) {
  els.overlayEmoji.textContent = winner === 0 ? '🤝' : youWon ? '🎉' : '😬';
  els.overlayTitle.textContent =
    winner === 0 ? 'Draw' : youWon ? 'You win!' : markName(winner === 1 ? 2 : 1) + ' wins';
  els.overlaySub.textContent =
    'Series — 🔴 ' + state.series.r + ' · 🔵 ' + state.series.b + ' · 🤝 ' + state.series.draw;
  els.overlay.classList.remove('hidden');
  document.getElementById('btn-next').focus();
}

/* ---- online duel (plan/games/04) ------------------------------------------------ */
/* Server-authoritative matches (backend /battleship): fleets are submitted and
 * VALIDATED server-side, shots are resolved server-side, and the poll view is
 * redacted — we see our fleet, our shots and what landed on us; the enemy
 * fleet never crosses the API. Deep link: ?bs=CODE. */

const ONLINE_API =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3012/api/v1'
    : 'https://api.pigzap.com/api/v1';

function onlineGuestId() {
  try {
    const key = 'aiquiz:guest-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'guest_anon';
  }
}

function onlinePlayerName() {
  const name = els.onlineName.value.trim().slice(0, 24) || 'Guest';
  try {
    localStorage.setItem('pigzap:challenge-name', name);
  } catch {
    /* private mode */
  }
  return name;
}

/** The server-signed guest pair (HARD-03) cached by the app under this key —
 *  every guest WRITE the duels backend accepts requires it as X-Guest-Token. */
function onlineGuestPair() {
  try {
    const raw = localStorage.getItem('aiquiz:guest-token');
    if (!raw) return null;
    const pair = JSON.parse(raw);
    return pair && pair.guestId && pair.token ? pair : null;
  } catch {
    return null;
  }
}

/** Reuse the app's signed pair, or issue one for this device's guest id. */
async function ensureOnlineGuestPair() {
  const guestId = onlineGuestId();
  const cached = onlineGuestPair();
  if (cached && cached.guestId === guestId) return cached;
  const res = await fetch(ONLINE_API + '/guest-users/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ legacyId: guestId }),
  });
  if (!res.ok) return null;
  const pair = await res.json();
  try {
    localStorage.setItem('aiquiz:guest-token', JSON.stringify(pair));
  } catch {
    /* private mode — the in-memory pair still works this page */
  }
  return pair;
}

function onlineApi(path, body) {
  return ensureOnlineGuestPair()
    .then((pair) =>
      fetch(ONLINE_API + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(pair ? { 'X-Guest-Token': pair.token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    )
    .then((r) => {
      if (!r.ok)
        return r.json().then((e) => Promise.reject(new Error(e.message || String(r.status))));
      return r.json();
    });
}

function onlineStatus(text) {
  els.onlineStatus.textContent = text;
}

function stopOnlinePoll() {
  if (state.online && state.online.pollTimer) {
    clearInterval(state.online.pollTimer);
    state.online.pollTimer = null;
  }
}

function onlineLeaveQuietly() {
  if (state.online && state.online.code && state.online.mark) {
    onlineApi('/battleship/' + state.online.code + '/leave', {
      playerName: onlinePlayerName(),
      guestId: onlineGuestId(),
    }).catch(() => undefined);
  }
  stopOnlinePoll();
  state.online = null;
}

function onlineCreate() {
  onlineStatus('Creating the match…');
  onlineApi('/battleship', { playerName: onlinePlayerName(), guestId: onlineGuestId() })
    .then(({ code }) => {
      state.online = { code, mark: 1, pollTimer: null, busy: false };
      const link = 'https://pigzap.com/games/battleship/?bs=' + code;
      onlineStatus('Match ' + code + ' — waiting for a challenger. Send: ' + link);
      if (navigator.share) {
        navigator
          .share({ title: 'Battleship duel', text: 'Sunk my fleet? Match ' + code, url: link })
          .catch(() => undefined);
      }
      state.online.pollTimer = setInterval(pollOnline, 3000);
      refreshSeriesFromStorage();
      showScreen('playing');
      state.phase = 'placing';
      state.placing = 0;
      state.myFleet = [null, null, null];
      state.orientation = 'h';
      buildGrids();
      renderPlacement();
    })
    .catch(() => onlineStatus('Could not create the match — check your connection.'));
}

function onlineJoin(code) {
  if (!code) return;
  onlineStatus('Joining ' + code + '…');
  onlineApi('/battleship/' + encodeURIComponent(code) + '/join', {
    playerName: onlinePlayerName(),
    guestId: onlineGuestId(),
  })
    .then((view) => {
      state.online = { code: view.code, mark: view.yourMark, pollTimer: null, busy: false };
      refreshSeriesFromStorage();
      showScreen('playing');
      buildGrids();
      if (view.status === 'waiting') {
        onlineStatus('Joined — waiting for 🔴 to claim the match.');
        els.turn.textContent = 'Waiting for a challenger…';
        els.placementBar.classList.add('hidden');
        els.seaMine.style.display = '';
        els.seaTheirs.style.display = 'none';
        paintGrid(els.seaMine, () => '');
        startOnlinePoll();
        return;
      }
      if (view.status === 'placing') {
        // Re-opening your own match on this device is the creator's view
        if (view.yourFleetPlaced) {
          onlineStatus('Your fleet is placed — waiting for your opponent.');
          state.placing = 3;
          els.placementBar.classList.add('hidden');
        } else {
          startOnlinePlacement(view);
        }
        startOnlinePoll();
        return;
      }
      if (view.status === 'running' || view.status === 'finished') {
        applyOnlineView(view);
        startOnlinePoll();
        return;
      }
      startOnlinePoll();
    })
    .catch((e) => onlineStatus('Join failed: ' + (e.message || 'try again')));
}

function startOnlinePlacement(view) {
  state.phase = 'placing';
  state.placing = 0;
  state.myFleet = (view.yourFleet || [null, null, null]).slice();
  state.placing = state.myFleet.filter(Boolean).length;
  if (fleetComplete(state.myFleet)) {
    els.placementBar.classList.add('hidden');
    els.turn.textContent = 'Fleet placed — waiting for your opponent…';
    return;
  }
  renderPlacement();
}

function submitOnlineFleet() {
  const fleet = state.myFleet.filter(Boolean);
  if (!fleetComplete({ fleet: [state.myFleet[0], state.myFleet[1], state.myFleet[2]] })) return;
  onlineApi('/battleship/' + encodeURIComponent(state.online.code) + '/fleet', {
    guestId: onlineGuestId(),
    fleet,
  })
    .then((view) => {
      els.placementBar.classList.add('hidden');
      els.turn.textContent = 'Fleet placed — waiting for your opponent…';
      applyOnlineView(view);
    })
    .catch((e) => toast('Fleet rejected: ' + (e.message || 'try again')));
}

function startOnlinePoll() {
  if (state.online && !state.online.pollTimer) {
    state.online.pollTimer = setInterval(pollOnline, 3000);
  }
}

function pollOnline() {
  if (!state.online || state.online.busy) return;
  onlineApi(
    '/battleship/' +
      encodeURIComponent(state.online.code) +
      '?guestId=' +
      encodeURIComponent(onlineGuestId())
  )
    .then((view) => {
      if (!state.online) return;
      applyOnlineView(view);
    })
    .catch(() => undefined); // transient — the poll rides again
}

function applyOnlineView(view) {
  if (view.status === 'placing') {
    if (view.yourFleetPlaced) {
      els.placementBar.classList.add('hidden');
      els.turn.textContent = 'Waiting for your opponent to place their fleet…';
    } else {
      startOnlinePlacement(view);
    }
    return;
  }
  // running / finished — rebuild the local mirror from the redacted view
  state.phase = view.status === 'finished' ? 'finished' : 'battle';
  state.myFleet = view.yourFleet || [null, null, null];
  state.myShots = Uint8Array.from(view.yourShots || new Uint8Array(CELLS));
  state.theirShots = Uint8Array.from(view.yourIncoming || new Uint8Array(CELLS));
  state.myTurn = view.turn === view.yourMark && view.status === 'running';
  renderBattle();
  // the !locked guard keeps a repeated poll/response from tallying twice
  if (view.status === 'finished' && !state.locked) finishOnlineRound(view);
}

function onlineFire(cell) {
  if (!state.online || state.online.busy || state.phase !== 'battle' || !state.myTurn) return;
  if (state.myShots[cell] !== 0) return;
  state.online.busy = true;
  onlineApi('/battleship/' + encodeURIComponent(state.online.code) + '/fire', {
    guestId: onlineGuestId(),
    cell,
  })
    .then((view) => {
      if (state.online) state.online.busy = false;
      if (view.lastShot && view.lastShot.sunk) {
        toast(
          view.lastShot.sunk
            ? view.lastShot.result === 'hit'
              ? 'You sank a ' + view.lastShot.sunk + '-cell ship!'
              : 'They sank your ' + view.lastShot.sunk + '-cell ship!'
            : ''
        );
      }
      applyOnlineView(view);
    })
    .catch(() => {
      if (state.online) state.online.busy = false;
      toast('Shot rejected — try again');
    });
}

/* ---- toast / vibrate -------------------------------------------------------------- */

let toastTimer = null;
function toast(message) {
  if (!message) return;
  els.toast.textContent = message;
  els.toast.classList.add('toast--in');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('toast--in'), 2200);
}

function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported — fine */
  }
}

/* ---- wiring ------------------------------------------------------------------------ */

function buildGrids() {
  buildGrid(els.seaMine);
  buildGrid(els.seaTheirs);
}

function bindSegmented(container, attr, onPick) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[' + attr + ']');
    if (!btn) return;
    const buttons = container.querySelectorAll('button[' + attr + ']');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-checked', buttons[i] === btn ? 'true' : 'false');
    }
    onPick(btn.getAttribute(attr));
  });
}

function syncSegmented(container, attr, value) {
  const buttons = container.querySelectorAll('button[' + attr + ']');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute(
      'aria-checked',
      buttons[i].getAttribute(attr) === value ? 'true' : 'false'
    );
  }
}

function applyModeUi(mode) {
  els.difficultyRow.classList.toggle('hidden', mode !== '1p');
  els.onlineRow.classList.toggle('hidden', mode !== 'online');
  els.btnPlay.classList.toggle('hidden', mode === 'online');
}

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, difficulty: state.difficulty });
}

function resetMatch() {
  state.phase = 'placing';
  state.placing = 0;
  state.orientation = 'h';
  state.myFleet = [null, null, null];
  state.theirFleet = [null, null, null];
  state.myShots = new Uint8Array(CELLS);
  state.theirShots = new Uint8Array(CELLS);
  state.myTurn = myMark() === 1;
  state.winner = 0;
  state.placingFor = 1;
  state.iAm = 1;
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.seaMine = document.getElementById('sea-mine');
  els.seaTheirs = document.getElementById('sea-theirs');
  els.seaMineTitle = document.getElementById('sea-mine-title');
  els.seaTheirsTitle = document.getElementById('sea-theirs-title');
  els.turn = document.getElementById('turn');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.placementBar = document.getElementById('placement-bar');
  els.placementLabel = document.getElementById('placement-label');
  els.miniSeries = document.getElementById('mini-series');
  els.seriesScope = document.getElementById('series-scope');
  els.seriesR = document.getElementById('series-r');
  els.seriesB = document.getElementById('series-b');
  els.seriesDraw = document.getElementById('series-draw');
  els.resetSeriesBtn = document.getElementById('reset-series');
  els.difficultyRow = document.getElementById('difficulty-row');
  els.onlineRow = document.getElementById('online-row');
  els.onlineName = document.getElementById('online-name');
  els.onlineCode = document.getElementById('online-code');
  els.onlineStatus = document.getElementById('online-status');
  els.thinkingBadge = document.getElementById('thinking-badge');
  els.btnPlay = document.getElementById('btn-play');
  els.toast = document.getElementById('toast');

  buildGrids();

  const prefs = loadPrefs();
  state.mode = prefs.mode;
  state.difficulty = prefs.difficulty;

  bindSegmented(document.getElementById('mode-segmented'), 'data-mode', (mode) => {
    state.mode = mode;
    applyModeUi(mode);
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  });
  bindSegmented(
    document.getElementById('difficulty-segmented'),
    'data-difficulty',
    (difficulty) => {
      state.difficulty = difficulty;
      refreshSeriesFromStorage();
      renderSeriesCard();
      saveMenuPrefs();
    }
  );

  els.btnPlay.addEventListener('click', () => {
    refreshSeriesFromStorage();
    showScreen('playing');
    resetMatch();
    renderPlacement();
  });
  document.getElementById('btn-online-create').addEventListener('click', onlineCreate);
  document.getElementById('btn-online-join').addEventListener('click', () => {
    onlineJoin(els.onlineCode.value.trim().toUpperCase().slice(0, 6));
  });
  const leaveOnlineToMenu = () => {
    onlineLeaveQuietly();
    document.getElementById('btn-next').textContent = 'Next match';
  };
  document.getElementById('btn-menu').addEventListener('click', () => {
    if (state.mode === 'online') leaveOnlineToMenu();
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
      els.thinkingBadge.classList.add('hidden');
    }
    showScreen('menu');
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (state.mode === 'online') {
      onlineLeaveQuietly();
      onlineCreate();
      return;
    }
    resetMatch();
    renderPlacement();
  });
  document.getElementById('btn-menu2').addEventListener('click', () => {
    if (state.mode === 'online') leaveOnlineToMenu();
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
      els.thinkingBadge.classList.add('hidden');
    }
    showScreen('menu');
  });
  els.resetSeriesBtn.addEventListener('click', () => {
    state.series = emptyTally();
    saveSeries(currentSetupKey(), state.series);
    renderSeriesCard();
    renderMiniSeries();
  });

  // placement tap → place the current ship
  els.seaMine.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || state.phase !== 'placing') return;
    if (state.mode === 'online' && fleetComplete(state.myFleet)) return;
    tryPlace(Number(cell.dataset.cell));
  });
  // battle tap on enemy waters → fire
  els.seaTheirs.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || state.phase !== 'battle' || !state.myTurn) return;
    const c = Number(cell.dataset.cell);
    if (state.mode === 'online') onlineFire(c);
    else localFire(c);
  });

  document.getElementById('btn-rotate').addEventListener('click', () => {
    state.orientation = state.orientation === 'h' ? 'v' : 'h';
    renderPlacement();
  });
  document.getElementById('btn-random').addEventListener('click', () => {
    if (state.phase !== 'placing') return;
    const placed = randomFleet();
    state.myFleet = placed.slice();
    onFleetComplete();
  });

  applyModeUi(state.mode);
  syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
  syncSegmented(
    document.getElementById('difficulty-segmented'),
    'data-difficulty',
    state.difficulty
  );

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');

  // plan/games/04: ?bs=CODE deep link
  const bsCode = new URLSearchParams(window.location.search).get('bs');
  if (bsCode) {
    state.mode = 'online';
    applyModeUi('online');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', 'online');
    renderSeriesCard();
    els.onlineCode.value = bsCode.toUpperCase().slice(0, 6);
    try {
      els.onlineName.value = localStorage.getItem('pigzap:challenge-name') || '';
    } catch {
      /* private mode */
    }
    onlineStatus('Match ' + els.onlineCode.value + ' ready — press Join.');
  }
}

if (typeof document !== 'undefined' && document.getElementById('sea-mine')) {
  init();
}
