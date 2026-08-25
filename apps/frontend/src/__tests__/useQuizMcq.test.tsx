/**
 * ============================================================================
 * useQuizMcq engine regression tests
 * ============================================================================
 * Covers the quality-gate refactor:
 *  - single completion save path (no double-save under rerenders)
 *  - progress + achievements wired on completion
 *  - resume round-trip restores index/answers/score (two-key store)
 *  - pause/resume transitions
 *  - addMoreQuestions clamps to the available pool
 * ============================================================================
 */

import { renderHook, act, waitFor } from '@testing-library/react';

import { useQuizMcq } from '@/hooks/useQuizMcq';
import type { QuizQuestion } from '@/lib/quiz-mcq-api';

jest.mock('@/lib/quiz-mcq-api');
jest.mock('@/lib/quiz-mcq-resume');
jest.mock('@/lib/progress', () => ({
  saveQuizResult: jest.fn(),
}));
jest.mock('@/lib/achievements', () => ({
  checkAchievements: jest.fn(() => []),
  toastAchievementUnlocks: jest.fn(),
}));

import { saveQuizResult } from '@/lib/progress';
import { loadQuizResume, clearQuizResume, isQuizResumeMatch } from '@/lib/quiz-mcq-resume';

const mockGetSubjectBySlug = require('@/lib/quiz-mcq-api').getSubjectBySlug as jest.Mock;
const mockGetSubjectRandomQuestions = require('@/lib/quiz-mcq-api')
  .getSubjectRandomQuestions as jest.Mock;
const mockGetSubjectMeta = require('@/lib/quiz-mcq-api').getSubjectMeta as jest.Mock;

const mockLoadQuizResume = loadQuizResume as jest.Mock;
const mockIsQuizResumeMatch = isQuizResumeMatch as jest.Mock;

function apiQuestion(id: string): QuizQuestion {
  return {
    id,
    question: `Q ${id}`,
    options: ['opt A', 'opt B', 'opt C', 'opt D'],
    correctAnswer: 'opt A',
    correctLetter: 'A',
    level: 'easy',
    chapterId: 'ch1',
    status: 'published',
  };
}

function setupApi(questionCount = 3) {
  const data = Array.from({ length: questionCount }, (_, i) => apiQuestion(`q${i + 1}`));
  mockGetSubjectBySlug.mockResolvedValue({
    id: 'sub1',
    slug: 'science',
    name: 'Science',
    chapters: [{ id: 'ch1', name: 'Physics' }],
  });
  mockGetSubjectRandomQuestions.mockResolvedValue({ data, total: data.length });
  mockGetSubjectMeta.mockResolvedValue({ name: 'Science', emoji: '🔬', slug: 'science' });
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockLoadQuizResume.mockReturnValue(null);
  mockIsQuizResumeMatch.mockReturnValue(false);
  setupApi();
});

async function renderPlayingHook() {
  const utils = renderHook(() =>
    useQuizMcq('science', 'Physics', 'easy', undefined, undefined, null, null, 'normal')
  );
  await waitFor(() => expect(utils.result.current.status).toBe('playing'));
  return utils;
}

describe('useQuizMcq engine', () => {
  it('loads questions and reaches playing state', async () => {
    const { result } = await renderPlayingHook();

    expect(result.current.questions).toHaveLength(3);
    expect(result.current.totalQuestions).toBeGreaterThan(0);
    expect(mockGetSubjectRandomQuestions).toHaveBeenCalled();
  });

  it('saves completion exactly once despite rerenders (single save path)', async () => {
    const { result, rerender } = await renderPlayingHook();

    // Answer every question correctly (all fixtures are letter A)
    for (let i = 0; i < result.current.questions.length; i++) {
      act(() => {
        result.current.selectAnswer('A');
      });
      if (i < result.current.questions.length - 1) {
        act(() => {
          result.current.goToNext();
        });
      }
    }

    act(() => {
      result.current.submitQuiz();
    });

    expect(result.current.status).toBe('completed');
    const callsAfterSubmit = (saveQuizResult as jest.Mock).mock.calls.length;
    expect(callsAfterSubmit).toBe(1);

    // StrictMode-style double renders must not double-save
    rerender();
    rerender();
    act(() => {});
    expect(saveQuizResult).toHaveBeenCalledTimes(1);
    expect(clearQuizResume).toHaveBeenCalled();
  });

  it('wires progress and achievements on completion', async () => {
    const { toastAchievementUnlocks } = require('@/lib/achievements');
    const { result } = await renderPlayingHook();

    result.current.questions.forEach((_, i) => {
      act(() => {
        result.current.selectAnswer('A');
      });
      if (i < result.current.questions.length - 1) {
        act(() => {
          result.current.goToNext();
        });
      }
    });
    act(() => {
      result.current.submitQuiz();
    });

    expect(saveQuizResult).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'science', chapter: 'Physics' })
    );
    expect(toastAchievementUnlocks).toHaveBeenCalled();
  });

  it('resume round-trip restores index, answers, score, and question subset', async () => {
    const q1 = apiQuestion('q1');
    const q2 = apiQuestion('q2');
    const q3 = apiQuestion('q3');

    mockLoadQuizResume.mockReturnValue({
      subject: 'science',
      chapter: 'Physics',
      level: 'easy',
      mode: 'normal',
      currentQuestionIndex: 1,
      sessionSize: 2,
      answers: { q1: 'B' },
      score: 1,
      manuallySkipped: ['q2'],
      startedAt: new Date().toISOString(),
      availableQuestions: [q1, q2, q3],
    });
    mockIsQuizResumeMatch.mockReturnValue(true);

    const { result } = renderHook(() =>
      useQuizMcq('science', 'Physics', 'easy', undefined, undefined, null, null, 'normal')
    );

    // Resume prompt shown instead of auto-loading
    await waitFor(() => expect(result.current.showResumePrompt).toBe(true));
    expect(result.current.pendingResumeState?.answers).toEqual({ q1: 'B' });
    expect(result.current.status).not.toBe('playing');

    act(() => {
      result.current.handleResumeSession();
    });

    expect(result.current.status).toBe('playing');
    expect(result.current.availableQuestions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
    expect(result.current.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
    expect(result.current.sessionSize).toBe(2);
    expect(result.current.currentQuestionIndex).toBe(1);
    expect(result.current.answers).toEqual({ q1: 'B' });
    expect(result.current.score).toBe(1);
    expect(result.current.manuallySkipped.has('q2')).toBe(true);
  });

  it('pause/resume toggles status without losing progress', async () => {
    const { result } = await renderPlayingHook();

    act(() => {
      result.current.pauseQuiz();
    });
    expect(result.current.status).toBe('paused');

    act(() => {
      result.current.resumeQuiz();
    });
    expect(result.current.status).toBe('playing');
  });

  it('addMoreQuestions clamps to the available pool', async () => {
    const q1 = apiQuestion('q1');
    const q2 = apiQuestion('q2');
    const q3 = apiQuestion('q3');

    mockLoadQuizResume.mockReturnValue({
      subject: 'science',
      chapter: 'Physics',
      level: 'easy',
      mode: 'normal',
      currentQuestionIndex: 0,
      sessionSize: 2,
      answers: {},
      score: 0,
      manuallySkipped: [],
      startedAt: new Date().toISOString(),
      availableQuestions: [q1, q2, q3],
    });
    mockIsQuizResumeMatch.mockReturnValue(true);

    const { result } = renderHook(() =>
      useQuizMcq('science', 'Physics', 'easy', undefined, undefined, null, null, 'normal')
    );
    await waitFor(() => expect(result.current.showResumePrompt).toBe(true));
    act(() => {
      result.current.handleResumeSession();
    });
    expect(result.current.sessionSize).toBe(2);

    act(() => {
      result.current.addMoreQuestions(50); // way over the pool of 3
    });
    expect(result.current.sessionSize).toBe(3);
    expect(result.current.questions).toHaveLength(3);
  });
});
