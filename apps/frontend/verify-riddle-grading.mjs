/**
 * HARD-02 verification: drive one riddle play session end-to-end.
 * Usage: node apps/frontend/verify-riddle-grading.mjs [baseUrl] [apiBase]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3013';
const API = process.argv[3] || 'http://localhost:3012/api/v1';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

const subjects = await fetch(`${API}/riddle-mcq/subjects`).then((r) => r.json());
const list = subjects.data ?? subjects;
const subject = list.find((s) => s.slug) ?? list[0];
const playUrl = `${BASE}/riddle-mcq/play?subjectId=${encodeURIComponent(subject.id)}&level=easy&mode=practice`;

const browser = await chromium.launch();
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
const graderCalls = [];
page.on('response', async (res) => {
  if (res.url().includes('/riddle-mcq/answers/check')) {
    try {
      graderCalls.push(await res.json());
    } catch {}
  }
});

try {
  await page.goto(playUrl, { waitUntil: 'domcontentloaded' });
  // Pre-game summary → begin session
  const start = page.locator('button:has-text("Start")').first();
  await start.waitFor({ state: 'visible', timeout: 30000 });
  await start.click();
  await page.waitForSelector('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]', {
    timeout: 30000,
  });

  let sawFeedback = 0;
  for (let q = 0; q < 3; q++) {
    const radios = page.locator('[role="radiogroup"][aria-label="Answer choices"] [role="radio"]');
    await radios.first().click();
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

    const next = page.locator('button:has-text("Next")');
    if (await next.count()) {
      await next.first().click();
      await page.waitForTimeout(800);
    } else break;
  }
  check('grader called ≥3 times', graderCalls.length >= 3, `${graderCalls.length} calls`);
  check(
    'grader responses verdict-only',
    graderCalls.every(
      (b) => typeof b.correct === 'boolean' && !('correctLetter' in b) && !('answer' in b)
    )
  );
  check('verdict feedback on answered riddles', sawFeedback >= 3, `${sawFeedback} feedback`);
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
