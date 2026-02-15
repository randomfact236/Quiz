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
  const [subjects, setSubjects] = useState<Subject[]>(() => 
    getItem(STORAGE_KEYS.SUBJECTS, initialSubjects)
  );
  const [allQuestions, setAllQuestions] = useState<Record<string, Question[]>>(() => 
    getItem(STORAGE_KEYS.QUESTIONS, initialQuestions)
  );
  const [allJokes, setAllJokes] = useState<Joke[]>(() => 
    getItem(STORAGE_KEYS.JOKES, initialJokes)
  );
  const [allRiddles, setAllRiddles] = useState<Riddle[]>(() => 
    getItem(STORAGE_KEYS.RIDDLES, initialRiddles)
  );
  const [allImageRiddles, setAllImageRiddles] = useState<ImageRiddle[]>(() => 
    getItem(STORAGE_KEYS.IMAGE_RIDDLES, initialImageRiddles)
  );

  // Persist subjects
  useEffect(() => {
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
  }, [subjects]);

  // Persist questions
  useEffect(() => {
    setItem(STORAGE_KEYS.QUESTIONS, allQuestions);
  }, [allQuestions]);

  // Persist jokes
  useEffect(() => {
    setItem(STORAGE_KEYS.JOKES, allJokes);
  }, [allJokes]);

  // Persist riddles
  useEffect(() => {
    setItem(STORAGE_KEYS.RIDDLES, allRiddles);
  }, [allRiddles]);

  // Persist image riddles
  useEffect(() => {
    setItem(STORAGE_KEYS.IMAGE_RIDDLES, allImageRiddles);
  }, [allImageRiddles]);

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
