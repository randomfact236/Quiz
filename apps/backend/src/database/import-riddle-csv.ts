/**
 * ============================================================================
 * Import riddle-mcq CSVs (plan/imports/riddle-mcq) via the site's own
 * bulk-import path (RiddleMcqImportService.createRiddlesBulk — the same
 * service the admin ImportModal drives).
 * ============================================================================
 * - Parses each CSV exactly like apps/frontend/src/features/riddle-mcq/modals/
 *   csv-parser.ts ('# Category:' header + named columns).
 * - REPAIR: brain-teasers/lateral-thinking CSVs contain 93 rows authored as
 *   'expert' but carrying 4 options + a letter (generator bug in
 *   scripts/riddle-csv/build_riddle_csvs.py parse_txt_shard). Their true
 *   options/letter are recovered from scripts/riddle-csv/data-txt/*.txt and
 *   the rows are imported as 'hard' MCQ riddles (options + letter preserved;
 *   'expert' means free-text on this platform, options would be dropped).
 * - Genuine expert rows (free-text answer, no options) pass through as-is.
 * - Subject/category auto-creation, dedup (subjectId+contentHash), and cache
 *   invalidation are handled by the backend service. Re-running is safe.
 *
 * Usage (from apps/backend):
 *   npx ts-node src/database/import-riddle-csv.ts            # all files
 *   npx ts-node src/database/import-riddle-csv.ts funny kids # subset
 * ============================================================================
 */

import { NestFactory } from '@nestjs/core';
import { In } from 'typeorm';

import { AppModule } from '../app.module';
import { RiddleMcqImportService } from '../riddle-mcq/services/riddle-mcq-import.service';
import { RiddleMcq } from '../riddle-mcq/entities/riddle-mcq.entity';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to import in production (NODE_ENV=production).');
  process.exit(1);
}

interface ParsedRiddle {
  question: string;
  options: string[];
  correctLetter: string;
  level: string;
  subjectName: string;
  categoryName: string;
  hint: string;
  explanation: string;
  answer: string;
  status: string;
}

interface BulkRiddleDto {
  question: string;
  options: string[];
  correctLetter?: string;
  level: string;
  subjectName?: string;
  categoryName?: string;
  hint?: string;
  explanation?: string;
  answer?: string;
  status?: string;
  importOrder?: number;
}

/** Port of parseCSVRow in features/riddle-mcq/modals/csv-parser.ts. */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/** Port of parseCsvContent in features/riddle-mcq/modals/csv-parser.ts. */
function parseCsvContent(content: string): { riddles: ParsedRiddle[]; categoryName: string } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { riddles: [], categoryName: '' };

  let headerLineIdx = 0;
  let dataStartIdx = 1;
  let categoryName = '';

  if (lines[0].startsWith('# Category:')) {
    categoryName = lines[0]
      .replace(/^#\s*Category:\s*/i, '')
      .replace(/,+$/, '')
      .trim();
    headerLineIdx = 1;
    dataStartIdx = 2;
  }

  const headers = parseCSVRow(lines[headerLineIdx]).map((h) => h.toLowerCase().trim());
  const riddles: ParsedRiddle[] = [];

  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const values = parseCSVRow(line);
    if (values.length < 2) continue;

    const getValue = (colName: string): string => {
      const idx = headers.indexOf(colName.toLowerCase());
      return idx >= 0 && values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
    };

    const question = getValue('question');
    if (!question) continue;

    const optA = getValue('optiona');
    const optB = getValue('optionb');
    const optC = getValue('optionc');
    const optD = getValue('optiond');
    const answerRaw = getValue('answer');

    let correctLetter = '';
    let answerText = '';
    if (answerRaw) {
      const m = answerRaw.match(/^([A-D])\.\s*(.*)$/i);
      if (m) {
        correctLetter = m[1].toUpperCase();
        answerText = m[2].trim();
      } else {
        answerText = answerRaw;
      }
    }

    const options: string[] = [];
    if (optA) options.push(optA);
    if (optB) options.push(optB);
    if (optC) options.push(optC);
    if (optD) options.push(optD);

    if (answerText && correctLetter) {
      const li = correctLetter.charCodeAt(0) - 65;
      if (li >= 0 && li < options.length) options[li] = answerText;
    }

    riddles.push({
      question,
      options,
      correctLetter,
      level: getValue('level') || 'easy',
      subjectName: getValue('subject'),
      categoryName,
      hint: getValue('hint'),
      explanation: getValue('explanation'),
      answer: answerText || '',
      status: getValue('status') || 'draft',
    });
  }

  return { riddles, categoryName };
}

function normalizeQ(q: string): string {
  return q.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Build repair index from data-txt: normalized question -> {options, letter}. */
function buildTxtRepairIndex(txtDir: string, fs: typeof import('fs'), path: typeof import('path')) {
  const index = new Map<string, { options: string[]; letter: string }>();
  if (!fs.existsSync(txtDir)) return index;
  for (const f of fs.readdirSync(txtDir).filter((x) => x.endsWith('.txt'))) {
    const lines = fs.readFileSync(path.join(txtDir, f), 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#category:')) continue;
      const parts = t.split('~');
      if (parts.length !== 10) continue;
      const [q, o1, o2, o3, o4, letterRaw, level] = parts.map((p) => p.trim());
      if (level !== 'expert') continue;
      const letter = letterRaw.toUpperCase();
      if (!/^[A-D]$/.test(letter)) continue;
      const opts = [o1, o2, o3, o4];
      if (opts.some((o) => !o)) continue;
      index.set(normalizeQ(q), { options: opts, letter });
    }
  }
  return index;
}

async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const csvDir = path.join(repoRoot, 'plan', 'imports', 'riddle-mcq');
  const txtDir = path.join(repoRoot, 'scripts', 'riddle-csv', 'data-txt');

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

  const repairIndex = buildTxtRepairIndex(txtDir, fs, path);
  console.log(
    `Importing ${files.length} riddle CSV(s) from ${csvDir} (repair index: ${repairIndex.size} entries)\n`
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const importService = app.get(RiddleMcqImportService);

  let totalCreated = 0;
  let totalDup = 0;
  let totalErr = 0;
  let totalRepaired = 0;
  let filesFailed = 0;

  for (const file of files) {
    const { riddles, categoryName } = parseCsvContent(
      fs.readFileSync(path.join(csvDir, file), 'utf8')
    );
    if (riddles.length === 0) {
      console.error(`FAIL ${file}: no valid riddles parsed - skipping`);
      filesFailed++;
      continue;
    }

    const dtos: BulkRiddleDto[] = [];
    let repaired = 0;
    let unmatched = 0;

    riddles.forEach((r, i) => {
      const degenerateExpert =
        r.level === 'expert' &&
        !r.correctLetter &&
        /^[A-D]$/.test(r.answer) &&
        r.options.length === 0;
      if (degenerateExpert) {
        const hit = repairIndex.get(normalizeQ(r.question));
        if (hit) {
          const li = hit.letter.charCodeAt(0) - 65;
          dtos.push({
            question: r.question,
            options: hit.options,
            correctLetter: hit.letter,
            level: 'hard',
            subjectName: r.subjectName,
            categoryName: r.categoryName || categoryName,
            hint: r.hint || undefined,
            explanation: r.explanation || undefined,
            status: r.status,
            importOrder: i + 1,
          });
          repaired++;
          return;
        }
        unmatched++;
      }

      const dto: BulkRiddleDto = {
        question: r.question,
        options: r.level === 'expert' ? [] : r.options,
        level: r.level,
        subjectName: r.subjectName,
        categoryName: r.categoryName || categoryName,
        hint: r.hint || undefined,
        explanation: r.explanation || undefined,
        status: r.status,
        importOrder: i + 1,
      };
      if (r.level === 'expert') {
        dto.answer = /^[A-D]$/.test(r.answer) ? '' : r.answer;
      } else if (r.correctLetter) {
        dto.correctLetter = r.correctLetter;
      }
      dtos.push(dto);
    });

    try {
      const res = await importService.createRiddlesBulk(dtos as never);
      totalCreated += res.count;
      totalDup += res.duplicates?.length ?? 0;
      totalErr += res.errors?.length ?? 0;
      totalRepaired += repaired;
      console.log(
        `OK ${file} -> category "${categoryName}": created=${res.count}, duplicates=${res.duplicates?.length ?? 0}, errors=${res.errors?.length ?? 0}, repairedExpertRows=${repaired}${unmatched ? `, UNMATCHED=${unmatched}` : ''}`
      );
      for (const err of (res.errors ?? []).slice(0, 5)) {
        console.log(`   error: ${String(err).slice(0, 160)}`);
      }
    } catch (err) {
      filesFailed++;
      console.error(`FAIL ${file}: ${(err as Error).message}`);
    }
  }

  console.log(
    `\nDone. created=${totalCreated}, duplicates=${totalDup}, rowErrors=${totalErr}, repairedExpertRows=${totalRepaired}, failedFiles=${filesFailed}`
  );

  // Sanity: per-subject published counts straight from the DB entities.
  const repo = app.get(require('@nestjs/typeorm').getRepositoryToken(RiddleMcq));
  const bySubject = await repo
    .createQueryBuilder('r')
    .select('s.name', 'subject')
    .addSelect('COUNT(*)', 'qs')
    .leftJoin('riddle_subjects', 's', 's.id = r.subjectId')
    .groupBy('s.name')
    .getRawMany();
  for (const row of bySubject) console.log(`   ${row.subject}: ${row.qs}`);

  await app.close();
  process.exit(filesFailed > 0 ? 1 : 0);
}

void In;
main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
