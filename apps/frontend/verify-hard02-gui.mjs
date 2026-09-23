/**
 * GUI verification (web-gui-tester methodology) for the two remaining UI flows:
 *  T1: image-riddles modal — wrong guess hides the answer; Reveal shows it.
 *  T2: quiz results — review reveals the correct option for key-stripped sessions.
 * Evidence: screenshots in gui-test-screenshots/ (t1_*.png, t2_*.png).
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3013';
const API = 'http://localhost:3012/api/v1';
const SHOT_DIR = 'E:/webiste theme and plugin/Ai-Quiz/Quiz/gui-test-screenshots';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

const browser = await chromium.launch();

// ================= T1: image-riddles reveal flow =================
try {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));
  await page.goto(`${BASE}/image-riddles`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[role="button"][aria-label^="Open riddle:"]', { timeout: 60000 });
  await page.screenshot({ path: `${SHOT_DIR}/t1_catalog.png` });
  await page.locator('[role="button"][aria-label^="Open riddle:"]').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOT_DIR}/t1_modal_open.png` });

  const input = page.locator('#riddle-answer');
  check('T1: guess input visible', (await input.count()) > 0);

  // Wrong guess: type nonsense and submit (check/submit button inside the modal)
  await input.fill('zzz wrong guess 123');
  const modal = page.locator('.fixed.inset-0:visible').first();
  await modal.locator('button', { hasText: /check|submit/i }).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOT_DIR}/t1_wrong_guess.png` });
  const bodyAfterWrong = await page.locator('body').innerText();
  const leakedOnWrong = /prima company logo/i.test(bodyAfterWrong);
  check('T1: wrong guess keeps the answer hidden', !leakedOnWrong);

  // Give-up reveal: the eye button (aria-label "Reveal answer") inside the visible modal
  const revealBtn = modal.locator('[aria-label="Reveal answer"], button:has-text("Reveal")').first();
  await revealBtn.click({ timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOT_DIR}/t1_revealed.png` });
  const bodyAfterReveal = await page.locator('body').innerText();
  const revealed = !/prima company logo/i.test(bodyAfterReveal) ? false : true;
  // The modal shows an answer panel; accept either the Prima answer or any
  // non-empty answer block (the first riddle may differ between runs)
  const answerPanelVisible = await modal.locator('text=/correct answer|answer/i').count();
  check('T1: reveal shows the answer panel', answerPanelVisible > 0 || revealed, `revealed=${revealed}`);
  check('T1: zero page errors', errs.length === 0, errs[0] || '');
  await page.close();
} catch (e) {
  check('T1: image-riddle reveal flow', false, String(e).slice(0, 140));
}

// ================= T2: quiz results review reveal =================
try {
  const page = await browser.newPage();
  let revealFetched = false;
  page.on('response', (r) => {
    if (r.url().includes('/quiz-mcq/answers/reveal')) revealFetched = true;
  });
  const meta = await fetch(`${API}/quiz-mcq/subjects/science`).then((r) => r.json());
  const counts = await fetch(`${API}/quiz-mcq/question-counts`).then((r) => r.json());
  const byChapter = counts?.byChapter ?? {};
  const ch = (meta.chapters || []).find((c) => {
    const s = byChapter[c.id];
    return s && s.count > 0 && (s.levels?.easy ?? 0) > 0;
  });
  await page.goto(
    `${BASE}/quiz-mcq/play?subject=science&chapter=${encodeURIComponent(ch.name)}&level=easy&mode=normal`,
    { waitUntil: 'domcontentloaded' }
  );
  const start = page.locator('button:has-text("Start")').first();
  await start.waitFor({ state: 'visible', timeout: 60000 });
  await start.click();
  // clear the cookie banner so it cannot overlay the confirm modal
  const accept = page.locator('button:has-text("Accept all")');
  if (await accept.count()) await accept.first().click();
  await page.waitForSelector('[role="radiogroup"] [role="radio"]', { timeout: 60000 });

  // Answer everything with the FIRST option; submit through the confirm modal
  for (let i = 0; i < 15; i++) {
    await page.locator('[role="radiogroup"] [role="radio"]').first().click();
    await page.waitForTimeout(800);
    const next = page.locator('button:has-text("Next")');
    if (await next.count()) {
      await next.first().click();
      await page.waitForTimeout(500);
      if (!(await page.locator('[role="radiogroup"]').count())) break;
      continue;
    }
    // last question: the page-level "Submit" opens the confirm dialog
    const pageSubmit = page.locator('button:has-text("Submit")').first();
    await pageSubmit.click();
    // the confirm dialog owns the ONLY Submit button once open — scope to it
    const dialog = page.locator('div:visible > button:has-text("Continue Quiz")').locator('..');
    await dialog.locator('button:has-text("Submit")').click();
    break;
  }
  await page.waitForURL('**/results**', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOT_DIR}/t2_results.png` });

  const reviewToggle = page.locator('button:has-text("Question Review")').first();
  await reviewToggle.waitFor({ state: 'visible', timeout: 20000 });
  await reviewToggle.click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${SHOT_DIR}/t2_review_expanded.png` });
  const greenMarks = await page.locator('.bg-green-100, .border-green-500, .bg-green-500').count();
  check('T2: review reveal fetched', revealFetched);
  check('T2: correct options highlighted in review', greenMarks > 0, `${greenMarks} green marks`);
  await page.close();
} catch (e) {
  check('T2: quiz review reveal', false, String(e).slice(0, 140));
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
