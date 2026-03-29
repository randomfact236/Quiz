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
  
  const subjectsQuery = useSubjects();
  const chaptersQuery = useChapters(filters.subject);
  const questionsQuery = useQuestions(filters);
  const filterCountsQuery = useFilterCounts(filters);
  
  const questions = useMemo(() => 
    questionsQuery.data?.pages.flatMap(page => page.data) ?? [],
    [questionsQuery.data]
  );
  const total = questionsQuery.data?.pages[0]?.total ?? 0;
  
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
