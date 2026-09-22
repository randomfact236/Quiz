/**
 * HARD-02 verification: drive one quiz play session end-to-end against the
 * local servers and assert the server-grading flow works.
 * Usage: node apps/frontend/verify-quiz-grading.mjs [baseUrl] [apiBase]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3013';
const API = process.argv[3] || 'http://localhost:3012/api/v1';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

const subjectMeta = await fetch(`${API}/quiz-mcq/subjects/science`).then((r) => r.json());
const counts = await fetch(`${API}/quiz-mcq/question-counts`).then((r) => r.json());
const byChapter = counts?.byChapter ?? {};
const chapterInfo = (subjectMeta.chapters || []).find((c) => {
  const stats = byChapter[c.id];
  return stats && stats.count > 0 && (stats.levels?.easy ?? 0) > 0;
});
if (!chapterInfo) {
  console.error('no chapter with easy questions found');
  process.exit(1);
}
const chapter = chapterInfo.name;
const playUrl = `${BASE}/quiz-mcq/play?subject=science&chapter=${encodeURIComponent(chapter)}&level=easy&mode=normal`;

const browser = await chromium.launch();
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

const graderCalls = [];
page.on('response', async (res) => {
  if (res.url().includes('/answers/check')) {
    try {
      graderCalls.push(await res.json());
    } catch {}
  }
});

try {
  await page.goto(playUrl, { waitUntil: 'domcontentloaded' });
  // Pre-game summary: the session starts on an explicit Start click
  const start = page.locator('button:has-text("Start")').first();
  await start.waitFor({ state: 'visible', timeout: 30000 });
  await start.click();
  await page.waitForSelector('[role="radiogroup"][aria-label="Answer choices"]', {
    timeout: 30000,
  });

  let sawFeedback = 0;
  for (let q = 0; q < 3; q++) {
    await page
      .waitForSelector('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]', {
        timeout: 30000,
      })
      .catch(() => {});
    const radios = page.locator('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]');
    if ((await radios.count()) === 0) break;
    await radios.nth(0).click();

    await page.waitForFunction(
      () => {
        const el = document.querySelector(
          '[role="radiogroup"][aria-label="Answer choices"] [role="radio"][aria-checked="true"]'
        );
        return el && (el.textContent.includes('✓') || el.textContent.includes('✕'));
      },
      { timeout: 15000 }
    );
    const checked = await page
      .locator('[role="radiogroup"][aria-label="Answer choices"] [role="radio"][aria-checked="true"]')
      .first()
      .textContent();
    if (checked.includes('✓') || checked.includes('✕')) sawFeedback++;
    check(`q${q + 1} verdict feedback`, checked.includes('✓') || checked.includes('✕'), checked.slice(0, 40));

    const next = page.locator('button:has-text("Next")');
    if (await next.count()) {
      await next.first().click();
      await page.waitForTimeout(800);
    } else {
      const submit = page.locator('button:has-text("Submit")');
      if (await submit.count()) {
        await submit.first().click();
        break;
      }
    }
  }
  check('grader called ≥3 times', graderCalls.length >= 3, `${graderCalls.length} calls`);
  check(
    'grader responses verdict-only',
    graderCalls.every(
      (b) => typeof b.correct === 'boolean' && !('correctLetter' in b) && !('correctAnswer' in b)
    )
  );
  check('verdict feedback on all answered', sawFeedback === graderCalls.length || sawFeedback >= 3, `${sawFeedback} feedback / ${graderCalls.length} calls`);
  check('zero page errors', pageErrors.length === 0, pageErrors[0] || '');
} catch (err) {
  console.error('DRIVER ERROR:', String(err).slice(0, 300));
  check('driver completed', false);
} finally {
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
}
