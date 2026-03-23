'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  LogOut,
  BookOpen
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
import { ImageRiddlesAdminSection, JokesSection, QuizMcqSection, RiddleMcqSection, SettingsSection, AdminGuard } from './components';

import { saveQuizData, exportQuizDataToFile, importQuizDataFromFile } from '@/lib/quiz-data-manager';
import { QuizQuestion, getQuestionsBySubject, deleteSubject, createSubject, updateSubject } from '@/lib/quiz-api';
import { useQuizSubjects } from '@/hooks/useQuizSubjects';

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
  const [activeSection, setActiveSection] = useState<MenuSection>('summary');
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Use sanitized subjects from hook - memoized to prevent infinite re-renders
  const subjects = useMemo(() => sanitizeSubjects(dbSubjects), [dbSubjects, sanitizeSubjects]);

  // Local subjects state for immediate UI updates (add/delete without waiting for API)
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);

  // Combined subjects: local changes take priority - memoized to prevent infinite re-renders
  const allSubjects = useMemo(() =>
    localSubjects.length > 0 ? localSubjects : subjects,
    [localSubjects, subjects]
  );
  
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
    };
  }, []);
  
  // Other state
  const [allQuestions, setAllQuestions] = useState<Record<string, Question[]>>(defaultQuestions);
  const [allRiddles, setAllRiddles] = useState<Riddle[]>([]);
  const [allJokes, setAllJokes] = useState<Joke[]>([]);
  const [jokeCategories, setJokeCategories] = useState<JokeCategory[]>([]);


  // URL-based state management - replaces localStorage
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  
  // Get section from URL, default to dashboard
  const urlSection = searchParams.get('section') || 'summary';

  // Set active section from URL on initial load
  const hasSetInitialSection = useRef(false);
  useEffect(() => {
    if (hasSetInitialSection.current) return;
    if (allSubjects.length > 0 || urlSection) {
      // URL section takes priority, but validate if it's a quiz subject
      if (urlSection === 'riddle-mcq' || urlSection === 'image-riddles' || urlSection === 'jokes' || urlSection === 'users' || urlSection === 'settings' || urlSection === 'summary' || urlSection === 'quiz') {
        setActiveSection(urlSection as MenuSection);
      } else {
        // It's a quiz subject - check if valid
        const isValidSubject = allSubjects.some(s => s.slug === urlSection);
        if (isValidSubject) {
          setActiveSection(urlSection as MenuSection);
        } else {
          // Invalid subject - default to dashboard instead of auto-selecting first subject
          // This prevents flickering and unexpected behavior
          setActiveSection('summary');
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
    const isSpecialSection = ['riddle-mcq', 'image-riddles', 'jokes', 'users', 'settings', 'summary', 'quiz'].includes(urlSection);
    
    if (!isSpecialSection) {
      // It's a quiz subject - check if valid
      const isValidSubject = allSubjects.some(s => s.slug === urlSection);
      if (isValidSubject) {
        targetSection = urlSection;
      } else {
        // Invalid subject - default to summary
        targetSection = 'summary';
      }
    }

    // Only update if different from current state
    setActiveSection(targetSection as MenuSection);
  }, [urlSection, allSubjects]);


  // URL update helper - replaces localStorage.setItem
  const updateURL = useCallback((params: { section?: string; subject?: string | null; chapter?: string | null }) => {
    const currentParams = searchParamsRef.current.toString();
    const newParams = new URLSearchParams(currentParams);
    
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
  }, [router, pathname]);



  // Mark as hydrated once after initial mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch riddles from backend API
  useEffect(() => {
    import('@/lib/riddles-api').then(({ getAllRiddleMcqsAdmin }) => {
      getAllRiddleMcqsAdmin()
        .then(riddleMcqs => {
          const mappedRiddles = riddleMcqs.map(qr => ({
            id: qr.id as string,
            question: qr.question,
            options: qr.options || [],
            correctOption: qr.correctLetter || qr.correctAnswer || 'A',
            correctLetter: qr.correctLetter,
            difficulty: (qr.level as Riddle['difficulty']) || 'medium',
            status: 'published' as const,
            hint: qr.hint || '',
            explanation: qr.explanation || '',
            answer: qr.correctAnswer || '',
            subject: qr.subject?.name || qr.chapter?.subject?.name || '',
            subjectId: qr.subject?.id || qr.chapter?.subject?.id || '',
            categoryId: qr.chapter?.subject?.categoryId || '',
          }));
          setAllRiddles(mappedRiddles);
        })
        .catch((err: any) => console.error('Failed to load quiz riddles:', err));
    });
  }, []);

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);


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

        if (result.success) {
          // Refresh subjects and questions after successful import
          refetchSubjects();
          
          const newQuestions = await getQuestionsBySubject(result.subjectSlug);
          const mappedQuestions: Question[] = newQuestions.data.map(mapQuizQuestionToQuestion);
          setAllQuestions(prev => ({
            ...prev,
            [result.subjectSlug]: mappedQuestions
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
      // Add to existing subjects, not replace
      setLocalSubjects(prev => [...prev, subjectWithId]);
      setAllQuestions(prev => ({ ...prev, [newSubject.slug]: [] }));
    } catch (err) {
      console.error('Failed to create subject in database:', err);
    }
    setShowAddSubjectModal(false);
  };


  // Delete subject - triggered by modal confirmation
  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;

    const subjectId = subjectToDelete.id;
    const subjectSlug = subjectToDelete.slug;
    const wasActiveSection = activeSection === subjectSlug;

    // Delete from database first
    if (!subjectId.startsWith('local-')) {
      try {
        await deleteSubject(subjectId);
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (error.message?.includes('not found') || error.message?.includes('Subject not found')) {

        } else {
          console.error('Failed to delete subject from database:', err);
          // Don't update local state if delete failed
          setSubjectToDelete(null);
          return;
        }
      }
    }

    // Filter from dbSubjects directly, not allSubjects
    const remainingSubjects = subjects.filter(s => s.id !== subjectId);
    setLocalSubjects(remainingSubjects);
    setAllQuestions(prev => {
      const updated = { ...prev };
      delete updated[subjectSlug];
      return updated;
    });


    if (wasActiveSection && remainingSubjects.length > 0) {
      const nextSubject = remainingSubjects[0]!;
      setActiveSection(nextSubject.slug);
    } else if (wasActiveSection && remainingSubjects.length === 0) {
      setActiveSection('summary');
    }
    
    // Don't call refetchSubjects() here - it causes flickering
    // The local state update is sufficient for immediate UI
    setSubjectToDelete(null);
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
      refetchSubjects();
    } catch (err) {
      console.error('Failed to update subject in database:', err);
    }
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
          {/* Summary */}
          <MenuItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Summary"
            active={activeSection === 'summary'}
            expanded={sidebarOpen}
            onClick={() => updateURL({ section: 'summary' })}
          />

          {/* Quiz Section */}
          <MenuItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Quiz"
            active={activeSection === 'quiz'}
            expanded={sidebarOpen}
            onClick={() => {
              setActiveSection('quiz');
              updateURL({ section: 'quiz' });
            }}
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
              <MenuItem
                icon={<Puzzle className="w-5 h-5" />}
                label="Riddle MCQ"
                active={activeSection === 'riddle-mcq'}
                expanded={sidebarOpen}
                onClick={() => updateURL({ section: 'riddle-mcq' })}
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
              {activeSection === 'summary' && <><LayoutDashboard className="w-6 h-6" /> Summary</>}
              {activeSection === 'jokes' && <><Smile className="w-6 h-6" /> Dad Jokes Management</>}
              {activeSection === 'riddles' && <><Puzzle className="w-6 h-6" /> Riddle MCQ Management</>}
              {activeSection === 'image-riddles' && <><ImageIcon className="w-6 h-6" /> Image Riddles Management</>}
              {activeSection === 'users' && <><Users className="w-6 h-6" /> User Management</>}
              {activeSection === 'settings' && <><Settings className="w-6 h-6" /> Settings</>}
              {(allSubjects.some(s => s.slug === activeSection) || activeSection === 'quiz') && (
                <>
                  <span className="text-2xl">{activeSection === 'quiz' ? '📚' : (isEmoji(allSubjects.find(s => s.slug === activeSection)?.emoji || '') ? allSubjects.find(s => s.slug === activeSection)?.emoji : '📚')}</span>
                  <span>{activeSection === 'quiz' ? 'All Subjects' : allSubjects.find(s => s.slug === activeSection)?.name ?? ''} - Quiz Management</span>
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
          {activeSection === 'summary' && (
            <div className="rounded-xl bg-white p-8 shadow-md text-center">
              <p className="text-gray-500 font-medium">Summary</p>
              <p className="text-gray-400 text-sm mt-1">Coming Soon</p>
            </div>
          )}
          {activeSection === 'quiz' && (
            <QuizMcqSection
              allSubjects={allSubjects}
              onSubjectsChange={refetchSubjects}
            />
          )}
          {allSubjects.some(s => s.slug === activeSection) && (
            <QuizMcqSection
              allSubjects={allSubjects}
              initialSubjectSlug={activeSection}
              onSubjectsChange={refetchSubjects}
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
            <RiddleMcqSection
              allRiddles={allRiddles}
              setAllRiddles={setAllRiddles}
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
          defaultCategory="academic"
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

