'use client';

import { useState, useEffect } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import {
  initialJokes,
  initialRiddles,
  initialImageRiddles,
} from '@/lib/initial-data';
import type { Question, Subject, Joke, Riddle, ImageRiddle } from '../types';

// Initial questions data
const initialQuestions: Record<string, Question[]> = {
  science: [
    { id: 1, question: 'What is the chemical symbol for water?', optionA: 'H2O', optionB: 'CO2', optionC: 'NaCl', optionD: 'O2', correctAnswer: 'A', level: 'easy', chapter: 'Chemistry Basics' },
    { id: 2, question: 'What planet is known as the Red Planet?', optionA: 'Venus', optionB: 'Mars', optionC: 'Jupiter', optionD: 'Saturn', correctAnswer: 'B', level: 'easy', chapter: 'Solar System' },
    { id: 3, question: 'What is the speed of light?', optionA: '300,000 km/s', optionB: '150,000 km/s', optionC: '500,000 km/s', optionD: '200,000 km/s', correctAnswer: 'A', level: 'medium', chapter: 'Physics Basics' },
  ],
  math: [
    { id: 1, question: 'What is 15 × 8?', optionA: '110', optionB: '120', optionC: '130', optionD: '140', correctAnswer: 'B', level: 'easy', chapter: 'Multiplication' },
    { id: 2, question: 'What is the square root of 144?', optionA: '10', optionB: '11', optionC: '12', optionD: '13', correctAnswer: 'C', level: 'easy', chapter: 'Square Roots' },
  ],
  history: [
    { id: 1, question: 'In which year did World War II end?', optionA: '1943', optionB: '1944', optionC: '1945', optionD: '1946', correctAnswer: 'C', level: 'easy', chapter: 'World War II' },
  ],
  geography: [
    { id: 1, question: 'What is the capital of France?', optionA: 'London', optionB: 'Paris', optionC: 'Berlin', optionD: 'Rome', correctAnswer: 'B', level: 'easy', chapter: 'European Capitals' },
  ],
  english: [
    { id: 1, question: 'What is the past tense of "run"?', optionA: 'Runned', optionB: 'Ran', optionC: 'Running', optionD: 'Runs', correctAnswer: 'B', level: 'easy', chapter: 'Verbs' },
  ],
  technology: [
    { id: 1, question: 'What does CPU stand for?', optionA: 'Central Processing Unit', optionB: 'Computer Personal Unit', optionC: 'Central Program Utility', optionD: 'Computer Processing Unit', correctAnswer: 'A', level: 'easy', chapter: 'Hardware' },
  ],
};

const initialSubjects: Subject[] = [
  { id: 1, slug: 'science', name: 'Science', emoji: '🔬', category: 'academic' },
  { id: 2, slug: 'math', name: 'Math', emoji: '🔢', category: 'academic' },
  { id: 3, slug: 'history', name: 'History', emoji: '📜', category: 'academic' },
  { id: 4, slug: 'geography', name: 'Geography', emoji: '🌍', category: 'academic' },
  { id: 5, slug: 'english', name: 'English', emoji: '📖', category: 'academic' },
  { id: 6, slug: 'technology', name: 'Technology', emoji: '💻', category: 'professional' },
];

export interface UseAdminDataReturn {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  allQuestions: Record<string, Question[]>;
  setAllQuestions: React.Dispatch<React.SetStateAction<Record<string, Question[]>>>;
  allJokes: Joke[];
  setAllJokes: React.Dispatch<React.SetStateAction<Joke[]>>;
  allRiddles: Riddle[];
  setAllRiddles: React.Dispatch<React.SetStateAction<Riddle[]>>;
  allImageRiddles: ImageRiddle[];
  setAllImageRiddles: React.Dispatch<React.SetStateAction<ImageRiddle[]>>;
}

export function useAdminData(): UseAdminDataReturn {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects as Subject[]);
  const [allQuestions, setAllQuestions] = useState<Record<string, Question[]>>(initialQuestions as Record<string, Question[]>);
  const [allJokes, setAllJokes] = useState<Joke[]>(initialJokes as unknown as Joke[]);
  const [allRiddles, setAllRiddles] = useState<Riddle[]>(initialRiddles as Riddle[]);
  const [allImageRiddles, setAllImageRiddles] = useState<ImageRiddle[]>(initialImageRiddles as unknown as ImageRiddle[]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSubjects(getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, initialSubjects as Subject[]));
    setAllQuestions(getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, initialQuestions as Record<string, Question[]>));
    setAllJokes(getItem<Joke[]>(STORAGE_KEYS.JOKES, initialJokes as unknown as Joke[]));
    setAllRiddles(getItem<Riddle[]>(STORAGE_KEYS.RIDDLES, initialRiddles as Riddle[]));
    setAllImageRiddles(getItem<ImageRiddle[]>(STORAGE_KEYS.IMAGE_RIDDLES, initialImageRiddles as unknown as ImageRiddle[]));
    setIsHydrated(true);
  }, []);

  // Persist subjects
  useEffect(() => {
    if (isHydrated) {
      setItem(STORAGE_KEYS.SUBJECTS, subjects);
    }
  }, [subjects, isHydrated]);

  // Persist questions
  useEffect(() => {
    if (isHydrated) {
      setItem(STORAGE_KEYS.QUESTIONS, allQuestions);
    }
  }, [allQuestions, isHydrated]);

  // Persist jokes
  useEffect(() => {
    if (isHydrated) {
      setItem(STORAGE_KEYS.JOKES, allJokes);
    }
  }, [allJokes, isHydrated]);

  // Persist riddles
  useEffect(() => {
    if (isHydrated) {
      setItem(STORAGE_KEYS.RIDDLES, allRiddles);
    }
  }, [allRiddles, isHydrated]);

  // Persist image riddles
  useEffect(() => {
    if (isHydrated) {
      setItem(STORAGE_KEYS.IMAGE_RIDDLES, allImageRiddles);
    }
  }, [allImageRiddles, isHydrated]);

  return {
    subjects,
    setSubjects,
    allQuestions,
    setAllQuestions,
    allJokes,
    setAllJokes,
    allRiddles,
    setAllRiddles,
    allImageRiddles,
    setAllImageRiddles,
  };
}
