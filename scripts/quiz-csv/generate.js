'use strict';

/**
 * Runner: generates one CSV per subject (1000 questions each) into <repo>/quiz-csv/,
 * then re-validates every file through a port of the site's own CSV parser rules.
 *
 * Usage: node scripts/quiz-csv/generate.js [subject-file-name ...]
 */

const fs = require('fs');
const path = require('path');
const { TARGET_PER_SUBJECT, makeRng, finalize, buildCsv } = require('./lib');

const OUT_DIR = path.join(__dirname, '..', '..', 'quiz-csv');
const SEED = 20260913;

const ALL_SUBJECTS = [
  'general-knowledge',
  'movies-tv',
  'music',
  'sports',
  'science-nature',
  'history',
  'geography',
  'technology-video-games',
  'food-cooking',
  'pop-culture-celebrities',
  'animals',
  'business',
];

// ---- Port of ImportModal.tsx parser (parseCSVRow / parseCSVWithSubjectHeader) ----
const VALID_LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'];

function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseLikeSite(text) {
  const lines = text.trim().split(/\r?\n/);
  let subjectName;
  const dataLines = [];
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('# Subject:')) {
      subjectName = trimmedLine.replace('# Subject:', '').trim().split(',')[0]?.trim() || 'General';
    } else if (
      trimmedLine &&
      !trimmedLine.startsWith('Question,') &&
      !trimmedLine.startsWith('ID,') &&
      !trimmedLine.startsWith('#') &&
      !trimmedLine.startsWith('id,')
    ) {
      dataLines.push(trimmedLine);
    }
  }
  const questions = [];
  for (const row of dataLines) {
    if (!row.trim()) continue;
    const cols = parseCSVRow(row);
    if (cols.length < 9) continue;
    const question = cols[1] || '';
    const correctAnswer = cols[6] || '';
    const level = cols[7] || '';
    const chapterName = cols[8] || '';
    if (!question || !chapterName) continue;
    questions.push({
      question: question.trim(),
      correctAnswer: correctAnswer.trim(),
      level: level.trim(),
      chapterName: chapterName.trim(),
      cols,
    });
  }
  return { subjectName: subjectName || 'General', questions };
}

// ---- Generation + validation ----

function run(names) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const summary = [];
  let failures = 0;

  for (const name of names) {
    const mod = require(path.join(__dirname, 'subjects', name));
    const rng = makeRng(SEED);
    const candidates = mod.generate(rng);
    let questions;
    try {
      questions = finalize(candidates, rng, TARGET_PER_SUBJECT);
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
      failures++;
      continue;
    }

    const csv = buildCsv(mod.subject, questions);
    const file = path.join(OUT_DIR, `${name}.csv`);
    fs.writeFileSync(file, csv, 'utf8');

    // Validate by re-parsing with the site's rules.
    const parsed = parseLikeSite(fs.readFileSync(file, 'utf8'));
    const problems = [];
    if (parsed.subjectName !== mod.subject)
      problems.push(`subject line mismatch: "${parsed.subjectName}"`);
    if (parsed.questions.length !== TARGET_PER_SUBJECT)
      problems.push(`row count ${parsed.questions.length}`);
    const uniq = new Set(parsed.questions.map((q) => q.question.toLowerCase()));
    if (uniq.size !== parsed.questions.length)
      problems.push(`${parsed.questions.length - uniq.size} duplicate questions`);
    const levelCounts = {};
    const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of parsed.questions) {
      if (!VALID_LEVELS.includes(q.level)) problems.push(`invalid level "${q.level}"`);
      if (q.level === 'extreme') {
        if (!q.correctAnswer)
          problems.push(`extreme row without answer: "${q.question.slice(0, 40)}"`);
      } else {
        if (!/^[A-D]$/.test(q.correctAnswer)) problems.push(`bad letter "${q.correctAnswer}"`);
        else {
          const idx = q.correctAnswer.charCodeAt(0) - 65;
          if (!q.cols[2 + idx]) problems.push(`empty option at letter ${q.correctAnswer}`);
          letterCounts[q.correctAnswer]++;
        }
        for (let i = 2; i <= 5; i++)
          if (q.cols[i].includes('"')) problems.push('quote survived escaping');
      }
      levelCounts[q.level] = (levelCounts[q.level] || 0) + 1;
      if (q.chapterName.includes('"')) problems.push('quote in chapter');
    }
    const chapters = new Set(parsed.questions.map((q) => q.chapterName));

    if (problems.length) {
      failures++;
      console.error(`✗ ${name}.csv — ${problems.length} problems:`);
      for (const p of [...new Set(problems)].slice(0, 8)) console.error(`   - ${p}`);
    } else {
      console.log(
        `✓ ${name}.csv — ${parsed.questions.length} questions, ${chapters.size} chapters, levels ${JSON.stringify(levelCounts)}, letters ${JSON.stringify(letterCounts)}`
      );
    }
    summary.push({
      file: `${name}.csv`,
      count: parsed.questions.length,
      problems: problems.length,
    });
  }

  console.log(`\nOutput: ${OUT_DIR}`);
  if (failures) {
    console.error(`${failures} file(s) failed validation`);
    process.exitCode = 1;
  }
}

const only = process.argv.slice(2);
run(only.length ? only : ALL_SUBJECTS);
