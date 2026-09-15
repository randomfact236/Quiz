/**
 * ============================================================================
 * Import dad-joke CSVs (scripts/joke-csv) via the site's own bulk path
 * ============================================================================
 * Mirrors the admin JokesSection import flow: parseJokeCSV format
 * (ID,Setup,Punchline,Category,Status) -> joke text = setup + punchline,
 * resolved category -> DadJokesService.createJokesBulk (DRAFT, like the UI).
 * After import, jokes are published through DadJokesService.bulkActionClassic
 * (the admin bulk-action) so they appear on the public site.
 *
 * Extras for safety: missing categories are created via createCategory;
 * duplicate joke texts (within files or already in DB) are skipped up front
 * (the jokes module has no content-hash dedup guard).
 *
 * Usage (from apps/backend):
 *   npx ts-node src/database/import-dad-jokes.ts
 * ============================================================================
 */

import { NestFactory } from '@nestjs/core';
import { In } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppModule } from '../app.module';
import { DadJokesService } from '../dad-jokes/dad-jokes.service';
import { DadJoke } from '../dad-jokes/entities/dad-joke.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { BulkActionType } from '../common/enums/bulk-action.enum';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to import in production (NODE_ENV=production).');
  process.exit(1);
}

/** Port of parseCSVLine in apps/frontend/src/app/admin/utils/index.ts. */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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

function normalizeJoke(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const csvDir = path.join(repoRoot, 'scripts', 'joke-csv');

  const files = fs
    .readdirSync(csvDir)
    .filter((f) => f.endsWith('.csv'))
    .sort();
  if (files.length === 0) {
    console.error(`No CSV files in ${csvDir}`);
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const jokesService = app.get(DadJokesService);
  const jokeRepo = app.get(getRepositoryToken(DadJoke)) as import('typeorm').Repository<DadJoke>;

  // 1. Ensure all categories exist (site flow: categories must exist before import).
  const neededCategories = new Set<string>();
  const parsedFiles: { file: string; rows: { joke: string; category: string }[] }[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(path.join(csvDir, file), 'utf8').trim().split(/\r?\n/);
    const rows: { joke: string; category: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      const values = parseCSVLine(line);
      if (values.length < 3) continue;
      const setup = values[1] ?? '';
      const punchline = values[2] ?? '';
      const category = (values[3] || 'General').trim();
      const joke = `${setup} ${punchline}`.trim();
      if (!joke) continue;
      rows.push({ joke, category });
      neededCategories.add(category);
    }
    parsedFiles.push({ file, rows });
  }

  const existingCats = await jokesService.findAllCategories(false);
  const catMap = new Map<string, string>(existingCats.map((c) => [c.name, c.id]));
  for (const name of [...neededCategories].sort()) {
    if (!catMap.has(name)) {
      const created = await jokesService.createCategory({ name });
      catMap.set(name, created.id);
      console.log(`created category: ${name}`);
    }
  }

  // 2. Dedup pre-filter: normalize against DB + within-batch.
  const existingJokes: Pick<DadJoke, 'id' | 'joke'>[] = await jokeRepo.find({
    select: ['id', 'joke'],
  });
  const seen = new Set<string>(existingJokes.map((j) => normalizeJoke(j.joke)));

  let totalCreated = 0;
  let totalSkipped = 0;
  let filesFailed = 0;

  for (const { file, rows } of parsedFiles) {
    let createdInFile = 0;
    let skippedInFile = 0;
    try {
      for (let i = 0; i < rows.length; i += 100) {
        const chunkRows = rows.slice(i, i + 100);
        const fresh = chunkRows.filter((r) => {
          const key = normalizeJoke(r.joke);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        skippedInFile += chunkRows.length - fresh.length;
        if (fresh.length === 0) continue;
        const dtos = fresh.map((r) => ({
          joke: r.joke,
          categoryId: catMap.get(r.category) ?? '',
        }));
        const res = await jokesService.createJokesBulk(dtos);
        createdInFile += res.count;
        for (const err of res.errors.slice(0, 3)) console.log(`   ${file}: ${err}`);
      }
      console.log(`OK ${file}: created=${createdInFile}, duplicatesSkipped=${skippedInFile}`);
      totalCreated += createdInFile;
      totalSkipped += skippedInFile;
    } catch (err) {
      filesFailed++;
      console.error(`FAIL ${file}: ${(err as Error).message}`);
    }
  }

  // 3. Publish everything just imported via the site's own bulk action.
  // createJokesBulk does not return IDs; publish all drafts in the affected categories.
  let published = 0;
  const catIds = [...new Set([...catMap.values()])];
  const drafts: Pick<DadJoke, 'id'>[] = await jokeRepo.find({
    where: { status: ContentStatus.DRAFT, categoryId: In(catIds) },
    select: ['id'],
  });
  for (let i = 0; i < drafts.length; i += 100) {
    const ids = drafts.slice(i, i + 100).map((d) => d.id);
    const res = await jokesService.bulkActionClassic(ids, BulkActionType.PUBLISH);
    published += res.succeeded;
  }

  // 4. Final counts.
  const byStatus = await jokeRepo
    .createQueryBuilder('j')
    .select('j.status', 'status')
    .addSelect('COUNT(*)', 'n')
    .groupBy('j.status')
    .getRawMany();
  const byCat = await jokeRepo
    .createQueryBuilder('j')
    .select('c.name', 'category')
    .addSelect('COUNT(*)', 'n')
    .leftJoin('joke_categories', 'c', 'c.id = j.categoryId')
    .groupBy('c.name')
    .orderBy('c.name')
    .getRawMany();

  console.log(
    `\nDone. created=${totalCreated}, duplicatesSkipped=${totalSkipped}, published=${published}, failedFiles=${filesFailed}`
  );
  for (const r of byStatus) console.log(`   status ${r.status}: ${r.n}`);
  for (const r of byCat) console.log(`   ${r.category}: ${r.n}`);

  await app.close();
  process.exit(filesFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
