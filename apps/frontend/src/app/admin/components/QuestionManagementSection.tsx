'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FileUploader } from '@/components/ui/FileUploader';
import { Pencil, Trash2, FileQuestion } from 'lucide-react';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { Question, Subject, ContentStatus, BulkActionType, StatusFilter } from '../types';
import { downloadFile, parseQuestionCSV, exportQuestionsToCSV } from '../utils';

/**
 * Props for the QuestionManagementSection component
 */
interface QuestionManagementSectionProps {
  /** Currently selected subject */
  subject: Subject;
  /** Array of questions for the selected subject */
  questions: Question[];
  /** All available subjects for filtering */
  allSubjects: Subject[];
  /** Callback when a subject is selected from filters */
  onSubjectSelect: (slug: string) => void;
  /** Callback to add a new chapter */
  onAddChapter: () => void;
  /** Callback when questions are imported */
  onQuestionsImport: (subjectSlug: string, newQuestions: Question[]) => void;
  /** Callback when questions are updated (edited, deleted, status changed) */
  onQuestionsUpdate: (subjectSlug: string, updatedQuestions: Question[]) => void;
}

/**
 * Question form state type
 */
interface QuestionFormState {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: Question['correctAnswer'];
  level: Question['level'];
  chapter: string;
}



/**
 * QuestionManagementSection
 *
 * A comprehensive component for managing quiz questions including:
 * - Question list display with filtering by level, chapter, and search term
 * - Add/Edit question modal with form validation
 * - Bulk actions (publish, draft, trash, delete, restore)
 * - Subject and chapter filtering
 * - Import/Export functionality (CSV and JSON)
 *
 * @param props - Component properties
 * @returns JSX Element
 */
export function QuestionManagementSection({
  subject,
  questions,
  allSubjects,
  onSubjectSelect,
  onAddChapter,
  onQuestionsImport,
  onQuestionsUpdate,
}: QuestionManagementSectionProps): JSX.Element {
  // Filter states
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('published');

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Data states
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const questionsPerPage = 10;

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState<Partial<Question>[]>([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [uploadKey, setUploadKey] = useState(0); // Used to force FileUploader remount

  // Reset import state when modal opens
  useEffect(() => {
    if (showImportModal) {
      setImportError('');
      setImportPreview([]);
      setUploadKey(prev => prev + 1); // Force FileUploader remount
    }
  }, [showImportModal]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModalRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Form state for adding question
  const [questionForm, setQuestionForm] = useState<QuestionFormState>({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    level: 'easy',
    chapter: '',
  });

  // Chapter editing state
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingChapterName, setEditingChapterName] = useState('');

  // Sync local questions when props change (from parent/localStorage)
  useEffect(() => {
    setLocalQuestions(questions.map((q) => ({ ...q, status: q.status || 'published' })));
  }, [questions]);

  // Persist local questions changes back to parent
  const prevLocalQuestionsRef = useRef(localQuestions);
  useEffect(() => {
    // Only update parent if localQuestions actually changed from previous render
    const isDifferent = JSON.stringify(prevLocalQuestionsRef.current) !== JSON.stringify(localQuestions);
    if (isDifferent) {
      prevLocalQuestionsRef.current = localQuestions;
      onQuestionsUpdate(subject.slug, localQuestions);
    }
  }, [localQuestions, subject.slug, onQuestionsUpdate]);

  // Get unique chapters for this subject - memoized
  const chapters = useMemo(() => 
    [...new Set(localQuestions.map((q) => q.chapter))],
    [localQuestions]
  );

  // Calculate status counts - memoized
  const statusCounts = useMemo(() => ({
    total: localQuestions.length,
    published: localQuestions.filter((q) => q.status === 'published').length,
    draft: localQuestions.filter((q) => q.status === 'draft').length,
    trash: localQuestions.filter((q) => q.status === 'trash').length,
  }), [localQuestions]);

  // Calculate chapter question counts - memoized
  const chapterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    localQuestions.forEach((q) => {
      counts[q.chapter] = (counts[q.chapter] || 0) + 1;
    });
    return counts;
  }, [localQuestions]);

  // Calculate level question counts - memoized
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: localQuestions.length };
    localQuestions.forEach((q) => {
      counts[q.level] = (counts[q.level] || 0) + 1;
    });
    return counts;
  }, [localQuestions]);

  // Filter questions - memoized
  const filteredQuestions = useMemo(() => {
    return localQuestions.filter((q) => {
      const matchesLevel = filterLevel === 'all' || q.level === filterLevel;
      const matchesChapter = filterChapter === 'all' || q.chapter === filterChapter;
      const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesLevel && matchesChapter && matchesSearch && matchesStatus;
    });
  }, [localQuestions, filterLevel, filterChapter, searchTerm, statusFilter]);

  // Pagination calculations - memoized
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const paginatedQuestions = useMemo(() => 
    filteredQuestions.slice(startIndex, startIndex + questionsPerPage),
    [filteredQuestions, startIndex, questionsPerPage]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [filterLevel, filterChapter, searchTerm, statusFilter]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // Handle page input change
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageInput(value);
  };

  // Handle page input submit (on Enter or blur)
  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(paginatedQuestions.map((q) => String(q.id)));
  }, [paginatedQuestions]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Get status badge color
  const getStatusBadgeColor = useCallback((status?: ContentStatus): string => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'trash':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Get level badge color
  const getLevelBadgeColor = useCallback((level: string): string => {
    switch (level) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      case 'extreme':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Get level button color
  const getLevelButtonColor = useCallback((level: string): string => {
    switch (level) {
      case 'easy':
        return 'bg-green-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'hard':
        return 'bg-orange-500 text-white';
      case 'expert':
        return 'bg-red-500 text-white';
      case 'extreme':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }, []);

  // Bulk action handler
  const handleBulkAction = useCallback(
    async (action: BulkActionType) => {
      setBulkActionLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setLocalQuestions((prev) =>
        prev
          .map((q) => {
            if (selectedIds.includes(String(q.id))) {
              switch (action) {
                case 'publish':
                  return { ...q, status: 'published' as ContentStatus };
                case 'draft':
                  return { ...q, status: 'draft' as ContentStatus };
                case 'trash':
                  return { ...q, status: 'trash' as ContentStatus };
                case 'delete':
                  return null;
                case 'restore':
                  return { ...q, status: 'draft' as ContentStatus };
                default:
                  return q;
              }
            }
            return q;
          })
          .filter(Boolean) as Question[]
      );

      setSelectedIds([]);
      setBulkActionLoading(false);
    },
    [selectedIds]
  );

  // Reset form
  const resetQuestionForm = useCallback(() => {
    setQuestionForm({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      level: 'easy',
      chapter: '',
    });
  }, []);

  // Handle add question
  const handleAddQuestion = useCallback(() => {
    if (
      !questionForm.question.trim() ||
      !questionForm.optionA.trim() ||
      !questionForm.optionB.trim() ||
      !questionForm.chapter.trim()
    ) {
      return;
    }

    const newQuestion: Question = {
      id: Date.now(),
      question: questionForm.question.trim(),
      optionA: questionForm.optionA.trim(),
      optionB: questionForm.optionB.trim(),
      optionC: questionForm.optionC.trim(),
      optionD: questionForm.optionD.trim(),
      correctAnswer: questionForm.correctAnswer,
      level: questionForm.level,
      chapter: questionForm.chapter.trim(),
      status: 'draft',
    };

    onQuestionsImport(subject.slug, [newQuestion]);
    setShowAddModal(false);
    resetQuestionForm();
  }, [questionForm, subject.slug, onQuestionsImport, resetQuestionForm]);

  // Handle edit question
  const handleEditQuestion = useCallback(() => {
    if (!selectedQuestion) return;
    
    if (
      !questionForm.question.trim() ||
      !questionForm.optionA.trim() ||
      !questionForm.optionB.trim() ||
      !questionForm.chapter.trim()
    ) {
      return;
    }

    const updatedQuestion: Question = {
      ...selectedQuestion,
      question: questionForm.question.trim(),
      optionA: questionForm.optionA.trim(),
      optionB: questionForm.optionB.trim(),
      optionC: questionForm.optionC.trim(),
      optionD: questionForm.optionD.trim(),
      correctAnswer: questionForm.correctAnswer,
      level: questionForm.level,
      chapter: questionForm.chapter.trim(),
    };

    setLocalQuestions(prev => 
      prev.map(q => q.id === selectedQuestion.id ? updatedQuestion : q)
    );
    setShowEditModal(false);
    setSelectedQuestion(null);
    resetQuestionForm();
  }, [questionForm, selectedQuestion, resetQuestionForm]);

  // Handle delete question
  const handleDeleteQuestion = useCallback(() => {
    if (!selectedQuestion) return;

    if (selectedQuestion.status === 'trash') {
      // Permanent delete if already in trash
      setLocalQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id));
    } else {
      // Move to trash otherwise
      setLocalQuestions(prev => 
        prev.map(q => q.id === selectedQuestion.id ? { ...q, status: 'trash' as ContentStatus } : q)
      );
    }
    // Close modal and clear selection immediately
    setShowDeleteModal(false);
    setSelectedQuestion(null);
  }, [selectedQuestion]);

  // Open edit modal with question data
  const openEditModal = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setQuestionForm({
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      level: question.level,
      chapter: question.chapter,
    });
    setShowEditModal(true);
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  }, []);

  // Export to CSV using the standardized format
  const handleExportCSV = useCallback(() => {
    const csv = exportQuestionsToCSV(filteredQuestions, subject.name);
    downloadFile(csv, `${subject.name.replace(/\s+/g, '_').toLowerCase()}_questions.csv`, 'text/csv');
  }, [filteredQuestions, subject.name]);

  // Export to JSON
  const handleExportJSON = useCallback(() => {
    const data = {
      subject: subject.name,
      exportedAt: new Date().toISOString(),
      questions: filteredQuestions,
    };
    downloadFile(JSON.stringify(data, null, 2), `${subject.name}_questions.json`, 'application/json');
  }, [filteredQuestions, subject.name]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (file: File) => {
      setImportError('');
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          let parsed: Partial<Question>[] = [];

          // Parse as JSON for .json files, CSV for .csv files
          const fileName = file.name.toLowerCase();
          if (fileName.endsWith('.json')) {
            const data = JSON.parse(content);
            parsed = Array.isArray(data.questions)
              ? data.questions
              : Array.isArray(data)
                ? data
                : [];
          } else {
            // Use the new CSV parser that handles animals-questions.csv format
            const result = parseQuestionCSV(content);
            if (result.failed.length > 0 && result.imported.length === 0) {
              setImportError(`Import failed: ${result.failed.map(f => `Row ${f.row}: ${f.error}`).join(', ')}`);
              return;
            }
            if (result.failed.length > 0) {
              console.warn('Some rows failed to import:', result.failed);
            }
            parsed = result.imported;
          }

          if (parsed.length === 0) {
            setImportError('No valid questions found in file');
            return;
          }

          setImportPreview(parsed);
        } catch (err) {
          setImportError('Failed to parse file: ' + (err as Error).message);
        }
      };

      reader.readAsText(file);
    },
    []
  );

  // Confirm import
  const handleConfirmImport = useCallback(() => {
    const newQuestions: Question[] = importPreview
      .filter((q) => q.question?.trim())
      .map((q, index) => ({
        id: Date.now() + index,
        question: q.question?.trim() ?? '',
        optionA: q.optionA?.trim() ?? '',
        optionB: q.optionB?.trim() ?? '',
        optionC: q.optionC?.trim() ?? '',
        optionD: q.optionD?.trim() ?? '',
        correctAnswer: (q.correctAnswer?.trim() as Question['correctAnswer']) ?? 'A',
        level: (q.level as Question['level']) ?? 'easy',
        chapter: q.chapter?.trim() ?? 'General',
        status: 'draft',
      }));

    onQuestionsImport(subject.slug, newQuestions);
    setShowImportModal(false);
    setImportPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [importPreview, subject.slug, onQuestionsImport]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterLevel('all');
    setFilterChapter('all');
    setStatusFilter('all');
  }, []);

  // Handle chapter rename
  const handleStartEditChapter = useCallback((chapterName: string) => {
    setEditingChapter(chapterName);
    setEditingChapterName(chapterName);
  }, []);

  const handleCancelEditChapter = useCallback(() => {
    setEditingChapter(null);
    setEditingChapterName('');
  }, []);

  const handleSaveChapterName = useCallback(() => {
    if (!editingChapter || !editingChapterName.trim() || editingChapterName.trim() === editingChapter) {
      setEditingChapter(null);
      return;
    }

    const newName = editingChapterName.trim();
    
    // Update all questions with the old chapter name
    setLocalQuestions(prev => prev.map(q => 
      q.chapter === editingChapter ? { ...q, chapter: newName } : q
    ));
    
    // If the filter was set to the old chapter, update it
    if (filterChapter === editingChapter) {
      setFilterChapter(newName);
    }
    
    setEditingChapter(null);
    setEditingChapterName('');
  }, [editingChapter, editingChapterName, filterChapter]);

  // Handle outside click for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle outside click for import modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importModalRef.current && !importModalRef.current.contains(event.target as Node)) {
        setShowImportModal(false);
        setImportError('');
        setImportPreview([]);
      }
    };
    if (showImportModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showImportModal]);

  // Handle outside click for add question modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
        resetQuestionForm();
      }
    };
    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showAddModal, resetQuestionForm]);

  // Handle outside click for edit question modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowEditModal(false);
        setSelectedQuestion(null);
        resetQuestionForm();
      }
    };
    if (showEditModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showEditModal, resetQuestionForm]);

  // Handle outside click for delete modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setShowDeleteModal(false);
        setSelectedQuestion(null);
      }
    };
    if (showDeleteModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showDeleteModal]);

  const hasActiveFilters = searchTerm || filterLevel !== 'all' || filterChapter !== 'all' || statusFilter !== 'all';

  return (
    <div>
      {/* Subject Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl" role="img" aria-label={`${subject.name} emoji`}>
            {subject.emoji}
          </span>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
            <p className="text-sm text-gray-500">{questions.length} total questions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 flex items-center gap-2"
              aria-expanded={showExportDropdown}
              aria-haspopup="listbox"
            >
              <span role="img" aria-hidden="true">
                📤
              </span>{' '}
              Export
            </button>
            {showExportDropdown && (
              <div
                className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-10"
                role="listbox"
                aria-label="Export options"
              >
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg text-sm"
                  role="option"
                  aria-selected="false"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg text-sm"
                  role="option"
                  aria-selected="false"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 flex items-center gap-2"
          >
            <span role="img" aria-hidden="true">
              📥
            </span>{' '}
            Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* Status Dashboard */}
      <div className="mb-4">
        <StatusDashboard
          counts={statusCounts}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          loading={false}
        />
      </div>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        totalItems={filteredQuestions.length}
        currentFilter={statusFilter}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onAction={handleBulkAction}
        onClose={deselectAll}
        loading={bulkActionLoading}
      />

      {/* Filter Bar */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md space-y-4">
        {/* Subject Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Subject:</span>
          {allSubjects.map((s) => (
            <button
              key={s.slug}
              onClick={() => onSubjectSelect(s.slug)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                subject.slug === s.slug
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={subject.slug === s.slug}
            >
              <span role="img" aria-hidden="true">
                {s.emoji}
              </span>{' '}
              {s.name}
            </button>
          ))}
        </div>

        {/* Chapter Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Chapter:</span>
          <button
            onClick={() => setFilterChapter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterChapter === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filterChapter === 'all'}
          >
            All Chapters <span className="opacity-70">({localQuestions.length})</span>
          </button>
          {chapters.map((ch) => (
            <div key={ch} className="flex items-center gap-1">
              {editingChapter === ch ? (
                <>
                  <input
                    type="text"
                    value={editingChapterName}
                    onChange={(e) => setEditingChapterName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveChapterName();
                      if (e.key === 'Escape') handleCancelEditChapter();
                    }}
                    className="px-2 py-1 text-sm border rounded-lg w-32"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveChapterName}
                    className="text-green-600 hover:text-green-800 px-1"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEditChapter}
                    className="text-red-600 hover:text-red-800 px-1"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setFilterChapter(ch)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterChapter === ch
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-pressed={filterChapter === ch}
                  >
                    {ch} <span className="opacity-70">({chapterCounts[ch] || 0})</span>
                  </button>
                  <button
                    onClick={() => handleStartEditChapter(ch)}
                    className="text-gray-400 hover:text-gray-600 px-1 opacity-0 hover:opacity-100 transition-opacity"
                    title="Edit chapter name"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
          <button
            onClick={onAddChapter}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1"
          >
            <span>+</span> Add Chapter
          </button>
        </div>

        {/* Level Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Level:</span>
          {['all', 'easy', 'medium', 'hard', 'expert', 'extreme'].map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filterLevel === level
                  ? level === 'all'
                    ? 'bg-purple-500 text-white'
                    : getLevelButtonColor(level)
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={filterLevel === level}
            >
              {level === 'all' ? 'All Levels' : level}{' '}
              <span className="opacity-70">({levelCounts[level] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-2">
          <label htmlFor="question-search" className="text-sm font-medium text-gray-600">
            Search:
          </label>
          <input
            id="question-search"
            type="text"
            placeholder="Type to search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
            aria-label="Search questions by keyword"
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
          <div ref={importModalRef} className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <h3 id="import-modal-title" className="text-xl font-bold mb-4">
              Bulk Import Questions
            </h3>

            {!importPreview.length ? (
              <div className="space-y-4">
                <FileUploader
                  key={uploadKey}
                  onFileSelect={handleFileUpload}
                  accept=".csv,.json"
                  label="Select CSV or JSON File"
                  description="Drag and drop your CSV or JSON file here, or click to browse"
                />

                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p className="font-medium mb-2">CSV Format (with headers):</p>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto mb-2">
                    # Subject: SubjectName
                  </code>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                    ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
                  </code>
                  <p className="text-xs text-gray-600 mt-1 mb-3">
                    Supports: comment lines (#), quoted values, empty options for True/False questions
                  </p>
                  <p className="font-medium mb-2">JSON Format:</p>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                    {`{"questions": [{"question": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctAnswer": "A", "level": "easy", "chapter": "..."}]}`}
                  </code>
                </div>

                {importError && (
                  <p className="text-red-500 text-sm" role="alert">
                    {importError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportError('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-green-600 font-medium">
                  ✓ Found {importPreview.length} questions to import
                </p>

                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Question</th>
                        <th className="px-3 py-2 text-left">Options</th>
                        <th className="px-3 py-2 text-left">Answer</th>
                        <th className="px-3 py-2 text-left">Level</th>
                        <th className="px-3 py-2 text-left">Chapter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 5).map((q, i) => (
                        <tr
                          key={`preview-${q.id ?? q.question?.slice(0, 20)}-${i}`}
                          className="border-t"
                        >
                          <td className="px-3 py-2 truncate max-w-xs">{q.question}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">
                            A: {q.optionA}, B: {q.optionB}...
                          </td>
                          <td className="px-3 py-2">{q.correctAnswer}</td>
                          <td className="px-3 py-2">{q.level}</td>
                          <td className="px-3 py-2">{q.chapter}</td>
                        </tr>
                      ))}
                      {importPreview.length > 5 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                            ... and {importPreview.length - 5} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setImportPreview([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                  >
                    Import {importPreview.length} Questions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="add-modal-title">
          <div ref={addModalRef} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h3 id="add-modal-title" className="text-xl font-bold mb-4">
              ➕ Add New Question
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="question-text" className="block text-sm font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <textarea
                  id="question-text"
                  value={questionForm.question}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({ ...prev, question: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Enter the question..."
                  aria-required="true"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="option-a" className="block text-sm font-medium text-gray-700 mb-1">
                    Option A *
                  </label>
                  <input
                    id="option-a"
                    type="text"
                    value={questionForm.optionA}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionA: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option A"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="option-b" className="block text-sm font-medium text-gray-700 mb-1">
                    Option B *
                  </label>
                  <input
                    id="option-b"
                    type="text"
                    value={questionForm.optionB}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionB: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option B"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="option-c" className="block text-sm font-medium text-gray-700 mb-1">
                    Option C
                  </label>
                  <input
                    id="option-c"
                    type="text"
                    value={questionForm.optionC}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionC: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option C"
                  />
                </div>
                <div>
                  <label htmlFor="option-d" className="block text-sm font-medium text-gray-700 mb-1">
                    Option D
                  </label>
                  <input
                    id="option-d"
                    type="text"
                    value={questionForm.optionD}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionD: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option D"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="correct-answer" className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer *
                  </label>
                  <select
                    id="correct-answer"
                    value={questionForm.correctAnswer}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, correctAnswer: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="question-level" className="block text-sm font-medium text-gray-700 mb-1">
                    Level *
                  </label>
                  <select
                    id="question-level"
                    value={questionForm.level}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        level: e.target.value as Question['level'],
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="question-chapter" className="block text-sm font-medium text-gray-700 mb-1">
                    Chapter *
                  </label>
                  <select
                    id="question-chapter"
                    value={questionForm.chapter}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, chapter: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetQuestionForm();
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  disabled={
                    !questionForm.question.trim() ||
                    !questionForm.optionA.trim() ||
                    !questionForm.optionB.trim() ||
                    !questionForm.chapter.trim()
                  }
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div ref={editModalRef} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h3 id="edit-modal-title" className="text-xl font-bold mb-4">
              ✏️ Edit Question
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-question-text" className="block text-sm font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <textarea
                  id="edit-question-text"
                  value={questionForm.question}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({ ...prev, question: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Enter the question..."
                  aria-required="true"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-option-a" className="block text-sm font-medium text-gray-700 mb-1">
                    Option A *
                  </label>
                  <input
                    id="edit-option-a"
                    type="text"
                    value={questionForm.optionA}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionA: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option A"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="edit-option-b" className="block text-sm font-medium text-gray-700 mb-1">
                    Option B *
                  </label>
                  <input
                    id="edit-option-b"
                    type="text"
                    value={questionForm.optionB}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionB: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option B"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="edit-option-c" className="block text-sm font-medium text-gray-700 mb-1">
                    Option C
                  </label>
                  <input
                    id="edit-option-c"
                    type="text"
                    value={questionForm.optionC}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionC: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option C"
                  />
                </div>
                <div>
                  <label htmlFor="edit-option-d" className="block text-sm font-medium text-gray-700 mb-1">
                    Option D
                  </label>
                  <input
                    id="edit-option-d"
                    type="text"
                    value={questionForm.optionD}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, optionD: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option D"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="edit-correct-answer" className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer *
                  </label>
                  <select
                    id="edit-correct-answer"
                    value={questionForm.correctAnswer}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, correctAnswer: e.target.value as Question['correctAnswer'] }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-level" className="block text-sm font-medium text-gray-700 mb-1">
                    Level *
                  </label>
                  <select
                    id="edit-level"
                    value={questionForm.level}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, level: e.target.value as Question['level'] }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-chapter" className="block text-sm font-medium text-gray-700 mb-1">
                    Chapter *
                  </label>
                  <select
                    id="edit-chapter"
                    value={questionForm.chapter}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, chapter: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedQuestion(null);
                    resetQuestionForm();
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditQuestion}
                  disabled={
                    !questionForm.question.trim() ||
                    !questionForm.optionA.trim() ||
                    !questionForm.optionB.trim() ||
                    !questionForm.chapter.trim()
                  }
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div ref={deleteModalRef} className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 id="delete-modal-title" className="text-xl font-bold mb-4 text-red-600">
              🗑️ {selectedQuestion.status === 'trash' ? 'Permanently Delete' : 'Move to Trash'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {selectedQuestion.status === 'trash' 
                ? `Are you sure you want to permanently delete this question? This action cannot be undone.`
                : `Are you sure you want to move this question to trash? You can restore it later from the Trash section.`}
            </p>

            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="font-medium text-gray-800">{selectedQuestion.question}</p>
              <p className="text-sm text-gray-500 mt-1">Chapter: {selectedQuestion.chapter}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedQuestion(null);
                }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuestion}
                className={`flex-1 rounded-lg px-4 py-2 text-white ${
                  selectedQuestion.status === 'trash' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {selectedQuestion.status === 'trash' ? 'Permanently Delete' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Questions table">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredQuestions.length}
                    onChange={() =>
                      selectedIds.length === filteredQuestions.length ? deselectAll() : selectAll()
                    }
                    className="rounded border-gray-300"
                    aria-label="Select all questions"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-12">
                  #
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 min-w-[200px]">
                  Question
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-28">
                  Chapter
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-48">
                  Options
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-16">
                  Ans
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-20">
                  Level
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileQuestion className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No questions found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting filters or add new questions</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQuestions.map((q, index) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    index={startIndex + index + 1}
                    isSelected={selectedIds.includes(String(q.id))}
                    onToggleSelection={toggleSelection}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    getLevelBadgeColor={getLevelBadgeColor}
                    getStatusBadgeColor={getStatusBadgeColor}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{Math.min(startIndex + 1, filteredQuestions.length)}</span> - {' '}
            <span className="font-medium">{Math.min(startIndex + questionsPerPage, filteredQuestions.length)}</span> of{' '}
            <span className="font-medium">{filteredQuestions.length}</span> questions
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 flex items-center gap-1">
              Page
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                className="w-12 rounded border border-gray-300 px-2 py-1 text-center text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
              of <span className="font-medium">{totalPages || 1}</span>
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoized Question Row component to prevent unnecessary re-renders
interface QuestionRowProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  getLevelBadgeColor: (level: string) => string;
  getStatusBadgeColor: (status?: ContentStatus) => string;
}

const QuestionRow = React.memo(function QuestionRow({
  question,
  index,
  isSelected,
  onToggleSelection,
  onEdit,
  onDelete,
  getLevelBadgeColor,
  getStatusBadgeColor,
}: QuestionRowProps) {
  const handleToggle = useCallback(() => {
    onToggleSelection(String(question.id));
  }, [onToggleSelection, question.id]);

  const handleEdit = useCallback(() => {
    onEdit(question);
  }, [onEdit, question]);

  const handleDelete = useCallback(() => {
    onDelete(question);
  }, [onDelete, question]);

  return (
    <tr className="hover:bg-gray-50 will-change-transform" style={{ transition: 'background-color 0.1s ease' }}>
      <td className="whitespace-nowrap px-3 py-3 align-top">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggle}
          className="rounded border-gray-300"
          aria-label={`Select question ${question.question.slice(0, 30)}...`}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 align-top">
        {index}
      </td>
      <td className="px-3 py-3 align-top">
        <p className="text-sm font-medium text-gray-900 line-clamp-2" title={question.question}>
          {question.question}
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200"
            title="Edit question"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
            title="Delete question"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
          {question.chapter || 'General'}
        </span>
      </td>
      <td className="px-3 py-3 align-top">
        <div className="space-y-1 text-xs">
          <div className={question.correctAnswer === 'A' ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
            A. {question.optionA}
          </div>
          <div className={question.correctAnswer === 'B' ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
            B. {question.optionB}
          </div>
          {question.optionC && (
            <div className={question.correctAnswer === 'C' ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
              C. {question.optionC}
            </div>
          )}
          {question.optionD && (
            <div className={question.correctAnswer === 'D' ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
              D. {question.optionD}
            </div>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-center align-top">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
          {question.correctAnswer}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-center align-top">
        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${getLevelBadgeColor(question.level)}`}>
          {question.level}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-center align-top">
        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusBadgeColor(question.status)}`}>
          {question.status || 'published'}
        </span>
      </td>
    </tr>
  );
});

export default QuestionManagementSection;
