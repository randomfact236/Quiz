/**
 * ============================================================================
 * useImageRiddleFilters — filter/sort/pagination state with deep-link init
 * ============================================================================
 * Holds the filter state for the grid. Search is debounced before it feeds
 * the (server-side) query; "Mix" re-rolls a shuffle seed only on toggle so
 * the grid order stays stable while filtering.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const SEARCH_DEBOUNCE_MS = 350;

export type ImageRiddleSortOrder = 'recent' | 'random';

export function useImageRiddleFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<ImageRiddleSortOrder>('recent');
  const [page, setPage] = useState(1);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Debounce the query actually used for fetching/filtering.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Deep links: /image-riddles?category=<name>&difficulty=<level>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const diff = params.get('difficulty');
    if (cat) setActiveCategory(cat);
    if (diff && DIFFICULTIES.includes(diff)) setDifficulty(diff);
  }, []);

  const changeSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    setPage(1);
  }, []);

  const changeCategory = useCallback((cat: string | null) => {
    setActiveCategory(cat);
    setPage(1);
  }, []);

  const changeDifficulty = useCallback((d: string) => {
    setDifficulty(d);
    setPage(1);
  }, []);

  const changeSortOrder = useCallback((s: ImageRiddleSortOrder) => {
    setSortOrder(s);
    // Re-roll the shuffle seed only when (re-)toggling Mix — filter typing
    // never reshuffles; remaining items keep their relative order.
    if (s === 'random') setShuffleSeed((prev) => prev + 1);
    setPage(1);
  }, []);

  const changePage = useCallback((p: number) => setPage(p), []);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setActiveCategory(null);
    setDifficulty('all');
    setPage(1);
  }, []);

  return {
    searchInput,
    search,
    activeCategory,
    difficulty,
    sortOrder,
    page,
    shuffleSeed,
    changeSearchInput,
    changeCategory,
    changeDifficulty,
    changeSortOrder,
    changePage,
    resetFilters,
  };
}

export type ImageRiddleFilters = ReturnType<typeof useImageRiddleFilters>;
