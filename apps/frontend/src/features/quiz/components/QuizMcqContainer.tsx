'use client';

import { useState, useMemo } from 'react';
import { useQuizFilters } from '../hooks/useQuizFilters';
import { useSubjects } from '../hooks/useSubjects';
import { useChapters } from '../hooks/useChapters';
import { useQuestions } from '../hooks/useQuestions';
import { useFilterCounts } from '../hooks/useFilterCounts';
import { QuizHeader } from './QuizHeader';
import { FilterPanel } from './FilterPanel';
import { QuestionManager } from './QuestionManager';
import { SubjectModal } from './modals/SubjectModal';
import { ChapterModal } from './modals/ChapterModal';
import { QuestionModal } from './modals/QuestionModal';
import { ImportModal } from './modals/ImportModal';
import type { QuizQuestion, QuizSubject, QuizChapter } from '@/lib/quiz-api';

interface QuestionModalState {
  open: boolean;
  question: QuizQuestion | undefined;
}

interface SubjectModalState {
  open: boolean;
  subject: QuizSubject | undefined;
}

interface ChapterModalState {
  open: boolean;
  chapter: QuizChapter | undefined;
  subjectId: string | undefined;
}

export function QuizMcqContainer() {
  const { filters, setFilter, resetFilters } = useQuizFilters();
  
  // ALL hooks must be called before any conditional returns
  // 1. Query hooks
  const subjectsQuery = useSubjects();
  const chaptersQuery = useChapters(filters.subject);
  const questionsQuery = useQuestions(filters);
  const filterCountsQuery = useFilterCounts(filters);
  
  // 2. State hooks (MUST be before error checks)
  const [questionModal, setQuestionModal] = useState<QuestionModalState>({ 
    open: false, 
    question: undefined 
  });
  const [subjectModal, setSubjectModal] = useState<SubjectModalState>({ 
    open: false, 
    subject: undefined 
  });
  const [chapterModal, setChapterModal] = useState<ChapterModalState>({ 
    open: false,
    chapter: undefined,
    subjectId: undefined
  });
  const [importModal, setImportModal] = useState(false);
  
  // 3. Memo hooks
  const questions = useMemo(() => 
    questionsQuery.data?.pages.flatMap(page => page.data) ?? [],
    [questionsQuery.data]
  );
  const total = questionsQuery.data?.pages[0]?.total ?? 0;

  // 4. Error handling (AFTER all hooks)
  if (subjectsQuery.error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">
            Failed to load subjects
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {subjectsQuery.error instanceof Error ? subjectsQuery.error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => subjectsQuery.refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (questionsQuery.error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">
            Failed to load questions
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {questionsQuery.error instanceof Error ? questionsQuery.error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => questionsQuery.refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      <QuizHeader
        totalQuestions={total}
        onAddQuestion={() => setQuestionModal({ 
          open: true, 
          question: undefined 
        })}
        onImport={() => setImportModal(true)}
      />
      
      <FilterPanel
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
        subjects={subjectsQuery.data ?? []}
        chapters={chaptersQuery.data ?? []}
        filterCounts={filterCountsQuery.data}
        isLoading={subjectsQuery.isLoading}
      />
      
      <QuestionManager
        questions={questions}
        total={total}
        isLoading={questionsQuery.isLoading}
        isFetching={questionsQuery.isFetching}
        hasNextPage={questionsQuery.hasNextPage ?? false}
        onLoadMore={questionsQuery.fetchNextPage}
        onEdit={(q) => setQuestionModal({ 
          open: true, 
          question: q 
        })}
      />
      
      <SubjectModal
        open={subjectModal.open}
        subject={subjectModal.subject}
        onClose={() => setSubjectModal({ 
          open: false, 
          subject: undefined 
        })}
      />
      
      <ChapterModal
        open={chapterModal.open}
        chapter={chapterModal.chapter}
        subjectId={chapterModal.subjectId}
        subjects={subjectsQuery.data ?? []}
        onClose={() => setChapterModal({ 
          open: false,
          chapter: undefined,
          subjectId: undefined
        })}
      />
      
      <QuestionModal
        open={questionModal.open}
        question={questionModal.question}
        subjects={subjectsQuery.data ?? []}
        chapters={chaptersQuery.data ?? []}
        onClose={() => setQuestionModal({ 
          open: false, 
          question: undefined 
        })}
      />
      
      <ImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
      />
    </div>
  );
}

export default QuizMcqContainer;
