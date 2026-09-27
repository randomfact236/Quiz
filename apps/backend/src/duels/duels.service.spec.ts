import { BadRequestException } from '@nestjs/common';

import { DuelsService } from './duels.service';

/**
 * plan/18 §10 step 6 — unit specs for the duels module (previously none;
 * audit BE-11 PARTIAL). Repositories are faked and the service constructed
 * directly (house style: analytics.service.spec.ts). The critical behaviors:
 * server-side grading (letters AND extreme open text), the answer reveal
 * payload, the 30-second silence void, TTL expiry and code-collision retry.
 */
describe('DuelsService', () => {
  let matches: Record<string, jest.Mock>;
  let participants: Record<string, jest.Mock>;
  let questions: Record<string, jest.Mock>;
  let guests: Record<string, jest.Mock>;
  let riddles: Record<string, jest.Mock>;
  let imageRiddles: Record<string, jest.Mock>;
  let service: DuelsService;

  const runningMatch = {
    id: 'm1',
    code: 'ABC234',
    level: 'medium',
    contentType: 'quiz',
    questionIds: ['q1', 'q2'],
    status: 'running',
    expiresAt: new Date(Date.now() + 60_000),
  };

  const meRow = {
    id: 'p1',
    matchId: 'm1',
    guestId: 'guest-1',
    playerName: 'Me',
    completedCount: 0,
    correctCount: 0,
    score: 0,
  };

  const mcqQuestion = {
    id: 'q1',
    correctLetter: 'B',
    correctAnswer: 'Paris',
    explanation: 'Capital of France',
    level: 'medium',
  };

  beforeEach(() => {
    matches = {
      findOne: jest.fn().mockResolvedValue(runningMatch),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation(async (x) => x),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockResolvedValue(undefined),
    };
    participants = {
      findOne: jest.fn().mockResolvedValue(meRow),
      find: jest.fn().mockResolvedValue([meRow]),
      save: jest.fn().mockImplementation(async (x) => x),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(1),
      query: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    questions = {
      findOne: jest.fn().mockResolvedValue(mcqQuestion),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    guests = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (x) => x),
      create: jest.fn().mockImplementation((x) => x),
      update: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([{ count: 0 }]),
    };
    riddles = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    imageRiddles = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    service = new DuelsService(
      matches as any,
      participants as any,
      questions as any,
      guests as any,
      riddles as any,
      imageRiddles as any
    );
  });

  // ---- grading -----------------------------------------------------------

  it('grades an MCQ letter pick and returns the post-answer reveal', async () => {
    const result = await service.gradeAnswer('ABC234', 'guest-1', {
      questionId: 'q1',
      selected: 'B',
    });

    expect(result.correct).toBe(true);
    expect(result.completed).toBe(1);
    expect(result.correctAnswer).toBe('Paris');
    expect(result.explanation).toBe('Capital of France');
    expect(participants.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ completedCount: 1, correctCount: 1, score: 1 })
    );
  });

  it('grades a wrong MCQ pick without crediting the score', async () => {
    const result = await service.gradeAnswer('ABC234', 'guest-1', {
      questionId: 'q1',
      selected: 'A',
    });

    expect(result.correct).toBe(false);
    expect(participants.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ completedCount: 1, correctCount: 0, score: 0 })
    );
  });

  it('grades an extreme open answer by trimmed, case-folded text', async () => {
    questions.findOne.mockResolvedValue({
      ...mcqQuestion,
      correctLetter: null,
      correctAnswer: '  The Sun ',
      explanation: null,
    });

    const result = await service.gradeAnswer('ABC234', 'guest-1', {
      questionId: 'q1',
      selected: 'the sun',
    });

    expect(result.correct).toBe(true);
    expect(result.correctAnswer).toBe('  The Sun ');
    expect(result.explanation).toBeNull();
  });

  it('rejects answers for questions outside the frozen set', async () => {
    await expect(
      service.gradeAnswer('ABC234', 'guest-1', { questionId: 'other', selected: 'A' })
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects answers from guests who are not participants', async () => {
    participants.findOne.mockResolvedValue(null);
    await expect(
      service.gradeAnswer('ABC234', 'stranger', { questionId: 'q1', selected: 'B' })
    ).rejects.toThrow();
  });

  // ---- creation ------------------------------------------------------------

  it('filters by subject only when a subjectId is given (plan/18 step 5)', async () => {
    const qb: Record<string, jest.Mock> = {};
    ['where', 'andWhere', 'innerJoin', 'orderBy', 'limit'].forEach((k) => {
      qb[k] = jest.fn().mockReturnThis();
    });
    qb.getMany = jest.fn().mockResolvedValue([{ id: 'q1' }, { id: 'q2' }]);
    questions.createQueryBuilder.mockReturnValue(qb);
    matches.findOne.mockResolvedValue(null); // no code clash
    matches.save.mockImplementation(async (x) => ({ ...x, id: 'm-new', code: x.code }));

    await service.createMatch({
      level: 'medium',
      questionCount: 2,
      playerName: 'Me',
      guestId: 'guest-1',
      subjectId: 'sub-1',
    });

    expect(qb.innerJoin).toHaveBeenCalledWith('q.chapter', 'ch');
    expect(qb.andWhere).toHaveBeenCalledWith('ch.subjectId = :subjectId', { subjectId: 'sub-1' });
    expect(matches.create).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: 'sub-1', level: 'medium' })
    );
  });

  it('creates without the subject join when no subjectId is given', async () => {
    const qb: Record<string, jest.Mock> = {};
    ['where', 'andWhere', 'innerJoin', 'orderBy', 'limit'].forEach((k) => {
      qb[k] = jest.fn().mockReturnThis();
    });
    qb.getMany = jest.fn().mockResolvedValue([{ id: 'q1' }]);
    questions.createQueryBuilder.mockReturnValue(qb);
    matches.findOne.mockResolvedValue(null);
    matches.save.mockImplementation(async (x) => ({ ...x, id: 'm-new', code: x.code }));

    await service.createMatch({
      level: 'easy',
      questionCount: 3,
      playerName: 'Me',
      guestId: 'guest-1',
    });

    expect(qb.innerJoin).not.toHaveBeenCalled();
    expect(matches.create).toHaveBeenCalledWith(expect.objectContaining({ subjectId: null }));
  });

  it('retries code generation once when a clash is found', async () => {
    const qb: Record<string, jest.Mock> = {};
    ['where', 'andWhere', 'innerJoin', 'orderBy', 'limit'].forEach((k) => {
      qb[k] = jest.fn().mockReturnThis();
    });
    qb.getMany = jest.fn().mockResolvedValue([{ id: 'q1' }]);
    questions.createQueryBuilder.mockReturnValue(qb);
    // First lookup: any generated code clashes; second: free.
    matches.findOne.mockResolvedValueOnce({ id: 'clash' }).mockResolvedValueOnce(null);
    matches.save.mockImplementation(async (x) => ({ ...x, id: 'm-new' }));

    await service.createMatch({
      level: 'easy',
      questionCount: 3,
      playerName: 'Me',
      guestId: 'guest-1',
    });

    expect(matches.findOne).toHaveBeenCalledTimes(2);
    expect(matches.save).toHaveBeenCalled();
  });

  // ---- riddle + image-riddle families (plan/18 phase 2) --------------------

  it('grades a riddle MCQ by letter and reveals the option text', async () => {
    matches.findOne.mockResolvedValue({ ...runningMatch, contentType: 'riddle' });
    riddles.findOne.mockResolvedValue({
      id: 'r1',
      correctLetter: 'C',
      options: ['a', 'b', 'c-option', 'd'],
      answer: null,
      explanation: 'Because c.',
    });

    const result = await service.gradeAnswer('ABC234', 'guest-1', {
      questionId: 'q1',
      selected: 'C',
    });

    expect(result.correct).toBe(true);
    expect(result.correctAnswer).toBe('c-option');
    expect(result.explanation).toBe('Because c.');
  });

  it('grades an open riddle by its text answer, trimmed and case-folded', async () => {
    matches.findOne.mockResolvedValue({ ...runningMatch, contentType: 'riddle' });
    riddles.findOne.mockResolvedValue({
      id: 'r2',
      correctLetter: null,
      options: null,
      answer: '  Towel  ',
      explanation: 'Classic.',
    });

    const result = await service.gradeAnswer('ABC234', 'guest-1', {
      questionId: 'q1',
      selected: 'towel',
    });

    expect(result.correct).toBe(true);
    expect(result.correctAnswer).toBe('  Towel  ');
  });

  it('grades an image riddle accepting its alias answers', async () => {
    matches.findOne.mockResolvedValue({ ...runningMatch, contentType: 'image-riddle' });
    imageRiddles.findOne.mockResolvedValue({
      id: 'i1',
      answer: 'Elephant',
      alternativeAnswers: ['an elephant', 'grey giant'],
    });

    const alias = await service.gradeAnswer('ABC234', 'guest-1', {
      questionId: 'q1',
      selected: '  An Elephant ',
    });
    const wrong = await service.gradeAnswer('ABC234', 'guest-1', {
      questionId: 'q1',
      selected: 'rhino',
    });

    expect(alias.correct).toBe(true);
    expect(alias.correctAnswer).toBe('Elephant');
    expect(wrong.correct).toBe(false);
  });

  it('draws riddle matches from the riddle table with the subject filter', async () => {
    const qb: Record<string, jest.Mock> = {};
    ['where', 'andWhere', 'orderBy', 'limit'].forEach((k) => {
      qb[k] = jest.fn().mockReturnThis();
    });
    qb.getMany = jest.fn().mockResolvedValue([{ id: 'r1' }]);
    riddles.createQueryBuilder.mockReturnValue(qb);
    matches.findOne.mockResolvedValue(null);
    matches.save.mockImplementation(async (x) => ({ ...x, id: 'm-new' }));

    await service.createMatch({
      level: 'expert',
      questionCount: 5,
      playerName: 'Me',
      guestId: 'guest-1',
      contentType: 'riddle',
      subjectId: 'subj-9',
    });

    expect(riddles.createQueryBuilder).toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalledWith('r.subjectId = :subjectId', { subjectId: 'subj-9' });
    expect(matches.create).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'riddle' }));
  });

  // ---- resolution ----------------------------------------------------------

  it('voids a running match when a participant went silent >30s', async () => {
    // Heartbeat UPDATE (no rows) vs the silence SELECT (one silent row).
    participants.query.mockImplementation((sql: string) =>
      sql.includes('COUNT') ? Promise.resolve([{ count: 1 }]) : Promise.resolve([])
    );

    await service.pollMatch('ABC234', 'guest-1');

    expect(matches.update).toHaveBeenCalledWith('m1', { status: 'abandoned' });
  });

  it('keeps a live match when every participant has polled recently', async () => {
    participants.query.mockImplementation((sql: string) =>
      sql.includes('COUNT') ? Promise.resolve([{ count: 0 }]) : Promise.resolve([])
    );

    const view = (await service.pollMatch('ABC234', 'guest-1')) as { reveal?: unknown };

    // No VOID update (match-id criteria) — the TTL sweep (criteria object) is
    // a different call and always runs.
    expect(matches.update).not.toHaveBeenCalledWith('m1', expect.anything());
    // While running, no per-question reveal may ship (plan/18 §10 step 4).
    expect(view.reveal).toBeUndefined();
  });

  it('attaches the per-question reveal only once the match resolves', async () => {
    participants.query.mockImplementation((sql: string) =>
      sql.includes('COUNT') ? Promise.resolve([{ count: 0 }]) : Promise.resolve([])
    );
    const finished = { ...runningMatch, status: 'finished' };
    matches.findOne.mockResolvedValue(finished);
    questions.find.mockResolvedValue([
      {
        id: 'q1',
        question: 'Capital of France?',
        options: ['London', 'Paris'],
        level: 'medium',
        correctAnswer: 'Paris',
        correctLetter: 'B',
        explanation: 'It is Paris.',
      },
    ]);

    const view = (await service.pollMatch('ABC234', 'guest-1')) as {
      reveal?: { id: string; correctLetter: string | null; explanation: string | null }[];
    };

    expect(view.reveal).toHaveLength(1);
    expect(view.reveal?.[0]).toMatchObject({
      id: 'q1',
      correctLetter: 'B',
      explanation: 'It is Paris.',
    });
  });

  it('expires stale waiting/running matches on lookup (TTL)', async () => {
    await service.pollMatch('ABC234', 'guest-1');
    // expireStaleMatches runs before every code lookup.
    expect(matches.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.anything(), expiresAt: expect.anything() }),
      { status: 'abandoned' }
    );
  });
});
