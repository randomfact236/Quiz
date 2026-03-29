'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { QuizQuestion, QuizSubject, QuizChapter, CreateQuestionDto } from '@/lib/quiz-api';
import { useQuestionMutation } from '../../hooks';

interface QuestionModalProps {
  open: boolean;
  question: QuizQuestion | undefined;
  subjects: QuizSubject[];
  chapters: QuizChapter[];
  onClose: () => void;
}

const LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
  { value: 'extreme', label: 'Extreme' },
];

const CORRECT_LETTERS = ['A', 'B', 'C', 'D'];

export function QuestionModal({ open, question, subjects, chapters, onClose }: QuestionModalProps) {
  const isEdit = useMemo(() => !!question, [question]);
  
  const [questionText, setQuestionText] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [level, setLevel] = useState('easy');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctLetter, setCorrectLetter] = useState('A');
  
  const { createAsync, updateAsync, isCreating, isUpdating, createError, updateError } = useQuestionMutation();
  const isPending = isCreating || isUpdating;
  const error = isEdit ? updateError : createError;

  const filteredChapters = useMemo(() => {
    if (!subjectId) return [];
    return chapters.filter(c => c.subjectId === subjectId);
  }, [chapters, subjectId]);

  useEffect(() => {
    if (open && question) {
      setQuestionText(question.question);
      setChapterId(question.chapterId);
      setLevel(question.level);
      setStatus((question.status === 'draft' || question.status === 'published') ? question.status : 'draft');
      setOptions(question.options || ['', '', '', '']);
      setCorrectLetter(question.correctLetter || 'A');
      // Find subject from chapters
      const chapter = chapters.find(c => c.id === question.chapterId);
      if (chapter) {
        setSubjectId(chapter.subjectId);
      }
    } else if (open) {
      setQuestionText('');
      setSubjectId('');
      setChapterId('');
      setLevel('easy');
      setStatus('draft');
      setOptions(['', '', '', '']);
      setCorrectLetter('A');
    }
  }, [open, question, chapters]);

  useEffect(() => {
    // Reset chapter when subject changes
    if (subjectId && chapterId) {
      const chapterExists = filteredChapters.some(c => c.id === chapterId);
      if (!chapterExists) {
        setChapterId('');
      }
    }
  }, [subjectId, chapterId, filteredChapters]);

  const handleOptionChange = (index: number, value: string) => {
    setOptions(prev => {
      const newOptions = [...prev];
      newOptions[index] = value;
      return newOptions;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !chapterId) return;

    const data: CreateQuestionDto = {
      question: questionText.trim(),
      chapterId,
      level: level as 'easy' | 'medium' | 'hard' | 'expert' | 'extreme',
      status,
      options: options.filter(o => o.trim()),
      correctLetter,
      correctAnswer: options[CORRECT_LETTERS.indexOf(correctLetter)] || '',
    };

    try {
      if (isEdit && question) {
        await updateAsync({ id: question.id, dto: data });
      } else {
        await createAsync(data);
      }
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Edit Question' : 'Add Question'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error.message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question <span className="text-red-500">*</span>
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the question..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.emoji} {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chapter <span className="text-red-500">*</span>
            </label>
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              disabled={!subjectId || filteredChapters.length === 0}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            >
              <option value="">Select chapter</option>
              {filteredChapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Options
          </label>
          <div className="space-y-2">
            {CORRECT_LETTERS.map((letter, index) => (
              <div key={letter} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctLetter === letter}
                  onChange={() => setCorrectLetter(letter)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium w-6">{letter}.</span>
                <input
                  type="text"
                  value={options[index]}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${letter}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !questionText.trim() || !chapterId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default QuestionModal;
