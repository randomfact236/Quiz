/**
 * HARD-02 manual verification round 2 (the flows not yet browser-verified):
 *  A. image-riddle UI: wrong guess -> no answer shown; Reveal -> answer appears
 *  B. quiz results review -> reveal endpoint fetched for key-stripped sessions
 *  C. riddle resume -> answers + verdicts survive a mid-session refresh
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3013';
const API = 'http://localhost:3012/api/v1';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

const browser = await chromium.launch();

// ---------- A. image-riddle UI flow ----------
try {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));
  await page.goto(`${BASE}/image-riddles`, { waitUntil: 'domcontentloaded' });
  const card = page.locator('[class*="cursor-pointer"], button, a').filter({ hasText: /./ }).first();
  await page.waitForTimeout(2500);
  // open the first riddle modal
  const firstCard = page.locator('[role="button"][aria-label^="Open riddle:"]').first();
  await firstCard.click();
  await page.waitForTimeout(1200);
  const input = page.locator('#riddle-answer');
  const inputCount = await input.count();
  check('A: guess input visible', inputCount > 0);
  if (inputCount) {
    await input.fill('zzz absolutely wrong guess');
    await page.locator('#riddle-answer ~ button, button:has-text("Check"), button:has-text("Submit")').first().click();
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    // wrong guess: the answer must NOT appear
    const leaked = /Prima company logo/i.test(body);
    check('A: wrong guess does not reveal answer', !leaked);
    // find a give-up / reveal action button
    const revealBtn = page.locator('[aria-label="Reveal answer"]').first();
    if (await revealBtn.count()) {
      await revealBtn.click();
      await page.waitForTimeout(1500);
      const body2 = await page.locator('body').innerText();
      check('A: reveal shows the answer', /prima/i.test(body2));
    } else {
      check('A: reveal action present', false, 'no reveal button found');
    }
  }
  check('A: zero page errors', errs.length === 0, errs[0] || '');
  await page.close();
} catch (e) {
  check('A: image-riddle flow', false, String(e).slice(0, 120));
}

// ---------- B. quiz review reveal ----------
try {
  const page = await browser.newPage();
  let revealCalled = false;
  page.on('response', (r) => {
    if (r.url().includes('/quiz-mcq/answers/reveal')) revealCalled = true;
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
  await start.waitFor({ state: 'visible', timeout: 30000 });
  await start.click();
  await page.waitForSelector('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]', { timeout: 30000 });
  // answer ALL questions with option A, then submit
  for (;;) {
    const radios = page.locator('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]');
    await radios.first().click();
    await page.waitForTimeout(900);
    const next = page.locator('button:has-text("Next")');
    if (await next.count()) {
      await next.first().click();
      await page.waitForTimeout(600);
      const stillPlaying = await page.locator('[role="radiogroup"]').count();
      if (!stillPlaying) break;
    } else {
      const submit = page.locator('button:has-text("Submit")');
      if (await submit.count()) {
        await submit.first().click();
        break;
      }
      break;
    }
  }
  await page.waitForTimeout(2500);
  // results/review: reveal fetches happen (key-stripped session)
  await page.waitForTimeout(1200);
  const reviewToggle = page.locator('button:has-text("Question Review")');
  if (await reviewToggle.count()) {
    await reviewToggle.first().click();
    await page.waitForTimeout(2500);
  }
  check('B: results review fetched reveals', revealCalled);
  await page.close();
} catch (e) {
  check('B: quiz review flow', false, String(e).slice(0, 120));
}

// ---------- C. riddle resume verdicts ----------
try {
  const page = await browser.newPage();
  const subjects = await fetch(`${API}/riddle-mcq/subjects`).then((r) => r.json());
  const list = subjects.data ?? subjects;
  const subject = list.find((s) => s.slug) ?? list[0];
  const playUrl = `${BASE}/riddle-mcq/play?subjectId=${encodeURIComponent(subject.id)}&level=easy&mode=practice`;
  await page.goto(playUrl, { waitUntil: 'domcontentloaded' });
  const start = page.locator('button:has-text("Start")').first();
  await start.waitFor({ state: 'visible', timeout: 30000 });
  await start.click();
  await page.waitForSelector('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]', { timeout: 30000 });
  await page.locator('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]').first().click();
  // the autosave ticks every 10s — give it time to persist before reloading
  await page.waitForTimeout(11500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const resumeBtn = page.locator('button:has-text("Resume")').first();
  await resumeBtn.waitFor({ state: 'visible', timeout: 20000 });
  await resumeBtn.click();
  await page.waitForSelector('[role="radiogroup"][aria-label="Answer choices"] [role="radio"][aria-checked="true"]', { timeout: 20000 });
  const stillSelected = await page
    .locator('[role="radiogroup"][aria-label="Answer choices"] [role="radio"][aria-checked="true"]')
    .count();
  check('C: riddle resume keeps answered state', stillSelected > 0);
  // submit and check the results page grades (score card present)
  const submit = page.locator('button:has-text("Submit")');
  if (await submit.count()) {
    await submit.first().click();
    await page.waitForTimeout(1500);
    const confirm = page.locator('button:has-text("Submit")').last();
    if (await confirm.count()) {
      await confirm.click().catch(() => {});
    }
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    check('C: riddle results after resume', /score|correct/i.test(body), page.url().slice(-40));
  }
  await page.close();
} catch (e) {
  check('C: riddle resume flow', false, String(e).slice(0, 120));
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
