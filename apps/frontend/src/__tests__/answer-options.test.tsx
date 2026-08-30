/**
 * AnswerOptions component tests (plan/02-mcq-quiz.md P2): level-format forcing
 * and QuestionReview states (correct / incorrect / unanswered / explanation).
 */

import { render, screen, fireEvent } from '@testing-library/react';

import { AnswerOptions } from '@/components/quiz-mcq/AnswerOptions';
import { QuestionReview } from '@/components/quiz-mcq/QuestionReview';
import type { Question } from '@/types/quiz-mcq';

const fourOptions = [
  { key: 'A', text: 'Alpha' },
  { key: 'B', text: 'Beta' },
  { key: 'C', text: 'Gamma' },
  { key: 'D', text: 'Delta' },
];

describe('AnswerOptions — level-format forcing', () => {
  it('easy falls back to True/False when stored options are blank', () => {
    render(
      <AnswerOptions
        options={[
          { key: 'A', text: '' },
          { key: 'B', text: '' },
        ]}
        selectedKey={null}
        onSelect={jest.fn()}
        level="easy"
      />
    );
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });

  it('easy keeps stored options when authored', () => {
    render(
      <AnswerOptions options={fourOptions} selectedKey={null} onSelect={jest.fn()} level="easy" />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });

  it.each([
    ['medium', 2],
    ['hard', 3],
    ['expert', 4],
  ] as const)('%s slices to %i options', (level, count) => {
    render(
      <AnswerOptions options={fourOptions} selectedKey={null} onSelect={jest.fn()} level={level} />
    );
    expect(screen.getAllByRole('radio')).toHaveLength(count);
  });

  it('extreme renders a text input + submit, and fires onSelect with the typed answer', () => {
    const onSelect = jest.fn();
    render(<AnswerOptions options={[]} selectedKey={null} onSelect={onSelect} level="extreme" />);
    const input = screen.getByLabelText('Type your answer');
    fireEvent.change(input, { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Submit Answer'));
    expect(onSelect).toHaveBeenCalledWith('Paris');
  });
});

describe('QuestionReview — answer states', () => {
  const baseQuestion = {
    id: 'q1',
    question: 'Capital of France?',
    optionA: 'Paris',
    optionB: 'London',
    optionC: '',
    optionD: '',
    correctAnswer: 'Paris',
    correctLetter: 'A',
    level: 'easy',
    chapter: 'c1',
    status: 'published',
  } as unknown as Question;

  it('renders correct state (green)', () => {
    const { container } = render(
      <QuestionReview question={baseQuestion} userAnswer="A" questionNumber={1} />
    );
    expect(container.querySelector('.border-green-200')).not.toBeNull();
    expect(container.querySelector('.border-red-200')).toBeNull();
  });

  it('renders incorrect state (red)', () => {
    const { container } = render(
      <QuestionReview question={baseQuestion} userAnswer="B" questionNumber={1} />
    );
    expect(container.querySelector('.border-red-200')).not.toBeNull();
  });

  it('renders unanswered state (amber), distinct from incorrect', () => {
    const { container } = render(
      <QuestionReview question={baseQuestion} userAnswer="" questionNumber={1} />
    );
    expect(container.querySelector('.border-amber-200')).not.toBeNull();
    expect(container.querySelector('.border-red-200')).toBeNull();
  });

  it('shows the explanation block when present', () => {
    const { container } = render(
      <QuestionReview
        question={{ ...baseQuestion, explanation: 'Paris is the capital.' } as Question}
        userAnswer="A"
        questionNumber={1}
      />
    );
    fireEvent.click(container.querySelector('button')!); // expand
    expect(screen.getByText('Explanation:')).toBeInTheDocument();
    expect(screen.getByText('Paris is the capital.')).toBeInTheDocument();
  });
});
