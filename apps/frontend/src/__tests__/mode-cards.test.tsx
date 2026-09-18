/**
 * ModeCards component tests (BUG-003): both mode cards start expanded, and the
 * first header click switches to exclusive accordion behavior — opening one
 * card collapses the other; clicking the open card's header collapses it.
 */

import { render, screen, fireEvent } from '@testing-library/react';

import { ModeCards } from '@/app/components/home/ModeCards';

const timerHeader = () => screen.getByRole('button', { name: /Timer Challenges section/ });
const practiceHeader = () => screen.getByRole('button', { name: /Practice Mode section/ });

describe('ModeCards — accordion behavior', () => {
  it('renders both mode cards expanded by default', () => {
    render(<ModeCards />);
    expect(timerHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(practiceHeader()).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses the other card when one header is clicked', () => {
    render(<ModeCards />);
    fireEvent.click(timerHeader());
    expect(timerHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(practiceHeader()).toHaveAttribute('aria-expanded', 'false');
  });

  it('collapses the clicked card when its header is clicked again', () => {
    render(<ModeCards />);
    fireEvent.click(timerHeader());
    fireEvent.click(timerHeader());
    expect(timerHeader()).toHaveAttribute('aria-expanded', 'false');
    expect(practiceHeader()).toHaveAttribute('aria-expanded', 'false');
  });

  it('switches the open card when the collapsed one is expanded', () => {
    render(<ModeCards />);
    fireEvent.click(practiceHeader());
    expect(practiceHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(timerHeader()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(timerHeader());
    expect(timerHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(practiceHeader()).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders the direct-link tiles without a Quiz card (owner request 2026-09-18)', () => {
    render(<ModeCards />);
    expect(screen.getByRole('link', { name: /Games Brain Exercise/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Riddles Brain Teasers/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Image Riddles Visual Puzzles/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dad Jokes Fun Time/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Quiz Test Your Knowledge/ })
    ).not.toBeInTheDocument();
  });
});
