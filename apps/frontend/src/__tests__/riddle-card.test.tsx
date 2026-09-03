/**
 * RiddleCard level-format tests (plan/03-riddle-mcq.md P2): easy/medium/hard
 * slice their option counts, expert renders the text input, and answer
 * selection routes through onSelectAnswer.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';

import { RiddleCard, type RiddleCardRef } from '@/app/riddle-mcq/components/RiddleCard';
import { adaptRiddleMcq } from '@/types/riddles';
import type { Riddle } from '@/types/riddles';

const makeRiddle = (overrides: Partial<Riddle> = {}): Riddle =>
  ({
    id: 'r1',
    question: 'What has keys but opens no locks?',
    options: ['A piano', 'A door', 'A car', 'A bird'],
    correctOption: 'A',
    correctLetter: 'A',
    correctAnswer: 'A piano',
    difficulty: 'easy',
    level: 'easy',
    chapter: 'Logic',
    chapterId: 's1',
    status: 'published',
    hint: '',
    explanation: '',
    ...overrides,
  }) as Riddle;

const renderCard = (riddle: Riddle, onSelect = jest.fn()) =>
  render(
    <RiddleCard
      riddle={riddle}
      riddleNumber={1}
      totalRiddles={5}
      selectedAnswer={null}
      onSelectAnswer={onSelect}
    />
  );

describe('RiddleCard — level-format behavior', () => {
  it('easy shows 2 options', () => {
    renderCard(makeRiddle());
    expect(screen.getByText('A piano')).toBeInTheDocument();
    expect(screen.getByText('A door')).toBeInTheDocument();
    expect(screen.queryByText('A car')).not.toBeInTheDocument();
  });

  it('hard shows 3 options', () => {
    renderCard(makeRiddle({ difficulty: 'hard', level: 'hard' }));
    expect(screen.getByText('A car')).toBeInTheDocument();
    expect(screen.queryByText('A bird')).not.toBeInTheDocument();
  });

  it('expert (mapped to extreme) renders the text input instead of options', () => {
    renderCard(
      makeRiddle({
        difficulty: 'expert',
        level: 'extreme',
        options: null,
        correctLetter: null,
      })
    );
    expect(screen.getByLabelText('Type your answer')).toBeInTheDocument();
    expect(screen.queryByText('A piano')).not.toBeInTheDocument();
  });

  it('clicking an option fires onSelectAnswer with its letter', () => {
    const onSelect = jest.fn();
    renderCard(makeRiddle(), onSelect);
    fireEvent.click(screen.getByText('A piano'));
    expect(onSelect).toHaveBeenCalledWith('A');
  });

  it('exposes clearBubbles through the ref', () => {
    const ref = createRef<RiddleCardRef>();
    render(
      <RiddleCard
        ref={ref}
        riddle={makeRiddle()}
        riddleNumber={1}
        totalRiddles={1}
        selectedAnswer={null}
        onSelectAnswer={jest.fn()}
      />
    );
    expect(typeof ref.current?.clearBubbles).toBe('function');
    expect(() => ref.current?.clearBubbles()).not.toThrow();
  });
});

describe('adaptRiddleMcq — level mapping', () => {
  it('maps expert (free-text) to the extreme AnswerOptions level', () => {
    const adapted = adaptRiddleMcq({
      id: 'x',
      question: 'q',
      options: null,
      correctLetter: null,
      correctAnswer: 'stone',
      level: 'expert',
    } as never);
    expect(adapted.level).toBe('extreme');
    expect(adapted.difficulty).toBe('expert');
  });

  it('keeps MCQ levels as-is', () => {
    const adapted = adaptRiddleMcq({
      id: 'y',
      question: 'q',
      options: ['a', 'b'],
      correctLetter: 'A',
      correctAnswer: 'a',
      level: 'medium',
    } as never);
    expect(adapted.level).toBe('medium');
  });
});
