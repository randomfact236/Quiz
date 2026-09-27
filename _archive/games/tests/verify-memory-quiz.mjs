/* Memory Quiz — post-upgrade E2E driver (campaign / modes / new question types).
 * Plays the upgraded game end-to-end in headless Chromium with real input.
 * Run: node scripts/verify-mq2.mjs  (from apps/frontend)
 */
import { createRequire } from 'node:module';
const require = createRequire('E:/webiste theme and plugin/Ai-Quiz/Quiz/apps/frontend/package.json');
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8931/games/memory-quiz/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const consoleErrors = [];

function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

async function readState(page) {
  return page.evaluate(() => ({
    banner: document.getElementById('banner-text').textContent,
    hearts: document.getElementById('hud-hearts').getAttribute('aria-label'),
    score: document.getElementById('hud-score').textContent,
    level: document.getElementById('hud-level').textContent,
    levelLabel: document.getElementById('hud-level-label').textContent,
    boardNo: document.getElementById('hud-board').textContent,
    boardHiddenWrap: document.getElementById('hud-board-wrap').classList.contains('hidden'),
    gridHidden: document.getElementById('board').classList.contains('grid--hidden'),
    gridBlank: document.getElementById('board').classList.contains('grid--blank'),
    cellLabels: [...document.querySelectorAll('.cell')].map((c) => c.getAttribute('aria-label')),
    kidNames: [...document.querySelectorAll('.cell .glyph small')].map((s) => s.textContent),
    candidates: [...document.querySelectorAll('#candidates button')].map((b) => b.getAttribute('aria-label')),
    candidatesHidden: document.getElementById('candidates').classList.contains('hidden'),
    pauseVisible: !document.getElementById('overlay-pause').classList.contains('hidden'),
    gameoverVisible: !document.getElementById('overlay-gameover').classList.contains('hidden'),
    clearVisible: !document.getElementById('overlay-levelclear').classList.contains('hidden'),
    clearStars: document.getElementById('clear-stars').textContent,
    clearTitle: document.getElementById('clear-title').textContent,
    clearStats: document.getElementById('clear-stats').textContent,
    nextVisible: !document.getElementById('btn-next').classList.contains('hidden'),
    feedbackVisible: !document.getElementById('overlay-feedback').classList.contains('hidden'),
    feedbackText: document.getElementById('feedback-card').textContent,
    status: document.getElementById('play-status').textContent,
    menuBest: document.getElementById('menu-best').textContent,
    modeChips: [...document.querySelectorAll('#mode-picker button')].map((b) => ({
      label: b.textContent,
      checked: b.getAttribute('aria-checked'),
    })),
    levelTiles: [...document.querySelectorAll('#level-picker .level-tile')].map((b) => ({
      id: b.dataset.level,
      disabled: b.disabled,
      stars: b.querySelector('.lv-stars') ? b.querySelector('.lv-stars').textContent : null,
      checked: b.getAttribute('aria-checked'),
    })),
  }));
}

/** Debug seam (?debug=1): the pure run state incl. the active question. */
async function debugRun(page) {
  return page.evaluate(() => window.__MEMORY_QUIZ_DEBUG__.run());
}

/** Answer the active question (correctly or not) using real clicks. */
async function answerActive(page, correctly) {
  for (let i = 0; i < 120; i++) {
    const run = await debugRun(page);
    if (run.phase === 'gameover') return 'gameover';
    if (run.phase !== 'question') {
      await sleep(150);
      continue;
    }
    const q = run.questions[run.questionIndex];
    if (q.type === 'where' || q.type === 'swap') {
      const idx = correctly ? (q.type === 'where' ? q.cell : q.to) : (q.cell + 1) % run.board.length;
      await page.locator(`.cell[data-index="${idx}"]`).click();
      return 'answered';
    }
    // candidate types: the answer item's name → the row button
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('#candidates button')].map((b) => b.getAttribute('aria-label'))
    );
    const answerName = names.find((n) => q.item && n && n.toLowerCase() === q.item.name.en.toLowerCase());
    if (!answerName) throw new Error('answer not among candidates: ' + JSON.stringify(names));
    const pick = correctly ? answerName : names.find((n) => n !== answerName);
    await page.locator('#candidates').getByRole('button', { name: pick, exact: true }).click();
    return 'answered';
  }
  return 'stale';
}

/** Play boards of a ladder run with all-correct answers until `levelId`. */
async function playLadderTo(page, levelId) {
  for (let guard = 0; guard < 6000; guard++) {
    const run = await debugRun(page);
    if (run.phase === 'gameover') throw new Error('game over before ' + levelId);
    if (run.level === levelId && run.phase === 'memorize') return;
    if (run.phase === 'question') await answerActive(page, true);
    await sleep(80);
  }
  throw new Error('never reached ' + levelId);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 360, height: 740 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

try {
  /* ---- 1. fresh menu: modes + locked campaign ---- */
  await page.goto(BASE + '?debug=1', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  let s = await readState(page);
  check('menu: 6 mode chips rendered', s.modeChips.length === 6 && s.modeChips[0].label === 'Campaign');
  check('menu: 30 numbered level tiles, only l01 playable on a fresh save',
    s.levelTiles.length === 30 && s.levelTiles[0].id === 'l01' && !s.levelTiles[0].disabled
    && s.levelTiles.slice(1).every((t) => t.disabled), JSON.stringify(s.levelTiles.slice(0, 2)));
  check('menu: no horizontal overflow at 360px',
    (await page.evaluate(() => document.documentElement.scrollWidth)) <= 360);

  /* ---- 2. campaign l01: hidden grid + where questions + level clear ---- */
  await page.locator('.level-tile[data-level="l01"]').click();
  await page.locator('#btn-start').click();
  await page.waitForFunction(() => window.__MEMORY_QUIZ_DEBUG__.run().phase === 'memorize', null, { timeout: 30000 });
  const playOverflow = await page.evaluate(() => ({
    w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  check('play: no page overflow at 360×740 (plan §10 acceptance)', playOverflow.w <= 360 && playOverflow.h <= 740, JSON.stringify(playOverflow));
  s = await readState(page);
  check('campaign l01: level chip says Level 1, board chip hidden', s.level === '1' && s.levelLabel === 'Level' && s.boardHiddenWrap);
  check('campaign l01: memorize shows a FULL grid — no blank blocks', !s.gridHidden
    && s.cellLabels.length === 4 && s.cellLabels.every((l) => !l.endsWith(', empty')),
    JSON.stringify(s.cellLabels));
  // question phase: items hidden, labels neutralized
  await page.waitForFunction(
    () => {
      const run = window.__MEMORY_QUIZ_DEBUG__.run();
      return run.phase === 'question' && document.getElementById('board').classList.contains('grid--hidden');
    },
    null,
    { timeout: 30000 }
  );
  s = await readState(page);
  check('campaign l01: items hidden once the question begins', s.gridHidden
    && s.cellLabels.every((l) => !/pizza|hotdog|fries|donut|taco|cookie/.test(l)),
    JSON.stringify(s.cellLabels.slice(0, 2)) + ' banner="' + s.banner + '"');
  check('campaign l01: full grid (4 blocks, no blanks)', s.cellLabels.length === 4);
  check('campaign l01: candidates row hidden for grid-answer question', s.candidatesHidden);
  check('campaign l01: answer correct via debug seam', (await answerActive(page, true)) === 'answered');
  await sleep(150);
  s = await readState(page);
  check('campaign l01: +100 feedback chip', s.feedbackText.includes('+100'), s.feedbackText);
  // second (final) question → level clear
  check('campaign l01: all questions answered → clear', (await answerActive(page, true)) === 'answered');
  await page.waitForFunction(() => !document.getElementById('overlay-levelclear').classList.contains('hidden'), null, { timeout: 20000 });
  s = await readState(page);
  check('campaign l01: level-clear card, 3 stars', s.clearVisible && s.clearStars === '★★★' && /Level 1 cleared/.test(s.clearTitle), s.clearTitle + ' ' + s.clearStars);
  check('campaign l01: NEW BEST badge + next level offered', await page.locator('#badge-levelbest').isVisible() && s.nextVisible);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('game:memory-quiz:save')));
  check('save v2: level record + version 2', saved.version === 2
    && saved.levels.l01 && saved.levels.l01.stars === 3 && saved.levels.l01.clears === 1, JSON.stringify(saved.levels));

  /* ---- 3. next level → l02 (has a missing question) ---- */
  await page.locator('#btn-next').click();
  let sawMissing = false;
  for (let i = 0; i < 1200 && !sawMissing; i++) {
    const run = await debugRun(page);
    if (run.phase === 'gameover') break;
    if (run.level === 'l02' && run.phase === 'question') {
      const q = run.questions[run.questionIndex];
      if (q.type === 'missing') {
        sawMissing = true;
        s = await readState(page);
        check('l02: missing question shows candidate row', s.candidates.length === 3, JSON.stringify(s.candidates));
        check('l02: removed cell renders as socket', (await debugRun(page)).questions[0] && s.cellLabels.some((l) => l.endsWith(', empty')));
      }
      await answerActive(page, true);
    }
    await sleep(80);
  }
  check('l02 asked its missing question', sawMissing);
  await page.waitForFunction(() => !document.getElementById('overlay-levelclear').classList.contains('hidden'), null, { timeout: 20000 });
  check('l02 cleared via Next chain', /Level 2 cleared/.test(await page.locator('#clear-title').textContent()));
  const unlockedNow = await page.evaluate(() => window.localStorage.getItem('game:memory-quiz:save'));
  check('save v2: l02 record kept alongside l01', JSON.parse(unlockedNow).levels.l02.stars >= 1);

  /* ---- 4. ?unlockAll=1: level picker opens; l05 swap; l07 oddOne ---- */
  await page.goto(BASE + '?unlockAll=1&debug=1', { waitUntil: 'domcontentloaded' });
  s = await readState(page);
  check('unlockAll: every one of the 30 tiles enabled', s.levelTiles.length === 30 && s.levelTiles.every((t) => !t.disabled));
  await page.locator('.level-tile[data-level="l04"]').click();
  await page.locator('#btn-start').click();
  await playLadderTo(page, 'l04');
  // answer l05's three questions, verifying the swap reveal
  let swapSeen = false;
  for (let i = 0; i < 1200; i++) {
    const run = await debugRun(page);
    if (run.phase === 'gameover') break;
    if (run.phase === 'question') {
      const q = run.questions[run.questionIndex];
      if (q.type === 'swap') {
        swapSeen = true;
        await answerActive(page, true);
        await sleep(120);
        s = await readState(page);
        check('l04: swap hit reveals the exchange (item at destination, partner at origin)',
          s.cellLabels[q.to] && s.cellLabels[q.to].includes(q.item.name.en)
          && s.cellLabels[q.from] && s.cellLabels[q.from].includes(q.partner.name.en),
          JSON.stringify([s.cellLabels[q.from], s.cellLabels[q.to]]));
      } else {
        await answerActive(page, true);
      }
    }
    await sleep(80);
  }
  check('l04 asked its swap question', swapSeen);
  await page.waitForFunction(() => !document.getElementById('overlay-levelclear').classList.contains('hidden'), null, { timeout: 20000 });
  check('l04 cleared', /Level 4 cleared/.test(await page.locator('#clear-title').textContent()));
  await page.locator('#btn-menu4').click(); // back to the menu for the next pick
  await sleep(150);

  await page.locator('.level-tile[data-level="l05"]').click();
  await page.locator('#btn-start').click();
  let oddSeen = false;
  for (let i = 0; i < 1200; i++) {
    const run = await debugRun(page);
    if (run.phase === 'gameover') break;
    if (run.level !== 'l05') { await sleep(80); continue; }
    if (run.phase === 'question') {
      const q = run.questions[run.questionIndex];
      if (q.type === 'oddOne') {
        oddSeen = true;
        s = await readState(page);
        check('l07: oddOne banner + 4 candidates', s.candidates.length === 4 && /NOT on the board/.test(s.banner), s.banner);
      }
      await answerActive(page, true);
    }
    await sleep(80);
    if (/Level 5 cleared/.test(await page.evaluate(() => document.getElementById('clear-title').textContent))) break;
  }
  check('l05 asked its odd-one question', oddSeen);

  /* ---- 5. modes: zen survives misses; hard dies on one ---- */
  await page.goto(BASE + '?debug=1', { waitUntil: 'domcontentloaded' });
  await page.locator('#mode-picker button', { hasText: 'Zen' }).click();
  await page.locator('#btn-start').click();
  for (let i = 0; i < 3; i++) {
    await page.waitForFunction(() => window.__MEMORY_QUIZ_DEBUG__.run().phase === 'question', null, { timeout: 30000 });
    await answerActive(page, false);
    await sleep(600); // feedback
  }
  const run = await debugRun(page);
  s = await readState(page);
  check('zen: misses never end the run (♾ hearts)', run.hearts === Infinity && !s.gameoverVisible, JSON.stringify(run.hearts));
  await page.locator('#btn-menu').click();

  await page.locator('#mode-picker button', { hasText: 'Hard' }).click();
  await page.locator('#btn-start').click();
  await page.waitForFunction(() => window.__MEMORY_QUIZ_DEBUG__.run().phase === 'question', null, { timeout: 30000 });
  const hardBefore = await debugRun(page);
  const hardAnswer = await answerActive(page, false);
  try {
    await page.waitForFunction(() => !document.getElementById('overlay-gameover').classList.contains('hidden'), null, { timeout: 20000 });
  } catch (e) {
    const probe = await page.evaluate(() => new Promise((resolve) => {
      let rafCount = 0;
      const cb = () => { rafCount++; if (rafCount < 5) requestAnimationFrame(cb); };
      requestAnimationFrame(cb);
      setTimeout(() => {
        const el = document.querySelector('.cell[data-index="4"]');
        if (el) el.click();
        setTimeout(() => resolve({
          rafFired: rafCount,
          taps: window.__MQ_TAPS__,
          afterJsClick: window.__MEMORY_QUIZ_DEBUG__.run(),
          pauseOverlayHidden: document.getElementById('overlay-pause').classList.contains('hidden'),
        }), 300);
      }, 500);
    }));
    console.log('HARD PROBE:', JSON.stringify(probe));
    throw e;
  }
  check('hard: one miss ends the run', await page.locator('#overlay-gameover').isVisible());

  /* ---- 6. kids: names under items during memorize ---- */
  await page.locator('#btn-menu3').click(); // game-over overlay's menu button
  await page.locator('#mode-picker button', { hasText: 'Kids' }).click();
  await page.locator('#btn-start').click();
  await page.waitForFunction(() => window.__MEMORY_QUIZ_DEBUG__.run().phase === 'memorize', null, { timeout: 30000 });
  s = await readState(page);
  check('kids: item names ride under the glyphs', s.kidNames.length > 0 && s.kidNames.every(Boolean), JSON.stringify(s.kidNames.slice(0, 3)));
  await page.locator('#btn-menu').click();

  /* ---- 7. time attack: tightened window + time bonus flag ---- */
  await page.locator('#mode-picker button', { hasText: 'Time attack' }).click();
  await page.locator('#btn-start').click();
  await page.waitForFunction(() => window.__MEMORY_QUIZ_DEBUG__.run().phase === 'question', null, { timeout: 30000 });
  const taRun = await debugRun(page);
  check('time attack: 5 s answer window', taRun.questionWindowS === 5, JSON.stringify(taRun.questionWindowS));
  check('time attack: correct answer pays a time bonus', (await answerActive(page, true)) === 'answered'
    && (await debugRun(page)).score > 100, 'score ' + (await debugRun(page)).score);
  await page.locator('#btn-menu').click();

  /* ---- 8. endless climbs the ladder past the campaign ---- */
  await page.locator('#mode-picker button', { hasText: 'Endless' }).click();
  await page.locator('#btn-start').click();
  await playLadderTo(page, 'l03');
  const endlessRun = await debugRun(page);
  s = await readState(page);
  check('endless: HUD climbs as WAVES (wave 3, board chip visible)', endlessRun.position === 3 && s.levelLabel === 'Wave' && !s.boardHiddenWrap, s.levelLabel + ' ' + s.level);

  /* ---- 9. pause holds; restart replays ---- */
  await page.keyboard.press('Escape');
  await sleep(300);
  check('pause overlay opens mid-run', (await readState(page)).pauseVisible);
  await page.locator('#btn-resume').click();

  /* ---- 10. v1 save migration ---- */
  await page.evaluate(() => {
    localStorage.setItem('game:memory-quiz:save', JSON.stringify({
      version: 1,
      best: { score: 700, bestStreak: 9 },
      history: [{ score: 700, boards: 5, ts: 1001 }],
      prefs: { muted: false, pack: 'snacks' },
    }));
  });
  await page.goto(BASE + '?debug=1', { waitUntil: 'domcontentloaded' });
  s = await readState(page);
  check('v1 save migrated: best line survives', /Best score 700/.test(s.menuBest), s.menuBest);
  await page.locator('#btn-start').click(); // trigger a write
  await page.locator('#btn-menu').click();
  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('game:memory-quiz:save')));
  check('migrated save persisted as v2', migrated.version === 2 && migrated.best.score === 700, JSON.stringify(migrated.version));

  /* ---- 11. daily determinism + record ---- */
  const daily1 = await page.evaluate(() => new Promise((resolve) => {
    document.getElementById('btn-daily').click();
    const poll = setInterval(() => {
      const run = window.__MEMORY_QUIZ_DEBUG__ && window.__MEMORY_QUIZ_DEBUG__.run();
      if (run && run.board && run.board.some(Boolean)) { clearInterval(poll); resolve({ board: run.board, level: run.level }); }
    }, 80);
    setTimeout(() => { clearInterval(poll); resolve(null); }, 12000);
  }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const daily2 = await page.evaluate(() => new Promise((resolve) => {
    document.getElementById('btn-daily').click();
    const poll = setInterval(() => {
      const run = window.__MEMORY_QUIZ_DEBUG__ && window.__MEMORY_QUIZ_DEBUG__.run();
      if (run && run.board && run.board.some(Boolean)) { clearInterval(poll); resolve({ board: run.board }); }
    }, 80);
    setTimeout(() => { clearInterval(poll); resolve(null); }, 12000);
  }));
  check('daily board identical across reloads (seeded)', JSON.stringify(daily1.board) === JSON.stringify(daily2.board));

  /* ---- 12. mute persistence + corrupt save recovery ---- */
  await page.locator('#btn-menu').click();
  await page.locator('#mute-toggle').check();
  await sleep(150);
  await page.reload({ waitUntil: 'domcontentloaded' });
  check('mute pref persists across reload', await page.locator('#mute-toggle').isChecked());
  await page.evaluate(() => localStorage.setItem('game:memory-quiz:save', '{corrupt'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  s = await readState(page);
  check('corrupt save sanitizes to a fresh session', s.menuBest.includes('No best score yet'), s.menuBest);

  check('zero console/page errors across the session', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 300));
} catch (err) {
  results.push({ name: 'driver completed without crashing', ok: false });
  const msg = (err && err.message ? err.message : String(err)).split(String.fromCharCode(10)).slice(0, 4).join(String.fromCharCode(9));
  console.log(msg);
  console.log(msg);
  try {
    console.log('STATE AT CRASH:', JSON.stringify(await debugRun(page)));
    console.log('OVERLAYS AT CRASH:', JSON.stringify(await page.evaluate(() => ({
      play: document.getElementById('screen-play').classList.contains('screen--active'),
      clear: !document.getElementById('overlay-levelclear').classList.contains('hidden'),
      gameover: !document.getElementById('overlay-gameover').classList.contains('hidden'),
      clearTitle: document.getElementById('clear-title').textContent,
    }))));
  } catch { /* page may be gone */ }
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n==== ${results.length - failed.length}/${results.length} checks passed ====`);
  if (consoleErrors.length) console.log('console errors:', consoleErrors);
  await browser.close();
  process.exit(failed.length ? 1 : 0);
}
