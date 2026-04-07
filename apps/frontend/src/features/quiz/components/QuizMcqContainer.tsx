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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportQuestionsFromBackend } from '@/lib/quiz-api';
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

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function QuizMcqContainer() {
  const { filters, setFilter, resetFilters } = useQuizFilters();

  // ALL hooks must be called before any conditional returns
  // 1. State hooks (MUST be before error checks and query hooks)
  const [pageSize, setPageSize] = useState(20);
  const [questionModal, setQuestionModal] = useState<QuestionModalState>({
    open: false,
    question: undefined,
  });
  const [subjectModal, setSubjectModal] = useState<SubjectModalState>({
    open: false,
    subject: undefined,
  });
  const [chapterModal, setChapterModal] = useState<ChapterModalState>({
    open: false,
    chapter: undefined,
    subjectId: undefined,
  });
  const [importModal, setImportModal] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 2. Query hooks
  const subjectsQuery = useSubjects();
  const selectedSubject = subjectsQuery.data?.find((s) => s.slug === filters.subject);
  const chaptersQuery = useChapters(selectedSubject?.id);
  const questionsQuery = useQuestions(filters, pageSize);
  const filterCountsQuery = useFilterCounts(filters);

  // 3. Memo hooks
  const questions = useMemo(
    () => questionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [questionsQuery.data]
  );
  const total = questionsQuery.data?.pages[0]?.total ?? 0;

  // 4. Error handling (AFTER all hooks)
  if (subjectsQuery.error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">Failed to load subjects</p>
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
          <p className="text-red-700 dark:text-red-300 font-medium">Failed to load questions</p>
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

  const handleDeleteSubject = (subject: QuizSubject) => {
    setConfirm({
      open: true,
      title: 'Delete Subject',
      message: `Delete subject "${subject.name}"? This will also delete all chapters in this subject.`,
      onConfirm: () => {
        subjectsQuery.delete(subject.id);
        setConfirm((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleDeleteChapter = (chapter: QuizChapter) => {
    setConfirm({
      open: true,
      title: 'Delete Chapter',
      message: `Delete chapter "${chapter.name}"?`,
      onConfirm: () => {
        chaptersQuery.delete({ id: chapter.id, subjectId: chapter.subjectId });
        setConfirm((prev) => ({ ...prev, open: false }));
      },
    });
  };

  return (
    <div className="space-y-6 p-6">
      <QuizHeader
        totalQuestions={total}
        onAddQuestion={() =>
          setQuestionModal({
            open: true,
            question: undefined,
          })
        }
        onImport={() => setImportModal(true)}
        onExport={() => {
          const exportFilters: {
            subject?: string;
            level?: string;
            chapter?: string;
            status?: string;
          } = {};
          if (filters.subject && filters.subject !== 'all') exportFilters.subject = filters.subject;
          if (filters.level && filters.level !== 'all') exportFilters.level = filters.level;
          if (filters.chapter && filters.chapter !== 'all') exportFilters.chapter = filters.chapter;
          if (filters.status && filters.status !== 'all') exportFilters.status = filters.status;
          exportQuestionsFromBackend(exportFilters);
        }}
      />

      <FilterPanel
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
        subjects={subjectsQuery.data ?? []}
        chapters={chaptersQuery.data ?? []}
        filterCounts={filterCountsQuery.data}
        isLoading={subjectsQuery.isLoading}
        onAddSubject={() => setSubjectModal({ open: true, subject: undefined })}
        onEditSubject={(s) => setSubjectModal({ open: true, subject: s })}
        onDeleteSubject={handleDeleteSubject}
        onAddChapter={() => {
          if (filters.subject) {
            const subject = subjectsQuery.data?.find((s) => s.slug === filters.subject);
            setChapterModal({ open: true, chapter: undefined, subjectId: subject?.id });
          } else {
            setChapterModal({ open: true, chapter: undefined, subjectId: undefined });
          }
        }}
        onEditChapter={(c) => setChapterModal({ open: true, chapter: c, subjectId: c.subjectId })}
        onDeleteChapter={handleDeleteChapter}
      />

      <QuestionManager
        questions={questions}
        total={total}
        isLoading={questionsQuery.isLoading}
        isFetching={questionsQuery.isFetching}
        hasNextPage={questionsQuery.hasNextPage ?? false}
        onLoadMore={questionsQuery.fetchNextPage}
        onEdit={(q) =>
          setQuestionModal({
            open: true,
            question: q,
          })
        }
        statusFilter={filters.status || 'all'}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <SubjectModal
        open={subjectModal.open}
        subject={subjectModal.subject}
        onClose={() =>
          setSubjectModal({
            open: false,
            subject: undefined,
          })
        }
      />

      <ChapterModal
        open={chapterModal.open}
        chapter={chapterModal.chapter}
        subjectId={chapterModal.subjectId}
        subjects={subjectsQuery.data ?? []}
        onClose={() =>
          setChapterModal({
            open: false,
            chapter: undefined,
            subjectId: undefined,
          })
        }
      />

      <QuestionModal
        open={questionModal.open}
        question={questionModal.question}
        subjects={subjectsQuery.data ?? []}
        chapters={chaptersQuery.data ?? []}
        onClose={() =>
          setQuestionModal({
            open: false,
            question: undefined,
          })
        }
      />

      <ImportModal open={importModal} onClose={() => setImportModal(false)} />

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm((prev) => ({ ...prev, open: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

export default QuizMcqContainer;
