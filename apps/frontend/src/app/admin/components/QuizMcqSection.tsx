'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuizFilters } from '@/lib/useQuizFilters';
import { 
  getFilterCounts, 
  getAllQuestions, 
  FilterCountsResponse, 
  QuizQuestion,
  createSubject,
  createChapter,
  createQuestion,
  updateSubject,
  updateChapter,
  updateQuestion,
  deleteSubject,
  deleteChapter,
  deleteQuestion,
  exportQuestionsToCSV,
  parseCSVQuestions,
} from '@/lib/quiz-api';
import { SubjectFilter } from '@/components/ui/quiz-filters/SubjectFilter';
import { ChapterFilter } from '@/components/ui/quiz-filters/ChapterFilter';
import { LevelFilter } from '@/components/ui/quiz-filters/LevelFilter';
import { SearchInput } from '@/components/ui/quiz-filters/SearchInput';
import { StatusFilter } from '@/components/ui/quiz-filters/StatusFilter';
import { QuestionTable } from '@/components/ui/quiz-filters/QuestionTable';
import { SelectedFilters } from '@/components/ui/quiz-filters/SelectedFilters';
import { SubjectModal } from '@/components/ui/quiz-filters/SubjectModal';
import { ChapterModal } from '@/components/ui/quiz-filters/ChapterModal';
import { QuestionModal } from '@/components/ui/quiz-filters/QuestionModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Subject } from '../types';

interface QuizMcqSectionProps {
  allSubjects: Subject[];
}

const QUESTIONS_PAGE_SIZE = 10;

export default function QuizMcqSection({ allSubjects }: QuizMcqSectionProps) {
  const { filters, setFilter, resetFilters } = useQuizFilters();
  
  const [filterCounts, setFilterCounts] = useState<FilterCountsResponse | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectModalMode, setSubjectModalMode] = useState<'add' | 'edit'>('add');
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; emoji: string; category: string; slug: string } | null>(null);

  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [chapterModalMode, setChapterModalMode] = useState<'add' | 'edit'>('add');
  const [editingChapter, setEditingChapter] = useState<{ id: string; name: string; subjectId: string } | null>(null);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionModalMode, setQuestionModalMode] = useState<'add' | 'edit'>('add');
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subject' | 'chapter' | 'question'; id: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize filterParams to prevent infinite loops
  const filterParams = useMemo(() => {
    const params: {
      subject?: string;
      status?: string;
      level?: string;
      chapter?: string;
      search?: string;
    } = {};

    if (filters.subject && filters.subject !== 'all') params.subject = filters.subject;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.level && filters.level !== 'all') params.level = filters.level;
    if (filters.chapter && filters.chapter !== 'all') params.chapter = filters.chapter;
    if (filters.search) params.search = filters.search;

    return params;
  }, [filters.subject, filters.status, filters.level, filters.chapter, filters.search]);

  // Fetch filter counts
  useEffect(() => {
    let cancelled = false;
    
    async function fetchCounts() {
      try {
        const counts = await getFilterCounts(filterParams);
        if (!cancelled) {
          setFilterCounts(counts);
        }
      } catch (error) {
        console.error('Failed to fetch filter counts:', error);
      }
    }
    
    fetchCounts();
    
    return () => { cancelled = true; };
  }, [filterParams]);

  // Fetch questions
  useEffect(() => {
    let cancelled = false;
    
    async function fetchQuestionsData() {
      setIsLoading(true);
      try {
        const result = await getAllQuestions(filterParams, currentPage, QUESTIONS_PAGE_SIZE);
        if (!cancelled) {
          setQuestions(result.data);
          setTotalQuestions(result.total);
        }
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    fetchQuestionsData();
    
    return () => { cancelled = true; };
  }, [filterParams, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.subject, filters.status, filters.level, filters.chapter, filters.search]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRefresh = useCallback(() => {
    Promise.all([
      getFilterCounts(filterParams),
      getAllQuestions(filterParams, currentPage, QUESTIONS_PAGE_SIZE),
    ]).then(([counts, result]) => {
      setFilterCounts(counts);
      setQuestions(result.data);
      setTotalQuestions(result.total);
    }).catch(console.error);
  }, [filterParams, currentPage]);

  // Subject handlers
  const handleAddSubject = () => {
    setSubjectModalMode('add');
    setEditingSubject(null);
    setSubjectModalOpen(true);
  };

  const handleEditSubject = (subject: { id?: string; slug: string; name: string; emoji?: string; category?: string }) => {
    setSubjectModalMode('edit');
    setEditingSubject({ 
      id: subject.id || '', 
      name: subject.name, 
      emoji: subject.emoji || '📚', 
      category: subject.category || '', 
      slug: subject.slug 
    });
    setSubjectModalOpen(true);
  };

  const handleDeleteSubject = (subject: { id?: string; slug: string; name: string }) => {
    if (!subject.id) return;
    setDeleteTarget({ type: 'subject', id: subject.id, name: subject.name });
    setDeleteConfirmOpen(true);
  };

  const handleSaveSubject = async (data: { name: string; emoji: string; category: string }) => {
    try {
      if (subjectModalMode === 'add') {
        const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await createSubject({ ...data, slug });
      } else if (editingSubject) {
        await updateSubject(editingSubject.id, data);
      }
      handleRefresh();
    } catch (error) {
      console.error('Failed to save subject:', error);
    }
  };

  // Chapter handlers
  const handleAddChapter = () => {
    setChapterModalMode('add');
    setEditingChapter(null);
    setChapterModalOpen(true);
  };

  const handleEditChapter = (chapter: { id: string; name: string; subjectId?: string }) => {
    setChapterModalMode('edit');
    setEditingChapter({ id: chapter.id, name: chapter.name, subjectId: chapter.subjectId || '' });
    setChapterModalOpen(true);
  };

  const handleDeleteChapter = (chapter: { id: string; name: string }) => {
    setDeleteTarget({ type: 'chapter', id: chapter.id, name: chapter.name });
    setDeleteConfirmOpen(true);
  };

  const handleSaveChapter = async (data: { name: string; subjectId: string }) => {
    try {
      if (chapterModalMode === 'add') {
        await createChapter(data);
      } else if (editingChapter) {
        await updateChapter(editingChapter.id, data);
      }
      handleRefresh();
    } catch (error) {
      console.error('Failed to save chapter:', error);
    }
  };

  // Question handlers
  const handleAddQuestion = () => {
    setQuestionModalMode('add');
    setEditingQuestion(null);
    setQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setQuestionModalMode('edit');
    setEditingQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (data: any) => {
    try {
      if (questionModalMode === 'add') {
        await createQuestion(data);
      } else if (editingQuestion) {
        await updateQuestion(editingQuestion.id, data);
      }
      handleRefresh();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  // Delete handlers
  const handleDeleteQuestion = (question: QuizQuestion) => {
    setDeleteTarget({ type: 'question', id: question.id, name: question.question.slice(0, 30) + '...' });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      switch (deleteTarget.type) {
        case 'subject':
          await deleteSubject(deleteTarget.id);
          break;
        case 'chapter':
          await deleteChapter(deleteTarget.id);
          break;
        case 'question':
          await deleteQuestion(deleteTarget.id);
          break;
      }
      handleRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // Export handler
  const handleExport = () => {
    exportQuestionsToCSV(questions, filters.subject);
  };

  // Import handler
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const { data, errors } = parseCSVQuestions(text);
    
    if (errors.length > 0) {
      alert(`Import warnings:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`);
    }
    
    if (data.length > 0) {
      alert(`Parsed ${data.length} questions. Note: Import requires chapter/subject to be pre-created.`);
    }
    
    e.target.value = '';
  };

  // Get subject/chapter data for modals
  const subjectsForModal = allSubjects.map(s => ({ id: s.id, name: s.name, slug: s.slug }));
  const chaptersForModal = filterCounts?.chapterCounts.map(c => ({ id: c.id, name: c.name, subjectId: '' })) || [];

  const chapterList = filterCounts?.chapterCounts.map(c => ({ id: c.id, name: c.name })) || [];
  
  const levelCounts: Record<string, number> = {};
  filterCounts?.levelCounts.forEach(l => {
    levelCounts[l.level] = l.count;
  });

  const subjectCounts = filterCounts?.subjectCounts || [];
  const statusCounts = filterCounts?.statusCounts || [];

  // Get subject name for display
  const getSubjectName = (slug: string) => allSubjects.find(s => s.slug === slug)?.name || slug;

  // Prepare subject data with IDs for filter
  const subjectsWithIds = allSubjects.map(s => {
    const countData = subjectCounts.find(sc => sc.slug === s.slug);
    return { 
      id: s.id,
      slug: s.slug, 
      name: s.name, 
      emoji: s.emoji, 
      category: s.category,
      count: countData?.count || 0 
    };
  });

  return (
    <div className="space-y-4">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Status Filter with Actions */}
      <div className="rounded-xl bg-white p-4 shadow-md border border-gray-200">
        <StatusFilter
          value={filters.status || 'all'}
          onChange={(value) => setFilter('status', value)}
          counts={statusCounts}
          onAddQuestion={handleAddQuestion}
          onImport={handleImportClick}
          onExport={handleExport}
        />
      </div>

      {/* Combined Filter Container */}
      <div className="rounded-xl bg-white p-4 shadow-md border border-gray-200 space-y-4">
        {/* Subject Filter */}
        <SubjectFilter
          value={filters.subject || 'all'}
          onChange={(value) => setFilter('subject', value)}
          subjects={subjectsWithIds}
          onAddSubject={handleAddSubject}
          onEditSubject={handleEditSubject}
          onDeleteSubject={handleDeleteSubject}
        />

        {/* Chapter Filter */}
        <ChapterFilter
          value={filters.chapter || 'all'}
          onChange={(value) => setFilter('chapter', value)}
          chapters={chapterList}
          onAddChapter={handleAddChapter}
          onEditChapter={handleEditChapter}
          onDeleteChapter={handleDeleteChapter}
        />

        {/* Level Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 w-16 shrink-0">Level:</span>
          <LevelFilter
            value={filters.level || 'all'}
            onChange={(value) => setFilter('level', value)}
            counts={levelCounts}
          />
        </div>

        {/* Search */}
        <SearchInput
          value={filters.search || ''}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search questions..."
        />

        {/* Selected Filters + Reset */}
        <SelectedFilters
          filters={filters}
          subjectName={filters.subject !== 'all' ? getSubjectName(filters.subject) : undefined}
          chapterName={filters.chapter !== 'all' ? filters.chapter : undefined}
          onRemove={(key) => setFilter(key, key === 'search' ? '' : 'all')}
          onResetAll={resetFilters}
        />
      </div>

      {/* Question Table */}
      <QuestionTable
        questions={questions}
        total={totalQuestions}
        page={currentPage}
        limit={QUESTIONS_PAGE_SIZE}
        onPageChange={handlePageChange}
        onQuestionUpdate={handleRefresh}
        onEditQuestion={handleEditQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        isLoading={isLoading}
      />

      {/* Modals */}
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        mode={subjectModalMode}
        initialData={editingSubject ?? undefined}
      />

      <ChapterModal
        isOpen={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
        onSave={handleSaveChapter}
        mode={chapterModalMode}
        initialData={editingChapter ?? undefined}
        subjects={subjectsForModal}
      />

      <QuestionModal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        onSave={handleSaveQuestion}
        mode={questionModalMode}
        initialData={editingQuestion ?? undefined}
        subjects={subjectsForModal}
        chapters={chaptersForModal}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteTarget?.type || 'item'}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}