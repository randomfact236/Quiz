'use client';

import { useState, useRef, useEffect } from 'react';
import { FileUploader } from '@/components/ui/FileUploader';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { Riddle, ContentStatus, BulkActionType, StatusFilter } from '../types';
import {
  getStatusBadgeColor,
  getDifficultyColor,
  riddlesToCSV,
  riddlesToJSON,
  parseRiddleCSV,
  validateJSONStructure,
  downloadFile,
} from '../utils';

/**
 * Props for the RiddlesSection component
 */
interface RiddlesSectionProps {
  /** Optional initial riddles data */
  initialRiddles?: Riddle[];
  /** Controlled state for all riddles from parent */
  allRiddles: Riddle[];
  /** State setter for all riddles from parent */
  setAllRiddles: React.Dispatch<React.SetStateAction<Riddle[]>>;
  /** Controlled state for the active chapter filter from parent */
  riddleFilterChapter: string;
  /** State setter for the active chapter filter from parent */
  setRiddleFilterChapter: React.Dispatch<React.SetStateAction<string>>;
  /** Controlled state for chapter order from parent */
  riddleChapterOrder: string[];
  /** State setter for chapter order from parent */
  setRiddleChapterOrder: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Riddle form state interface
 */
interface RiddleFormState {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  correctLetter: string;
  difficulty: Riddle['difficulty'];
  chapter: string;
  hint: string;
  explanation: string;
  isOpenEnded: boolean;
}

/**
 * RiddlesSection Component
 *
 * Manages the riddle content section in the admin panel.
 * Features include:
 * - Riddle list display with filtering by chapter, difficulty, and search
 * - Add/Edit riddle modal with form validation
 * - Bulk actions (publish, draft, trash, delete, restore)
 * - CSV/JSON import and export functionality
 * - Pagination and status dashboard
 *
 * @example
 * ```tsx
 * <RiddlesSection />
 * ```
 */
export function RiddlesSection({
  allRiddles,
  setAllRiddles,
  riddleFilterChapter,
  setRiddleFilterChapter,
  riddleChapterOrder,
  setRiddleChapterOrder,
}: RiddlesSectionProps): JSX.Element {
  // Filter States
  const [riddleFilterLevel, setRiddleFilterLevel] = useState<string>('');
  const [riddleSearch, setRiddleSearch] = useState<string>('');
  const [riddlePage, setRiddlePage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('published');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const riddlesPerPage = 10;

  // Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [selectedRiddle, setSelectedRiddle] = useState<Riddle | null>(null);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  // Import State
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState<Riddle[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModalRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Form State
  const [riddleForm, setRiddleForm] = useState<RiddleFormState>({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    correctLetter: 'A',
    difficulty: 'easy',
    chapter: '',
    hint: '',
    explanation: '',
    isOpenEnded: false,
  });

  const [chapterNameToId, setChapterNameToId] = useState<Record<string, string>>({});
  const defaultSubjectIdRef = useRef<string>('');

  // Riddle MCQ Category & Subject State
  const [categories, setCategories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectEmoji, setNewSubjectEmoji] = useState('📚');
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);

  // Edit/Delete State
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryEmoji, setEditCategoryEmoji] = useState('');
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectEmoji, setEditSubjectEmoji] = useState('');

  useEffect(() => {
    import('@/lib/riddles-api').then(({ getAllChapters }) => {
      getAllChapters()
        .then(apiChapters => {
          const mapping: Record<string, string> = {};
          apiChapters.forEach((c: any) => {
            mapping[c.name] = c.id;
            // Store the first subjectId we encounter as the default
            if (!defaultSubjectIdRef.current && c.subject?.id) {
              defaultSubjectIdRef.current = c.subject.id;
            }
          });
          setChapterNameToId(mapping);
        })
        .catch(err => console.error('Failed to load chapters for RiddlesSection:', err));
    });

    // Load Riddle MCQ Categories and Subjects
    Promise.all([
      import('@/lib/riddles-api').then(m => m.getSubjects()),
      import('@/lib/riddles-api').then(m => m.getCategories())
    ])
      .then(([apiSubjects, apiCategories]) => {
        setSubjects(apiSubjects);
        setCategories(apiCategories);
      })
      .catch(err => console.error('Failed to load subjects/categories:', err));
  }, []);

  // Get unique chapters from riddles and always include the currently filtered one
  // and all chapters from the persisted order
  const chapterSet = new Set([...riddleChapterOrder, ...allRiddles.map(r => r.chapter)]);
  if (riddleFilterChapter && riddleFilterChapter !== '') {
    chapterSet.add(riddleFilterChapter);
  }
  const chapters = Array.from(chapterSet);

  // Calculate difficulty counts
  const difficultyCounts = {
    easy: allRiddles.filter(r => r.difficulty === 'easy').length,
    medium: allRiddles.filter(r => r.difficulty === 'medium').length,
    hard: allRiddles.filter(r => r.difficulty === 'hard').length,
    expert: allRiddles.filter(r => r.difficulty === 'expert').length,
  };

  // Calculate status counts
  const statusCounts = {
    total: allRiddles.length,
    published: allRiddles.filter(r => r.status === 'published').length,
    draft: allRiddles.filter(r => r.status === 'draft').length,
    trash: allRiddles.filter(r => r.status === 'trash').length,
  };

  // Migrate riddles without status to 'published'
  useEffect(() => {
    const needsMigration = allRiddles.some(r => !r.status);
    if (needsMigration) {
      setAllRiddles(prev => prev.map(r => r.status ? r : { ...r, status: 'published' as const }));
    }
  }, [allRiddles]);

  // Filter riddles based on all criteria
  const filteredRiddles = allRiddles.filter(riddle => {
    const matchesDifficulty = !riddleFilterLevel || riddle.difficulty === riddleFilterLevel;
    const matchesChapter = !riddleFilterChapter || riddle.chapter === riddleFilterChapter;
    const matchesSearch = !riddleSearch ||
      riddle.question.toLowerCase().includes(riddleSearch.toLowerCase()) ||
      riddle.options?.[0]?.toLowerCase().includes(riddleSearch.toLowerCase()) ||
      riddle.options?.[1]?.toLowerCase().includes(riddleSearch.toLowerCase());
    const riddleStatus = riddle.status || 'published';
    const matchesStatus = statusFilter === 'all' || riddleStatus === statusFilter;
    return matchesDifficulty && matchesChapter && matchesSearch && matchesStatus;
  });

  // Pagination
  const totalRiddlePages = Math.ceil(filteredRiddles.length / riddlesPerPage);
  const paginatedRiddles = filteredRiddles.slice(
    (riddlePage - 1) * riddlesPerPage,
    riddlePage * riddlesPerPage
  );

  // Sync pageInput with riddlePage
  useEffect(() => {
    setPageInput(String(riddlePage));
  }, [riddlePage]);

  // Page input handlers
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalRiddlePages) {
      setRiddlePage(page);
    } else {
      setPageInput(String(riddlePage));
    }
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(filteredRiddles.map(r => String(r.id)));
  const deselectAll = () => setSelectedIds([]);

  // Bulk action handler
  const handleBulkAction = async (action: BulkActionType) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);

    try {
      const { bulkActionRiddles } = await import('@/lib/riddles-api');
      await bulkActionRiddles(selectedIds, action === 'restore' ? 'draft' : action);

      if (action === 'delete') {
        setAllRiddles(prev => prev.filter(r => !selectedIds.includes(String(r.id))));
      } else {
        // We mock status changes for UI optimism
        setAllRiddles(prev =>
          prev.map(r => {
            if (selectedIds.includes(String(r.id))) {
              if (action === 'publish') return { ...r, status: 'published' as ContentStatus };
              if (action === 'draft' || action === 'restore') return { ...r, status: 'draft' as ContentStatus };
              if (action === 'trash') return { ...r, status: 'trash' as ContentStatus };
            }
            return r;
          })
        );
      }
      setSelectedIds([]);
    } catch (err: any) {
      alert('Bulk action failed: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Check if an option is the correct answer
  const isCorrectOption = (riddle: Riddle, optionIndex: number) =>
    riddle.correctOption === ['A', 'B', 'C', 'D'][optionIndex];

  // Export Functions
  const handleExportCSV = () => {
    // Debug: Log first riddle to see data structure
    console.log('Exporting riddles:', filteredRiddles.length);
    const firstRiddle = filteredRiddles[0];
    if (firstRiddle) {
      console.log('First riddle:', firstRiddle);
      console.log('Options:', firstRiddle.options);
    }

    const csv = riddlesToCSV(filteredRiddles);

    // Debug: Log generated CSV
    console.log('Generated CSV (first 500 chars):', csv.substring(0, 500));

    downloadFile(csv, `riddles_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = riddlesToJSON(filteredRiddles);
    downloadFile(json, `riddles_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Import Functions
  const handleFileUpload = (file: File) => {
    setImportError('');
    setImportWarnings([]);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let result: import('../types').ImportResult<Riddle>;

        if (file.name.endsWith('.json')) {
          const validation = validateJSONStructure<Riddle>(content, 'riddles');
          if (!validation.isValid || !validation.data) {
            setImportError(validation.errors.join('; '));
            return;
          }
          result = {
            success: true,
            imported: validation.data.map(r => ({
              ...r,
              id: String(Date.now() + Math.floor(Math.random() * 1000)),
              status: r.status || 'published',
            })),
            failed: [],
            total: validation.data.length,
          };
        } else {
          result = parseRiddleCSV(content);
        }

        if (result.imported.length === 0) {
          setImportError(result.failed.map(f => f.error).join('; ') || 'No valid riddles found');
          return;
        }

        setImportPreview(result.imported);
        if (result.failed.length > 0) {
          setImportWarnings(result.failed.map(f => `Row ${f.row}: ${f.error}`));
        }
      } catch (err) {
        setImportError('Failed to parse file: ' + (err as Error).message);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportError('');
    try {
      const {
        bulkCreateRiddles,
        getAllQuizRiddlesAdmin,
        createChapter,
        getAllChapters,
        getSubjects,
      } = await import('@/lib/riddles-api');

      // Build up-to-date chapter map (re-fetch to include any recently created chapters)
      const apiChapters = await getAllChapters();
      const latestMap: Record<string, string> = {};
      let subjectId = defaultSubjectIdRef.current;
      apiChapters.forEach((c: any) => {
        latestMap[c.name] = c.id;
        if (!subjectId && c.subject?.id) subjectId = c.subject.id;
      });

      // If we still have no subject, fetch subjects list and pick the first
      if (!subjectId) {
        try {
          const subjects = await getSubjects();
          subjectId = subjects[0]?.id || '';
        } catch { }
      }

      if (!subjectId) {
        setImportError('No subjects found in the database. Please create a subject and chapter first.');
        return;
      }

      // Collect unique chapter names from the import file
      const uniqueChapterNames = [...new Set(
        importPreview.map(r => r.chapter?.trim()).filter(Boolean)
      )] as string[];

      // Auto-create any chapters that don't exist yet
      for (const chapterName of uniqueChapterNames) {
        if (!latestMap[chapterName]) {
          try {
            // Determine next chapter number
            const nextNum = Object.keys(latestMap).length + 1;
            const created = await createChapter({
              name: chapterName,
              chapterNumber: nextNum,
              subjectId,
            });
            latestMap[chapterName] = created.id;
          } catch (err: any) {
            console.warn(`Could not create chapter "${chapterName}":`, err.message);
          }
        }
      }

      // Update state so other parts of the UI also see new chapters
      setChapterNameToId({ ...latestMap });

      // Build riddle DTOs using the correct chapter IDs
      const dtos = importPreview.map(r => {
        const chapterKey = r.chapter?.trim() || '';
        const cId = latestMap[chapterKey] || Object.values(latestMap)[0];
        const letterIndex = ['A', 'B', 'C', 'D'].indexOf(r.correctOption?.toUpperCase() || 'A');
        const correctAnswer = (r.options && r.options[letterIndex] != null)
          ? r.options[letterIndex]
          : (r.options?.[0] || r.correctOption || 'A');
        return {
          question: r.question,
          options: r.options || [],
          correctLetter: r.correctOption?.toUpperCase() || 'A',
          correctAnswer,
          level: r.difficulty || 'medium',
          chapterId: cId,
        };
      });

      if (dtos.length > 0) {
        await bulkCreateRiddles(dtos as any);

        const updated = await getAllQuizRiddlesAdmin();
        const mapped = updated.map(qr => ({
          id: String(qr.id),
          question: qr.question,
          options: qr.options || [],
          correctOption: qr.correctLetter || qr.correctAnswer || 'A',
          difficulty: (qr.level as Riddle['difficulty']) || 'medium',
          chapter: qr.chapter?.name || 'General',
          status: 'published' as const,
        }));
        setAllRiddles(mapped);
      }

      setShowImportModal(false);
      setImportPreview([]);
      setImportWarnings([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Import failed', err);
      setImportError('Failed to import riddles: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset form helper
  const resetRiddleForm = () => {
    setRiddleForm({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      correctLetter: 'A',
      difficulty: 'easy',
      chapter: '',
      hint: '',
      explanation: '',
      isOpenEnded: false,
    });
  };

  // Handle outside click for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle outside click for import modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        importModalRef.current &&
        !importModalRef.current.contains(event.target as Node)
      ) {
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

  // Handle outside click for add modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
        resetRiddleForm();
      }
    };
    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showAddModal]);

  // Handle outside click for edit modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowEditModal(false);
        setSelectedRiddle(null);
        resetRiddleForm();
      }
    };
    if (showEditModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showEditModal]);

  // CRUD Functions
  const handleAddRiddle = async () => {
    // Validate based on question type
    if (!riddleForm.question.trim()) {
      alert('Please enter a question.');
      return;
    }
    if (!riddleForm.chapter.trim()) {
      alert('Please select a subject.');
      return;
    }
    if (!riddleForm.isOpenEnded && (!riddleForm.optionA.trim() || !riddleForm.optionB.trim())) {
      alert('Please provide at least 2 options for MCQ questions.');
      return;
    }

    const subjectId = riddleForm.chapter.trim();
    const selectedSubject = subjects.find(s => s.id === subjectId);
    if (!selectedSubject) {
      alert(`Subject not found. Please select a valid subject.`);
      return;
    }

    try {
      const { createRiddle } = await import('@/lib/riddles-api');
      const options = [
        riddleForm.optionA.trim(),
        riddleForm.optionB.trim(),
        riddleForm.optionC.trim(),
        riddleForm.optionD.trim(),
      ].filter(Boolean);

      // For open-ended (Expert) - no options needed
      // For MCQ - need at least 2 options
      if (!riddleForm.isOpenEnded && options.length < 2) {
        alert('Please provide at least 2 options for MCQ questions.');
        return;
      }

      const letterIndex = ['A', 'B', 'C', 'D'].indexOf(riddleForm.correctLetter || 'A');
      const correctAnswerText = options[letterIndex] || options[0] || '';
      
      // Build API payload based on question type
      const riddlePayload: any = {
        question: riddleForm.question.trim(),
        level: riddleForm.difficulty,
        subjectId: subjectId,
        hint: riddleForm.hint.trim() || undefined,
        explanation: riddleForm.explanation.trim() || undefined,
      };

      if (riddleForm.isOpenEnded) {
        // Open-ended (Expert): no options, no correctLetter
        riddlePayload.options = [];
        riddlePayload.correctLetter = null;
        riddlePayload.correctAnswer = riddleForm.correctOption || correctAnswerText || 'expert';
      } else {
        // MCQ: has options
        riddlePayload.options = options;
        riddlePayload.correctLetter = riddleForm.correctLetter;
        riddlePayload.correctAnswer = correctAnswerText;
      }

      const created = (await createRiddle(riddlePayload)) as any;

      const newRiddle: Riddle = {
        id: String(Date.now()),
        question: created.question,
        options: created.options || [],
        correctOption: created.correctLetter || riddleForm.correctLetter,
        difficulty: created.level as any,
        chapter: riddleForm.chapter.trim(),
        status: 'published' as const,
      };

      setAllRiddles(prev => [newRiddle, ...prev]);
      setShowAddModal(false);
      resetRiddleForm();
    } catch (err: any) {
      alert('Failed to add riddle: ' + err.message);
    }
  };

  const handleEditRiddle = async () => {
    if (
      !selectedRiddle ||
      !riddleForm.question.trim() ||
      !riddleForm.optionA.trim() ||
      !riddleForm.optionB.trim() ||
      !riddleForm.chapter.trim()
    ) {
      return;
    }

    const chapterId = chapterNameToId[riddleForm.chapter.trim()];
    if (!chapterId) {
      alert(`Chapter "${riddleForm.chapter}" not found on backend. Please ensure it exists.`);
      return;
    }

    try {
      const { updateRiddle } = await import('@/lib/riddles-api');
      const options = [
        riddleForm.optionA.trim(),
        riddleForm.optionB.trim(),
        riddleForm.optionC.trim(),
        riddleForm.optionD.trim(),
      ].filter(Boolean);
      const letterIndex = ['A', 'B', 'C', 'D'].indexOf(riddleForm.correctLetter || 'A');
      const correctAnswerText = options[letterIndex] || options[0] || '';
      
      await updateRiddle(String(selectedRiddle.id), {
        question: riddleForm.question.trim(),
        options,
        correctLetter: riddleForm.correctLetter,
        correctAnswer: correctAnswerText,
        level: riddleForm.difficulty,
        chapterId: chapterId,
      });

      setAllRiddles(prev =>
        prev.map(r =>
          r.id === selectedRiddle.id
            ? {
              ...r,
              question: riddleForm.question.trim(),
              options,
              correctOption: riddleForm.correctLetter,
              difficulty: riddleForm.difficulty,
              chapter: riddleForm.chapter.trim(),
            }
            : r
        )
      );
      setShowEditModal(false);
      setSelectedRiddle(null);
      resetRiddleForm();
    } catch (err: any) {
      alert('Failed to update riddle: ' + err.message);
    }
  };

  const handleTrashRiddle = async () => {
    if (!selectedRiddle) {
      return;
    }

    try {
      if (selectedRiddle.status === 'trash') {
        // Permanent delete if already in trash
        const { bulkActionRiddles } = await import('@/lib/riddles-api');
        await bulkActionRiddles([String(selectedRiddle.id)], 'delete');
        setAllRiddles(prev => prev.filter(r => r.id !== selectedRiddle.id));
      } else {
        // Move to trash
        const { bulkActionRiddles } = await import('@/lib/riddles-api');
        await bulkActionRiddles([String(selectedRiddle.id)], 'trash');
        setAllRiddles(prev => prev.map(r =>
          r.id === selectedRiddle.id ? { ...r, status: 'trash' as ContentStatus } : r
        ));
      }
      setShowTrashConfirm(false);
      setSelectedRiddle(null);
    } catch (err: any) {
      alert('Failed to trash riddle: ' + err.message);
    }
  };

  const openTrashConfirm = (riddle: Riddle) => {
    setSelectedRiddle(riddle);
    setShowTrashConfirm(true);
  };

  const openEditModal = (riddle: Riddle) => {
    setSelectedRiddle(riddle);
    setRiddleForm({
      question: riddle.question,
      optionA: riddle.options?.[0] || '',
      optionB: riddle.options?.[1] || '',
      optionC: riddle.options?.[2] || '',
      optionD: riddle.options?.[3] || '',
      correctOption: riddle.correctOption,
      correctLetter: riddle.correctOption,
      difficulty: riddle.difficulty,
      chapter: riddle.chapter,
      hint: riddle.hint || '',
      explanation: riddle.explanation || '',
      isOpenEnded: riddle.difficulty === 'expert',
    });
    setShowEditModal(true);
  };



  // Difficulty level options
  const difficultyLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' },
  ];

  // Handle create category (creates a classic category)
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCategoryFormLoading(true);
    try {
      const { createCategory, getCategories, getSubjects } = await import('@/lib/riddles-api');
      await createCategory({
        name: newCategoryName,
        emoji: newCategoryEmoji,
      });
      setNewCategoryName('');
      setNewCategoryEmoji('📁');
      setShowAddCategoryModal(false);
      // Reload categories and subjects
      const [apiCategories, apiSubjects] = await Promise.all([
        getCategories(),
        getSubjects()
      ]);
      setCategories(apiCategories);
      setSubjects(apiSubjects);
    } catch (err: any) {
      alert('Failed to create category: ' + err.message);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  // Handle create subject
  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    setCategoryFormLoading(true);
    try {
      const { createSubject, getSubjects, getCategories, createCategory } = await import('@/lib/riddles-api');
      
      let categoryId = selectedCategoryId;
      
      // If no category selected, get or create "Miscellaneous" category
      if (!categoryId) {
        let miscCategory = categories.find(c => c.name.toLowerCase() === 'miscellaneous');
        if (!miscCategory) {
          miscCategory = await createCategory({
            name: 'Miscellaneous',
            emoji: '📁'
          });
        }
        categoryId = miscCategory.id;
      }
      
      const subjectDto: any = {
        name: newSubjectName,
        emoji: newSubjectEmoji,
        categoryId: categoryId,
      };
      
      await createSubject(subjectDto);
      setNewSubjectName('');
      setNewSubjectEmoji('📚');
      setShowAddSubjectModal(false);
      // Reload subjects and categories
      const [apiSubjects, apiCategories] = await Promise.all([
        getSubjects(),
        getCategories()
      ]);
      setSubjects(apiSubjects);
      setCategories(apiCategories);
    } catch (err: any) {
      alert('Failed to create subject: ' + err.message);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  // Handle edit category
  const handleEditCategory = (category: any) => {
    setEditCategoryName(category.name);
    setEditCategoryEmoji(category.emoji || '📁');
    setEditingCategory(category);
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryName.trim() || !editingCategory) return;
    setCategoryFormLoading(true);
    try {
      const { updateCategory, getCategories } = await import('@/lib/riddles-api');
      await updateCategory(editingCategory.id, {
        name: editCategoryName,
        emoji: editCategoryEmoji,
      });
      setEditingCategory(null);
      const apiCategories = await getCategories();
      setCategories(apiCategories);
    } catch (err: any) {
      alert('Failed to update category: ' + err.message);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    setCategoryFormLoading(true);
    try {
      const { deleteCategory, getCategories } = await import('@/lib/riddles-api');
      await deleteCategory(deletingCategoryId);
      setDeletingCategoryId(null);
      if (selectedCategoryId === deletingCategoryId) {
        setSelectedCategoryId('');
      }
      const apiCategories = await getCategories();
      setCategories(apiCategories);
    } catch (err: any) {
      alert('Failed to delete category: ' + err.message);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  // Handle edit subject
  const handleEditSubject = (subject: any) => {
    setEditSubjectName(subject.name);
    setEditSubjectEmoji(subject.emoji || '📚');
    setEditingSubject(subject);
  };

  const handleUpdateSubject = async () => {
    if (!editSubjectName.trim() || !editingSubject) return;
    setCategoryFormLoading(true);
    try {
      const { updateSubject, getSubjects, getCategories } = await import('@/lib/riddles-api');
      await updateSubject(editingSubject.id, {
        name: editSubjectName,
        emoji: editSubjectEmoji,
      });
      setEditingSubject(null);
      const [apiSubjects, apiCategories] = await Promise.all([
        getSubjects(),
        getCategories()
      ]);
      setSubjects(apiSubjects);
      setCategories(apiCategories);
    } catch (err: any) {
      alert('Failed to update subject: ' + err.message);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  // Handle delete subject
  const handleDeleteSubject = async () => {
    if (!deletingSubjectId) return;
    setCategoryFormLoading(true);
    try {
      const { deleteSubject, getSubjects, getCategories } = await import('@/lib/riddles-api');
      await deleteSubject(deletingSubjectId);
      setDeletingSubjectId(null);
      const [apiSubjects, apiCategories] = await Promise.all([
        getSubjects(),
        getCategories()
      ]);
      setSubjects(apiSubjects);
      setCategories(apiCategories);
    } catch (err: any) {
      alert('Failed to delete subject: ' + err.message);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🎭 Riddle MCQ Management</h3>
          <p className="text-sm text-gray-500">{filteredRiddles.length} total riddles</p>
        </div>
        <div className="flex gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
              aria-label="Export riddles"
              aria-expanded={showExportDropdown}
              aria-haspopup="menu"
            >
              📥 Export
            </button>
            {showExportDropdown && (
              <div
                className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-lg z-10"
                role="menu"
              >
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowExportDropdown(false);
                  }}
                  className="w-full rounded-t-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                  role="menuitem"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowExportDropdown(false);
                  }}
                  className="w-full rounded-b-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                  role="menuitem"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
            aria-label="Import riddles"
          >
            📤 Import
          </button>
          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            aria-label="Add new riddle"
          >
            + Add Riddle
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

      {/* Category & Subject with Level & Search */}
      <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {/* Categories Row with Add Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Category:</span>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${selectedCategoryId === ''
              ? 'bg-purple-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            onClick={() => setSelectedCategoryId('')}
          >
            All
          </button>
          {categories.map(cat => (
            <div key={`cat-${cat.id}`} className="flex items-center gap-1 rounded-lg bg-white border border-gray-300 px-2 py-1">
              <button
                className={`text-sm font-medium transition-colors ${selectedCategoryId === cat.id
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
                  }`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.emoji || '📁'} {cat.name}
              </button>
              <button
                onClick={() => handleEditCategory(cat)}
                className="ml-1 text-xs text-gray-400 hover:text-blue-500"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => setDeletingCategoryId(cat.id)}
                className="text-xs text-gray-400 hover:text-red-600"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-600"
          >
            + Add
          </button>
        </div>

        {/* Subjects Row with Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Subject:</span>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${selectedSubjectId === ''
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            onClick={() => setSelectedSubjectId('')}
          >
            All
          </button>
          {subjects
            .filter(s => !selectedCategoryId || s.category?.id === selectedCategoryId)
            .map(sub => (
              <div key={`sub-${sub.id}`} className="flex items-center gap-1 rounded-lg bg-white border border-gray-200 px-2 py-1">
                <button
                  className={`text-sm transition-colors ${selectedSubjectId === sub.id
                    ? 'text-indigo-600 font-medium'
                    : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  onClick={() => setSelectedSubjectId(sub.id)}
                >
                  {sub.emoji || '📚'} {sub.name}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditSubject(sub); }}
                  className="ml-1 text-xs text-gray-400 hover:text-blue-500"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingSubjectId(sub.id); }}
                  className="text-xs text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ))}
          {subjects.filter(s => !selectedCategoryId || s.category?.id === selectedCategoryId).length === 0 && (
            <span className="text-sm text-gray-400">No subjects found</span>
          )}
          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
          >
            + Add
          </button>
        </div>

        {/* Level Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Level:</span>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${riddleFilterLevel === ''
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            onClick={() => setRiddleFilterLevel('')}
            aria-pressed={riddleFilterLevel === ''}
          >
            All <span className="opacity-70">({allRiddles.length})</span>
          </button>
          {difficultyLevels.map(({ value, label }) => (
            <button
              key={`level-${value}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${riddleFilterLevel === value
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              onClick={() => setRiddleFilterLevel(value)}
              aria-pressed={riddleFilterLevel === value}
            >
              {label} <span className="opacity-70">({difficultyCounts[value as keyof typeof difficultyCounts] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-2">
          <label htmlFor="riddle-search" className="text-sm font-medium text-gray-700">
            Search:
          </label>
          <input
            id="riddle-search"
            type="text"
            placeholder="Type to search riddles..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
            value={riddleSearch}
            onChange={e => setRiddleSearch(e.target.value)}
            aria-label="Search riddles by keyword"
          />
          {(riddleFilterLevel || riddleSearch || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setRiddleFilterLevel('');
                setRiddleSearch('');
                setStatusFilter('all');
              }}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
              aria-label="Clear all filters"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        totalItems={filteredRiddles.length}
        currentFilter={statusFilter}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onAction={handleBulkAction}
        onClose={deselectAll}
        loading={bulkActionLoading}
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-3 py-3 text-left text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredRiddles.length}
                  onChange={() =>
                    selectedIds.length === filteredRiddles.length ? deselectAll() : selectAll()
                  }
                  className="rounded border-gray-300"
                  aria-label="Select all riddles"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-12">#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Question</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-28">Chapter</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-48">Options</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-16">Ans</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-20">Level</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-20">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRiddles.map((riddle, index) => (
              <tr key={`riddle-row-${riddle.id}`} className="hover:bg-gray-50">
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(String(riddle.id))}
                    onChange={() => toggleSelection(String(riddle.id))}
                    className="rounded border-gray-300"
                    aria-label={`Select riddle ${riddle.id}`}
                  />
                </td>
                <td className="px-3 py-4 text-sm text-gray-600">{index + 1}</td>
                <td className="px-3 py-3 align-top">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{riddle.question}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEditModal(riddle)}
                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
                      aria-label={`Edit riddle ${riddle.id}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => openTrashConfirm(riddle)}
                      className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      aria-label={`Trash riddle ${riddle.id}`}
                    >
                      🗑️ Trash
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    {riddle.chapter || 'General'}
                  </span>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1 text-xs">
                    <div className={isCorrectOption(riddle, 0) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                      A. {riddle.options[0]}
                    </div>
                    <div className={isCorrectOption(riddle, 1) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                      B. {riddle.options[1]}
                    </div>
                    {riddle.options[2] && (
                      <div className={isCorrectOption(riddle, 2) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                        C. {riddle.options[2]}
                      </div>
                    )}
                    {riddle.options[3] && (
                      <div className={isCorrectOption(riddle, 3) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                        D. {riddle.options[3]}
                      </div>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                    {riddle.correctOption}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${getDifficultyColor(riddle.difficulty)}`}>
                    {riddle.difficulty}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusBadgeColor(riddle.status)}`}>
                    {riddle.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedRiddles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">No riddles found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting filters or add new riddles</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredRiddles.length > 0 && (
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 mt-4">
          <p className="text-sm text-gray-500">
            Showing {Math.min((riddlePage - 1) * riddlesPerPage + 1, filteredRiddles.length)} - {Math.min(riddlePage * riddlesPerPage, filteredRiddles.length)} of {filteredRiddles.length} items
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRiddlePage(p => Math.max(1, p - 1))}
              disabled={riddlePage === 1}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
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
              of <span className="font-medium">{totalRiddlePages || 1}</span>
            </span>
            <button
              onClick={() => setRiddlePage(p => Math.min(totalRiddlePages, p + 1))}
              disabled={riddlePage >= totalRiddlePages}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div ref={importModalRef} className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">📤 Import Riddles</h3>

            {!importPreview.length ? (
              <div className="space-y-4">
                <FileUploader
                  onFileSelect={handleFileUpload}
                  accept=".csv,.json"
                  label="Select CSV or JSON File"
                  description="Drag and drop your CSV or JSON file here, or click to browse"
                />

                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p className="mb-2 font-medium">CSV Format:</p>
                  <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                    ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
                  </code>
                  <p className="mb-2 mt-3 font-medium">JSON Format:</p>
                  <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                    {`{"riddles": [{"question": "...", "answer": "...", "options": [...], "correctOption": "A", "level": "easy", "chapter": "..."}]}`}
                  </code>
                </div>

                {importError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-600">⚠️ {importError}</p>
                  </div>
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
                <p className="font-medium text-green-600">
                  ✓ Found {importPreview.length} riddles to import
                </p>

                {importWarnings.length > 0 && (
                  <div className="max-h-32 overflow-auto rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="mb-1 text-sm font-medium text-yellow-700">⚠️ Warnings:</p>
                    {importWarnings.map((w, i) => (
                      <p key={`warning-${w.slice(0, 30)}-${w.length}-${i}`} className="text-xs text-yellow-600">
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                <div className="max-h-64 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Question</th>
                        <th className="px-3 py-2 text-left">Answer</th>
                        <th className="px-3 py-2 text-left">Level</th>
                        <th className="px-3 py-2 text-left">Chapter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 5).map((riddle, i) => (
                        <tr
                          key={`preview-${riddle.id ?? riddle.question?.slice(0, 20)}-${i}`}
                          className="border-t"
                        >
                          <td className="max-w-xs truncate px-3 py-2">{riddle.question}</td>
                          <td className="px-3 py-2">{riddle.answer}</td>
                          <td className="px-3 py-2">{riddle.difficulty}</td>
                          <td className="px-3 py-2">{riddle.chapter}</td>
                        </tr>
                      ))}
                      {importPreview.length > 5 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
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
                    disabled={isImporting}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : `Import ${importPreview.length} Riddles`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={showAddModal ? addModalRef : editModalRef}
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6"
          >
            <h3 className="mb-4 text-xl font-bold">
              {showAddModal ? '➕ Add New Riddle' : '✏️ Edit Riddle'}
            </h3>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <label htmlFor="riddle-question" className="mb-1 block text-sm font-medium text-gray-700">
                  Question *
                </label>
                <textarea
                  id="riddle-question"
                  value={riddleForm.question}
                  onChange={e => setRiddleForm(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Enter the riddle question..."
                  aria-required="true"
                />
              </div>

              {/* Hint Field */}
              <div>
                <label htmlFor="riddle-hint" className="mb-1 block text-sm font-medium text-gray-700">
                  Hint (optional)
                </label>
                <input
                  id="riddle-hint"
                  type="text"
                  value={riddleForm.hint}
                  onChange={e => setRiddleForm(prev => ({ ...prev, hint: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter a hint for the riddle..."
                />
              </div>

              {/* Explanation Field */}
              <div>
                <label htmlFor="riddle-explanation" className="mb-1 block text-sm font-medium text-gray-700">
                  Explanation (optional)
                </label>
                <textarea
                  id="riddle-explanation"
                  value={riddleForm.explanation}
                  onChange={e => setRiddleForm(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={2}
                  placeholder="Explain the answer..."
                />
              </div>

              {/* Options Grid - Only show if NOT open-ended */}
              {!riddleForm.isOpenEnded && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="riddle-option-a" className="mb-1 block text-sm font-medium text-gray-700">
                    Option A *
                  </label>
                  <input
                    id="riddle-option-a"
                    type="text"
                    value={riddleForm.optionA}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionA: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option A"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="riddle-option-b" className="mb-1 block text-sm font-medium text-gray-700">
                    Option B *
                  </label>
                  <input
                    id="riddle-option-b"
                    type="text"
                    value={riddleForm.optionB}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionB: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option B"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="riddle-option-c" className="mb-1 block text-sm font-medium text-gray-700">
                    Option C
                  </label>
                  <input
                    id="riddle-option-c"
                    type="text"
                    value={riddleForm.optionC}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionC: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option C"
                  />
                </div>
                <div>
                  <label htmlFor="riddle-option-d" className="mb-1 block text-sm font-medium text-gray-700">
                    Option D
                  </label>
                  <input
                    id="riddle-option-d"
                    type="text"
                    value={riddleForm.optionD}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionD: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option D"
                  />
                </div>
              </div>
              )}

              {/* Correct Answer, Difficulty, Chapter */}
              <div className="grid grid-cols-3 gap-4">
                {!riddleForm.isOpenEnded && (
                <div>
                  <label
                    htmlFor="riddle-correct-answer"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Correct Answer *
                  </label>
                  <select
                    id="riddle-correct-answer"
                    value={riddleForm.correctLetter}
                    onChange={e => setRiddleForm(prev => ({ ...prev, correctOption: e.target.value, correctLetter: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                )}
                {riddleForm.isOpenEnded && (
                <div>
                  <label
                    htmlFor="riddle-correct-answer-text"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Correct Answer (for reference)
                  </label>
                  <input
                    id="riddle-correct-answer-text"
                    type="text"
                    value={riddleForm.correctOption}
                    onChange={e => setRiddleForm(prev => ({ ...prev, correctOption: e.target.value, correctLetter: 'A' }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter the correct answer text..."
                  />
                </div>
                )}
                  <div>
                    <label htmlFor="riddle-difficulty" className="mb-1 block text-sm font-medium text-gray-700">
                      Difficulty *
                    </label>
                    <select
                      id="riddle-difficulty"
                      value={riddleForm.difficulty}
                      onChange={e =>
                        setRiddleForm(prev => ({ 
                          ...prev, 
                          difficulty: e.target.value as Riddle['difficulty'],
                          isOpenEnded: e.target.value === 'expert'
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      aria-required="true"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert (Open-Ended)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="riddle-subject" className="mb-1 block text-sm font-medium text-gray-700">
                      Subject *
                    </label>
                    <select
                    id="riddle-subject"
                    value={riddleForm.chapter}
                    onChange={e => setRiddleForm(prev => ({ ...prev, chapter: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(sub => (
                      <option key={`subject-option-${sub.id}`} value={sub.id}>
                        {sub.emoji || '📚'} {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetRiddleForm();
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={showAddModal ? handleAddRiddle : handleEditRiddle}
                  disabled={
                    !riddleForm.question.trim() ||
                    !riddleForm.optionA.trim() ||
                    !riddleForm.optionB.trim() ||
                    !riddleForm.chapter.trim()
                  }
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showAddModal ? 'Add Riddle' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trash Confirmation Modal */}
      {showTrashConfirm && selectedRiddle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              {selectedRiddle.status === 'trash' ? 'Permanently Delete Riddle' : 'Move Riddle to Trash'}
            </h3>
            <p className="mb-6 text-gray-600">
              {selectedRiddle.status === 'trash'
                ? 'Are you sure you want to permanently delete this riddle? This action cannot be undone.'
                : 'Are you sure you want to move this riddle to trash? You can still restore it later from the Trash section.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowTrashConfirm(false); setSelectedRiddle(null); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleTrashRiddle}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {selectedRiddle.status === 'trash' ? 'Permanently Delete' : 'Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">➕ Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Logic, Math, Word Play"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Emoji
                </label>
                <input
                  type="text"
                  value={newCategoryEmoji}
                  onChange={e => setNewCategoryEmoji(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="📁"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || categoryFormLoading}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
              >
                {categoryFormLoading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">➕ Add New Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateSubject()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Brain Teasers, Word Puzzles"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Emoji
                </label>
                <input
                  type="text"
                  value={newSubjectEmoji}
                  onChange={e => setNewSubjectEmoji(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateSubject()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="🧩"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category (optional)
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubject}
                disabled={!newSubjectName.trim() || categoryFormLoading}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {categoryFormLoading ? 'Creating...' : 'Create Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">✏️ Edit Category</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={e => setEditCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Logic, Math, Word Play"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Emoji
                </label>
                <input
                  type="text"
                  value={editCategoryEmoji}
                  onChange={e => setEditCategoryEmoji(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="📁"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setEditingCategory(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={!editCategoryName.trim() || categoryFormLoading}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
              >
                {categoryFormLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">✏️ Edit Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={editSubjectName}
                  onChange={e => setEditSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateSubject()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Brain Teasers, Word Puzzles"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Emoji
                </label>
                <input
                  type="text"
                  value={editSubjectEmoji}
                  onChange={e => setEditSubjectEmoji(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateSubject()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="🧩"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setEditingSubject(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubject}
                disabled={!editSubjectName.trim() || categoryFormLoading}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {categoryFormLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation */}
      {deletingCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold text-red-600">🗑️ Delete Category</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeletingCategoryId(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={categoryFormLoading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {categoryFormLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation */}
      {deletingSubjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold text-red-600">🗑️ Delete Subject</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this subject? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeletingSubjectId(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubject}
                disabled={categoryFormLoading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {categoryFormLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
