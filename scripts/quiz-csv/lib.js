'use strict';

/**
 * Shared helpers for the quiz CSV generator.
 *
 * Target format (matches apps/frontend/src/features/quiz-mcq-admin/components/modals/ImportModal.tsx):
 *   # Subject: <Subject Name>
 *   ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
 *   1,What is H2O?,Water,Steam,Ice,Air,A,easy,Chemistry
 *
 * Rules the site parser enforces:
 *   - row must have >= 9 columns; question + chapter non-empty
 *   - Correct Answer is a letter A-D for MCQ; free text when Level = extreme (options empty)
 *   - level in: easy | medium | hard | expert | extreme
 *   - content must not contain double quotes or newlines (site parser does not escape them)
 */

const TARGET_PER_SUBJECT = 1000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed) {
  const rand = mulberry32(seed);
  return {
    rand,
    int: (n) => Math.floor(rand() * n),
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

/** Pick n distinct distractors from a pool, excluding the correct value. rng optional. */
function distractors(pool, correct, n, rng) {
  const out = [];
  const seen = new Set([String(correct).toLowerCase()]);
  const ordered = rng ? rng.shuffle(pool) : pool.slice();
  for (const cand of ordered) {
    const key = String(cand).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cand);
    if (out.length === n) break;
  }
  // Pool too small: top up from a fallback list of generic wrong answers.
  const fallback = ['None of these', 'Not sure'];
  let fi = 0;
  while (out.length < n && fi < fallback.length) {
    const key = String(fallback[fi]).toLowerCase();
    if (!seen.has(key)) {
      out.push(fallback[fi]);
      seen.add(key);
    }
    fi++;
  }
  return out;
}

/**
 * Normalize generated rows into CSV-ready questions.
 * Row in:  { q, correct, ds: [distractors], level, chapter }  (MCQ)
 *       or { q, text, chapter }                              (extreme, free-text)
 */
function finalize(rows, rng, target = TARGET_PER_SUBJECT) {
  const seen = new Set();
  const mcq = [];
  const extreme = [];
  for (const row of rows) {
    if (!row || !row.q || !row.chapter) continue;
    const key = row.q.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (row.text != null) {
      extreme.push({
        q: row.q.trim(),
        text: String(row.text),
        chapter: row.chapter,
        level: 'extreme',
      });
    } else if (row.correct != null && Array.isArray(row.ds) && row.ds.length >= 2) {
      mcq.push({
        q: row.q.trim(),
        correct: row.correct,
        ds: row.ds.slice(0, 3),
        level: row.level,
        chapter: row.chapter,
      });
    }
  }

  // ~2% extreme free-text questions, the rest MCQ.
  const extremeCount = Math.min(extreme.length, Math.round(target * 0.02));
  const mcqCount = target - extremeCount;
  if (mcq.length < mcqCount || extreme.length < extremeCount) {
    const err = new Error(
      `Not enough unique questions: have ${mcq.length} MCQ + ${extreme.length} extreme, need ${mcqCount} + ${extremeCount}`
    );
    err.shortfall = { mcq: mcqCount - mcq.length, extreme: extremeCount - extreme.length };
    throw err;
  }

  const pickedMcq = rng.shuffle(mcq).slice(0, mcqCount);
  const pickedExtreme = rng.shuffle(extreme).slice(0, extremeCount);

  const questions = pickedMcq.map((row) => {
    const opts = rng.shuffle([row.correct, ...row.ds]).map((o) => String(o));
    while (opts.length < 4) opts.push('');
    const letter = String.fromCharCode(65 + opts.findIndex((o) => o === String(row.correct)));
    return { q: row.q, options: opts, letter, level: row.level || 'easy', chapter: row.chapter };
  });
  for (const row of pickedExtreme) questions.push(row);

  return rng.shuffle(questions);
}

const HEADERS = 'ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter';

function csvField(value) {
  const v = String(value)
    .replace(/"/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  return v.includes(',') ? `"${v}"` : v;
}

function buildCsv(subjectName, questions) {
  const lines = [`# Subject: ${subjectName}`, '', HEADERS];
  questions.forEach((row, i) => {
    const id = i + 1;
    if (row.level === 'extreme') {
      lines.push(
        [
          id,
          csvField(row.q),
          '',
          '',
          '',
          '',
          csvField(row.text),
          'extreme',
          csvField(row.chapter),
        ].join(',')
      );
    } else {
      lines.push(
        [
          id,
          csvField(row.q),
          csvField(row.options[0]),
          csvField(row.options[1]),
          csvField(row.options[2]),
          csvField(row.options[3]),
          row.letter,
          row.level,
          csvField(row.chapter),
        ].join(',')
      );
    }
  });
  return lines.join('\n') + '\n';
}

module.exports = {
  TARGET_PER_SUBJECT,
  makeRng,
  distractors,
  finalize,
  buildCsv,
  csvField,
  HEADERS,
};
