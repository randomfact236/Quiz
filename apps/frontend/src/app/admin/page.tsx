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
  BookOpen,
} from 'lucide-react';

import type { Subject, Joke, JokeCategory, MenuSection } from './types';
import { removeItem, STORAGE_KEYS } from '@/lib/storage';

// Status Dashboard & Bulk Actions
import {
  ImageRiddlesAdminSection,
  JokesSection,
  SettingsSection,
  AdminGuard,
  AdminUsersSection,
} from './components';
import { QuizMcqContainer } from '@/features/quiz/components';
import { RiddleMcqContainer } from '@/features/riddle-mcq/components';

import { useQuizSubjects } from '@/hooks/useQuizSubjects';

// Helper to check if a string is an emoji
const isEmoji = (str: string): boolean => {
  return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2B50}]/u.test(
    str
  );
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
  const { subjects: dbSubjects } = useQuizSubjects();

  // Helper to normalize subject emojis - preserves custom emojis
  const sanitizeSubjects = useCallback((storedSubjects: Subject[]): Subject[] => {
    const validIconKeys = [
      'science',
      'math',
      'history',
      'geography',
      'english',
      'technology',
      'puzzle',
      'smile',
      'image',
      'settings',
      'users',
      'home',
      'book-open',
      'help-circle',
      'graduation-cap',
      'briefcase',
      'gamepad-2',
    ];
    return storedSubjects.map((subject) => {
      const isCustomEmoji =
        /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B50}]/u.test(
          subject.emoji
        );
      if (validIconKeys.includes(subject.emoji) || isCustomEmoji) {
        return subject;
      }
      const slugToIcon: Record<string, string> = {
        science: 'science',
        math: 'math',
        history: 'history',
        geography: 'geography',
        english: 'english',
        technology: 'technology',
      };
      return { ...subject, emoji: slugToIcon[subject.slug] || 'puzzle' };
    });
  }, []);

  // Use sanitized subjects from hook - memoized to prevent infinite re-renders
  const subjects = useMemo(() => sanitizeSubjects(dbSubjects), [dbSubjects, sanitizeSubjects]);

  // Other state
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
    if (subjects.length > 0 || urlSection) {
      // URL section takes priority, but validate if it's a quiz subject
      if (
        urlSection === 'riddle-mcq' ||
        urlSection === 'image-riddles' ||
        urlSection === 'jokes' ||
        urlSection === 'users' ||
        urlSection === 'settings' ||
        urlSection === 'summary' ||
        urlSection === 'quiz'
      ) {
        setActiveSection(urlSection as MenuSection);
      } else {
        // It's a quiz subject - check if valid
        const isValidSubject = subjects.some((s) => s.slug === urlSection);
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
  }, [subjects, urlSection]);

  // Handle URL changes after initial load - update activeSection when URL changes
  useEffect(() => {
    if (!hasSetInitialSection.current) return; // Wait for initial load
    if (!urlSection) return;

    // Determine the target section
    let targetSection = urlSection;

    // Check if it's a special section (riddles, jokes, etc.)
    const isSpecialSection = [
      'riddle-mcq',
      'image-riddles',
      'jokes',
      'users',
      'settings',
      'summary',
      'quiz',
    ].includes(urlSection);

    if (!isSpecialSection) {
      // It's a quiz subject - check if valid
      const isValidSubject = subjects.some((s) => s.slug === urlSection);
      if (isValidSubject) {
        targetSection = urlSection;
      } else {
        // Invalid subject - default to summary
        targetSection = 'summary';
      }
    }

    // Only update if different from current state
    setActiveSection(targetSection as MenuSection);
  }, [urlSection, subjects]);

  // URL update helper - replaces localStorage.setItem
  const updateURL = useCallback(
    (params: { section?: string; subject?: string | null; chapter?: string | null }) => {
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
    },
    [router, pathname]
  );

  // Mark as hydrated once after initial mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col sticky top-0 h-screen z-20`}
      >
        {/* Logo */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" /> Admin Panel
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-gray-800"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
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
                <span className="flex items-center gap-2">
                  <Puzzle className="w-4 h-4" /> Other Modules
                </span>
                <span
                  className={`transition-transform ${otherModulesExpanded ? 'rotate-180' : ''}`}
                >
                  <ChevronDown className="w-3 h-3" />
                </span>
              </>
            ) : (
              <span className="flex items-center justify-center w-5 h-5">
                <Puzzle className="w-4 h-4" />
              </span>
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
            <span>
              <Home className="w-5 h-5" />
            </span>
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
              {activeSection === 'summary' && (
                <>
                  <LayoutDashboard className="w-6 h-6" /> Summary
                </>
              )}
              {activeSection === 'jokes' && (
                <>
                  <Smile className="w-6 h-6" /> Dad Jokes Management
                </>
              )}
              {activeSection === 'riddle-mcq' && (
                <>
                  <Puzzle className="w-6 h-6" /> Riddle MCQ Management
                </>
              )}
              {activeSection === 'image-riddles' && (
                <>
                  <ImageIcon className="w-6 h-6" /> Image Riddles Management
                </>
              )}
              {activeSection === 'users' && (
                <>
                  <Users className="w-6 h-6" /> Users Management
                </>
              )}
              {activeSection === 'settings' && (
                <>
                  <Settings className="w-6 h-6" /> Settings
                </>
              )}
              {(subjects.some((s) => s.slug === activeSection) || activeSection === 'quiz') && (
                <>
                  <span className="text-2xl">
                    {activeSection === 'quiz'
                      ? '📚'
                      : isEmoji(subjects.find((s) => s.slug === activeSection)?.emoji || '')
                        ? subjects.find((s) => s.slug === activeSection)?.emoji
                        : '📚'}
                  </span>
                  <span>
                    {activeSection === 'quiz'
                      ? 'All Subjects'
                      : (subjects.find((s) => s.slug === activeSection)?.name ?? '')}{' '}
                    - Quiz Management
                  </span>
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
          {(activeSection === 'quiz' || subjects.some((s) => s.slug === activeSection)) && (
            <QuizMcqContainer />
          )}
          {activeSection === 'jokes' && (
            <JokesSection
              allJokes={allJokes}
              setAllJokes={setAllJokes}
              jokeCategories={jokeCategories}
              setJokeCategories={setJokeCategories}
            />
          )}
          {activeSection === 'riddle-mcq' && <RiddleMcqContainer />}
          {activeSection === 'image-riddles' && <ImageRiddlesAdminSection />}
          {activeSection === 'users' && <AdminUsersSection />}
          {activeSection === 'settings' && <SettingsSection />}
        </div>
      </main>

      <AdminGuard />
    </div>
  );
}

// Menu Item Component
function MenuItem({
  icon,
  label,
  active,
  expanded,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
      }`}
    >
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      {expanded && <span>{label}</span>}
    </button>
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

/** Admin Guard component to be used at the end of the page */
