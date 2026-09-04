/**
 * ============================================================================
 * JokeCommentsModal — punchline reveal in the header (jokes UX)
 * ============================================================================
 * Commenters need the punchline visible without closing the modal and
 * flipping the card. One-liners carry no separate punchline, so the reveal
 * affordance must not render at all for them.
 * ============================================================================
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import JokeCommentsModal from '@/components/jokes/JokeCommentsModal';

jest.mock('@/lib/comments-api', () => ({
  getComments: jest.fn().mockResolvedValue({ items: [] }),
  postComment: jest.fn(),
  deleteMyComment: jest.fn(),
}));

jest.mock('@/lib/guest-id', () => ({
  getGuestName: jest.fn().mockReturnValue('Tester'),
  setGuestName: jest.fn(),
}));

describe('JokeCommentsModal — punchline reveal', () => {
  it('reveals the punchline in the header on demand', async () => {
    render(
      <JokeCommentsModal
        jokeId="j1"
        jokeSetup="Why did the golfer bring two pairs of pants?"
        jokePunchline="In case he got a hole in one!"
        onClose={jest.fn()}
      />
    );

    // Hidden until asked for.
    expect(screen.queryByText(/In case he got a hole in one!/)).not.toBeInTheDocument();
    const show = screen.getByRole('button', { name: 'Show punchline' });
    fireEvent.click(show);

    await waitFor(() => {
      expect(screen.getByText(/In case he got a hole in one!/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Show punchline' })).not.toBeInTheDocument();
  });

  it('offers no reveal for one-liners (no separate punchline)', async () => {
    render(<JokeCommentsModal jokeId="j2" jokeSetup="erfrfreggr grr" onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/No replies yet/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Show punchline' })).not.toBeInTheDocument();
  });

  it('starts hidden again on a fresh mount (modal is remounted per joke)', async () => {
    const { unmount } = render(
      <JokeCommentsModal
        jokeId="j3"
        jokeSetup="Setup"
        jokePunchline="Punchline"
        onClose={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show punchline' }));
    await waitFor(() => expect(screen.getByText(/Punchline/)).toBeInTheDocument());
    unmount();

    render(
      <JokeCommentsModal
        jokeId="j4"
        jokeSetup="Setup"
        jokePunchline="Punchline"
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Show punchline' })).toBeInTheDocument();
    expect(screen.queryByText(/Punchline/)).not.toBeInTheDocument();
  });
});
