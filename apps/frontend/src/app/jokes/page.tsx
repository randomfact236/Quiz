'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';

import { getAllJokes, getJokeCategories, voteJoke, type AdaptedJoke } from '@/lib/jokes-api';
import { getCommentCounts } from '@/lib/comments-api';
import { useSavedItems } from '@/hooks/useSavedItems';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { track } from '@/lib/analytics';
import JokeCommentsModal from '@/components/jokes/JokeCommentsModal';
import ShareMenu from '@/components/share/ShareMenu';

// ─── Types ────────────────────────────────────────────────────────────────────

type Joke = AdaptedJoke;

interface JokeCategory {
  id: string;
  name: string;
  emoji: string;
}

// ─── Constants (outside component to avoid recreation on every render) ────────

const ITEMS_PER_PAGE = 12;

/** Offline fallback categories — real data comes from the API. */
const defaultJokeCategories: JokeCategory[] = [
  { id: '1', name: 'Classic Dad Jokes', emoji: '😂' },
  { id: '2', name: 'Programming Jokes', emoji: '💻' },
  { id: '3', name: 'Parenting Dad Jokes', emoji: '👶' },
  { id: '4', name: 'Work Office Dad Jokes', emoji: '💼' },
];

// ─── Fisher-Yates seeded shuffle (full shuffle, not charCode hack) ─────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    // LCG pseudo-random: produces a different value each iteration
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    const temp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = temp;
  }
  return a;
}

// ─── VoteButtons sub-component (eliminates 4× code duplication) ──────────────

interface VoteButtonsProps {
  jokeId: string;
  likes: number;
  dislikes: number;
  votedJokes: Record<string, 'like' | 'dislike'>;
  disabled?: boolean;
  onVote: (e: React.MouseEvent, jokeId: string, type: 'like' | 'dislike') => void;
  variant?: 'light' | 'dark';
}

function VoteButtons({
  jokeId,
  likes,
  dislikes,
  votedJokes,
  disabled,
  onVote,
  variant = 'light',
}: VoteButtonsProps) {
  const voted = votedJokes[jokeId];
  const base =
    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed';
  const likeActive =
    variant === 'light'
      ? 'bg-orange-100 text-orange-600 shadow-sm ring-1 ring-orange-400 scale-105'
      : 'bg-white text-orange-500 shadow-md scale-105';
  const likeInactive =
    variant === 'light'
      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      : 'bg-black/10 text-white hover:bg-black/20';
  const dislikeActive =
    variant === 'light'
      ? 'bg-red-100 text-red-600 shadow-sm ring-1 ring-red-400 scale-105'
      : 'bg-white text-red-500 shadow-md scale-105';
  const dislikeInactive =
    variant === 'light'
      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      : 'bg-black/10 text-white hover:bg-black/20';

  // Only the *other* button locks after voting — clicking your own vote toggles it off
  const likeLocked = disabled || (!!voted && voted !== 'like');
  const dislikeLocked = disabled || (!!voted && voted !== 'dislike');

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={(e) => onVote(e, jokeId, 'like')}
        disabled={likeLocked}
        aria-pressed={voted === 'like'}
        className={`${base} ${voted === 'like' ? likeActive : likeInactive} ${likeLocked ? 'opacity-50' : ''}`}
        aria-label={`Like this joke. ${likes} likes`}
      >
        <span className="text-sm">👍</span> {likes}
      </button>
      <button
        onClick={(e) => onVote(e, jokeId, 'dislike')}
        disabled={dislikeLocked}
        aria-pressed={voted === 'dislike'}
        className={`${base} ${voted === 'dislike' ? dislikeActive : dislikeInactive} ${dislikeLocked ? 'opacity-50' : ''}`}
        aria-label={`Dislike this joke. ${dislikes} dislikes`}
      >
        <span className="text-sm">👎</span> {dislikes}
      </button>
    </div>
  );
}

// ─── Comments chip (sits beside the vote buttons) ────────────────────────────

function CommentsChip({
  jokeId,
  count,
  onOpen,
  variant = 'light',
}: {
  jokeId: string;
  count: number;
  onOpen: (e: React.MouseEvent, jokeId: string) => void;
  variant?: 'light' | 'dark';
}) {
  return (
    <button
      onClick={(e) => onOpen(e, jokeId)}
      aria-label={`View comments. ${count} comments`}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
        variant === 'light'
          ? 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600'
          : 'bg-black/10 text-white hover:bg-black/20'
      }`}
    >
      <span className="text-sm">💬</span> {count}
    </button>
  );
}

// ─── Toast sub-component ──────────────────────────────────────────────────────

function VoteToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      aria-live="polite"
      role="status"
      className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}

// ─── Skeleton loading placeholders ─────────────────────────────────────────────

function SkeletonCards({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-h-[120px] animate-pulse rounded-2xl bg-white/70 shadow-md"
          aria-hidden="true"
        />
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JokesPage(): JSX.Element {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'unseen' | 'random' | 'top'>('newest');
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [jokeOfTheDay, setJokeOfTheDay] = useState<Joke | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [jokeCategories, setJokeCategories] = useState<JokeCategory[]>(defaultJokeCategories);
  const [loading, setLoading] = useState(true);

  // Seen-joke tracking (improvement plan Workstream C): jokeId → ISO timestamp
  // of first flip. Device-local by design; Joke of the Day is excluded.
  const [seenJokes, setSeenJokes] = useState<Record<string, string>>({});

  // Voting state — use a ref for in-flight guard to avoid stale-closure race condition
  const [votedJokes, setVotedJokes] = useState<Record<string, 'like' | 'dislike'>>({});
  const inFlightVotes = useRef<Set<string>>(new Set());

  // Comments (comments-system plan §4): 💬 counts for card chips + open modal
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentsModalJokeId, setCommentsModalJokeId] = useState<string | null>(null);

  // 🔖 Save — device-local bookmarks, chip on the card corner (stays in sync
  // with the share menu's Save via the saved-items event)
  const { savedMap: savedJokes, toggle: toggleSavedJoke } = useSavedItems('jokes');
  const handleSaveChip = (e: React.MouseEvent, jokeId: string) => {
    e.stopPropagation(); // Prevent card from flipping
    const nowSaved = toggleSavedJoke(jokeId);
    showToast(nowSaved ? '🔖 Saved!' : 'Removed from saved');
  };

  // Toast state
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
  };

  // Measured site-header height drives sticky offsets (replaces magic numbers)
  const [headerHeight, setHeaderHeight] = useState(73);
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const update = () => setHeaderHeight(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Share opens the explicit ShareMenu (FB / X / WhatsApp / LinkedIn /
  // Copy Link / Save) — desktop browsers have no native share sheet.
  const [shareJokeId, setShareJokeId] = useState<string | null>(null);
  const openShare = (e: React.MouseEvent, jokeId: string) => {
    e.stopPropagation(); // Prevent card from flipping
    track('joke_shared', { jokeId }, { module: 'jokes' });
    setShareJokeId(jokeId);
  };

  // Reset to first page when filtering, sorting, or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, sortOrder, searchQuery]);

  const toggleFlip = (id: string, countAsSeen = true) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!countAsSeen) return;
    // First flip only — un-flipping does not un-see
    setSeenJokes((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: new Date().toISOString() };
      setItem(STORAGE_KEYS.SEEN_JOKES, next);
      track('joke_viewed', { jokeId: id }, { module: 'jokes' });
      return next;
    });
  };

  const handleResetSeen = () => {
    if (!window.confirm('Clear your seen-joke history?')) return;
    setSeenJokes({});
    setItem(STORAGE_KEYS.SEEN_JOKES, {});
    showToast('Seen history cleared');
  };

  // Voting — optimistic local update first (instant UI, offline-safe), then
  // fire-and-forget backend sync. Clicking the already-voted button removes the vote.
  const handleVote = (e: React.MouseEvent, jokeId: string, type: 'like' | 'dislike') => {
    e.stopPropagation(); // Prevent card from flipping
    if (inFlightVotes.current.has(jokeId)) return;
    inFlightVotes.current.add(jokeId);

    try {
      const voteKey = type === 'like' ? 'likes' : 'dislikes';
      const storedCounts = getItem<Record<string, { likes: number; dislikes: number }>>(
        STORAGE_KEYS.JOKE_VOTE_COUNTS,
        {}
      );
      const current = storedCounts[jokeId] || { likes: 0, dislikes: 0 };
      const isRemove = votedJokes[jokeId] === type;
      const updated = {
        ...current,
        [voteKey]: Math.max(0, isRemove ? current[voteKey] - 1 : current[voteKey] + 1),
      };
      setItem(STORAGE_KEYS.JOKE_VOTE_COUNTS, { ...storedCounts, [jokeId]: updated });

      // Optimistic updates with functional setters (no stale closure)
      setJokes((curr) => curr.map((j) => (j.id === jokeId ? { ...j, ...updated } : j)));
      setJokeOfTheDay((prev) => (prev?.id === jokeId ? { ...prev, ...updated } : prev));

      const newVotedState = { ...votedJokes };
      if (isRemove) delete newVotedState[jokeId];
      else newVotedState[jokeId] = type;
      setVotedJokes(newVotedState);
      setItem(STORAGE_KEYS.VOTED_JOKES, newVotedState);
      showToast(isRemove ? 'Vote removed' : type === 'like' ? '👍 Liked!' : '👎 Disliked!');

      // Backend sync: server counts win on success so devices converge
      void voteJoke(jokeId, type, isRemove)
        .then((synced) => {
          const s = synced as { likes?: number; dislikes?: number } | undefined;
          if (typeof s?.likes !== 'number' || typeof s?.dislikes !== 'number') return;
          const serverCounts = { likes: s.likes, dislikes: s.dislikes };
          setJokes((curr) => curr.map((j) => (j.id === jokeId ? { ...j, ...serverCounts } : j)));
          setJokeOfTheDay((prev) => (prev?.id === jokeId ? { ...prev, ...serverCounts } : prev));
          const latest = getItem<Record<string, { likes: number; dislikes: number }>>(
            STORAGE_KEYS.JOKE_VOTE_COUNTS,
            {}
          );
          setItem(STORAGE_KEYS.JOKE_VOTE_COUNTS, { ...latest, [jokeId]: serverCounts });
        })
        .catch(() => {
          /* offline — keep the optimistic local counts */
        });
    } finally {
      inFlightVotes.current.delete(jokeId);
    }
  };

  // Load all data on mount — API first, localStorage as offline fallback
  useEffect(() => {
    const savedVotes = getItem<Record<string, 'like' | 'dislike'>>(STORAGE_KEYS.VOTED_JOKES, {});
    setVotedJokes(savedVotes);
    setSeenJokes(getItem<Record<string, string>>(STORAGE_KEYS.SEEN_JOKES, {}));

    let cancelled = false;
    const load = async () => {
      try {
        // Fetch every page of published jokes (server is the vote-count source of truth)
        const [apiJokes, apiCats] = await Promise.all([getAllJokes(), getJokeCategories()]);
        if (cancelled) return;

        setJokes(apiJokes);
        if (apiCats.length > 0) setJokeCategories(apiCats);

        // Deterministic Joke of the Day
        if (apiJokes.length > 0) {
          const today = new Date();
          const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
          setJokeOfTheDay(apiJokes[seed % apiJokes.length] ?? apiJokes[0] ?? null);
        }
      } catch {
        // Offline fallback — read from localStorage / hardcoded data
        const categories = getItem(STORAGE_KEYS.JOKE_CATEGORIES, defaultJokeCategories);
        setJokeCategories(categories);

        const allJokes = getItem(STORAGE_KEYS.JOKES, []);
        const processedJokes = (allJokes as Joke[]).map((j) => {
          if (j.setup && j.punchline) {
            return { ...j, isOneLiner: false, createdAt: j.createdAt ?? new Date(0).toISOString() };
          }
          const fullJoke = j.setup || '';
          let setup = fullJoke,
            punchline = '';
          if (fullJoke.includes('?')) {
            const parts = fullJoke.split('?');
            setup = (parts[0] ?? '') + '?';
            punchline = parts.slice(1).join('?').trim();
          } else if (fullJoke.includes('Because')) {
            const parts = fullJoke.split('Because');
            setup = (parts[0] ?? '').trim();
            punchline = 'Because ' + parts.slice(1).join('Because').trim();
          }
          return {
            ...j,
            setup,
            punchline,
            isOneLiner: punchline.length === 0,
            createdAt: j.createdAt ?? new Date(0).toISOString(),
          };
        });

        const storedCounts = getItem<Record<string, { likes: number; dislikes: number }>>(
          STORAGE_KEYS.JOKE_VOTE_COUNTS,
          {}
        );
        const hydratedJokes = processedJokes.map((j) => {
          const counts = storedCounts[j.id];
          return counts ? { ...j, likes: counts.likes, dislikes: counts.dislikes } : j;
        });

        setJokes(hydratedJokes);

        if (hydratedJokes.length > 0) {
          const today = new Date();
          const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
          setJokeOfTheDay(hydratedJokes[seed % hydratedJokes.length] ?? hydratedJokes[0] ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep links: /jokes?category=<uuid>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const catId = params.get('category');
    if (catId) setActiveCategory(catId);
  }, []);

  // 💬 comment counts for the card chips (comments-system plan §4) — batched
  // one request for the whole set; silently empty offline.
  useEffect(() => {
    if (jokes.length === 0) return;
    let cancelled = false;
    getCommentCounts(
      'joke',
      jokes.map((j) => j.id)
    )
      .then((counts) => {
        if (!cancelled && Object.keys(counts).length > 0) setCommentCounts(counts);
      })
      .catch(() => {
        /* offline — chips simply stay at zero */
      });
    return () => {
      cancelled = true;
    };
  }, [jokes]);

  const openComments = (e: React.MouseEvent, jokeId: string) => {
    e.stopPropagation(); // Prevent card from flipping
    setCommentsModalJokeId(jokeId);
  };

  const bumpCommentCount = (jokeId: string) => {
    setCommentCounts((prev) => ({ ...prev, [jokeId]: (prev[jokeId] ?? 0) + 1 }));
  };

  // Multi-tab sync: propagate vote changes from other browser tabs in real-time
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.JOKE_VOTE_COUNTS && e.newValue) {
        try {
          const counts = JSON.parse(e.newValue) as Record<
            string,
            { likes: number; dislikes: number }
          >;
          setJokes((curr) => curr.map((j) => (counts[j.id] ? { ...j, ...counts[j.id] } : j)));
          setJokeOfTheDay((prev) =>
            prev && counts[prev.id] ? { ...prev, ...counts[prev.id] } : prev
          );
        } catch {
          /* ignore malformed data */
        }
      }
      if (e.key === STORAGE_KEYS.VOTED_JOKES && e.newValue) {
        try {
          setVotedJokes(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
      if (e.key === STORAGE_KEYS.SEEN_JOKES) {
        try {
          setSeenJokes(e.newValue ? JSON.parse(e.newValue) : {});
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  const handleShuffle = () => {
    setSortOrder('random');
    // Use bitwise OR to get an integer seed from Math.random()
    setRandomSeed((Math.random() * 100_000) | 0);
    setCurrentPage(1);
  };

  // Memoized: filter + search + sort — recomputes only when dependencies change
  const displayedJokes = useMemo(() => {
    // Filter by category UUID (matches API categoryId)
    let result = activeCategory ? jokes.filter((j) => j.categoryId === activeCategory) : [...jokes];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) => j.setup.toLowerCase().includes(q) || j.punchline.toLowerCase().includes(q)
      );
    }

    // Newest uses the real createdAt timestamp (ids are UUIDs, not numeric)
    if (sortOrder === 'newest') {
      result.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } else if (sortOrder === 'top') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortOrder === 'unseen') {
      // Unseen first, Newest order preserved within each group (stable sort)
      result.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      result.sort((a, b) => Number(Boolean(seenJokes[a.id])) - Number(Boolean(seenJokes[b.id])));
    } else if (sortOrder === 'random') {
      result = seededShuffle(result, randomSeed);
    }

    return result;
  }, [jokes, activeCategory, searchQuery, sortOrder, randomSeed, seenJokes]);

  // Seen progress: how much of the current catalog has been revealed
  const seenCount = useMemo(
    () => jokes.reduce((n, j) => (seenJokes[j.id] ? n + 1 : n), 0),
    [jokes, seenJokes]
  );

  // Memoized: category joke counts for sidebar display (keyed by categoryId)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jokes.forEach((j) => {
      counts[j.categoryId] = (counts[j.categoryId] || 0) + 1;
    });
    return counts;
  }, [jokes]);

  // Pagination
  const totalPages = Math.ceil(displayedJokes.length / ITEMS_PER_PAGE);
  const paginatedJokes = displayedJokes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Scroll to the top of the grid, clearing the site header + sticky section bar
  const scrollToGrid = () => {
    const el = document.getElementById('jokes-grid');
    if (el) window.scrollTo({ top: el.offsetTop - (headerHeight + 60), behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
      <VoteToast message={toast.message} visible={toast.visible} />

      {/* 💬 comments modal (comments-system plan §4) */}
      {commentsModalJokeId !== null &&
        (() => {
          const modalJoke = jokes.find((j) => j.id === commentsModalJokeId);
          if (!modalJoke) return null;
          return (
            <JokeCommentsModal
              jokeId={modalJoke.id}
              jokeSetup={modalJoke.setup}
              onPosted={() => bumpCommentCount(modalJoke.id)}
              onClose={() => setCommentsModalJokeId(null)}
            />
          );
        })()}

      {/* 🔗 share menu (FB / X / WhatsApp / LinkedIn / Copy Link / Save) */}
      {shareJokeId !== null &&
        (() => {
          const shareJoke = jokes.find((j) => j.id === shareJokeId);
          if (!shareJoke) return null;
          return (
            <ShareMenu
              title={shareJoke.setup}
              text={
                shareJoke.isOneLiner
                  ? shareJoke.setup
                  : `${shareJoke.setup} — ${shareJoke.punchline}`
              }
              saveNamespace="jokes"
              saveId={shareJoke.id}
              onClose={() => setShareJokeId(null)}
            />
          );
        })()}

      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-block rounded-lg bg-white/60 px-4 py-2 text-gray-700 transition-all hover:bg-white/80 hover:shadow-md"
        >
          ← Back to Home
        </Link>

        <h1 className="mb-4 text-center text-4xl font-bold text-gray-800">😄 Dad Jokes</h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-gray-600">
          Get ready for some serious eye-rolling with our collection of dad jokes!
        </p>

        {/* Synchronized Header Row (Sticky) */}
        <div
          className="sticky z-30 grid gap-10 lg:grid-cols-4 mb-6 border-b border-gray-200 py-4 bg-yellow-50/80 backdrop-blur-md -mx-4 px-4 transition-shadow"
          style={{ top: headerHeight }}
        >
          {/* Sidebar Header Portion */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                ✨
              </span>{' '}
              Focus
            </h2>
          </div>

          {/* Main Grid Header Portion */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                <h2 className="text-2xl font-black text-gray-800">
                  {activeCategory
                    ? `${jokeCategories.find((c) => c.id === activeCategory)?.name ?? 'Category'} (${displayedJokes.length})`
                    : `All Jokes (${jokes.length})`}
                </h2>
                <p className="hidden lg:block text-sm text-orange-600 font-semibold italic mt-0.5">
                  &ldquo;Laughter is the shortest distance between two people.&rdquo;
                </p>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-200 transition-colors shadow-sm"
                  >
                    Clear Filter ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search bar — filters by setup or punchline keyword */}
                <div className="relative flex-1 sm:w-48 sm:flex-none">
                  <input
                    type="search"
                    placeholder="Search jokes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-gray-200 bg-white/80 py-1.5 pl-4 pr-8 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400"
                    aria-label="Search jokes by keyword"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort controls: Newest | 🔥 Top (most liked) | Shuffle */}
                <div className="flex bg-gray-200/50 p-1 rounded-xl shadow-inner">
                  <button
                    onClick={() => setSortOrder('newest')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortOrder === 'newest' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setSortOrder('unseen')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortOrder === 'unseen' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Jokes you haven't revealed yet, newest first"
                  >
                    Unseen
                  </button>
                  <button
                    onClick={() => setSortOrder('top')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortOrder === 'top' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    🔥 Top
                  </button>
                  <button
                    onClick={handleShuffle}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortOrder === 'random' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="16 3 21 3 21 8"></polyline>
                      <line x1="4" y1="20" x2="21" y2="3"></line>
                      <polyline points="21 16 21 21 16 21"></polyline>
                      <line x1="15" y1="15" x2="21" y2="21"></line>
                      <line x1="4" y1="4" x2="9" y2="9"></line>
                    </svg>
                    Shuffle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Four Column Layout: Sidebar + Grid */}
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Combined Sidebar (Sticky) */}
          <div className="lg:col-span-1">
            <div
              className="sticky space-y-10 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar"
              style={{ top: headerHeight + 104 }}
            >
              {/* Joke of the Day */}
              <div className="space-y-4">
                {jokeOfTheDay && (
                  <div
                    className="group relative min-h-[160px] grid grid-cols-1 w-full perspective-1000 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    onClick={() => toggleFlip(jokeOfTheDay.id, false)}
                    tabIndex={0}
                    role="article"
                    aria-label={
                      flippedCards[jokeOfTheDay.id]
                        ? `Joke of the Day: ${jokeOfTheDay.setup} — ${jokeOfTheDay.punchline}`
                        : `Joke of the Day: ${jokeOfTheDay.setup} — click to reveal punchline`
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFlip(jokeOfTheDay.id, false);
                      }
                    }}
                  >
                    <div
                      className={`col-start-1 row-start-1 grid grid-cols-1 relative transition-all duration-500 transform-style-3d shadow-xl hover:shadow-2xl ${flippedCards[jokeOfTheDay.id] ? 'rotate-y-180' : ''}`}
                    >
                      {/* Front of card (Setup) */}
                      <div
                        className={`col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center backface-hidden ring-1 ring-orange-100 transition-opacity duration-300 ${flippedCards[jokeOfTheDay.id] ? 'opacity-0' : 'opacity-100'}`}
                      >
                        {/* 🔖 Save chip (front face — flips with the card) */}
                        <button
                          onClick={(e) => handleSaveChip(e, jokeOfTheDay.id)}
                          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-orange-100 transition-all hover:scale-110 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          aria-pressed={Boolean(savedJokes[jokeOfTheDay.id])}
                          aria-label={
                            savedJokes[jokeOfTheDay.id]
                              ? 'Remove from saved'
                              : 'Save joke of the day'
                          }
                          title={savedJokes[jokeOfTheDay.id] ? 'Saved — tap to remove' : 'Save'}
                        >
                          <Bookmark
                            className={`h-4 w-4 transition-colors ${savedJokes[jokeOfTheDay.id] ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`}
                            aria-hidden="true"
                          />
                        </button>
                        {/* Fixed: was <h2> — broken heading hierarchy. Now a <p> with visual styling. */}
                        <p className="mb-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                          Joke of the Day
                        </p>
                        <blockquote
                          className="mb-6 text-lg font-semibold text-gray-800 balance-text"
                          aria-label="Joke setup"
                        >
                          &ldquo;{jokeOfTheDay.setup}&rdquo;
                        </blockquote>
                        <div className="mt-auto w-full px-2 flex flex-col items-center gap-4">
                          <div className="flex items-center justify-center gap-3">
                            <VoteButtons
                              jokeId={jokeOfTheDay.id}
                              likes={jokeOfTheDay.likes || 0}
                              dislikes={jokeOfTheDay.dislikes || 0}
                              votedJokes={votedJokes}
                              onVote={handleVote}
                              variant="light"
                            />
                            <CommentsChip
                              jokeId={jokeOfTheDay.id}
                              count={commentCounts[jokeOfTheDay.id] ?? 0}
                              onOpen={openComments}
                            />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 animate-pulse">
                            {jokeOfTheDay.isOneLiner ? 'One-liner 😜' : 'Click to Reveal'}
                          </p>
                        </div>
                      </div>

                      {/* Back of card (Punchline) */}
                      <div
                        className={`col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-6 text-center text-white backface-hidden rotate-y-180 transition-opacity duration-300 ${flippedCards[jokeOfTheDay.id] ? 'opacity-100' : 'opacity-0'}`}
                      >
                        {/* 🔖 Save chip (back face — flips with the card) */}
                        <button
                          onClick={(e) => handleSaveChip(e, jokeOfTheDay.id)}
                          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          aria-pressed={Boolean(savedJokes[jokeOfTheDay.id])}
                          aria-label={
                            savedJokes[jokeOfTheDay.id]
                              ? 'Remove from saved'
                              : 'Save joke of the day'
                          }
                          title={savedJokes[jokeOfTheDay.id] ? 'Saved — tap to remove' : 'Save'}
                        >
                          <Bookmark
                            className={`h-4 w-4 transition-colors ${savedJokes[jokeOfTheDay.id] ? 'fill-amber-300 text-amber-300' : 'text-white/70'}`}
                            aria-hidden="true"
                          />
                        </button>
                        <p className="text-lg font-bold italic drop-shadow-md balance-text">
                          {jokeOfTheDay.isOneLiner ? jokeOfTheDay.setup : jokeOfTheDay.punchline}
                        </p>
                        {jokeOfTheDay.isOneLiner && (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/80">
                            😂 Ba-dum-tss!
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-center gap-2 w-full">
                          <CommentsChip
                            jokeId={jokeOfTheDay.id}
                            count={commentCounts[jokeOfTheDay.id] ?? 0}
                            onOpen={openComments}
                            variant="dark"
                          />
                          <button
                            onClick={(e) => openShare(e, jokeOfTheDay.id)}
                            className="rounded-full bg-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors hover:bg-white/30"
                            aria-label="Share joke"
                          >
                            🔗 Share
                          </button>
                        </div>
                        <div className="mt-6 flex items-center justify-between w-full px-2">
                          <span className="rounded-full bg-white/25 px-3 py-1 text-[10px] font-bold backdrop-blur-md border border-white/20 uppercase tracking-wider">
                            {jokeOfTheDay.category}
                          </span>
                          <VoteButtons
                            jokeId={jokeOfTheDay.id}
                            likes={jokeOfTheDay.likes || 0}
                            dislikes={jokeOfTheDay.dislikes || 0}
                            votedJokes={votedJokes}
                            onVote={handleVote}
                            variant="dark"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Topics / Categories with counts */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">
                    📁
                  </span>{' '}
                  Topics
                </h2>
                {/* Seen-joke progress (Workstream C) — excludes Joke of the Day flips */}
                {!loading && jokes.length > 0 && (
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-gray-700">
                      😄 You&apos;ve seen{' '}
                      <span className="font-bold text-orange-500">{seenCount}</span> of{' '}
                      {jokes.length} jokes
                    </p>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
                      role="progressbar"
                      aria-valuenow={seenCount}
                      aria-valuemin={0}
                      aria-valuemax={jokes.length}
                      aria-label="Seen jokes progress"
                    >
                      <div
                        className="h-full rounded-full bg-orange-400 transition-all duration-500"
                        style={{ width: `${Math.round((seenCount / jokes.length) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={handleResetSeen}
                      className="mt-2 text-xs font-semibold text-gray-400 underline transition-colors hover:text-red-500"
                    >
                      Reset seen history
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-3" role="list" aria-label="Joke categories">
                  {/* "All Jokes" — now has aria-pressed and onKeyDown (was missing both) */}
                  <div
                    onClick={() => setActiveCategory(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveCategory(null);
                      }
                    }}
                    className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${activeCategory === null ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={activeCategory === null}
                    aria-label="Show all jokes"
                  >
                    <span className="text-3xl" aria-hidden="true">
                      🃏
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">All Jokes</h3>
                      <p className="text-xs text-gray-500">
                        The full collection ·{' '}
                        <span className="font-bold text-orange-500">{jokes.length}</span>
                      </p>
                    </div>
                  </div>
                  {/* Hide empty categories so the sidebar never shows broken "0 jokes" rows */}
                  {jokeCategories
                    .filter((c) => (categoryCounts[c.id] || 0) > 0)
                    .map((category) => {
                      const isActive = activeCategory === category.id;
                      const count = categoryCounts[category.id] || 0;
                      return (
                        <div
                          key={category.id}
                          onClick={() => setActiveCategory(isActive ? null : category.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveCategory(isActive ? null : category.id);
                            }
                          }}
                          className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${isActive ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'}`}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isActive}
                          aria-label={`Filter by ${category.name}. ${count} jokes`}
                        >
                          <span className="text-3xl" aria-hidden="true">
                            {category.emoji}
                          </span>
                          <div>
                            <h3 className="text-base font-semibold text-gray-800">
                              {category.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              <span className="font-bold text-orange-500">{count}</span> jokes
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content: Flashcards Grid (Spans 3 columns) */}
          <div className="lg:col-span-3 space-y-8" aria-live="polite" aria-atomic="true">
            {/* Search result summary */}
            {searchQuery.trim() && (
              <p className="text-sm text-gray-500 -mb-4">
                {displayedJokes.length === 0
                  ? `No jokes found for “${searchQuery}”`
                  : `${displayedJokes.length} joke${displayedJokes.length !== 1 ? 's' : ''} found for “${searchQuery}”`}
              </p>
            )}

            <div id="jokes-grid" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <SkeletonCards count={6} />
              ) : (
                paginatedJokes.map((joke) => {
                  const seen = Boolean(seenJokes[joke.id]);
                  return (
                    <div
                      key={joke.id}
                      className="group relative min-h-[120px] grid grid-cols-1 w-full perspective-1000 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                      onClick={() => toggleFlip(joke.id)}
                      tabIndex={0}
                      role="article"
                      aria-label={
                        flippedCards[joke.id]
                          ? `Joke: ${joke.setup} — ${joke.punchline}`
                          : `Joke: ${joke.setup} — click to reveal punchline`
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFlip(joke.id);
                        }
                      }}
                    >
                      <div
                        className={`col-start-1 row-start-1 grid grid-cols-1 relative transition-all duration-500 transform-style-3d shadow-md hover:shadow-xl ${flippedCards[joke.id] ? 'rotate-y-180' : ''}`}
                      >
                        {/* Front of card (Setup) */}
                        <div
                          className={`col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center backface-hidden border-2 transition-opacity duration-300 ${flippedCards[joke.id] ? 'opacity-0' : seen ? 'border-gray-200 opacity-80 group-hover:border-gray-300' : 'border-transparent opacity-100 group-hover:border-orange-100'}`}
                        >
                          {/* Seen chip — muted gray-green, front face only (Workstream C) */}
                          {seen && (
                            <span className="absolute top-4 left-4 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-100">
                              ✓ Seen
                            </span>
                          )}
                          {/* aria-hidden: SVG is decorative, screen readers should skip it */}
                          <span
                            className="absolute top-4 right-12 text-gray-300"
                            aria-hidden="true"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 2v6h-6"></path>
                              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                              <path d="M3 22v-6h6"></path>
                              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                            </svg>
                          </span>
                          {/* 🔖 Save chip (front face — flips with the card) */}
                          <button
                            onClick={(e) => handleSaveChip(e, joke.id)}
                            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-gray-100 transition-all hover:scale-110 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                            aria-pressed={Boolean(savedJokes[joke.id])}
                            aria-label={savedJokes[joke.id] ? 'Remove from saved' : 'Save joke'}
                            title={savedJokes[joke.id] ? 'Saved — tap to remove' : 'Save'}
                          >
                            <Bookmark
                              className={`h-4 w-4 transition-colors ${savedJokes[joke.id] ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`}
                              aria-hidden="true"
                            />
                          </button>
                          <p className="text-base font-bold text-gray-800 balance-text">
                            {joke.setup}
                          </p>

                          <div className="mt-auto pt-6 flex flex-col items-center gap-3 w-full">
                            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 ring-1 ring-orange-100">
                              {joke.category}
                            </span>
                            <div className="flex items-center justify-center gap-3">
                              <VoteButtons
                                jokeId={joke.id}
                                likes={joke.likes || 0}
                                dislikes={joke.dislikes || 0}
                                votedJokes={votedJokes}
                                onVote={handleVote}
                                variant="light"
                              />
                              <CommentsChip
                                jokeId={joke.id}
                                count={commentCounts[joke.id] ?? 0}
                                onOpen={openComments}
                              />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 opacity-60">
                              {joke.isOneLiner ? 'One-liner 😜' : 'Click to flip'}
                            </p>
                          </div>
                        </div>

                        {/* Back of card (Punchline) */}
                        <div
                          className={`col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-6 text-center text-white backface-hidden rotate-y-180 shadow-inner transition-opacity duration-300 ${flippedCards[joke.id] ? 'opacity-100' : 'opacity-0'}`}
                        >
                          {/* 🔖 Save chip (back face — flips with the card) */}
                          <button
                            onClick={(e) => handleSaveChip(e, joke.id)}
                            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                            aria-pressed={Boolean(savedJokes[joke.id])}
                            aria-label={savedJokes[joke.id] ? 'Remove from saved' : 'Save joke'}
                            title={savedJokes[joke.id] ? 'Saved — tap to remove' : 'Save'}
                          >
                            <Bookmark
                              className={`h-4 w-4 transition-colors ${savedJokes[joke.id] ? 'fill-amber-300 text-amber-300' : 'text-white/70'}`}
                              aria-hidden="true"
                            />
                          </button>
                          <p className="text-base font-bold italic drop-shadow-sm balance-text">
                            {joke.isOneLiner ? joke.setup : joke.punchline}
                          </p>
                          {joke.isOneLiner && (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/80">
                              😂 Ba-dum-tss!
                            </p>
                          )}
                          <div className="mt-4 flex flex-col items-center gap-3 w-full">
                            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur-sm uppercase self-center">
                              {joke.category}
                            </span>
                            <div className="flex items-center justify-center gap-3 w-full">
                              <VoteButtons
                                jokeId={joke.id}
                                likes={joke.likes || 0}
                                dislikes={joke.dislikes || 0}
                                votedJokes={votedJokes}
                                onVote={handleVote}
                                variant="dark"
                              />
                              <CommentsChip
                                jokeId={joke.id}
                                count={commentCounts[joke.id] ?? 0}
                                onOpen={openComments}
                                variant="dark"
                              />
                            </div>
                            <button
                              onClick={(e) => openShare(e, joke.id)}
                              className="rounded-full bg-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm transition-colors hover:bg-white/30"
                              aria-label="Share joke"
                            >
                              🔗 Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!loading && paginatedJokes.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 py-16 text-center col-span-full">
                <span className="text-4xl mb-4 block" aria-hidden="true">
                  🏜️
                </span>
                <p className="text-xl font-medium text-gray-600">
                  {searchQuery
                    ? `No jokes match "${searchQuery}"`
                    : 'No jokes found for this category.'}
                </p>
                <button
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery('');
                  }}
                  className="mt-4 rounded-lg bg-orange-500 px-6 py-2 font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Show All Jokes
                </button>
              </div>
            )}

            {/* Pagination Controls With ellipsis collapse */}
            {!loading && totalPages > 1 && (
              <div
                className="mt-12 flex items-center justify-center gap-2 flex-wrap"
                role="navigation"
                aria-label="Joke pages"
              >
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    scrollToGrid();
                  }}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                {/* Ellipsis-collapsed pagination */}
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  const near = Math.abs(page - currentPage) <= 1;
                  const isEdge = page === 1 || page === totalPages;
                  const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                  const showEllipsisAfter =
                    page === currentPage + 2 && currentPage < totalPages - 2;

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span
                        key={`e${i}`}
                        className="w-10 text-center text-gray-400 font-bold select-none"
                      >
                        …
                      </span>
                    );
                  }
                  if (!near && !isEdge) return null;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentPage(page);
                        scrollToGrid();
                      }}
                      className={`h-10 w-10 rounded-lg font-bold transition-all ${currentPage === page ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    scrollToGrid();
                  }}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
