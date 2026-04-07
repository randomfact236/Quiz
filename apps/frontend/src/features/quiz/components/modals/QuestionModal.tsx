'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import type { QuizQuestion, QuizSubject, QuizChapter, CreateQuestionDto } from '@/lib/quiz-api';
import { useQuestionMutation } from '../../hooks';
import { OptionsEditor, CORRECT_LETTERS } from './OptionsEditor';
import { SubjectChapterFields } from './SubjectChapterFields';

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

export function QuestionModal({ open, question, subjects, chapters, onClose }: QuestionModalProps) {
  const isEdit = useMemo(() => !!question, [question]);

  const [questionText, setQuestionText] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [level, setLevel] = useState('easy');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctLetter, setCorrectLetter] = useState('A');
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');

  const isExtreme = level === 'extreme';

  const { createAsync, updateAsync, isCreating, isUpdating, createError, updateError } =
    useQuestionMutation();
  const isPending = isCreating || isUpdating;
  const error = isEdit ? updateError : createError;

  const filteredChapters = useMemo(() => {
    if (!subjectId) return [];
    return chapters.filter((c) => c.subjectId === subjectId);
  }, [chapters, subjectId]);

  useEffect(() => {
    if (open && question) {
      setQuestionText(question.question);
      setChapterId(question.chapterId);
      setLevel(question.level);
      setStatus(
        question.status === 'draft' || question.status === 'published' ? question.status : 'draft'
      );
      const chapter = chapters.find((c) => c.id === question.chapterId);
      if (chapter) {
        setSubjectId(chapter.subjectId);
      }
      if (question.level === 'extreme') {
        setOpenEndedAnswer(question.correctAnswer || '');
        setOptions(['', '', '', '']);
        setCorrectLetter('A');
      } else {
        setOptions((question.options || ['', '', '', '']).map((opt) => opt ?? ''));
        setCorrectLetter(question.correctLetter || 'A');
        setOpenEndedAnswer('');
      }
    } else if (open) {
      setQuestionText('');
      setSubjectId('');
      setChapterId('');
      setLevel('easy');
      setStatus('draft');
      setOptions(['', '', '', '']);
      setCorrectLetter('A');
      setOpenEndedAnswer('');
    }
  }, [open, question, chapters]);

  useEffect(() => {
    if (subjectId && chapterId) {
      const chapterExists = filteredChapters.some((c) => c.id === chapterId);
      if (!chapterExists) {
        setChapterId('');
      }
    }
  }, [subjectId, chapterId, filteredChapters]);

  const handleLevelChange = (newLevel: string) => {
    if (level === 'extreme' && newLevel !== 'extreme') {
      setOpenEndedAnswer('');
      setOptions(['', '', '', '']);
      setCorrectLetter('A');
    } else if (level !== 'extreme' && newLevel === 'extreme') {
      setOptions(['', '', '', '']);
      setCorrectLetter('A');
    }
    setLevel(newLevel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !chapterId) return;

    let data: CreateQuestionDto;

    if (isExtreme) {
      data = {
        question: questionText.trim(),
        chapterId,
        level: level as 'easy' | 'medium' | 'hard' | 'expert' | 'extreme',
        status,
        options: null,
        correctAnswer: openEndedAnswer.trim(),
        correctLetter: null,
      };
    } else {
      data = {
        question: questionText.trim(),
        chapterId,
        level: level as 'easy' | 'medium' | 'hard' | 'expert' | 'extreme',
        status,
        options: options.filter((o) => o.trim()),
        correctLetter: correctLetter,
        correctAnswer: options[CORRECT_LETTERS.indexOf(correctLetter)] || '',
      };
    }

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed' }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Question' : 'Add Question'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error.message}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the question..."
              required
            />
          </div>

          <SubjectChapterFields
            subjectId={subjectId}
            chapterId={chapterId}
            subjects={subjects}
            filteredChapters={filteredChapters}
            onSubjectChange={(id) => setSubjectId(id)}
            onChapterChange={(id) => setChapterId(id)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {isExtreme ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <textarea
                value={openEndedAnswer}
                onChange={(e) => setOpenEndedAnswer(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the correct answer/explanation..."
                required={isExtreme}
              />
            </div>
          ) : (
            <OptionsEditor
              options={options}
              correctLetter={correctLetter}
              onOptionChange={(index, value) =>
                setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
              }
              onCorrectLetterChange={setCorrectLetter}
            />
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !questionText.trim() || !chapterId}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuestionModal;
