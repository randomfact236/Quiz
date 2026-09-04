/**
 * useRiddlePlay hook tests (plan/03-riddle-mcq.md P2 #3):
 * - timer auto-submit fires exactly once when the clock hits zero and routes
 *   to the results page
 * - resume round-trip: a matching two-key resume store puts the hook into the
 *   paused dialog, and resumeSession() restores the saved answers into play
 */

import { renderHook, waitFor, act } from '@testing-library/react';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/lib/riddle-mcq-api', () => ({
  getMixedRiddles: jest.fn(async () => [
    {
      id: 'r1',
      question: 'q1',
      options: ['a', 'b'],
      correctAnswer: 'a',
      correctLetter: 'A',
      level: 'easy',
    },
    {
      id: 'r2',
      question: 'q2',
      options: ['a', 'b'],
      correctAnswer: 'b',
      correctLetter: 'B',
      level: 'easy',
    },
    {
      id: 'r3',
      question: 'q3',
      options: ['a', 'b'],
      correctAnswer: 'a',
      correctLetter: 'A',
      level: 'easy',
    },
  ]),
  getRiddlesBySubject: jest.fn(async () => ({ data: [] })),
  getRandomRiddles: jest.fn(async () => []),
}));

jest.mock('@/services/settings.service', () => ({
  SettingsService: { getSettings: jest.fn(async () => ({})) },
}));

jest.mock('@/lib/riddle-persistence', () => {
  const actual = jest.requireActual('@/lib/riddle-persistence');
  return {
    ...actual,
    loadRiddleResume: jest.fn(() => null),
    saveRiddleSession: jest.fn(),
    clearRiddleSession: jest.fn(),
    saveRiddleResume: jest.fn(),
    saveRiddleResumeQuestions: jest.fn(),
    clearRiddleResume: jest.fn(),
  };
});

// Clock stub: once playing, immediately run the timer down to zero.
jest.mock('@/hooks/use-riddle-play/useRiddleTimers', () => {
  const { useEffect } = require('react');
  return {
    useRiddleTimers: ({
      status,
      setTimeRemaining,
    }: {
      status: string;
      setTimeRemaining: (n: number) => void;
    }) => {
      useEffect(() => {
        if (status === 'playing') setTimeRemaining(0);
      }, [status, setTimeRemaining]);
    },
  };
});

jest.mock('@/lib/analytics', () => ({
  track: jest.fn(),
  registerExitHook: jest.fn(() => () => undefined),
}));
jest.mock('@/lib/achievements', () => ({
  checkAchievements: jest.fn(() => []),
  toastAchievementUnlocks: jest.fn(),
}));
jest.mock('@/lib/riddle-progress', () => ({ saveRiddleResult: jest.fn() }));

import { useRiddlePlay } from '@/hooks/use-riddle-play/useRiddlePlay';
import { loadRiddleResume } from '@/lib/riddle-persistence';

describe('useRiddlePlay — timer auto-submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('auto-submits when the timer hits zero and routes to results', async () => {
    const { result } = renderHook(() =>
      useRiddlePlay({ subjectId: 'all', level: 'all', mode: 'timer', chapterNameParam: '' })
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => {
      result.current.beginSession(0);
    });

    // The stubbed clock drops timeRemaining to 0 immediately, so the session
    // transitions playing -> completed within the same flush. Wait on the
    // observable outcome: exactly one redirect to the results page.
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith(expect.stringContaining('/riddle-mcq/results?session='));
    expect(result.current.status).toBe('completed');
  });
});

describe('useRiddlePlay — resume round-trip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('offers the resume dialog for a matching store and restores answers', async () => {
    (loadRiddleResume as jest.Mock).mockReturnValue({
      mode: 'timer',
      subjectId: 'all',
      level: 'all',
      answers: { r1: 'a', r2: 'b' },
      timeRemaining: 30,
      startedAt: new Date().toISOString(),
      availableRiddles: [
        {
          id: 'r1',
          question: 'q1',
          options: ['a', 'b'],
          correctOption: 'A',
          correctLetter: 'A',
          correctAnswer: 'a',
          difficulty: 'easy',
          level: 'easy',
          chapter: 'Mixed',
          chapterId: '',
          status: 'published',
        },
        {
          id: 'r2',
          question: 'q2',
          options: ['a', 'b'],
          correctOption: 'B',
          correctLetter: 'B',
          correctAnswer: 'b',
          difficulty: 'easy',
          level: 'easy',
          chapter: 'Mixed',
          chapterId: '',
          status: 'published',
        },
      ],
    });

    const { result } = renderHook(() =>
      useRiddlePlay({ subjectId: 'all', level: 'all', mode: 'timer', chapterNameParam: '' })
    );

    // Matching identity + non-empty answers -> paused with the dialog up
    await waitFor(() => expect(result.current.status).toBe('paused'));
    expect(result.current.showResumeDialog).toBe(true);

    act(() => {
      result.current.resumeSession();
    });

    // The stubbed clock auto-submits right after play resumes, so wait for the
    // completed state — the restored answers/riddles prove the round-trip.
    await waitFor(() => expect(result.current.status).toBe('completed'));
    expect(result.current.answers).toMatchObject({ r1: 'a', r2: 'b' });
    expect(result.current.riddles).toHaveLength(2);
    expect(push).toHaveBeenCalledWith(expect.stringContaining('/riddle-mcq/results?session='));
  });
});
