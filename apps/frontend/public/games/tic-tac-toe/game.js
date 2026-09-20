/**
 * ============================================================================
 * Tic Tac Toe — game.js (Game 02, plan/games/02-tic-tac-toe.md) — UI shell
 * ============================================================================
 * Plain ESM, no build step (same convention as tap-or-dont-tap). Rev 2
 * structure (§12): the pure model lives in core.js, persistence in storage.js
 * (versioned + migrated), flags/strings in config.js. This file is only the
 * screens + DOM wiring; it auto-inits when its board exists in the DOM, so
 * importing it in tests has no side effects.
 *
 * Board model = Array(9) of null | 'X' | 'O'. X is the first mover of the
 * series; the loser of a round starts the next one (starter flips on draw).
 * ============================================================================
 */

import { emptyBoard, other, roundOutcome, aiMove, hardAiToastDue } from './core.js';
import {
  emptyTally,
  seriesSetupKey,
  loadSeries,
  saveSeries,
  loadPrefs,
  savePrefs,
  getHardAiToastSeen,
  markHardAiToastSeen,
} from './storage.js';
import { GAME_CONFIG, t } from './config.js';

/* ==========================================================================
 * UI — auto-inits only when the board exists (never under jest/node)
 * ======================================================================= */

const MARK_SVG = {
  X:
    '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<line class="stroke" x1="22" y1="22" x2="78" y2="78"/>' +
    '<line class="stroke s2" x1="78" y1="22" x2="22" y2="78"/></svg>',
  O:
    '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<circle class="stroke" cx="50" cy="50" r="29"/></svg>',
};

const state = {
  screen: 'menu',
  mode: '1p', // '1p' | '2p'
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  misere: false,
  board: emptyBoard(),
  turn: 'X',
  starter: 'X', // mark that opens the current round
  locked: false, // true during AI thinking and after the round ends
  series: emptyTally(),
  aiTimer: null,
};

const els = {};

function currentSetupKey() {
  return seriesSetupKey(state.mode, state.difficulty, state.misere);
}

/* ---- screens -------------------------------------------------------------- */

function showScreen(name) {
  state.screen = name;
  els.screenMenu.classList.toggle('screen--active', name === 'menu');
  els.screenPlaying.classList.toggle('screen--active', name === 'playing');
  if (name === 'menu') renderSeriesCard();
}

/* ---- menu screen ---------------------------------------------------------- */

function renderSeriesCard() {
  let scope = state.mode === '1p' ? 'vs computer · ' + state.difficulty : '2 players';
  if (state.misere) scope += ' · misère';
  els.seriesScope.textContent = scope;
  els.seriesX.textContent = String(state.series.x);
  els.seriesO.textContent = String(state.series.o);
  els.seriesDraw.textContent = String(state.series.draw);
  const total = state.series.x + state.series.o + state.series.draw;
  els.resetSeriesBtn.disabled = total === 0;
}

function refreshSeriesFromStorage() {
  state.series = loadSeries(currentSetupKey());
}

/* ---- playing screen --------------------------------------------------------- */

function renderBoard() {
  for (let i = 0; i < 9; i++) renderCell(i);
}

/** Update a single cell — re-rendering the whole board would restart every mark's draw-in animation. */
function renderCell(i) {
  const cell = els.board.children[i];
  const mark = state.board[i];
  cell.dataset.mark = mark || '';
  cell.innerHTML = mark ? MARK_SVG[mark] : '';
  const row = Math.floor(i / 3) + 1;
  const col = (i % 3) + 1;
  cell.setAttribute(
    'aria-label',
    'Row ' + row + ', column ' + col + ', ' + (mark ? mark : 'empty')
  );
  cell.disabled = state.locked || !!mark;
  cell.classList.remove('cell--win', 'cell--dim', 'cell--animating', 'cell--think');
  if (mark) {
    // Draw-in reveal; the class is always removed on a timer so the mark
    // ends fully visible even if CSS animations never advance.
    cell.classList.add('cell--animating');
    setTimeout(() => cell.classList.remove('cell--animating'), 600);
  }
}

function highlightWin(line) {
  const cells = els.board.children;
  for (let i = 0; i < 9; i++) {
    if (line.indexOf(i) !== -1) cells[i].classList.add('cell--win');
    else cells[i].classList.add('cell--dim');
  }
}

function isAiTurnNow() {
  return state.mode === '1p' && state.turn === 'O';
}

function renderTurn() {
  let label;
  const mark = state.turn;
  if (state.mode === '1p') {
    label = isAiTurnNow() ? "Computer's turn…" : "Your turn — you're " + mark;
  } else {
    label = mark + "'s turn";
  }
  els.turn.textContent = label;
  els.turn.dataset.mark = mark;
}

function renderMiniSeries() {
  els.miniSeries.textContent =
    '✕ ' + state.series.x + ' · 🤝 ' + state.series.draw + ' · ◯ ' + state.series.o;
  els.misereBadge.classList.toggle('hidden', !state.misere);
}

function lockBoard(locked) {
  state.locked = locked;
  const cells = els.board.children;
  for (let i = 0; i < 9; i++) cells[i].disabled = locked || !!state.board[i];
}

function startRound() {
  state.board = emptyBoard();
  state.turn = state.starter;
  state.locked = false;
  if (state.aiTimer) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  renderBoard();
  renderTurn();
  renderMiniSeries();
  els.overlay.classList.add('hidden');
  els.overlay.classList.remove('overlay--in');
  els.board.classList.remove('board--deal');
  // restart the deal-in animation
  void els.board.offsetWidth;
  els.board.classList.add('board--deal');
  if (isAiTurnNow()) scheduleAiMove();
}

function placeMark(index) {
  if (state.screen !== 'playing' || state.locked) return; // round over / AI thinking
  if (state.board[index]) return; // occupied — no-op
  if (isAiTurnNow()) return; // human cannot move for the computer
  play(index);
}

function play(index) {
  state.board[index] = state.turn;
  renderCell(index);
  const outcome = roundOutcome(state.board, state.misere);
  if (outcome) {
    endRound(outcome);
    return;
  }
  state.turn = other(state.turn);
  renderTurn();
  if (isAiTurnNow()) scheduleAiMove();
}

function clearThinkPulse() {
  for (const cell of els.board.children) cell.classList.remove('cell--think');
}

function scheduleAiMove() {
  lockBoard(true);
  // Medium/Hard are deterministic, so the "decision" can be shown honestly: a
  // faint pulse on the cell being settled on resolves into the move when the
  // think-delay ends. Easy stays instant/random — there is no strategy to
  // visualize (suggestion 02 item 1).
  const planned =
    state.difficulty !== 'easy' ? aiMove(state.board, 'O', state.difficulty, state.misere) : null;
  if (planned !== null && planned !== undefined) {
    els.board.children[planned].classList.add('cell--think');
  }
  state.aiTimer = setTimeout(() => {
    state.aiTimer = null;
    clearThinkPulse();
    if (state.screen !== 'playing' || !isAiTurnNow()) return;
    const move =
      planned !== null && planned !== undefined
        ? planned
        : aiMove(state.board, 'O', state.difficulty, state.misere);
    if (move === null || move === undefined) return;
    lockBoard(false);
    play(move);
  }, GAME_CONFIG.aiThinkDelayMs);
}

/* ---- round end --------------------------------------------------------------- */

function endRound(outcome) {
  state.locked = true;
  const isDraw = outcome === 'draw';
  const winner = isDraw ? null : outcome.winner;

  // Series tally (misère flips who actually won the round).
  if (isDraw) state.series.draw++;
  else if (winner === 'X') state.series.x++;
  else state.series.o++;
  saveSeries(currentSetupKey(), state.series);

  // Next starter: loser opens the rematch; a draw flips the opener.
  if (isDraw) state.starter = other(state.starter);
  else state.starter = other(winner);

  if (!isDraw) highlightWin(outcome.line);
  renderMiniSeries(); // top-bar tally must move the moment the round ends
  if (!isDraw && (state.mode === '2p' || winner === 'X')) vibrate([40, 60, 40]);

  setTimeout(() => showOverlay(isDraw, winner), 650); // let the winning-line highlight land first
}

function showOverlay(isDraw, winner) {
  let title;
  let emoji;
  let sub;
  if (isDraw) {
    title = 'Draw 🤝';
    emoji = '🤝';
    sub = 'Nobody blinked. Run it back?';
  } else {
    title = winner + ' wins! 🎉';
    emoji = winner === 'X' ? '❌' : '⭕';
    if (state.misere) {
      sub = other(winner) + ' completed three in a row — misère rules say that loses.';
    } else if (state.mode === '1p') {
      sub = winner === 'X' ? 'You beat the computer!' : 'The computer takes it. Rematch?';
    } else {
      sub = '';
    }
  }
  els.overlayEmoji.textContent = emoji;
  els.overlayTitle.textContent = title;
  const seriesLine =
    'Series — ✕ ' + state.series.x + ' · ◯ ' + state.series.o + ' · 🤝 ' + state.series.draw;
  els.overlaySub.textContent = (sub ? sub + ' ' : '') + seriesLine;
  els.overlayTitle.dataset.mark = isDraw ? '' : winner;
  els.overlay.classList.remove('hidden');
  els.overlay.classList.add('overlay--in');
  // One-time softening: first loss-or-draw vs Hard AI points at Medium
  // (suggestion 02 item 2) — lifetime per device, never on other setups.
  if (
    hardAiToastDue({
      mode: state.mode,
      difficulty: state.difficulty,
      winner,
      isDraw,
      seen: getHardAiToastSeen(),
    })
  ) {
    markHardAiToastSeen();
    toast(t('hardAiToast'));
  }
  document.getElementById('btn-next').focus();
}

/* ---- share (plan §6) ----------------------------------------------------------- */

function shareText() {
  const url = window.location.origin + window.location.pathname;
  const score = '✕ ' + state.series.x + ' · ◯ ' + state.series.o + ' · draws ' + state.series.draw;
  if (state.mode === '2p') {
    return t('share2p', { score, url });
  }
  let setup = 'Tic Tac Toe vs the computer (' + state.difficulty + ')';
  if (state.misere) setup += ', misère';
  return t('share1p', { setup, score, url });
}

function shareUrls() {
  const url = window.location.origin + window.location.pathname;
  const text = shareText();
  const textNoUrl = text.split(url).join('').replace(/\s+/g, ' ').trim();
  const fb = document.getElementById('share-fb');
  fb.href =
    'https://www.facebook.com/sharer/sharer.php?u=' +
    encodeURIComponent(url) +
    '&quote=' +
    encodeURIComponent(textNoUrl);
  document.getElementById('share-x').href =
    'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
  document.getElementById('share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(text);
  document.getElementById('share-copy').dataset.copy = text;
}

function copyResult() {
  const text = document.getElementById('share-copy').dataset.copy || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast('Series copied to clipboard 📋'),
      () => window.prompt('Copy your result:', text)
    );
    return;
  }
  window.prompt('Copy your result:', text);
}

let toastTimer = null;
function toast(message) {
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

/* ---- keyboard a11y: roving focus on the board ------------------------------------ */

function handleBoardKeys(e) {
  const cells = els.board.children;
  const index = Array.prototype.indexOf.call(cells, document.activeElement);
  const from = index === -1 ? 0 : index;
  const map = { ArrowUp: from - 3, ArrowDown: from + 3, ArrowLeft: from - 1, ArrowRight: from + 1 };
  if (e.key in map) {
    e.preventDefault();
    let next = map[e.key];
    if (next < 0) next += 9;
    if (next > 8) next -= 9;
    cells[next].focus();
  }
}

/* ---- wiring ------------------------------------------------------------------------ */

function buildBoard() {
  els.board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = String(i);
    cell.setAttribute(
      'aria-label',
      'Row ' + (Math.floor(i / 3) + 1) + ', column ' + ((i % 3) + 1) + ', empty'
    );
    els.board.appendChild(cell);
  }
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

/** Reflect a value onto a segmented control's aria-checked states. */
function syncSegmented(container, attr, value) {
  const buttons = container.querySelectorAll('button[' + attr + ']');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute(
      'aria-checked',
      buttons[i].getAttribute(attr) === value ? 'true' : 'false'
    );
  }
}

function saveMenuPrefs() {
  savePrefs({ mode: state.mode, level: state.difficulty, misere: state.misere });
}

function init() {
  els.screenMenu = document.getElementById('screen-menu');
  els.screenPlaying = document.getElementById('screen-playing');
  els.board = document.getElementById('board');
  els.turn = document.getElementById('turn');
  els.overlay = document.getElementById('overlay');
  els.overlayEmoji = document.getElementById('overlay-emoji');
  els.overlayTitle = document.getElementById('overlay-title');
  els.overlaySub = document.getElementById('overlay-sub');
  els.miniSeries = document.getElementById('mini-series');
  els.misereBadge = document.getElementById('misere-badge');
  els.seriesScope = document.getElementById('series-scope');
  els.seriesX = document.getElementById('series-x');
  els.seriesO = document.getElementById('series-o');
  els.seriesDraw = document.getElementById('series-draw');
  els.resetSeriesBtn = document.getElementById('reset-series');
  els.difficultyRow = document.getElementById('difficulty-row');
  els.toast = document.getElementById('toast');

  buildBoard();

  bindSegmented(document.getElementById('mode-segmented'), 'data-mode', (mode) => {
    state.mode = mode;
    els.difficultyRow.classList.toggle('hidden', mode !== '1p');
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
  document.getElementById('misere-toggle').addEventListener('change', (e) => {
    state.misere = e.target.checked;
    refreshSeriesFromStorage();
    renderSeriesCard();
    saveMenuPrefs();
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    refreshSeriesFromStorage();
    showScreen('playing');
    startRound();
  });
  document.getElementById('btn-menu').addEventListener('click', () => {
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
    }
    showScreen('menu');
  });
  document.getElementById('btn-next').addEventListener('click', startRound);
  document.getElementById('btn-menu2').addEventListener('click', () => showScreen('menu'));
  const shareRowEl = document.getElementById('share-row');
  let shareRowTimer = null;
  document.getElementById('btn-share').addEventListener('click', () => {
    if (shareRowEl.classList.contains('share-row--open')) {
      shareRowEl.classList.remove('share-row--open');
      clearTimeout(shareRowTimer);
      shareRowTimer = setTimeout(() => {
        shareRowEl.hidden = true;
      }, 260);
    } else {
      clearTimeout(shareRowTimer);
      shareRowEl.hidden = false;
      void shareRowEl.offsetHeight;
      shareRowEl.classList.add('share-row--open');
      shareUrls();
    }
  });
  document.getElementById('share-copy').addEventListener('click', copyResult);
  els.resetSeriesBtn.addEventListener('click', () => {
    state.series = emptyTally();
    saveSeries(currentSetupKey(), state.series);
    renderSeriesCard();
    renderMiniSeries();
  });

  els.board.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    placeMark(Number(cell.dataset.index));
  });
  els.board.addEventListener('keydown', handleBoardKeys);

  // Pausing mid-AI-turn drops the pending move; reschedule on return, or the
  // human would come back to a board that can never be played.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (state.aiTimer) {
        clearTimeout(state.aiTimer);
        state.aiTimer = null;
      }
    } else if (
      state.screen === 'playing' &&
      isAiTurnNow() &&
      !state.aiTimer &&
      els.overlay.classList.contains('hidden')
    ) {
      scheduleAiMove();
    }
  });

  // Restore the menu exactly as the player left it (plan §5 prefs model).
  const prefs = loadPrefs();
  if (prefs) {
    state.mode = prefs.mode;
    state.difficulty = prefs.level;
    state.misere = prefs.misere;
    els.difficultyRow.classList.toggle('hidden', state.mode !== '1p');
    syncSegmented(document.getElementById('mode-segmented'), 'data-mode', state.mode);
    syncSegmented(
      document.getElementById('difficulty-segmented'),
      'data-difficulty',
      state.difficulty
    );
    document.getElementById('misere-toggle').checked = state.misere;
  }

  refreshSeriesFromStorage();
  renderSeriesCard();
  showScreen('menu');
}

if (typeof document !== 'undefined' && document.getElementById('board')) {
  init();
}
