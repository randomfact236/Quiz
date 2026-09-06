import { readFileSync } from 'fs';
import { In, DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';

import { QuizMcqService } from '../../quiz-mcq/quiz-mcq.service';
import { RiddleMcqImportService } from '../../riddle-mcq/services/riddle-mcq-import.service';
import { RiddleMcqQuestionService } from '../../riddle-mcq/services/riddle-mcq-question.service';
import { Subject } from '../../quiz-mcq/entities/subject.entity';
import { Chapter } from '../../quiz-mcq/entities/chapter.entity';
import { Question } from '../../quiz-mcq/entities/question.entity';
import { RiddleMcq } from '../../riddle-mcq/entities/riddle-mcq.entity';
import { RiddleMcqSubject } from '../../riddle-mcq/entities/riddle-subject.entity';
import { RiddleMcqCategory } from '../../riddle-mcq/entities/riddle-category.entity';

/**
 * Integration tests for duplicate-question detection, run against the real
 * local database (the migration must have been applied). Creates its own
 * DEDUP-TEST-* subject fixture and hard-deletes everything it created.
 *
 * CacheService is faked (delPattern) — no Redis needed; only invalidation is
 * triggered on these paths.
 */
jest.setTimeout(60000);

describe('duplicate detection (integration)', () => {
  let dataSource: DataSource;
  let quizService: QuizMcqService;
  let riddleImport: RiddleMcqImportService;
  let riddleQuestions: RiddleMcqQuestionService;
  let subjectId: string;
  let chapter1Id: string;
  let chapter2Id: string;
  let riddleSubjectId: string;
  const runId = Date.now();
  const subjectName = `DEDUP-TEST-${runId}`;

  const fakeCache = { delPattern: jest.fn().mockResolvedValue(undefined) } as any;

  const envValue = (key: string): string => {
    const line = readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${key}=`));
    if (!line) throw new Error(`Missing ${key} in backend .env`);
    return line.slice(key.length + 1).trim();
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: envValue('DB_HOST'),
      port: Number(envValue('DB_PORT')),
      username: envValue('DB_USERNAME'),
      password: envValue('DB_PASSWORD'),
      database: envValue('DB_DATABASE'),
      entities: [Subject, Chapter, Question, RiddleMcq, RiddleMcqSubject, RiddleMcqCategory],
    });
    await dataSource.initialize();

    quizService = new QuizMcqService(
      dataSource.getRepository(Subject),
      dataSource.getRepository(Chapter),
      dataSource.getRepository(Question),
      null as any,
      fakeCache,
      dataSource,
      null as any
    );
    riddleImport = new RiddleMcqImportService(
      dataSource.getRepository(RiddleMcq),
      fakeCache,
      dataSource
    );
    riddleQuestions = new RiddleMcqQuestionService(
      dataSource.getRepository(RiddleMcq),
      dataSource.getRepository(RiddleMcqSubject),
      fakeCache,
      dataSource
    );

    const subject = await dataSource.getRepository(Subject).save({
      name: subjectName,
      slug: `dedup-test-${runId}`,
      emoji: '🧪',
      isActive: true,
    });
    subjectId = subject.id;
    const chapterRepo = dataSource.getRepository(Chapter);
    const ch1 = await chapterRepo.save({ name: 'Dedup Ch 1', subjectId, chapterNumber: 9001 });
    const ch2 = await chapterRepo.save({ name: 'Dedup Ch 2', subjectId, chapterNumber: 9002 });
    chapter1Id = ch1.id;
    chapter2Id = ch2.id;

    const riddleSubject = await dataSource.getRepository(RiddleMcqSubject).save({
      name: `${subjectName}-RS`,
      slug: `dedup-test-${runId}-rs`,
      emoji: '🧪',
      isActive: true,
      categoryId: null,
    });
    riddleSubjectId = riddleSubject.id;
  });

  afterAll(async () => {
    if (!dataSource?.isInitialized) return;
    await dataSource.getRepository(Question).delete({ chapterId: In([chapter1Id, chapter2Id]) });
    // Riddles before their subjects (FK): catch both fixture-subject rows and
    // the subject the bulk import auto-created.
    await dataSource
      .getRepository(RiddleMcq)
      .createQueryBuilder()
      .delete()
      .where('question LIKE :q', { q: 'Dedup Test: %' })
      .execute();
    await dataSource.getRepository(Chapter).delete({ subjectId: In([subjectId]) });
    await dataSource.getRepository(Subject).delete(subjectId);
    await dataSource.getRepository(RiddleMcqSubject).delete(riddleSubjectId);
    await dataSource
      .getRepository(RiddleMcqSubject)
      .createQueryBuilder()
      .delete()
      .where('name = :name', { name: subjectName })
      .execute();
    await dataSource.destroy();
  });

  describe('manual create (ContentServiceBase.createItem)', () => {
    it('inserts a new question normally and stores the content hash', async () => {
      const saved = (await quizService.createItem({
        question: 'Dedup Test: What is 2 + 2?',
        chapterId: chapter1Id,
        level: 'easy',
        options: ['3', '4', '5', '6'],
        correctLetter: 'B',
        correctAnswer: '4',
      })) as Question;
      expect(saved.id).toBeDefined();
      expect(saved.contentHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('rejects a re-created question with different case/whitespace (409 with the text)', async () => {
      await expect(
        quizService.createItem({
          question: '  dedup   TEST: what IS 2 + 2?  ',
          chapterId: chapter1Id,
          level: 'easy',
          options: ['3', '4', '5', '6'],
          correctLetter: 'B',
          correctAnswer: '4',
        })
      ).rejects.toThrow(ConflictException);
      await expect(
        quizService.createItem({
          question: '  dedup   TEST: what IS 2 + 2?  ',
          chapterId: chapter1Id,
          level: 'easy',
          options: ['3', '4', '5', '6'],
          correctLetter: 'B',
          correctAnswer: '4',
        })
      ).rejects.toThrow(/Duplicate question detected: ".*" already exists in chapter/);
    });

    it('allows the same question text in a different chapter', async () => {
      const saved = (await quizService.createItem({
        question: 'Dedup Test: What is 2 + 2?',
        chapterId: chapter2Id,
        level: 'easy',
        options: ['3', '4', '5', '6'],
        correctLetter: 'B',
        correctAnswer: '4',
      })) as Question;
      expect(saved.chapterId).toBe(chapter2Id);
    });

    it('rejects an edit that would duplicate another question in the same chapter', async () => {
      const created = (await quizService.createItem({
        question: 'Dedup Test: unique question for edit test',
        chapterId: chapter1Id,
        level: 'easy',
        options: ['a', 'b'],
        correctLetter: 'A',
        correctAnswer: 'a',
      })) as Question;

      await expect(
        quizService.updateItem(created.id, { question: 'Dedup Test: What is 2 + 2?' })
      ).rejects.toThrow(ConflictException);

      // Editing to a unique text still works and re-hashes.
      const updated = (await quizService.updateItem(created.id, {
        question: 'Dedup Test: edited to a unique text',
      })) as Question;
      expect(updated.question).toBe('Dedup Test: edited to a unique text');
    });
  });

  describe('bulk import (importItems / processImportChunk)', () => {
    it('skips duplicates against the DB and within the batch, keeping the first occurrence', async () => {
      const result = await quizService.createQuestionsBulkFromImport({
        subjectName,
        questions: [
          {
            question: 'Dedup Test: batch question one',
            chapterName: 'Dedup Ch 1',
            optionA: 'a',
            optionB: 'b',
            correctAnswer: 'a',
            level: 'easy',
          },
          // Intra-batch duplicate (different case/spacing) → skipped, points at Row 1.
          {
            question: 'dedup test: BATCH  QUESTION ONE',
            chapterName: 'Dedup Ch 1',
            optionA: 'a',
            optionB: 'b',
            correctAnswer: 'a',
            level: 'easy',
          },
          // Duplicate of the manual question created in chapter 1 earlier.
          {
            question: 'Dedup Test: What is 2 + 2?',
            chapterName: 'Dedup Ch 1',
            optionA: '3',
            optionB: '4',
            correctAnswer: 'a',
            level: 'easy',
          },
          // Fresh row → created.
          {
            question: 'Dedup Test: batch question two',
            chapterName: 'Dedup Ch 1',
            optionA: 'x',
            optionB: 'y',
            correctAnswer: 'b',
            level: 'easy',
          },
        ],
      });

      expect(result.count).toBe(2);
      expect(result.duplicates).toHaveLength(2);

      const intraBatch = result.duplicates.find((d) => d.row === 2);
      expect(intraBatch).toBeDefined();
      expect(intraBatch!.duplicateOfRow).toBe(1);

      const vsDb = result.duplicates.find((d) => d.row === 3);
      expect(vsDb).toBeDefined();
      expect(vsDb!.duplicateOfRow).toBeUndefined();
      expect(vsDb!.question.toLowerCase()).toContain('what is 2 + 2?');

      expect(result.errors.filter((e) => e.includes('Duplicate question'))).toHaveLength(2);

      // Only the two fresh rows must exist for these texts in chapter 1.
      const repo = dataSource.getRepository(Question);
      const inCh1 = await repo.find({ where: { chapterId: chapter1Id } });
      const matching = inCh1.filter((q) => q.question.startsWith('Dedup Test: batch question'));
      expect(matching).toHaveLength(2);
    });
  });

  describe('riddle-mcq', () => {
    it('single create rejects duplicates within the subject', async () => {
      const dto = {
        question: 'Dedup Test: riddle with a twist',
        subjectId: riddleSubjectId,
        level: 'easy' as const,
        options: ['a', 'b'],
        correctLetter: 'A',
      };
      const created = await riddleQuestions.createRiddle(dto as any);
      expect(created.id).toBeDefined();

      await expect(
        riddleQuestions.createRiddle({
          ...dto,
          question: '  dedup test: RIDDLE  with a twist ',
        } as any)
      ).rejects.toThrow(/Duplicate question detected/);
    });

    it('bulk import skips duplicates (DB and intra-batch) and reports them', async () => {
      // First import: row 2 duplicates row 1 inside the batch; twist/bulk-two are fresh.
      const result = await riddleImport.createRiddlesBulk([
        {
          question: 'Dedup Test: bulk riddle one',
          subjectName,
          level: 'easy',
          options: ['a', 'b'],
          correctLetter: 'A',
        },
        {
          question: 'dedup test: BULK RIDDLE  ONE',
          subjectName,
          level: 'easy',
          options: ['a', 'b'],
          correctLetter: 'A',
        },
        {
          question: 'Dedup Test: bulk riddle two',
          subjectName,
          level: 'easy',
          options: ['a', 'b'],
          correctLetter: 'A',
        },
      ]);

      expect(result.count).toBe(2);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].row).toBe(2);
      expect(result.duplicates[0].duplicateOfRow).toBe(1);
      expect(result.errors.filter((e) => e.includes('Duplicate question'))).toHaveLength(1);

      // Second import of the same rows: everything is now a DB duplicate.
      const second = await riddleImport.createRiddlesBulk([
        {
          question: 'Dedup Test: bulk riddle one',
          subjectName,
          level: 'easy',
          options: ['a', 'b'],
          correctLetter: 'A',
        },
        {
          question: '  DEDUP test: bulk riddle TWO ',
          subjectName,
          level: 'easy',
          options: ['a', 'b'],
          correctLetter: 'A',
        },
      ]);

      expect(second.count).toBe(0);
      expect(second.duplicates).toHaveLength(2);
      expect(second.duplicates.every((d) => d.duplicateOfRow === undefined)).toBe(true);

      const riddles = await dataSource.getRepository(RiddleMcq).find({
        where: { subjectId: riddleSubjectId },
      });
      const bulkOnes = riddles.filter((r) => r.question.startsWith('Dedup Test: bulk riddle'));
      expect(bulkOnes).toHaveLength(0); // they live under the import-created subject
    });
  });
});
