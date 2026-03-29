'use client';

import type { QuizSubject, QuizChapter } from '@/lib/quiz-api';

interface SubjectChapterFieldsProps {
  subjectId: string;
  chapterId: string;
  subjects: QuizSubject[];
  filteredChapters: QuizChapter[];
  onSubjectChange: (id: string) => void;
  onChapterChange: (id: string) => void;
}

export function SubjectChapterFields({
  subjectId,
  chapterId,
  subjects,
  filteredChapters,
  onSubjectChange,
  onChapterChange,
}: SubjectChapterFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subject <span className="text-red-500">*</span>
        </label>
        <select
          value={subjectId}
          onChange={(e) => onSubjectChange(e.target.value)}
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
          onChange={(e) => onChapterChange(e.target.value)}
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
  );
}
