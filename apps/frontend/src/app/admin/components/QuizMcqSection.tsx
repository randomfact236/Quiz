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
  bulkActionQuestions,
} from '@/lib/quiz-api';
import { importQuestionsFromCSV } from '@/app/admin/utils/quiz-importer';
import { SubjectFilter } from '@/components/ui/quiz-filters/SubjectFilter';
import { ChapterFilter } from '@/components/ui/quiz-filters/ChapterFilter';
import { LevelFilter } from '@/components/ui/quiz-filters/LevelFilter';
import { SearchInput } from '@/components/ui/quiz-filters/SearchInput';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { QuestionTable } from '@/components/ui/quiz-filters/QuestionTable';
import { SelectedFilters } from '@/components/ui/quiz-filters/SelectedFilters';
import { SubjectModal } from '@/components/ui/quiz-filters/SubjectModal';
import { ChapterModal } from '@/components/ui/quiz-filters/ChapterModal';
import { QuestionModal } from '@/components/ui/quiz-filters/QuestionModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { Subject } from '../types';
import type { BulkActionType, StatusFilter as BulkStatusFilter } from '@/types/status.types';

interface QuizMcqSectionProps {
  allSubjects: Subject[];
  onSubjectsChange?: () => void;
}

const QUESTIONS_PAGE_SIZE = 10;

export default function QuizMcqSection({ allSubjects, onSubjectsChange }: QuizMcqSectionProps) {
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

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{ subjectName: string; questionCount: number; errors: string[]; warnings: string[] } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [lastImportContent, setLastImportContent] = useState('');

  // Page size state
  const [pageSize, setPageSize] = useState(QUESTIONS_PAGE_SIZE);

  // Memoize countParams for COUNTS (excludes status - shows subject/chapter-filtered counts)
  // We need status counts filtered by selected subject/chapter/level
  const countParams = useMemo(() => {
    const params: {
      subject?: string;
      chapter?: string;
      search?: string;
    } = {};

    if (filters.subject && filters.subject !== 'all') params.subject = filters.subject;
    if (filters.chapter && filters.chapter !== 'all') params.chapter = filters.chapter;
    if (filters.search) params.search = filters.search;
    // Note: status EXCLUDED - we want to see counts for ALL statuses

    return params;
  }, [filters.subject, filters.chapter, filters.search]);

  // Memoize dataParams for TABLE DATA (includes ALL filters)
  const dataParams = useMemo(() => {
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

  // Fetch filter counts (uses countParams - excludes status)
  useEffect(() => {
    let cancelled = false;
    
    async function fetchCounts() {
      try {
        const counts = await getFilterCounts(countParams);
        if (!cancelled) {
          setFilterCounts(counts);
        }
      } catch (error) {
        console.error('Failed to fetch filter counts:', error);
      }
    }
    
    fetchCounts();
    
    return () => { cancelled = true; };
  }, [countParams]);

  // Fetch questions (uses dataParams - includes ALL filters)
  useEffect(() => {
    let cancelled = false;
    
    async function fetchQuestionsData() {
      setIsLoading(true);
      try {
        const result = await getAllQuestions(dataParams, currentPage, QUESTIONS_PAGE_SIZE);
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
  }, [dataParams, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.subject, filters.status, filters.level, filters.chapter, filters.search, pageSize]);

  // Reset chapter filter when subject changes and current chapter doesn't belong to new subject
  useEffect(() => {
    if (filters.chapter && filters.chapter !== 'all' && filters.subject && filters.subject !== 'all') {
      const selectedSubject = allSubjects.find(s => s.slug === filters.subject);
      if (selectedSubject) {
        // Check if current chapter belongs to selected subject
        const chapterBelongsToSubject = filterCounts?.chapterCounts.some(
          ch => ch.name === filters.chapter && ch.subjectId === selectedSubject.id
        );
        if (!chapterBelongsToSubject) {
          setFilter('chapter', 'all');
        }
      }
    }
  }, [filters.subject, filters.chapter, filterCounts?.chapterCounts, allSubjects, setFilter]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRefresh = useCallback(() => {
    Promise.all([
      getFilterCounts(countParams),
      getAllQuestions(dataParams, currentPage, pageSize),
    ]).then(([counts, result]) => {
      setFilterCounts(counts);
      setQuestions(result.data);
      setTotalQuestions(result.total);
    }).catch(console.error);
  }, [countParams, dataParams, currentPage, pageSize]);

  // Bulk action handlers
  const handleBulkAction = useCallback(async (action: BulkActionType) => {
    if (selectedIds.length === 0) return;
    
    // Map 'restore' to 'publish' since API doesn't support restore
    const apiAction = action === 'restore' ? 'publish' : action;
    
    setBulkActionLoading(true);
    try {
      await bulkActionQuestions(selectedIds, apiAction as 'publish' | 'draft' | 'trash' | 'delete');
      setSelectedIds([]);
      handleRefresh();
    } catch (error) {
      console.error(`Failed to ${action} questions:`, error);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds, handleRefresh]);

  // Import handlers
  const handleFileUpload = useCallback(async (file: File) => {
    setImportLoading(true);
    setImportError('');
    setImportSuccess('');
    
    try {
      const content = await file.text();
      setLastImportContent(content);
      
      const result = await importQuestionsFromCSV(content, allSubjects);
      
      if (result.errors.length > 0) {
        setImportError(result.errors.join('\n'));
        setImportPreview(null);
      } else {
        setImportPreview({
          subjectName: result.subjectName,
          questionCount: result.questionsImported,
          errors: result.errors,
          warnings: result.warnings,
        });
      }
    } catch (err) {
      setImportError('Failed to read file: ' + (err as Error).message);
    } finally {
      setImportLoading(false);
    }
  }, [allSubjects]);

  const handleConfirmImport = useCallback(async () => {
    if (!importPreview) return;

    setImportLoading(true);
    try {
      const result = await importQuestionsFromCSV(lastImportContent, allSubjects);

      if (result.success) {
        const msg = `✅ Imported ${result.questionsImported} questions into "${result.subjectName}"` +
          (result.warnings.length > 0 ? ` (${result.warnings.length} warnings)` : '');
        setImportSuccess(msg);
        setImportPreview(null);
        setLastImportContent('');

        // Refresh data
        handleRefresh();
        onSubjectsChange?.();

        // Auto-close after short delay
        setTimeout(() => {
          setShowImportModal(false);
          setImportSuccess('');
        }, 2500);
      } else {
        setImportError(
          result.errors.join('\n') ||
          'Import failed. Check that your CSV matches the required format.'
        );
        setImportPreview(null);
      }
    } catch (err) {
      setImportError('Failed to import: ' + (err as Error).message);
    } finally {
      setImportLoading(false);
    }
  }, [importPreview, lastImportContent, allSubjects, handleRefresh, onSubjectsChange]);

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
      onSubjectsChange?.();
    } catch (error: any) {
      console.error('Failed to save subject:', error);
      const errorMessage = error?.message || 'Failed to save subject';
      alert(errorMessage);
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
      onSubjectsChange?.();
    } catch (error: any) {
      console.error('Failed to save chapter:', error);
      const errorMessage = error?.message || 'Failed to save chapter';
      alert(errorMessage);
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
          onSubjectsChange?.();
          break;
        case 'chapter':
          await deleteChapter(deleteTarget.id);
          onSubjectsChange?.();
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
    setShowImportModal(true);
    setImportPreview(null);
    setImportError('');
    setImportSuccess('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleFileUpload(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get subject/chapter data for modals
  const subjectsForModal = allSubjects.map(s => ({ id: s.id, name: s.name, slug: s.slug }));
  const chaptersForModal = filterCounts?.chapterCounts.map(c => ({ id: c.id, name: c.name, subjectId: c.subjectId })) || [];

  // Chapter list with counts and subjectId for cascading
  const chapterList = filterCounts?.chapterCounts.map(c => ({ 
    id: c.id, 
    name: c.name, 
    count: c.count,
    subjectId: c.subjectId 
  })) || [];

  // Filter chapters by selected subject (cascading)
  const visibleChapters = useMemo(() => {
    if (filters.subject === 'all') return chapterList;
    
    const selectedSubject = allSubjects.find(s => s.slug === filters.subject);
    if (!selectedSubject) return chapterList;
    
    return chapterList.filter(ch => ch.subjectId === selectedSubject.id);
  }, [chapterList, filters.subject, allSubjects]);
  
  const levelCounts: Record<string, number> = {};
  filterCounts?.levelCounts.forEach(l => {
    levelCounts[l.level] = l.count;
  });

  const subjectCounts = filterCounts?.subjectCounts || [];
  const statusCounts = filterCounts?.statusCounts || [];

  // Get subject name for display
  const getSubjectName = (slug: string) => allSubjects.find(s => s.slug === slug)?.name || slug;

  // Prepare subject data with counts from API - include ALL subjects from props
  const subjectsWithIds = useMemo(() => {
    return allSubjects.map(s => {
      const countData = subjectCounts.find(sc => sc.slug === s.slug);
      return { 
        id: s.id,
        slug: s.slug, 
        name: s.name, 
        emoji: s.emoji || '📚', 
        category: s.category || 'academic',
        count: countData?.count || 0 
      };
    });
  }, [subjectCounts, allSubjects]);

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

      {/* Action Buttons - Above all containers */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleAddQuestion}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Add Question
        </button>
        <button
          onClick={handleImportClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 11l4-4 4 4M4 17h16"/></svg>
          Import
        </button>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3M8 7l4-4 4 4M4 17h16"/></svg>
          Export
        </button>
      </div>

      {/* Status Dashboard */}
      <div className="rounded-xl bg-white p-4 shadow-md border border-gray-200">
        <StatusDashboard
          counts={{
            total: statusCounts.find(s => s.status === 'all')?.count || 
                   (statusCounts.find(s => s.status === 'published')?.count || 0) +
                   (statusCounts.find(s => s.status === 'draft')?.count || 0) +
                   (statusCounts.find(s => s.status === 'trash')?.count || 0),
            published: statusCounts.find(s => s.status === 'published')?.count || 0,
            draft: statusCounts.find(s => s.status === 'draft')?.count || 0,
            trash: statusCounts.find(s => s.status === 'trash')?.count || 0,
          }}
          activeFilter={(filters.status === 'all' || filters.status === 'published' || filters.status === 'draft' || filters.status === 'trash') ? filters.status : 'all'}
          onFilterChange={(filter) => setFilter('status', filter)}
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

        {/* Chapter Filter - shows only chapters for selected subject */}
        <ChapterFilter
          value={filters.chapter || 'all'}
          onChange={(value) => setFilter('chapter', value)}
          chapters={visibleChapters}
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

      {/* Page Size Selector */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Question Table */}
      <QuestionTable
        questions={questions}
        total={totalQuestions}
        page={currentPage}
        limit={pageSize}
        onPageChange={handlePageChange}
        onQuestionUpdate={handleRefresh}
        onEditQuestion={handleEditQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        isLoading={isLoading}
      />

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        totalItems={questions.length}
        currentFilter={filters.status as BulkStatusFilter}
        onSelectAll={() => setSelectedIds(questions.map(q => q.id))}
        onDeselectAll={() => setSelectedIds([])}
        onAction={handleBulkAction}
        onClose={() => setSelectedIds([])}
        loading={bulkActionLoading}
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

      {/* Import Modal */}
      {showImportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImportModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📥 Import Questions from CSV
              </h3>

              <div className="space-y-4">
                {/* File Upload */}
                {!importLoading && !importSuccess && !importPreview && (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="import-file"
                      />
                      <label htmlFor="import-file" className="cursor-pointer block">
                        <div className="text-gray-500 mb-2">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="font-medium">Drag and drop your CSV file here, or click to browse</p>
                        </div>
                      </label>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                      <p className="font-medium">Required CSV Format:</p>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                        # Subject: SubjectName
                      </code>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                        ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
                      </code>
                      <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                        <p>• <strong>easy</strong> — True/False (Option A = FALSE, Option B = TRUE)</p>
                        <p>• <strong>medium</strong> — 2 options (A, B)</p>
                        <p>• <strong>hard</strong> — 3 options (A, B, C)</p>
                        <p>• <strong>expert</strong> — 4 options (A, B, C, D)</p>
                        <p>• <strong>extreme</strong> — open answer (Correct Answer column = answer text)</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Import Preview */}
                {importPreview && !importSuccess && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="font-semibold text-blue-900">Import Preview</p>
                          <p className="text-sm text-blue-700">
                            {importPreview.questionCount} questions found for subject: <strong>{importPreview.subjectName}</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {importPreview.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-semibold text-yellow-800 mb-2">⚠️ Warnings ({importPreview.warnings.length})</p>
                        <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                          {importPreview.warnings.map((warning, idx) => (
                            <li key={idx} className="text-xs">• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confirm/Cancel Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setImportPreview(null); setLastImportContent(''); }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        ✕ Cancel
                      </button>
                      <button
                        onClick={handleConfirmImport}
                        disabled={importLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                      >
                        ✅ Confirm Import
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {importLoading && (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Importing questions to database…</p>
                    <p className="text-gray-400 text-sm">This may take a moment for large files</p>
                  </div>
                )}

                {/* Success State */}
                {importSuccess && (
                  <div className="flex flex-col items-center py-6 gap-3 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-green-700 font-semibold">{importSuccess}</p>
                    <p className="text-gray-400 text-sm">Modal will close automatically…</p>
                  </div>
                )}

                {/* Error State */}
                {importError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-800 mb-2">❌ Error</p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">{importError}</p>
                    <button
                      onClick={() => setImportError('')}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}