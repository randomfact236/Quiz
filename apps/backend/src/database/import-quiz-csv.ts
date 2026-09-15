/**
 * ============================================================================
 * Import quiz-csv/*.csv into the quiz via the site's own bulk-import path
 * ============================================================================
 * Reads every `# Subject:`-style CSV from <repo>/quiz-csv/ and feeds it to
 * QuizMcqService.createQuestionsBulkFromImport - the exact service method the
 * admin ImportModal calls (same validation, level rules, A-D letter mapping,
 * per-chapter content-hash dedup, auto subject/chapter creation, cache
 * invalidation). No schema writes, no destructive operations; re-running is
 * safe (existing rows are reported as duplicates and skipped).
 *
 * Usage (from apps/backend):
 *   npx ts-node src/database/import-quiz-csv.ts            # import all files
 *   npx ts-node src/database/import-quiz-csv.ts animals sports   # subset
 * ============================================================================
 */

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { QuizMcqService } from '../quiz-mcq/quiz-mcq.service';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to import in production (NODE_ENV=production).');
  process.exit(1);
}

/** Row shape sent to the bulk import API (mirrors BulkQuestionItemDto). */
interface BulkRow {
  question: string;
  chapterName: string;
  level: string;
  status: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
}

interface ParsedCsv {
  subjectName: string;
  questions: BulkRow[];
}

/**
 * Port of the site parser in
 * apps/frontend/src/features/quiz-mcq-admin/components/modals/ImportModal.tsx
 * (parseCSVRow / parseCSVWithSubjectHeader). Keep in sync.
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
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

function parseQuizCsv(text: string): ParsedCsv {
  const lines = text.trim().split(/\r?\n/);

  let subjectName: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('# Subject:')) {
      const subjectPart = trimmedLine.replace('# Subject:', '').trim();
      subjectName = subjectPart.split(',')[0]?.trim() || 'General';
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

  const questions: BulkRow[] = [];

  for (const row of dataLines) {
    if (!row.trim()) continue;

    const cols = parseCSVRow(row);
    if (cols.length < 9) continue;

    const question = cols[1] || '';
    const optionA = cols[2];
    const optionB = cols[3];
    const optionC = cols[4];
    const optionD = cols[5];
    const correctAnswer = cols[6] || '';
    const level = cols[7] || '';
    const chapterName = cols[8] || '';

    if (!question || !chapterName) continue;
    if (question === 'Question' || chapterName === 'Chapter') continue;
    if (level === 'Level') continue;

    questions.push({
      question: question.trim(),
      optionA: optionA?.trim(),
      optionB: optionB?.trim(),
      optionC: optionC?.trim(),
      optionD: optionD?.trim(),
      correctAnswer: correctAnswer?.trim() || '',
      level: level?.trim() || 'easy',
      chapterName: chapterName?.trim(),
      status: 'published',
    });
  }

  return { subjectName: subjectName || 'General', questions };
}

async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  // <repo>/quiz-csv - resolved from src/database (ts-node) or dist/src/database (compiled)
  const csvDir = path.resolve(__dirname, '..', '..', '..', '..', 'quiz-csv');

  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const files = fs
    .readdirSync(csvDir)
    .filter((f) => f.endsWith('.csv'))
    .filter((f) => (only.length === 0 ? true : only.some((o) => f.startsWith(o))))
    .sort();

  if (files.length === 0) {
    console.error(`No CSV files matched in ${csvDir}`);
    process.exit(1);
  }

  console.log(`Importing ${files.length} file(s) from ${csvDir}`);

  // Standalone application context: full DI graph, no HTTP listener.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const quizService = app.get(QuizMcqService);

  let filesFailed = 0;
  let totalCreated = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (const file of files) {
    const fullPath = path.join(csvDir, file);
    const text = fs.readFileSync(fullPath, 'utf8');
    const parsed = parseQuizCsv(text);

    if (parsed.questions.length === 0) {
      console.error(`FAIL ${file}: no valid questions parsed - skipping`);
      filesFailed++;
      continue;
    }

    try {
      const res = await quizService.createQuestionsBulkFromImport({
        subjectName: parsed.subjectName,
        questions: parsed.questions,
      });
      totalCreated += res.count;
      const dupCount = res.duplicates?.length ?? 0;
      const errCount = res.errors?.length ?? 0;
      totalDuplicates += dupCount;
      totalErrors += errCount;
      console.log(
        `OK ${file} -> subject "${parsed.subjectName}": created=${res.count}, duplicates=${dupCount}, errors=${errCount}`
      );
      for (const dup of (res.duplicates ?? []).slice(0, 3)) {
        console.log(`   dup example: ${JSON.stringify(dup).slice(0, 160)}`);
      }
      for (const err of (res.errors ?? []).slice(0, 5)) {
        console.log(`   error example: ${String(err).slice(0, 160)}`);
      }
    } catch (err) {
      filesFailed++;
      console.error(`FAIL ${file}: import failed: ${(err as Error).message}`);
    }
  }

  console.log(
    `Done. created=${totalCreated}, duplicates=${totalDuplicates}, rowErrors=${totalErrors}, failedFiles=${filesFailed}`
  );

  await app.close();
  process.exit(filesFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
