import { ContentStatus } from '../common/enums/content-status.enum';
import { QuizMcqService } from './quiz-mcq.service';

/**
 * Unit tests for the CSV/JSON bulk-import row → question normalization
 * (buildImportItem / getImportRowTaxonomy). These are pure functions on the
 * service; repository/cache dependencies are unused for them, so the service
 * is instantiated with null dependencies.
 */
describe('QuizMcqService — bulk import row normalization', () => {
  let service: any;

  beforeAll(() => {
    const Ctor = QuizMcqService as unknown as new (...args: unknown[]) => QuizMcqService;
    service = new Ctor(null, null, null, null, null, null, null);
  });

  describe('buildImportItem', () => {
    const ids = { chapterId: 'chapter-1' };

    it('maps the correctAnswer letter to the matching option', () => {
      const item = service.buildImportItem(
        {
          question: 'What is 2 + 2?',
          optionA: '3',
          optionB: '4',
          optionC: '5',
          optionD: '6',
          correctAnswer: 'b',
          level: 'easy',
        },
        ids,
        0
      );

      expect(item).toMatchObject({
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctLetter: 'B',
        correctAnswer: '4',
        level: 'easy',
        status: ContentStatus.PUBLISHED,
        chapterId: 'chapter-1',
        order: 0,
      });
    });

    it('defaults to letter A when correctAnswer is missing', () => {
      const item = service.buildImportItem(
        { question: 'Q?', optionA: 'one', optionB: 'two' },
        ids,
        1
      );

      expect(item.correctLetter).toBe('A');
      expect(item.correctAnswer).toBe('one');
    });

    it('falls back to letter A (and its option) for an out-of-range letter', () => {
      const item = service.buildImportItem(
        { question: 'Q?', optionA: 'one', optionB: 'two', correctAnswer: 'Z' },
        ids,
        2
      );

      expect(item.correctLetter).toBe('A');
      expect(item.correctAnswer).toBe('one');
    });

    it('handles extreme level: no options, free-text correctAnswer', () => {
      const item = service.buildImportItem(
        {
          question: 'Name a prime between 10 and 20.',
          optionA: 'should be dropped',
          correctAnswer: '13',
          level: 'extreme',
        },
        ids,
        3
      );

      expect(item).toMatchObject({
        options: null,
        correctLetter: null,
        correctAnswer: '13',
        level: 'extreme',
      });
    });

    it('rejects an unknown level with an error string', () => {
      const result = service.buildImportItem(
        { question: 'Q?', optionA: 'one', correctAnswer: 'A', level: 'impossible' },
        ids,
        4
      );

      expect(result).toBe("Invalid level 'impossible'");
    });

    it('keeps draft status when the row requests it', () => {
      const item = service.buildImportItem(
        { question: 'Q?', optionA: 'one', correctAnswer: 'A', status: 'draft' },
        ids,
        5
      );

      expect(item.status).toBe(ContentStatus.DRAFT);
    });
  });

  describe('getImportRowTaxonomy', () => {
    it('returns null when question or chapterName is missing', () => {
      expect(service.getImportRowTaxonomy({ question: 'Q?' })).toBeNull();
      expect(service.getImportRowTaxonomy({ chapterName: 'Ch' })).toBeNull();
    });

    it('builds taxonomy from the row, falling back to the default subject', () => {
      expect(
        service.getImportRowTaxonomy({ question: 'Q?', chapterName: 'Ch', subjectName: 'Math' })
      ).toEqual({ subjectName: 'Math', chapterName: 'Ch' });

      expect(
        service.getImportRowTaxonomy({ question: 'Q?', chapterName: 'Ch' }, 'Science')
      ).toEqual({ subjectName: 'Science', chapterName: 'Ch' });
    });
  });
});
