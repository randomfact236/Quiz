'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Smile,
  Puzzle,
  Image as ImageIcon,
  Settings,
  Users,
  Home,
  LogOut
} from 'lucide-react';

import type {
  Riddle,
  Subject,
  Joke,
  JokeCategory,
  Question,
  MenuSection
} from './types';
import { downloadFile, exportQuestionsToCSV } from './utils';
import { removeItem, STORAGE_KEYS } from '@/lib/storage';
import { importQuestionsFromCSV } from './utils/quiz-importer';

// Status Dashboard & Bulk Actions
import { ImageRiddlesAdminSection, JokesSection, QuestionManagementSection, RiddlesSection, SettingsSection, AdminGuard } from './components';
import { QuizSidebar } from './components/QuizSidebar';
import { RiddleSidebar } from './components/RiddleSidebar';

import { saveQuizData, exportQuizDataToFile, importQuizDataFromFile } from '@/lib/quiz-data-manager';
import { getSubjects, QuizQuestion, getQuestionsBySubject, getQuestionCountBySubject, createQuestionsBulk, updateQuestion, bulkActionQuestions, createQuestion, getChaptersBySubject, deleteSubject, createSubject, updateSubject, getSubjectBySlug, createChapter, deleteChapter, getStatusCountsBySubject, getChapterCountsBySubject, getLevelCountsBySubject, SubjectStatusCounts } from '@/lib/quiz-api';
import { useQuizSubjects } from '@/hooks/useQuizSubjects';
import { getJokes, getJokeCategories } from '@/lib/jokes-api';

// Initial Data
const defaultQuestions: Record<string, Question[]> = {};

// Helper to check if a string is an emoji
const isEmoji = (str: string): boolean => {
  return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2B50}]/u.test(str);
};

// Storage key for persisting active section
export default function AdminPage(): JSX.Element {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.clear();
    router.push('/admin/login');
  }, [router]);

  // Load from database via API - no localStorage fallback
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quizModuleExpanded, setQuizModuleExpanded] = useState(true);
  const [riddleModuleExpanded, setRiddleModuleExpanded] = useState(true);
  const [otherModulesExpanded, setOtherModulesExpanded] = useState(true);

  // Use the hook directly for subjects - database only, no fake data
  const { subjects: dbSubjects, refetch: refetchSubjects } = useQuizSubjects();
  
  // Helper to normalize subject emojis - preserves custom emojis
  const sanitizeSubjects = useCallback((storedSubjects: Subject[]): Subject[] => {
    const validIconKeys = ['science', 'math', 'history', 'geography', 'english', 'technology', 'puzzle', 'smile', 'image', 'settings', 'users', 'home', 'book-open', 'help-circle', 'graduation-cap', 'briefcase', 'gamepad-2'];
    return storedSubjects.map(subject => {
      const isCustomEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B50}]/u.test(subject.emoji);
      if (validIconKeys.includes(subject.emoji) || isCustomEmoji) {
        return subject;
      }
      const slugToIcon: Record<string, string> = {
        'science': 'science', 'math': 'math', 'history': 'history', 'geography': 'geography', 'english': 'english', 'technology': 'technology',
      };
      return { ...subject, emoji: slugToIcon[subject.slug] || 'puzzle' };
    });
  }, []);

  // Use sanitized subjects from hook - this is the main subjects array used throughout
  const subjects = sanitizeSubjects(dbSubjects);
  
  // Local subjects state for immediate UI updates (add/delete without waiting for API)
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);
  
  // Combined subjects: local changes take priority
  const allSubjects = localSubjects.length > 0 ? localSubjects : subjects;
  
  // Handle subject reordering - update order in database via API
  const handleReorderSubjects = useCallback(async (reorderedSubjects: Subject[]) => {
    try {
      // Note: Backend doesn't support order field in UpdateSubjectDto yet
      // This is a placeholder for future implementation
      console.log('Subject reordering not yet implemented:', reorderedSubjects.map(s => s.slug));
      refetchSubjects();
    } catch (err) {
      console.error('Failed to reorder allSubjects:', err);
    }
  }, [refetchSubjects]);
  
  // Helper to map API QuizQuestion to UI Question
  const mapQuizQuestionToQuestion = useCallback((q: QuizQuestion): Question => {
    const _opts = q.options || [];
    const optA = _opts[0] || '';
    const optB = _opts[1] || '';
    const optC = _opts[2] || '';
    const optD = _opts[3] || '';

    return {
      id: q.id as string,
      question: q.question,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: q.correctAnswer,
      correctLetter: q.correctLetter,
      level: (q.level || 'medium') as Question['level'],
      chapter: q.chapter?.name || 'General',
      status: (q.status || 'published') as Question['status'],
      explanation: q.explanation,
    };
  }, []);
  
  // For backward compatibility - setSubjects can update local allSubjects
  // This is a no-op placeholder - actual updates happen via refetchSubjects()
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setSubjects = useCallback((_newSubjects?: any) => {
    // no-op - actual updates happen via refetchSubjects()
  }, []);
  
  // Other state
  const [allQuestions, setAllQuestions] = useState<Record<string, Question[]>>(defaultQuestions);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [questionPagination, setQuestionPagination] = useState<Record<string, { page: number; limit: number; total: number }>>({});
  const [questionFilters, setQuestionFilters] = useState<Record<string, { status?: string; level?: string; chapter?: string; search?: string }>>({});
  const [allRiddles, setAllRiddles] = useState<Riddle[]>([]);
  const [riddleFilterChapter, setRiddleFilterChapter] = useState<string>('');
  const [riddleChapterOrder, setRiddleChapterOrder] = useState<string[]>([]);
  const [allJokes, setAllJokes] = useState<Joke[]>([]);
  const [jokeCategories, setJokeCategories] = useState<JokeCategory[]>([]);
  const [quizChapters, setQuizChapters] = useState<Record<string, { id: string; name: string }[]>>({});
  const [subjectStatusCounts, setSubjectStatusCounts] = useState<Record<string, SubjectStatusCounts>>({});
  const [subjectChapterCounts, setSubjectChapterCounts] = useState<Record<string, Record<string, number>>>({});
  const [subjectLevelCounts, setSubjectLevelCounts] = useState<Record<string, Record<string, number>>>({});

  // URL-based state management - replaces localStorage
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Get section from URL, default to dashboard
  const urlSection = searchParams.get('section') || 'dashboard';
  const urlChapter = searchParams.get('chapter');

  // Set active section from URL on initial load
  const hasSetInitialSection = useRef(false);
  useEffect(() => {
    if (hasSetInitialSection.current) return;
    if (allSubjects.length > 0 || urlSection) {
      // URL section takes priority, but validate if it's a quiz subject
      if (urlSection === 'riddles' || urlSection === 'image-riddles' || urlSection === 'jokes' || urlSection === 'users' || urlSection === 'settings' || urlSection === 'dashboard') {
        setActiveSection(urlSection as MenuSection);
      } else {
        // It's a quiz subject - check if valid
        const isValidSubject = allSubjects.some(s => s.slug === urlSection);
        if (isValidSubject) {
          setActiveSection(urlSection as MenuSection);
        } else if (allSubjects.length > 0) {
          setActiveSection(allSubjects[0]!.slug);
        } else {
          setActiveSection('dashboard');
        }
      }
      hasSetInitialSection.current = true;
    }
  }, [allSubjects, urlSection]);

  // Handle URL changes after initial load - update activeSection when URL changes
  useEffect(() => {
    if (!hasSetInitialSection.current) return; // Wait for initial load
    if (!urlSection) return;

    // Determine the target section
    let targetSection = urlSection;
    
    // Check if it's a special section (riddles, jokes, etc.)
    const isSpecialSection = ['riddles', 'image-riddles', 'jokes', 'users', 'settings', 'dashboard'].includes(urlSection);
    
    if (!isSpecialSection) {
      // It's a quiz subject - check if valid
      const isValidSubject = allSubjects.some(s => s.slug === urlSection);
      if (!isValidSubject) {
        // Invalid subject, fallback to first subject or dashboard
        targetSection = allSubjects.length > 0 ? allSubjects[0]!.slug : 'dashboard';
      }
    }

    // Update state if different from current
    if (activeSection !== targetSection) {
      setActiveSection(targetSection as MenuSection);
    }
  }, [urlSection, allSubjects, activeSection]);

  // Set riddle chapter filter from URL
  const hasSetInitialChapter = useRef(false);
  useEffect(() => {
    if (hasSetInitialChapter.current) return;
    if (urlChapter && allRiddles.length > 0) {
      if (allRiddles.some(r => r.chapter === urlChapter)) {
        setRiddleFilterChapter(urlChapter);
      }
      hasSetInitialChapter.current = true;
    }
  }, [urlChapter, allRiddles]);

  // URL update helper - replaces localStorage.setItem
  const updateURL = useCallback((params: { section?: string; subject?: string | null; chapter?: string | null }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (params.section) {
      newParams.set('section', params.section);
    }
    if (params.subject !== undefined && params.subject !== null) {
      newParams.set('subject', params.subject);
    } else if (params.subject === null) {
      newParams.delete('subject');
    }
    if (params.chapter !== undefined && params.chapter !== null) {
      newParams.set('chapter', encodeURIComponent(params.chapter));
    } else if (params.chapter === null) {
      newParams.delete('chapter');
    }
    
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Fetch question counts for allSubjects when allSubjects change
  useEffect(() => {
    const fetchQuestionCounts = async () => {
      try {
        const counts: Record<string, number> = {};
        await Promise.all(
          allSubjects.map(async (s) => {
            try {
              const count = await getQuestionCountBySubject(s.slug);
              counts[s.slug] = count;
            } catch {
              counts[s.slug] = 0;
            }
          })
        );
        setQuestionCounts(counts);
      } catch (e) {
        console.error('Failed to fetch question counts:', e);
      }
    };

    if (allSubjects.length > 0) {
      fetchQuestionCounts();
    }

    // Complete hydration
    setIsHydrated(true);
  }, [allSubjects]);


  // Fetch riddles from backend API
  useEffect(() => {
    import('@/lib/riddles-api').then(({ getAllQuizRiddlesAdmin }) => {
      getAllQuizRiddlesAdmin()
        .then(quizRiddles => {
          const mappedRiddles = quizRiddles.map(qr => ({
            id: qr.id as string,
            question: qr.question,
            options: qr.options || [],
            correctOption: qr.correctLetter || qr.correctAnswer || 'A',
            correctLetter: qr.correctLetter,
            difficulty: (qr.level as Riddle['difficulty']) || 'medium',
            chapter: (qr as any).chapter?.name || (qr as any).subject?.name || 'General',
            status: 'published' as const,
            ...(qr.hint ? { hint: qr.hint } : {}),
          }));
          setAllRiddles(mappedRiddles);
          // Riddle chapter filter is now handled via URL in useEffect above
        })
        .catch((err: any) => console.error('Failed to load quiz riddles:', err));
    });
  }, []);


  // Fetch questions from API when subject is selected (server-side pagination)
  // Track last fetch params to prevent duplicate fetches
  const lastFetchRef = useRef<{ section: string; page: number; limit: number; filters: string } | null>(null);
  
  useEffect(() => {
    // Wait for hydration before fetching
    if (!isHydrated) return;

    const isSubjectSection = allSubjects.some(s => s.slug === activeSection);

    if (isSubjectSection && activeSection !== 'dashboard') {
      const currentPage = questionPagination[activeSection]?.page || 1;
      const limit = questionPagination[activeSection]?.limit || 10;
      const filters = questionFilters[activeSection] || {};
      const filtersKey = JSON.stringify(filters);
      
      console.log(`[FetchEffect] Checking fetch for ${activeSection}, page ${currentPage}, limit ${limit}`);
      console.log(`[FetchEffect] Last fetch:`, lastFetchRef.current);
      
      // Skip if we already fetched with these exact params
      if (lastFetchRef.current?.section === activeSection &&
          lastFetchRef.current?.page === currentPage &&
          lastFetchRef.current?.limit === limit &&
          lastFetchRef.current?.filters === filtersKey) {
        console.log(`[FetchEffect] Skipping fetch - already fetched with these params`);
        return;
      }
      
      // Update last fetch params
      lastFetchRef.current = { section: activeSection, page: currentPage, limit: limit, filters: filtersKey };
      console.log(`[FetchEffect] Fetching questions for ${activeSection}, page ${currentPage}`);

      const fetchQuestions = async () => {
        try {
          const result = await getQuestionsBySubject(activeSection, filters, currentPage, limit);
          const mappedQuestions: Question[] = result.data.map(mapQuizQuestionToQuestion);
          setAllQuestions(prev => ({
            ...prev,
            [activeSection]: mappedQuestions
          }));
          setQuestionCounts(prev => ({
            ...prev,
            [activeSection]: result.total
          }));
          setQuestionPagination(prev => ({
            ...prev,
            [activeSection]: { page: result.page, limit: result.limit, total: result.total }
          }));

          // Also fetch chapters for this subject
          try {
            const subjectData = await getSubjectBySlug(activeSection);
            if (subjectData?.chapters) {
              const chapterObjects = subjectData.chapters.map(c => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
              setQuizChapters(prev => ({
                ...prev,
                [activeSection]: chapterObjects
              }));
            }
          } catch (chaptersErr) {
            console.error('Failed to fetch chapters:', chaptersErr);
          }

          // Also fetch status counts for this subject
          try {
            const statusCounts = await getStatusCountsBySubject(activeSection);
            setSubjectStatusCounts(prev => ({
              ...prev,
              [activeSection]: statusCounts
            }));
          } catch (statusErr) {
            console.error('Failed to fetch status counts:', statusErr);
          }

          // Also fetch chapter counts for this subject
          try {
            const chapterCounts = await getChapterCountsBySubject(activeSection);
            setSubjectChapterCounts(prev => ({
              ...prev,
              [activeSection]: chapterCounts
            }));
          } catch (chapterErr) {
            console.error('Failed to fetch chapter counts:', chapterErr);
          }

          // Also fetch level counts for this subject
          try {
            const levelCounts = await getLevelCountsBySubject(activeSection);
            setSubjectLevelCounts(prev => ({
              ...prev,
              [activeSection]: levelCounts
            }));
          } catch (levelErr) {
            console.error('Failed to fetch level counts:', levelErr);
          }
        } catch (err) {
          console.error('Failed to fetch questions for subject:', activeSection, err);
        }
      };

      fetchQuestions();
    }
  }, [activeSection, allSubjects, questionPagination, questionFilters, isHydrated]);

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'academic' | 'professional' | 'entertainment'>('academic');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const getSubjectFromSection = (section: MenuSection): Subject | null => {
    return allSubjects.find(s => s.slug === section) ?? null;
  };

  const getQuestionsForSubject = (slug: string): Question[] => {
    return allQuestions[slug] ?? [];
  };

  const getQuestionPagination = (slug: string) => {
    return questionPagination[slug] || { page: 1, limit: 10, total: questionCounts[slug] || 0 };
  };

  const getChaptersForSubject = (slug: string): { id: string; name: string }[] => {
    return quizChapters[slug] ?? [];
  };

  const getStatusCountsForSubject = (slug: string): SubjectStatusCounts | undefined => {
    return subjectStatusCounts[slug];
  };

  const getChapterCountsForSubject = (slug: string): Record<string, number> | undefined => {
    return subjectChapterCounts[slug];
  };

  const getLevelCountsForSubject = (slug: string): Record<string, number> | undefined => {
    return subjectLevelCounts[slug];
  };

  // Handle subject selection from filter
  const handleSubjectSelect = (slug: string) => {
    setActiveSection(slug as MenuSection);
  };

  // Handle question page change (server-side pagination)
  const handleQuestionPageChange = (subjectSlug: string, newPage: number, newLimit: number) => {
    console.log(`[handleQuestionPageChange] Setting page to ${newPage}, limit ${newLimit} for ${subjectSlug}`);
    setQuestionPagination(prev => {
      const existingPagination = prev[subjectSlug];
      const newState = {
        ...prev,
        [subjectSlug]: { 
          page: newPage, 
          limit: newLimit,
          total: existingPagination?.total ?? 0
        }
      };
      console.log(`[handleQuestionPageChange] New pagination state:`, newState[subjectSlug]);
      return newState;
    });
  };

  // Handle question filter change (server-side filtering)
  const handleQuestionFilterChange = useCallback((subjectSlug: string, filters: { status?: string; level?: string; chapter?: string; search?: string }) => {
    setQuestionFilters((prev) => {
      return { ...prev, [subjectSlug]: filters };
    });
    // Reset to page 1 when filters change
    setQuestionPagination((prev) => ({
      ...prev,
      [subjectSlug]: { page: 1, limit: prev?.[subjectSlug]?.limit ?? 10, total: prev?.[subjectSlug]?.total ?? 0 }
    }));
  }, []);

  // Handle questions refresh from server (after bulk actions)
  const handleQuestionsRefresh = async (subjectSlug: string) => {
    const pagination = questionPagination[subjectSlug] || { page: 1, limit: 10 };
    const filters = questionFilters[subjectSlug] || {};
    try {
      const result = await getQuestionsBySubject(subjectSlug, filters, pagination.page, pagination.limit);
      const mappedQuestions: Question[] = result.data.map(mapQuizQuestionToQuestion);
      setAllQuestions(prev => ({
        ...prev,
        [subjectSlug]: mappedQuestions
      }));
      setQuestionPagination(prev => ({
        ...prev,
        [subjectSlug]: { ...pagination, total: result.total }
      }));

      // Also refresh status counts
      const statusCounts = await getStatusCountsBySubject(subjectSlug);
      setSubjectStatusCounts(prev => ({
        ...prev,
        [subjectSlug]: statusCounts
      }));

      // Also refresh chapter counts
      const chapterCounts = await getChapterCountsBySubject(subjectSlug);
      setSubjectChapterCounts(prev => ({
        ...prev,
        [subjectSlug]: chapterCounts
      }));

      // Also refresh level counts
      const levelCounts = await getLevelCountsBySubject(subjectSlug);
      setSubjectLevelCounts(prev => ({
        ...prev,
        [subjectSlug]: levelCounts
      }));

      // Also refresh chapters list
      try {
        const subjectData = await getSubjectBySlug(subjectSlug);
        if (subjectData?.chapters) {
          const chapterObjects = subjectData.chapters.map(c => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
          setQuizChapters(prev => ({
            ...prev,
            [subjectSlug]: chapterObjects
          }));
        }
      } catch (chaptersErr) {
        console.error('Failed to refresh chapters:', chaptersErr);
      }
    } catch (err) {
      console.error('Failed to refresh questions:', err);
    }
  };

  // Handle questions import
  const handleQuestionsImport = async (subjectSlug: string, newQuestions: Question[]) => {
    // Refresh allSubjects list to ensure we have the latest (in case new subject was created)
    try {
      const apiSubjects = await getSubjects(false);
      const updatedSubjects = sanitizeSubjects(apiSubjects as unknown as Subject[]);
      // Update local subjects directly - this works because subjects is a local state
      setSubjects(updatedSubjects as any);
    } catch (err) {
      console.error('Failed to refresh allSubjects:', err);
    }

    // If no new questions to import, just refresh the data from DB
    if (!newQuestions || newQuestions.length === 0) {
      try {
        const result = await getQuestionsBySubject(subjectSlug);
        const mappedQuestions: Question[] = result.data.map(mapQuizQuestionToQuestion);
        setAllQuestions(prev => ({
          ...prev,
          [subjectSlug]: mappedQuestions
        }));
        setQuestionCounts(prev => ({
          ...prev,
          [subjectSlug]: result.total  // FIX: Use actual total from API
        }));
        setQuestionPagination(prev => ({
          ...prev,
          [subjectSlug]: { page: result.page, limit: result.limit, total: result.total }
        }));
      } catch (err) {
        console.error('Failed to refresh questions:', err);
      }
      return;
    }

    let subjectId: string | undefined;

    // First, check if subject is in local state
    const subject = allSubjects.find(s => s.slug === subjectSlug);
    if (subject?.id) {
      subjectId = subject.id;
    }

    // Always fetch from API to ensure we have the correct subject ID
    // This handles cases where subject exists in DB but not in frontend state
    try {
      const subjectData = await getSubjectBySlug(subjectSlug);
      if (subjectData?.id) {
        subjectId = subjectData.id;
        // Subject will be refreshed via refetchSubjects() - no need to add to state
      }
    } catch (err) {
      console.error('Failed to fetch subject from API:', err);
      // If subject was found in state, use its ID despite API error
      if (!subjectId) {
        console.error('Subject not found in state or API');
        return;
      }
    }

    if (!subjectId) {
      console.error('Subject ID not found');
      return;
    }

    // Get chapters for this subject
    let chapters = await getChaptersBySubject(subjectId);

    // Get unique chapters from questions
    const questionChapters = [...new Set(newQuestions.map(q => q.chapter || 'General'))];

    // Find or create each chapter
    for (const chapterName of questionChapters) {
      let chapter = chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());
      if (!chapter) {
        try {
          chapter = await createChapter({ name: chapterName, subjectId });
          chapters.push(chapter);
        } catch (err) {
          console.error(`Failed to create chapter ${chapterName}:`, err);
        }
      }
    }

    // Build a map of chapter names to IDs
    const chapterMap = new Map(chapters.map(c => [c.name.toLowerCase(), c.id]));

    const apiQuestions = newQuestions.map(q => {
      const allOptions = [q.optionA, q.optionB, q.optionC, q.optionD].filter(o => o);
      const correctLetter = (q.correctAnswer || 'A').toUpperCase();
      const correctAnswerText = q.level === 'extreme' ? q.correctAnswer : (correctLetter === 'A' ? q.optionA : correctLetter === 'B' ? q.optionB : correctLetter === 'C' ? q.optionC : q.optionD);

      const chapterName = (q.chapter || 'General').toLowerCase();
      const chapterId = chapterMap.get(chapterName) || chapterMap.get('general');

      return {
        question: q.question,
        correctAnswer: correctAnswerText,
        options: allOptions,
        level: q.level,
        explanation: q.explanation,
        chapterId: chapterId || '',
        status: (q.status === 'trash' ? 'draft' : (q.status || 'published')) as 'published' | 'draft',
      };
    });

    try {
      await createQuestionsBulk(apiQuestions);
      const result = await getQuestionsBySubject(subjectSlug);
      const mappedQuestions: Question[] = result.data.map(mapQuizQuestionToQuestion);
      setAllQuestions(prev => ({
        ...prev,
        [subjectSlug]: mappedQuestions
      }));
      setQuestionCounts(prev => ({
        ...prev,
        [subjectSlug]: result.total
      }));
      setQuestionPagination(prev => ({
        ...prev,
        [subjectSlug]: { page: result.page, limit: result.limit, total: result.total }
      }));
    } catch (err) {
      console.error('Failed to save questions to database:', err);
    }
  };

  const handleQuestionsUpdate = async (subjectSlug: string, updatedQuestions: Question[]) => {
    const subject = allSubjects.find(s => s.slug === subjectSlug);
    if (!subject) return;

    let chapterMap = new Map<string, string>();
    try {
      const existingChapters = await getChaptersBySubject(subject.id);
      chapterMap = new Map(existingChapters.map(c => [c.name.toLowerCase(), c.id]));
    } catch (err) {
      console.error('Failed to fetch chapters for update:', err);
    }

    for (const q of updatedQuestions) {
      const allOptions = [q.optionA, q.optionB, q.optionC, q.optionD].filter(o => o);
      const correctLetter = (q.correctAnswer || 'A').toUpperCase();
      const correctAnswerText = q.level === 'extreme' ? q.correctAnswer : (correctLetter === 'A' ? q.optionA : correctLetter === 'B' ? q.optionB : correctLetter === 'C' ? q.optionC : q.optionD);

      const chapterName = (q.chapter || 'General').toLowerCase();
      const chapterId = chapterMap.get(chapterName) || '';

      if (!q.id || q.id.startsWith('local-')) {
        if (!chapterId) {
          console.error('Cannot create question without a valid chapter ID');
          continue;
        }
        const apiQuestion = {
          question: q.question,
          options: allOptions,
          correctAnswer: correctAnswerText,
          level: q.level,
          hint: q.hint || '',
          explanation: q.explanation || '',
          chapterId: chapterId,
          status: q.status === 'trash' ? 'draft' : (q.status || 'published'),
        };
        try {
          await createQuestion(apiQuestion);
        } catch (err) {
          console.error('Failed to create question:', err);
        }
      } else {
        try {
          await updateQuestion(q.id, {
            question: q.question,
            options: allOptions,
            correctAnswer: correctAnswerText,
            level: q.level,
            explanation: q.explanation || '',
            status: (q.status === 'trash' ? 'draft' : (q.status || 'published')) as 'published' | 'draft',
          });
        } catch (err) {
          console.error('Failed to update question:', q.id, err);
        }
      }
    }

    try {
      const result = await getQuestionsBySubject(subjectSlug);
      const mappedQuestions: Question[] = result.data.map(mapQuizQuestionToQuestion);
      setAllQuestions(prev => ({
        ...prev,
        [subjectSlug]: mappedQuestions
      }));
      setQuestionCounts(prev => ({
        ...prev,
        [subjectSlug]: result.total
      }));
      setQuestionPagination(prev => ({
        ...prev,
        [subjectSlug]: { page: result.page, limit: result.limit, total: result.total }
      }));
    } catch (err) {
      console.error('Failed to refetch questions:', err);
    }
  };

  // Handle clear all questions for a subject
  const handleClearQuestions = async (subjectSlug: string) => {
    const currentQuestions = allQuestions[subjectSlug] || [];
    const questionIds = currentQuestions.filter(q => q.id && !q.id.startsWith('local-')).map(q => q.id);

    if (questionIds.length > 0) {
      try {
        await bulkActionQuestions(questionIds, 'delete');
      } catch (err) {
        console.error('Failed to delete questions from database:', err);
      }
    }

    setAllQuestions(prev => ({
      ...prev,
      [subjectSlug]: [],
    }));
    setQuestionCounts(prev => ({
      ...prev,
      [subjectSlug]: 0
    }));
  };

  // Export questions to JSON or CSV file (for backup/deployment)
  const handleExportQuestions = () => {
    if (exportFormat === 'json') {
      const data = {
        subjects: allSubjects,
        questions: allQuestions,
        lastUpdated: new Date().toISOString(),
      };
      saveQuizData(data).then(() => {
        exportQuizDataToFile(data);
        setShowExportModal(false);
      });
    } else {
      // CSV export - combine all questions from all subjects
      let csvContent = '';
      allSubjects.forEach(subject => {
        const questions = allQuestions[subject.slug] || [];
        if (questions.length > 0) {
          csvContent += exportQuestionsToCSV(questions, subject.name);
          csvContent += '\n\n';
        }
      });
      downloadFile(csvContent, 'all_questions.csv', 'text/csv');
      setShowExportModal(false);
    }
  };

  // Import questions from JSON or CSV file
  const handleImportQuestions = async (file: File) => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
      const data = await importQuizDataFromFile(file);
      if (data) {
        // Save each subject to database
        for (const subject of data.subjects) {
          try {
            await createSubject({
              name: subject.name,
              slug: subject.slug,
              emoji: subject.emoji || '📚',
              category: subject.category,
            });
          } catch (err) {
            console.error('Failed to create subject:', subject.name, err);
          }
        }
        setLocalSubjects(data.subjects);
        setAllQuestions(data.questions);
        await saveQuizData(data);
        setShowImportModal(false);
      }
    } else if (fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;

        const result = await importQuestionsFromCSV(content, allSubjects);

        console.log('Import result:', result);

        if (result.success) {
          // Refresh subjects and questions after successful import
          refetchSubjects();
          
          const newQuestions = await getQuestionsBySubject(result.subjectSlug);
          const mappedQuestions: Question[] = newQuestions.data.map(mapQuizQuestionToQuestion);
          setAllQuestions(prev => ({
            ...prev,
            [result.subjectSlug]: mappedQuestions
          }));
          setQuestionCounts(prev => ({
            ...prev,
            [result.subjectSlug]: result.questionsImported
          }));

          alert(`Successfully imported ${result.questionsImported} questions!\nSubject: ${result.subjectName}\nChapters: ${result.chaptersCreated}`);
        } else {
          alert(`Import failed:\n${result.errors.join('\n')}`);
        }
        setShowImportModal(false);
      };
      reader.readAsText(file);
    }
  };

  // Add new subject
  const handleAddSubject = async (newSubject: Subject) => {
    try {
      const created = await createSubject({
        name: newSubject.name,
        slug: newSubject.slug,
        emoji: newSubject.emoji || '📚',
        category: newSubject.category,
      });
      // Add to local state immediately for UI update
      const subjectWithId: Subject = {
        ...newSubject,
        id: created.id,
      };
      setLocalSubjects(prev => [...prev, subjectWithId]);
      setAllQuestions(prev => ({ ...prev, [newSubject.slug]: [] }));
    } catch (err) {
      console.error('Failed to create subject in database:', err);
    }
    setShowAddSubjectModal(false);
  };

  // Add new subject by name and slug (used for CSV import)
  const handleAddSubjectByName = async (name: string, slug: string) => {
    try {
      const created = await createSubject({
        name,
        slug,
        emoji: '📚',
        category: 'academic',
      });
      const newSubject: Subject = {
        id: created.id,
        slug,
        name,
        emoji: '📚',
        category: 'academic',
      };
      setLocalSubjects(prev => [...prev, newSubject]);
      setAllQuestions(prev => ({ ...prev, [slug]: [] }));
    } catch (err) {
      console.error('Failed to create subject in database:', err);
    }
  };

  // Add chapter to subject
  const handleAddChapter = async (subjectSlug: string, chapterName: string) => {
    const subject = allSubjects.find(s => s.slug === subjectSlug);
    if (!subject) {
      console.error('Subject not found:', subjectSlug);
      return;
    }
    
    try {
      await createChapter({ name: chapterName, subjectId: subject.id });
      // Refresh questions to show the new chapter
      handleQuestionsRefresh(subjectSlug);
    } catch (err) {
      console.error('Failed to create chapter:', err);
    }
  };

  // Delete chapter from subject
  const handleDeleteChapter = async (subjectSlug: string, chapterId: string, _chapterName: string) => {
    try {
      await deleteChapter(chapterId);
      // Refresh questions to update the list
      handleQuestionsRefresh(subjectSlug);
    } catch (err) {
      console.error('Failed to delete chapter:', err);
    }
  };

  // Delete subject
  const handleDeleteSubject = (subjectId: string) => {
    const subject = allSubjects.find(s => s.id === subjectId);
    if (!subject) return;
    setSubjectToDelete(subject);
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;

    const subjectId = subjectToDelete.id;
    const subjectSlug = subjectToDelete.slug;
    const wasActiveSection = activeSection === subjectSlug;

    if (!subjectId.startsWith('local-')) {
      try {
        await deleteSubject(subjectId);
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (error.message?.includes('not found') || error.message?.includes('Subject not found')) {
          console.warn('Subject may have already been deleted from database, removing from local state');
        } else {
          console.error('Failed to delete subject from database:', err);
        }
      }
    }

    const remainingSubjects = allSubjects.filter(s => s.id !== subjectId);
    setLocalSubjects(remainingSubjects);
    setAllQuestions(prev => {
      const updated = { ...prev };
      delete updated[subjectSlug];
      return updated;
    });
    setQuestionCounts(prev => {
      const updated = { ...prev };
      delete updated[subjectSlug];
      return updated;
    });
    setQuizChapters(prev => {
      const updated = { ...prev };
      delete updated[subjectSlug];
      return updated;
    });
    setSubjectStatusCounts(prev => {
      const updated = { ...prev };
      delete updated[subjectSlug];
      return updated;
    });
    setSubjectChapterCounts(prev => {
      const updated = { ...prev };
      delete updated[subjectSlug];
      return updated;
    });
    setSubjectLevelCounts(prev => {
      const updated = { ...prev };
      delete updated[subjectSlug];
      return updated;
    });

    if (wasActiveSection && remainingSubjects.length > 0) {
      const nextSubject = remainingSubjects[0]!;
      setActiveSection(nextSubject.slug);
    } else if (wasActiveSection && remainingSubjects.length === 0) {
      setActiveSection('dashboard');
    }

    setSubjectToDelete(null);
  };

  // Edit subject
  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setShowEditSubjectModal(true);
  };

  // Update subject
  const handleUpdateSubject = async (updatedSubject: Subject) => {
    // Update in database
    try {
      await updateSubject(updatedSubject.id, {
        name: updatedSubject.name,
        emoji: updatedSubject.emoji,
        category: updatedSubject.category,
        isActive: updatedSubject.isActive,
      });
    } catch (err) {
      console.error('Failed to update subject in database:', err);
    }
    setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    // If slug changed, update questions key
    if (editingSubject && editingSubject.slug !== updatedSubject.slug) {
      setAllQuestions(prev => {
        const questions = prev[editingSubject.slug] || [];
        const { [editingSubject.slug]: _, ...rest } = prev;
        return { ...rest, [updatedSubject.slug]: questions };
      });
    }
    setShowEditSubjectModal(false);
    setEditingSubject(null);
  };

  // Show loading state until hydration is complete to avoid section flash
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-secondary-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Compute Riddle Chapters and Counts for the Sidebar
  // Include chapters from persisted order AND from existing riddles
  const uniqueRiddleChaptersSet = new Set([...riddleChapterOrder, ...allRiddles.map(r => r.chapter)]);

  // Include currently filtered chapter even if empty
  if (riddleFilterChapter && riddleFilterChapter !== '') {
    uniqueRiddleChaptersSet.add(riddleFilterChapter);
  }
  const uniqueRiddleChapters = Array.from(uniqueRiddleChaptersSet);

  // Calculate sorted order using persisted riddleChapterOrder
  const orderedRiddleChapters = [...uniqueRiddleChapters].sort((a, b) => {
    const indexA = riddleChapterOrder.indexOf(a);
    const indexB = riddleChapterOrder.indexOf(b);

    // If both exist in order, sort by order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A exists, A comes first
    if (indexA !== -1) return -1;
    // If only B exists, B comes first
    if (indexB !== -1) return 1;
    // If neither exists, sort alphabetically
    return a.localeCompare(b);
  });

  const riddleChapterCounts = uniqueRiddleChapters.reduce((acc, chapter) => {
    acc[chapter] = allRiddles.filter(r => r.chapter === chapter).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-secondary-950">
      {/* Sidebar (Sticky) */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col sticky top-0 h-screen z-20`}>
        {/* Logo */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold flex items-center gap-2"><Gamepad2 className="w-5 h-5" /> Admin Panel</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-gray-800"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* Dashboard */}
          <MenuItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            active={activeSection === 'dashboard'}
            expanded={sidebarOpen}
            onClick={() => updateURL({ section: 'dashboard' })}
          />

          {/* Quiz Module with Categories */}
          <QuizSidebar
            subjects={allSubjects}
            activeSection={activeSection}
            sidebarOpen={sidebarOpen}
            quizModuleExpanded={quizModuleExpanded}
            onToggleExpand={() => setQuizModuleExpanded(!quizModuleExpanded)}
            onSelectSubject={(slug) => updateURL({ section: slug })}
            onAddSubject={(category) => {
              setSelectedCategory(category);
              setShowAddSubjectModal(true);
            }}
            onEditSubject={handleEditSubject}
            onReorderSubjects={handleReorderSubjects}
            questionCounts={questionCounts}
          />

          {/* Other Modules Header */}
          <button
            onClick={() => setOtherModulesExpanded(!otherModulesExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <>
                <span className="flex items-center gap-2"><Puzzle className="w-4 h-4" /> Other Modules</span>
                <span className={`transition-transform ${otherModulesExpanded ? 'rotate-180' : ''}`}><ChevronDown className="w-3 h-3" /></span>
              </>
            ) : (
              <span className="flex items-center justify-center w-5 h-5"><Puzzle className="w-4 h-4" /></span>
            )}
          </button>

          {/* Dad Jokes & Riddles */}
          {otherModulesExpanded && (
            <>
              <MenuItem
                icon={<Smile className="w-5 h-5" />}
                label="Dad Jokes"
                active={activeSection === 'jokes'}
                expanded={sidebarOpen}
                onClick={() => updateURL({ section: 'jokes' })}
              />
              <RiddleSidebar
                chapters={orderedRiddleChapters}
                activeSection={activeSection}
                activeChapter={riddleFilterChapter}
                sidebarOpen={sidebarOpen}
                moduleExpanded={riddleModuleExpanded}
                onToggleExpand={() => {
                  setRiddleModuleExpanded(!riddleModuleExpanded);
                  setActiveSection('riddles');
                  setRiddleFilterChapter('');
                  updateURL({ section: 'riddles', chapter: null });
                }}
                onSelectChapter={(chapter) => {
                  setActiveSection('riddles');
                  setRiddleFilterChapter(chapter);
                  updateURL({ section: 'riddles', chapter });
                }}
                onReorderChapters={(newOrder) => {
                  setRiddleChapterOrder(newOrder);
                }}
                chapterCounts={riddleChapterCounts}
              />
              <MenuItem
                icon={<ImageIcon className="w-5 h-5" />}
                label="Image Riddles"
                active={activeSection === 'image-riddles'}
                expanded={sidebarOpen}
                onClick={() => updateURL({ section: 'image-riddles' })}
              />
            </>
          )}

          {/* System */}
          {sidebarOpen && (
            <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-3 h-3" /> System
            </div>
          )}
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="Users"
            active={activeSection === 'users'}
            expanded={sidebarOpen}
            onClick={() => updateURL({ section: 'users' })}
          />
          <MenuItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={activeSection === 'settings'}
            expanded={sidebarOpen}
            onClick={() => updateURL({ section: 'settings' })}
          />
        </nav>

        {/* Back to Site */}
        <div className="border-t border-gray-800 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
          >
            <span><Home className="w-5 h-5" /></span>
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm dark:bg-secondary-900 dark:border-b dark:border-secondary-800">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-secondary-100 flex items-center gap-2">
              {activeSection === 'dashboard' && <><LayoutDashboard className="w-6 h-6" /> Dashboard</>}
              {activeSection === 'jokes' && <><Smile className="w-6 h-6" /> Dad Jokes Management</>}
              {activeSection === 'riddles' && <><Puzzle className="w-6 h-6" /> Riddle MCQ Management</>}
              {activeSection === 'image-riddles' && <><ImageIcon className="w-6 h-6" /> Image Riddles Management</>}
              {activeSection === 'users' && <><Users className="w-6 h-6" /> User Management</>}
              {activeSection === 'settings' && <><Settings className="w-6 h-6" /> Settings</>}
              {allSubjects.some(s => s.slug === activeSection) && (
                <>
                  <span className="text-2xl">{isEmoji(allSubjects.find(s => s.slug === activeSection)?.emoji || '') ? allSubjects.find(s => s.slug === activeSection)?.emoji : '📚'}</span>
                  <span>{allSubjects.find(s => s.slug === activeSection)?.name ?? ''} - Question Management</span>
                </>
              )}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-secondary-400">Welcome, Admin</span>
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-secondary-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>



        {/* Content Area */}
        <div className="p-6">
          {activeSection === 'dashboard' && (
            <DashboardSection
              onSelectSubject={setActiveSection}
              allSubjects={allSubjects}
              allQuestions={allQuestions}
              onAddSubject={() => setShowAddSubjectModal(true)}
              onExport={() => setShowExportModal(true)}
              onImport={() => setShowImportModal(true)}
              onDeleteSubject={handleDeleteSubject}
            />
          )}
          {allSubjects.some(s => s.slug === activeSection) && (
            <QuestionManagementSection
              subject={getSubjectFromSection(activeSection) as Subject}
              questions={getQuestionsForSubject(activeSection)}
              pagination={getQuestionPagination(activeSection)}
              chapters={getChaptersForSubject(activeSection)}
              statusCounts={getStatusCountsForSubject(activeSection)}
              chapterCounts={getChapterCountsForSubject(activeSection)}
              levelCounts={getLevelCountsForSubject(activeSection)}
              allSubjects={[...allSubjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
              onSubjectSelect={handleSubjectSelect}
              onAddSubject={handleAddSubjectByName}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              onQuestionsImport={handleQuestionsImport}
              onQuestionsUpdate={handleQuestionsUpdate}
              onClearQuestions={handleClearQuestions}
              onEditSubject={handleEditSubject}
              onDeleteSubject={handleDeleteSubject}
              onPageChange={handleQuestionPageChange}
              onFilterChange={handleQuestionFilterChange}
              onQuestionsRefresh={handleQuestionsRefresh}
            />
          )}
          {activeSection === 'jokes' && (
            <JokesSection
              allJokes={allJokes}
              setAllJokes={setAllJokes}
              jokeCategories={jokeCategories}
              setJokeCategories={setJokeCategories}
            />
          )}
          {activeSection === 'riddles' && (
            <RiddlesSection
              allRiddles={allRiddles}
              setAllRiddles={setAllRiddles}
              riddleFilterChapter={riddleFilterChapter}
              setRiddleFilterChapter={setRiddleFilterChapter}
              riddleChapterOrder={riddleChapterOrder}
              setRiddleChapterOrder={setRiddleChapterOrder}
            />
          )}
          {activeSection === 'image-riddles' && <ImageRiddlesAdminSection />}
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'settings' && <SettingsSection />}
        </div>
      </main>

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <AddSubjectModal
          onClose={() => setShowAddSubjectModal(false)}
          onAdd={handleAddSubject}
          existingSlugs={allSubjects.map(s => s.slug)}
          defaultCategory={selectedCategory}
        />
      )}

      {/* Export Questions Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md border dark:border-secondary-700">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-secondary-100">📤 Export Questions</h3>
            <p className="text-gray-600 dark:text-secondary-300 mb-4">
              Choose export format:
            </p>

            {/* Format Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex-1 rounded-lg px-4 py-2 border-2 ${exportFormat === 'json'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                  : 'border-gray-300 dark:border-secondary-600 text-gray-600 dark:text-secondary-400'
                  }`}
              >
                📄 JSON
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex-1 rounded-lg px-4 py-2 border-2 ${exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                  : 'border-gray-300 dark:border-secondary-600 text-gray-600 dark:text-secondary-400'
                  }`}
              >
                📊 CSV
              </button>
            </div>

            {exportFormat === 'json' ? (
              <>
                <p className="text-gray-600 dark:text-secondary-300 mb-4">
                  Downloads all allSubjects and questions as a JSON file. Best for:
                </p>
                <ul className="text-sm text-gray-500 dark:text-secondary-400 mb-4 list-disc list-inside">
                  <li>Full backup and restore</li>
                  <li>Include in website code for deployment</li>
                  <li>Transfer to another website</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-secondary-300 mb-4">
                  Downloads all questions as CSV files. Best for:
                </p>
                <ul className="text-sm text-gray-500 dark:text-secondary-400 mb-4 list-disc list-inside">
                  <li>Open in Excel/Google Sheets</li>
                  <li>Edit questions in spreadsheet</li>
                  <li>Share with others easily</li>
                </ul>
              </>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 rounded-lg bg-gray-200 dark:bg-secondary-700 px-4 py-2 text-gray-700 dark:text-secondary-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExportQuestions}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                {exportFormat === 'json' ? 'Download JSON' : 'Download CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Questions Modal */}
      {showImportModal && (
        <ImportQuestionsModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportQuestions}
        />
      )}

      {/* Edit Subject Modal */}
      {showEditSubjectModal && editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          onClose={() => { setShowEditSubjectModal(false); setEditingSubject(null); }}
          onUpdate={handleUpdateSubject}
          existingSlugs={allSubjects.filter(s => s.id !== editingSubject.id).map(s => s.slug)}
        />
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
              Delete Subject
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong className="text-gray-800">&quot;{subjectToDelete.name}&quot;</strong>?
              <br /><br />
              This will also delete all questions in this subject. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSubjectToDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSubject}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminGuard />
    </div>
  );
}

// Menu Item Component
function MenuItem({ icon, label, active, expanded, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
        }`}
    >
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      {expanded && <span>{label}</span>}
    </button>
  );
}

// Available icon options for allSubjects
// Add Subject Modal
function AddSubjectModal({ onClose, onAdd, existingSlugs, defaultCategory = 'academic' }: {
  onClose: () => void;
  onAdd: (subject: Subject) => void;
  existingSlugs: string[];
  defaultCategory?: 'academic' | 'professional' | 'entertainment';
}): JSX.Element {
  const [name, setName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('📚');
  const [category, setCategory] = useState<'academic' | 'professional' | 'entertainment'>(defaultCategory);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }
    if (existingSlugs.includes(slug)) {
      setError('A subject with this name already exists');
      return;
    }

    onAdd({
      id: String(Date.now()),
      slug,
      name: name.trim(),
      emoji: customEmoji || '📚',
      category,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md border dark:border-secondary-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-secondary-100">Add New Subject</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Subject Name</label>
            <input
              id="subjectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100"
              placeholder="e.g., Physics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">Subject Emoji</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                placeholder="Paste any emoji here 🎨"
                className="flex-1 rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100 text-2xl text-center"
                maxLength={2}
              />
              <span className="text-3xl">{customEmoji || '📚'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Paste any emoji to represent this subject</p>
          </div>
          <div>
            <label htmlFor="subjectCategory" className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Category</label>
            <select
              id="subjectCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'academic' | 'professional' | 'entertainment')}
              className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100"
            >
              <option value="academic">Academic</option>
              <option value="professional">Professional & Life</option>
              <option value="entertainment">Entertainment & Culture</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-200 dark:bg-secondary-700 px-4 py-2 text-gray-700 dark:text-secondary-200 hover:bg-gray-300 dark:hover:bg-secondary-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Add Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import Questions Modal
function ImportQuestionsModal({ onClose, onImport }: {
  onClose: () => void;
  onImport: (file: File) => void;
}): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.json') && !fileName.endsWith('.csv')) {
        setError('Please select a JSON or CSV file');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md border dark:border-secondary-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-secondary-100">📥 Import Questions</h3>
        <p className="text-gray-600 dark:text-secondary-300 mb-4">
          Upload a JSON or CSV file with questions.
        </p>

        <div className="bg-gray-50 dark:bg-secondary-700 p-3 rounded-lg mb-4 text-sm">
          <p className="font-medium mb-1">JSON:</p>
          <p className="text-gray-500 dark:text-secondary-400 text-xs mb-2">Full backup from this website</p>
          <p className="font-medium mb-1">CSV:</p>
          <p className="text-gray-500 dark:text-secondary-400 text-xs">Add questions from spreadsheet (creates subject if not exists)</p>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-secondary-300">
            Select JSON or CSV File
          </label>
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-secondary-100"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 dark:bg-secondary-700 px-4 py-2 text-gray-700 dark:text-secondary-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile}
            className="flex-1 rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Subject Modal
function EditSubjectModal({ subject, onClose, onUpdate, existingSlugs }: {
  subject: Subject;
  onClose: () => void;
  onUpdate: (subject: Subject) => void;
  existingSlugs: string[];
}): JSX.Element {
  const [name, setName] = useState(subject.name);
  const [customEmoji, setCustomEmoji] = useState(subject.emoji);
  const [category, setCategory] = useState<'academic' | 'professional' | 'entertainment'>(subject.category);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }
    if (slug !== subject.slug && existingSlugs.includes(slug)) {
      setError('A subject with this name already exists');
      return;
    }

    onUpdate({
      ...subject,
      slug,
      name: name.trim(),
      emoji: customEmoji || '📚',
      category,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md border dark:border-secondary-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-secondary-100">Edit Subject</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editSubjectName" className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Subject Name</label>
            <input
              id="editSubjectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100"
              placeholder="e.g., Physics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">Subject Emoji</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                placeholder="Paste any emoji here 🎨"
                className="flex-1 rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100 text-2xl text-center"
                maxLength={2}
              />
              <span className="text-3xl">{customEmoji || '📚'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Paste any emoji to represent this subject</p>
          </div>
          <div>
            <label htmlFor="editSubjectCategory" className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Category</label>
            <select
              id="editSubjectCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'academic' | 'professional' | 'entertainment')}
              className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100"
            >
              <option value="academic">Academic</option>
              <option value="professional">Professional & Life</option>
              <option value="entertainment">Entertainment & Culture</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-200 dark:bg-secondary-700 px-4 py-2 text-gray-700 dark:text-secondary-200 hover:bg-gray-300 dark:hover:bg-secondary-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Dashboard Section
function DashboardSection({ onSelectSubject, allSubjects, allQuestions, onAddSubject, onExport, onImport, onDeleteSubject }: {
  onSelectSubject: (section: MenuSection) => void;
  allSubjects: Subject[];
  allQuestions: Record<string, Question[]>;
  onAddSubject: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteSubject: (subjectId: string) => void;
}): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Quick Overview</h3>
        <div className="flex gap-2">
          <button
            onClick={onAddSubject}
            className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 flex items-center gap-2"
          >
            <span>+</span> Add Subject
          </button>
          <button
            onClick={onExport}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 flex items-center gap-2"
          >
            <span>📤</span> Export
          </button>
          <button
            onClick={onImport}
            className="rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 flex items-center gap-2"
          >
            <span>📥</span> Import
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allSubjects.map((subject) => (
          <div
            key={subject.slug}
            className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow relative group"
          >
            <button
              onClick={() => onSelectSubject(subject.slug as MenuSection)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 p-3 text-white">
                  <span className="text-2xl">{isEmoji(subject.emoji) ? subject.emoji : '📚'}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{subject.name}</p>
                  <p className="text-sm text-gray-500">{(allQuestions[subject.slug] ?? []).length} questions</p>
                </div>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSubject(subject.id);
              }}
              className="absolute top-2 right-2 p-2 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete subject"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/*
// Download file helper - Prefixed with underscore as it's not currently used
function _downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
*/

// ============================================================================
// ENTERPRISE-GRADE IMPORT/EXPORT UTILITIES
// ============================================================================

/*
 * Enterprise-Grade CSV Validator
 * Validates CSV content against expected headers and structure
 * Commented out as it's not currently used
function validateCSVStructure(csvText: string, expectedHeaders: string[]): ValidationResult<string[]> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    errors.push('CSV file must have at least a header row and one data row');
    return { isValid: false, data: null, errors, warnings };
  }

  const firstLine = lines[0];
  if (!firstLine) {
    errors.push('CSV header row is empty');
    return { isValid: false, data: null, errors, warnings };
  }

  const headers = parseCSVLine(firstLine).map(h => h.toLowerCase().trim());

  // Check for required headers
  const missingHeaders = expectedHeaders.filter(h =>
    !headers.some(header => header.includes(h.toLowerCase()))
  );

  if (missingHeaders.length > 0) {
    warnings.push(`Missing recommended headers: ${missingHeaders.join(', ')}`);
  }

  // Check for empty rows
  const emptyRows = lines.filter((line, idx) => idx > 0 && (!line || line.trim() === ''));
  if (emptyRows.length > 0) {
    warnings.push(`${emptyRows.length} empty rows detected and will be skipped`);
  }

  return {
    isValid: errors.length === 0,
    data: lines,
    errors,
    warnings
  };
}
*/

/*
 * Enterprise-Grade JSON Validator
 * Validates JSON content structure
 * Prefixed with underscore as it's not currently used
function _validateJSONStructure<T>(jsonText: string, rootKey?: string): ValidationResult<T[]> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(jsonText);

    let dataArray: T[];
    if (rootKey && parsed[rootKey]) {
      dataArray = Array.isArray(parsed[rootKey]) ? parsed[rootKey] : [parsed[rootKey]];
    } else if (Array.isArray(parsed)) {
      dataArray = parsed;
    } else {
      dataArray = [parsed];
    }

    if (dataArray.length === 0) {
      errors.push('No data records found in JSON file');
    }

    return {
      isValid: errors.length === 0,
      data: dataArray,
      errors,
      warnings
    };
  } catch (err) {
    errors.push(`Invalid JSON format: ${(err as Error).message}`);
    return { isValid: false, data: null, errors, warnings };
  }
}
*/

/*
 * Enterprise-Grade Entity Validator
 * Validates entity data against configuration rules
 * Commented out as it's not currently used
function validateEntity<T extends Record<string, unknown>>(
  entity: Partial<T>,
  config: ImportExportConfig<T>,
  rowIndex: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  config.validators.required.forEach(field => {
    const value = entity[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`Row ${rowIndex}: Missing required field "${String(field)}"`);
    }
  });

  // Check enum fields
  if (config.validators.enumFields) {
    Object.entries(config.validators.enumFields).forEach(([field, validValues]) => {
      const value = entity[field as keyof T];
      if (value !== undefined && value !== null && value !== '') {
        if (!validValues.includes(String(value))) {
          errors.push(`Row ${rowIndex}: Invalid value "${value}" for field "${field}". Valid values: ${validValues.join(', ')}`);
        }
      }
    });
  }

  // Check max length
  if (config.validators.maxLength) {
    Object.entries(config.validators.maxLength).forEach(([field, maxLen]) => {
      const value = entity[field as keyof T];
      if (value !== undefined && value !== null) {
        const strValue = String(value);
        if (strValue.length > maxLen) {
          errors.push(`Row ${rowIndex}: Field "${field}" exceeds maximum length of ${maxLen} characters`);
        }
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}
*/

/*
 * Enterprise-Grade Generic CSV Exporter
 * Commented out as it's not currently used - available in utils/index.ts
function exportToCSV<T extends Record<string, unknown>>(
  items: T[],
  config: ImportExportConfig<T>,
  metadata?: Record<string, string>
): string {
  const headers = config.csvHeaders;

  const rows = items.map(item =>
    headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '') as keyof T;
      const value = item[key];

      if (value === null || value === undefined) { return ''; }

      const strValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    })
  );

  // Add metadata header if provided
  let csvContent = '';
  if (metadata) {
    csvContent += '# ' + Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') + '\n';
  }

  csvContent += [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csvContent;
}
*/

/*
 * Enterprise-Grade Generic JSON Exporter
 * Prefixed with underscore as it's not currently used
function _exportToJSON<T>(
  items: T[],
  config: ImportExportConfig<T>,
  metadata?: Record<string, unknown>
): string {
  const data: Record<string, unknown> = {
    [config.jsonRootKey]: items,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  if (metadata) {
    data['metadata'] = metadata;
  }

  return JSON.stringify(data, null, 2);
}
*/

/*
 * Enterprise-Grade Generic CSV Importer
 * Commented out as it's not currently used - available in utils/index.ts
function importFromCSV<T extends Record<string, unknown>>(
  csvText: string,
  config: ImportExportConfig<T>,
  mapper: (values: string[], headers: string[]) => Partial<T>
): ImportResult<T> {
  const imported: T[] = [];
  const failed: { row: number; error: string; data: unknown }[] = [];

  const validation = validateCSVStructure(csvText, config.csvHeaders);
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      imported,
      failed: validation.errors.map((err, errIndex) => ({
        row: errIndex,
        error: err,
        data: null
      })),
      total: 0
    };
  }

  const lines = validation.data;
  const firstLine = lines[0];
  if (!firstLine) {
    return { success: false, imported, failed, total: 0 };
  }

  const headers = parseCSVLine(firstLine);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') { continue; }

    const values = parseCSVLine(line);
    try {
      const partialData = mapper(values, headers);
      const validation = validateEntity(partialData, config, i);

      if (validation.isValid) {
        imported.push(partialData as T);
      } else {
        failed.push({ row: i, error: validation.errors.join('; '), data: partialData });
      }
    } catch (err) {
      failed.push({ row: i, error: (err as Error).message, data: line });
    }
  }

  return {
    success: failed.length === 0,
    imported,
    failed,
    total: imported.length + failed.length
  };
}
*/

// ============================================================================
// ENTITY-SPECIFIC CONFIGURATIONS
// ============================================================================

/*
 * Joke Import/Export Config
 * Commented out as it's not currently used
const jokeConfig: ImportExportConfig<Joke> = {
  entityName: 'Joke',
  filePrefix: 'jokes',
  csvHeaders: ['ID', 'Joke', 'Category'],
  jsonRootKey: 'jokes',
  validators: {
    required: ['joke', 'category'],
    maxLength: { joke: 2000, category: 100 },
  },
};
*/

/*
 * Riddle Import/Export Config
 * Commented out as it's not currently used
const riddleConfig: ImportExportConfig<Riddle> = {
  entityName: 'Riddle',
  filePrefix: 'riddles',
  csvHeaders: ['ID', 'Question', 'Answer', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectOption', 'Difficulty', 'Chapter', 'Hint'],
  jsonRootKey: 'riddles',
  validators: {
    required: ['question', 'answer', 'options', 'correctOption', 'difficulty', 'chapter'],
    enumFields: {
      difficulty: ['easy', 'medium', 'hard', 'expert', 'extreme'],
      correctOption: ['A', 'B', 'C', 'D'],
    },
    maxLength: { question: 1000, answer: 500, chapter: 200, hint: 500 },
  },
};
*/

// ============================================================================
// ENTITY-SPECIFIC EXPORTERS
// ============================================================================

/*
function _jokesToCSV(jokes: Joke[]): string {
  return exportToCSV(jokes, jokeConfig, { count: jokes.length.toString() });
}

function _jokesToJSON(jokes: Joke[]): string {
  return _exportToJSON(jokes, jokeConfig, { count: jokes.length });
}

function _riddlesToCSV(riddles: Riddle[]): string {
  return exportToCSV(riddles, riddleConfig, { count: riddles.length.toString() });
}

function _riddlesToJSON(riddles: Riddle[]): string {
  return _exportToJSON(riddles, riddleConfig, { count: riddles.length });
}
*/



// ============================================================================
// ENTITY-SPECIFIC IMPORTERS
// ============================================================================

/*
function _parseJokeCSV(csvText: string): ImportResult<Joke> {
  return importFromCSV(csvText, jokeConfig, (values, headers) => {
    const getValue = (_index: number, headerName: string): string => {
      const headerIndex = headers.findIndex(h => h.toLowerCase().includes(headerName.toLowerCase()));
      return headerIndex !== -1 && headerIndex < values.length ? values[headerIndex] ?? '' : '';
    };

    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      joke: getValue(1, 'joke'),
      category: getValue(2, 'category') || 'General',
    };
  });
}
*/

/*
function _parseRiddleCSV(csvText: string): ImportResult<Riddle> {
  return importFromCSV(csvText, riddleConfig, (values, headers) => {
    const getValue = (_index: number, headerName: string): string => {
      const headerIndex = headers.findIndex(h => h.toLowerCase().includes(headerName.toLowerCase()));
      return headerIndex !== -1 && headerIndex < values.length ? values[headerIndex] ?? '' : '';
    };

    const options = [
      getValue(3, 'optiona') || getValue(2, 'answer'),
      getValue(4, 'optionb'),
      getValue(5, 'optionc'),
      getValue(6, 'optiond'),
    ].filter(Boolean);

    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      question: getValue(1, 'question'),
      answer: getValue(2, 'answer'),
      options: options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOption: getValue(7, 'correctoption') || 'A',
      difficulty: (getValue(8, 'difficulty') || 'medium') as Riddle['difficulty'],
      chapter: getValue(9, 'chapter') || 'General',
      hint: getValue(10, 'hint'),
    };
  });
}
*/

// ============================================================================
// GLOBAL JOKES STATE (shared with JokesSection component)
// ============================================================================

function useGlobalJokes() {
  const [allJokes, setAllJokes] = useState<Joke[]>([]);

  useEffect(() => {
    getJokes()
      .then(setAllJokes)
      .catch(() => setAllJokes([]));
  }, []);

  return { allJokes, setAllJokes };
}

// ============================================================================
// GLOBAL JOKE CATEGORIES STATE (shared with JokesSection component)
// ============================================================================

function useGlobalJokeCategories() {
  const [jokeCategories, setJokeCategories] = useState<JokeCategory[]>([]);

  useEffect(() => {
    getJokeCategories()
      .then(setJokeCategories)
      .catch(() => setJokeCategories([]));
  }, []);

  return { jokeCategories, setJokeCategories };
}

/** Admin Guard component to be used at the end of the page */


// Initial data is now imported from @/lib/initial-data
// to support standalone persistence without cluttering this file.


// Users Section
function UsersSection(): JSX.Element {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Manage Users</h3>
        <button className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
          + Add User
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <select className="rounded-lg border border-gray-300 px-4 py-2">
          <option>All Roles</option>
          <option>Admin</option>
          <option>User</option>
        </select>
        <input
          type="text"
          placeholder="Search users..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { name: 'Admin', email: 'admin@aiquiz.com', role: 'admin', date: '2026-01-01' },
              { name: 'John Doe', email: 'john@example.com', role: 'user', date: '2026-02-10' },
              { name: 'Jane Smith', email: 'jane@example.com', role: 'user', date: '2026-02-12' },
            ].map((user) => (
              <tr key={`user-${user.email}`} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {user.name[0]}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">{user.email}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">{user.date}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex gap-2">
                    <button className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200">Edit</button>
                    <button className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

