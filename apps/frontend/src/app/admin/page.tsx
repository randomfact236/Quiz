'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Calculator, 
  Scroll, 
  Globe, 
  BookOpen, 
  Laptop, 
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
  Home
} from 'lucide-react';

// Types

// Status Dashboard & Bulk Actions
import { ImageRiddlesAdminSection, JokesSection, QuestionManagementSection, RiddlesSection, SettingsSection } from './components';
import { QuizSidebar } from './components/QuizSidebar';
// StatusService moved to hook usage
// import { StatusService } from '@/services/status.service';
import {
  initialJokes as libInitialJokes
} from '@/lib/initial-data';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';


type Question = {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status?: ContentStatus;
};

type Subject = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  category: 'academic' | 'professional' | 'entertainment';
  order?: number;
};

type MenuSection = 'dashboard' | 'science' | 'math' | 'history' | 'geography' | 'english' | 'technology' | 'jokes' | 'riddles' | 'image-riddles' | 'users' | 'settings';

// ============================================================================
// ENTERPRISE-GRADE CONTENT TYPES
// ============================================================================

/** Content Status Type */
type ContentStatus = 'published' | 'draft' | 'trash';

/** Joke Type - Enterprise Grade */
type Joke = {
  id: number;
  joke: string;
  category: string;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
};

/** Joke Category Type - Available for future use */
// type JokeCategory = {
//   id: number;
//   name: string;
//   emoji: string;
//   description?: string;
// };

/*
 * Riddle Type - Enterprise Grade - Available for future use
 * Commented out as it's not currently used
type Riddle = {
  id: number;
  question: string;
  answer?: string;
  options: string[];
  correctOption: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status: ContentStatus;
  hint?: string;
  createdAt?: string;
  updatedAt?: string;
};
*/

/** Image Riddle Type - Enterprise Grade - Available for future use */
// type ImageRiddle = {
//   id: string;
//   title: string;
//   imageUrl: string;
//   altText?: string;
//   answer: string;
//   hint: string;
//   difficulty: 'easy' | 'medium' | 'hard' | 'expert';
//   category: { name: string; emoji: string };
//   status: ContentStatus;
//   timerSeconds?: number | null;
//   showTimer: boolean;
//   isActive: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// };



// ============================================================================
// ENTERPRISE-GRADE VALIDATION RESULTS
// ============================================================================

/*
type ValidationResult<T> = {
  isValid: boolean;
  data: T | null;
  errors: string[];
  warnings: string[];
};

type ImportResult<T> = {
  success: boolean;
  imported: T[];
  failed: { row: number; error: string; data: unknown }[];
  total: number;
};
*/

// ============================================================================
// ENTERPRISE-GRADE IMPORT/EXPORT CONFIG
// ============================================================================

/*
type ImportExportConfig<T> = {
  entityName: string;
  filePrefix: string;
  csvHeaders: string[];
  jsonRootKey: string;
  validators: {
    required: (keyof T)[];
    enumFields?: Record<string, string[]>;
    maxLength?: Record<string, number>;
  };
};
*/

// Initial Data
const initialQuestions: Record<string, Question[]> = {
  science: [
    { id: 1, question: 'What is the chemical symbol for water?', optionA: 'H2O', optionB: 'CO2', optionC: 'NaCl', optionD: 'O2', correctAnswer: 'A', level: 'easy', chapter: 'Chemistry Basics' },
    { id: 2, question: 'What planet is known as the Red Planet?', optionA: 'Venus', optionB: 'Mars', optionC: 'Jupiter', optionD: 'Saturn', correctAnswer: 'B', level: 'easy', chapter: 'Solar System' },
    { id: 3, question: 'What is the speed of light?', optionA: '300,000 km/s', optionB: '150,000 km/s', optionC: '500,000 km/s', optionD: '200,000 km/s', correctAnswer: 'A', level: 'medium', chapter: 'Physics Basics' },
    { id: 4, question: 'What is the powerhouse of the cell?', optionA: 'Nucleus', optionB: 'Ribosome', optionC: 'Mitochondria', optionD: 'Golgi Body', correctAnswer: 'C', level: 'easy', chapter: 'Cell Biology' },
    { id: 5, question: 'What gas do plants absorb from the atmosphere?', optionA: 'Oxygen', optionB: 'Nitrogen', optionC: 'Carbon Dioxide', optionD: 'Hydrogen', correctAnswer: 'C', level: 'easy', chapter: 'Plant Biology' },
    { id: 6, question: 'What is the atomic number of Carbon?', optionA: '4', optionB: '6', optionC: '8', optionD: '12', correctAnswer: 'B', level: 'medium', chapter: 'Chemistry Basics' },
    { id: 7, question: 'Which force keeps planets in orbit around the Sun?', optionA: 'Electromagnetic', optionB: 'Nuclear', optionC: 'Gravitational', optionD: 'Friction', correctAnswer: 'C', level: 'easy', chapter: 'Physics Basics' },
    { id: 8, question: 'What is the chemical formula for table salt?', optionA: 'NaCl', optionB: 'KCl', optionC: 'CaCO3', optionD: 'MgO', correctAnswer: 'A', level: 'easy', chapter: 'Chemistry Basics' },
    { id: 9, question: 'How many bones are in the adult human body?', optionA: '186', optionB: '206', optionC: '226', optionD: '256', correctAnswer: 'B', level: 'medium', chapter: 'Human Anatomy' },
    { id: 10, question: 'What is the largest organ in the human body?', optionA: 'Heart', optionB: 'Liver', optionC: 'Skin', optionD: 'Brain', correctAnswer: 'C', level: 'easy', chapter: 'Human Anatomy' },
  ],
  math: [
    { id: 1, question: 'What is 15 x 8?', optionA: '110', optionB: '120', optionC: '130', optionD: '140', correctAnswer: 'B', level: 'easy', chapter: 'Multiplication' },
    { id: 2, question: 'What is the square root of 144?', optionA: '10', optionB: '11', optionC: '12', optionD: '13', correctAnswer: 'C', level: 'easy', chapter: 'Square Roots' },
    { id: 3, question: 'What is the value of pi to 2 decimal places?', optionA: '3.12', optionB: '3.14', optionC: '3.16', optionD: '3.18', correctAnswer: 'B', level: 'easy', chapter: 'Constants' },
    { id: 4, question: 'Solve: 2x + 5 = 15', optionA: 'x = 3', optionB: 'x = 4', optionC: 'x = 5', optionD: 'x = 6', correctAnswer: 'C', level: 'medium', chapter: 'Algebra' },
    { id: 5, question: 'What is 25% of 200?', optionA: '25', optionB: '50', optionC: '75', optionD: '100', correctAnswer: 'B', level: 'easy', chapter: 'Percentages' },
    { id: 6, question: 'What is the sum of angles in a triangle?', optionA: '90 deg', optionB: '180 deg', optionC: '270 deg', optionD: '360 deg', correctAnswer: 'B', level: 'easy', chapter: 'Geometry' },
    { id: 7, question: 'What is 7^2 + 3^2?', optionA: '52', optionB: '58', optionC: '62', optionD: '68', correctAnswer: 'B', level: 'medium', chapter: 'Exponents' },
    { id: 8, question: 'Simplify: 3/4 + 1/4', optionA: '1/2', optionB: '3/8', optionC: '1', optionD: '4/8', correctAnswer: 'C', level: 'easy', chapter: 'Fractions' },
  ],
  history: [
    { id: 1, question: 'In which year did World War II end?', optionA: '1943', optionB: '1944', optionC: '1945', optionD: '1946', correctAnswer: 'C', level: 'easy', chapter: 'World War II' },
    { id: 2, question: 'Who was the first President of the United States?', optionA: 'Thomas Jefferson', optionB: 'John Adams', optionC: 'George Washington', optionD: 'Benjamin Franklin', correctAnswer: 'C', level: 'easy', chapter: 'US Presidents' },
    { id: 3, question: 'Which ancient civilization built the pyramids?', optionA: 'Romans', optionB: 'Greeks', optionC: 'Egyptians', optionD: 'Mayans', correctAnswer: 'C', level: 'easy', chapter: 'Ancient Civilizations' },
    { id: 4, question: 'In what year did the Titanic sink?', optionA: '1910', optionB: '1911', optionC: '1912', optionD: '1913', correctAnswer: 'C', level: 'medium', chapter: 'Maritime History' },
    { id: 5, question: 'Who painted the Mona Lisa?', optionA: 'Michelangelo', optionB: 'Leonardo da Vinci', optionC: 'Raphael', optionD: 'Donatello', correctAnswer: 'B', level: 'easy', chapter: 'Renaissance' },
    { id: 6, question: 'Which empire was ruled by Genghis Khan?', optionA: 'Roman Empire', optionB: 'Ottoman Empire', optionC: 'Mongol Empire', optionD: 'Persian Empire', correctAnswer: 'C', level: 'medium', chapter: 'Medieval Period' },
  ],
  geography: [
    { id: 1, question: 'What is the capital of France?', optionA: 'London', optionB: 'Paris', optionC: 'Berlin', optionD: 'Rome', correctAnswer: 'B', level: 'easy', chapter: 'European Capitals' },
    { id: 2, question: 'Which is the largest ocean on Earth?', optionA: 'Atlantic', optionB: 'Indian', optionC: 'Arctic', optionD: 'Pacific', correctAnswer: 'D', level: 'easy', chapter: 'Oceans' },
    { id: 3, question: 'What is the longest river in the world?', optionA: 'Amazon', optionB: 'Nile', optionC: 'Mississippi', optionD: 'Yangtze', correctAnswer: 'B', level: 'medium', chapter: 'Rivers' },
    { id: 4, question: 'Which continent has the most countries?', optionA: 'Asia', optionB: 'Europe', optionC: 'Africa', optionD: 'South America', correctAnswer: 'C', level: 'medium', chapter: 'Continents' },
    { id: 5, question: 'What is the smallest country in the world?', optionA: 'Monaco', optionB: 'San Marino', optionC: 'Vatican City', optionD: 'Liechtenstein', correctAnswer: 'C', level: 'easy', chapter: 'Countries' },
    { id: 6, question: 'Which mountain range contains Mount Everest?', optionA: 'Alps', optionB: 'Andes', optionC: 'Rocky Mountains', optionD: 'Himalayas', correctAnswer: 'D', level: 'easy', chapter: 'Mountains' },
  ],
  english: [
    { id: 1, question: 'What is the past tense of "run"?', optionA: 'Runned', optionB: 'Ran', optionC: 'Running', optionD: 'Runs', correctAnswer: 'B', level: 'easy', chapter: 'Verbs' },
    { id: 2, question: 'Which word is a synonym of "happy"?', optionA: 'Sad', optionB: 'Angry', optionC: 'Joyful', optionD: 'Tired', correctAnswer: 'C', level: 'easy', chapter: 'Synonyms' },
    { id: 3, question: 'What type of word is "beautiful"?', optionA: 'Noun', optionB: 'Verb', optionC: 'Adjective', optionD: 'Adverb', correctAnswer: 'C', level: 'easy', chapter: 'Parts of Speech' },
    { id: 4, question: 'Which sentence is grammatically correct?', optionA: 'She don\'t like apples', optionB: 'She doesn\'t likes apples', optionC: 'She doesn\'t like apples', optionD: 'She not like apples', correctAnswer: 'C', level: 'medium', chapter: 'Grammar' },
    { id: 5, question: 'What is the plural of "child"?', optionA: 'Childs', optionB: 'Children', optionC: 'Childes', optionD: 'Childrens', correctAnswer: 'B', level: 'easy', chapter: 'Plurals' },
    { id: 6, question: 'Which is an example of alliteration?', optionA: 'The sun smiled', optionB: 'Peter Piper picked', optionC: 'As busy as a bee', optionD: 'Boom! Crash!', correctAnswer: 'B', level: 'medium', chapter: 'Literary Devices' },
  ],
  technology: [
    { id: 1, question: 'What does CPU stand for?', optionA: 'Central Processing Unit', optionB: 'Computer Personal Unit', optionC: 'Central Program Utility', optionD: 'Computer Processing Unit', correctAnswer: 'A', level: 'easy', chapter: 'Hardware' },
    { id: 2, question: 'Which company developed the iPhone?', optionA: 'Google', optionB: 'Samsung', optionC: 'Apple', optionD: 'Microsoft', correctAnswer: 'C', level: 'easy', chapter: 'Mobile Technology' },
    { id: 3, question: 'What does HTML stand for?', optionA: 'Hyper Text Markup Language', optionB: 'High Tech Modern Language', optionC: 'Hyper Transfer Markup Language', optionD: 'Home Tool Markup Language', correctAnswer: 'A', level: 'easy', chapter: 'Web Development' },
    { id: 4, question: 'What is the main function of RAM?', optionA: 'Long-term storage', optionB: 'Temporary memory', optionC: 'Processing calculations', optionD: 'Graphics rendering', correctAnswer: 'B', level: 'medium', chapter: 'Hardware' },
    { id: 5, question: 'Which protocol is used for secure web browsing?', optionA: 'HTTP', optionB: 'FTP', optionC: 'HTTPS', optionD: 'SMTP', correctAnswer: 'C', level: 'easy', chapter: 'Networking' },
    { id: 6, question: 'What does "bug" mean in programming?', optionA: 'A feature', optionB: 'An error', optionC: 'A virus', optionD: 'A shortcut', correctAnswer: 'B', level: 'easy', chapter: 'Programming' },
  ],
};

// Icon mapping for subjects
const subjectIcons: Record<string, React.ReactNode> = {
  science: <FlaskConical className="w-5 h-5" />,
  math: <Calculator className="w-5 h-5" />,
  history: <Scroll className="w-5 h-5" />,
  geography: <Globe className="w-5 h-5" />,
  english: <BookOpen className="w-5 h-5" />,
  technology: <Laptop className="w-5 h-5" />,
};

const initialSubjects: Subject[] = [
  { id: 1, slug: 'science', name: 'Science', emoji: 'science', category: 'academic' },
  { id: 2, slug: 'math', name: 'Math', emoji: 'math', category: 'academic' },
  { id: 3, slug: 'history', name: 'History', emoji: 'history', category: 'academic' },
  { id: 4, slug: 'geography', name: 'Geography', emoji: 'geography', category: 'academic' },
  { id: 5, slug: 'english', name: 'English', emoji: 'english', category: 'academic' },
  { id: 6, slug: 'technology', name: 'Technology', emoji: 'technology', category: 'professional' },
];

// Storage key for persisting active section
const ACTIVE_SECTION_KEY = 'aiquiz:active-section';

export default function AdminPage(): JSX.Element {
  // Initialize with default, then load from localStorage in useEffect
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quizModuleExpanded, setQuizModuleExpanded] = useState(true);
  const [otherModulesExpanded, setOtherModulesExpanded] = useState(true);

  // Load active section from localStorage after hydration (to avoid SSR mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_SECTION_KEY);
    if (saved) {
      setActiveSection(saved as MenuSection);
    }
    setIsHydrated(true);
  }, []);

  // Persist active section to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(ACTIVE_SECTION_KEY, activeSection);
    }
  }, [activeSection, isHydrated]);

  // Helper to fix corrupted emojis in subjects from localStorage
  const sanitizeSubjects = (storedSubjects: Subject[]): Subject[] => {
    // Valid icon keys that we accept
    const validIconKeys = ['science', 'math', 'history', 'geography', 'english', 'technology', 'puzzle', 'smile', 'image', 'settings', 'users', 'home'];
    
    return storedSubjects.map(subject => {
      // If emoji is not a valid icon key, it's corrupted - replace with slug
      if (!validIconKeys.includes(subject.emoji)) {
        // Map subject slugs to appropriate icons
        const slugToIcon: Record<string, string> = {
          'science': 'science',
          'math': 'math', 
          'history': 'history',
          'geography': 'geography',
          'english': 'english',
          'technology': 'technology',
        };
        return { ...subject, emoji: slugToIcon[subject.slug] || 'puzzle' };
      }
      return subject;
    });
  };

  // Dynamic data state
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const stored = getItem(STORAGE_KEYS.SUBJECTS, initialSubjects);
    return sanitizeSubjects(stored);
  });
  const [allQuestions, setAllQuestions] = useState<Record<string, Question[]>>(() => getItem(STORAGE_KEYS.QUESTIONS, initialQuestions));

  // Jokes state (shared with JokesSection component)
  const { allJokes, setAllJokes } = useGlobalJokes();

  // One-time migration: Clear corrupted localStorage data on first load
  useEffect(() => {
    const MIGRATION_KEY = 'aiquiz:emoji-migration-v1';
    if (typeof window !== 'undefined' && !localStorage.getItem(MIGRATION_KEY)) {
      // Force reset subjects to fix corrupted emojis
      setSubjects(initialSubjects);
      localStorage.setItem(MIGRATION_KEY, 'done');
    }
  }, []);

  // Persistence effects
  useEffect(() => {
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
  }, [subjects]);

  useEffect(() => {
    setItem(STORAGE_KEYS.QUESTIONS, allQuestions);
  }, [allQuestions]);

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [selectedSubjectForChapter, setSelectedSubjectForChapter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'academic' | 'professional' | 'entertainment'>('academic');

  const getSubjectFromSection = (section: MenuSection): Subject | null => {
    return subjects.find(s => s.slug === section) ?? null;
  };

  const getQuestionsForSubject = (slug: string): Question[] => {
    return allQuestions[slug] ?? [];
  };

  // Handle subject selection from filter
  const handleSubjectSelect = (slug: string) => {
    setActiveSection(slug as MenuSection);
  };

  // Add new subject
  const handleAddSubject = (newSubject: Subject) => {
    setSubjects(prev => [...prev, newSubject]);
    setAllQuestions(prev => ({ ...prev, [newSubject.slug]: [] }));
    setShowAddSubjectModal(false);
  };

  // Add new chapter (adds a sample question with the new chapter)
  const handleAddChapter = (subjectSlug: string, chapterName: string) => {
    const newQuestion: Question = {
      id: Date.now(),
      question: `Sample question for ${chapterName}`,
      optionA: 'Option A',
      optionB: 'Option B',
      optionC: 'Option C',
      optionD: 'Option D',
      correctAnswer: 'A',
      level: 'easy',
      chapter: chapterName,
    };

    setAllQuestions(prev => ({
      ...prev,
      [subjectSlug]: [...(prev[subjectSlug] ?? []), newQuestion],
    }));
    setShowAddChapterModal(false);
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
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
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
            onClick={() => setActiveSection('dashboard')}
          />

          {/* Quiz Module with Categories */}
          <QuizSidebar
            subjects={subjects}
            activeSection={activeSection}
            sidebarOpen={sidebarOpen}
            quizModuleExpanded={quizModuleExpanded}
            onToggleExpand={() => setQuizModuleExpanded(!quizModuleExpanded)}
            onSelectSubject={(slug) => setActiveSection(slug as MenuSection)}
            onAddSubject={(category) => {
              setSelectedCategory(category);
              setShowAddSubjectModal(true);
            }}
            onReorderSubjects={setSubjects}
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
                onClick={() => setActiveSection('jokes')}
              />
              <MenuItem
                icon={<Puzzle className="w-5 h-5" />}
                label="Riddles"
                active={activeSection === 'riddles'}
                expanded={sidebarOpen}
                onClick={() => setActiveSection('riddles')}
              />
              <MenuItem
                icon={<ImageIcon className="w-5 h-5" />}
                label="Image Riddles"
                active={activeSection === 'image-riddles'}
                expanded={sidebarOpen}
                onClick={() => setActiveSection('image-riddles')}
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
            onClick={() => setActiveSection('users')}
          />
          <MenuItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={activeSection === 'settings'}
            expanded={sidebarOpen}
            onClick={() => setActiveSection('settings')}
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
              {activeSection === 'riddles' && <><Puzzle className="w-6 h-6" /> Riddles Management</>}
              {activeSection === 'image-riddles' && <><ImageIcon className="w-6 h-6" /> Image Riddles Management</>}
              {activeSection === 'users' && <><Users className="w-6 h-6" /> User Management</>}
              {activeSection === 'settings' && <><Settings className="w-6 h-6" /> Settings</>}
              {subjects.some(s => s.slug === activeSection) && (
                <>
                  {subjectIcons[subjects.find(s => s.slug === activeSection)?.emoji || ''] || <BookOpen className="w-6 h-6" />}
                  <span>{subjects.find(s => s.slug === activeSection)?.name ?? ''} - Question Management</span>
                </>
              )}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-secondary-400">Welcome, Admin</span>
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeSection === 'dashboard' && (
            <DashboardSection
              onSelectSubject={setActiveSection}
              subjects={subjects}
              allQuestions={allQuestions}
              onAddSubject={() => setShowAddSubjectModal(true)}
            />
          )}
          {subjects.some(s => s.slug === activeSection) && (
            <QuestionManagementSection
              subject={getSubjectFromSection(activeSection) as Subject}
              questions={getQuestionsForSubject(activeSection)}
              allSubjects={subjects}
              onSubjectSelect={handleSubjectSelect}
              onAddChapter={() => {
                setSelectedSubjectForChapter(activeSection);
                setShowAddChapterModal(true);
              }}
              onQuestionsImport={(slug, newQuestions) => {
                setAllQuestions(prev => ({
                  ...prev,
                  [slug]: [...(prev[slug] ?? []), ...newQuestions],
                }));
              }}
              onQuestionsUpdate={(slug, updatedQuestions) => {
                setAllQuestions(prev => ({
                  ...prev,
                  [slug]: updatedQuestions,
                }));
              }}
            />
          )}
          {activeSection === 'jokes' && <JokesSection allJokes={allJokes} setAllJokes={setAllJokes} />}
          {activeSection === 'riddles' && <RiddlesSection />}
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
          existingSlugs={subjects.map(s => s.slug)}
          defaultCategory={selectedCategory}
        />
      )}

      {/* Add Chapter Modal */}
      {showAddChapterModal && (
        <AddChapterModal
          onClose={() => setShowAddChapterModal(false)}
          onAdd={(chapterName) => handleAddChapter(selectedSubjectForChapter, chapterName)}
          subjectName={subjects.find(s => s.slug === selectedSubjectForChapter)?.name ?? ''}
        />
      )}
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

// Available icon options for subjects
const iconOptions = [
  { key: 'science', label: 'Science', icon: FlaskConical },
  { key: 'math', label: 'Math', icon: Calculator },
  { key: 'history', label: 'History', icon: Scroll },
  { key: 'geography', label: 'Geography', icon: Globe },
  { key: 'english', label: 'English', icon: BookOpen },
  { key: 'technology', label: 'Technology', icon: Laptop },
  { key: 'puzzle', label: 'Puzzle', icon: Puzzle },
  { key: 'smile', label: 'Smile', icon: Smile },
  { key: 'image', label: 'Image', icon: ImageIcon },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'home', label: 'Home', icon: Home },
];

// Add Subject Modal
function AddSubjectModal({ onClose, onAdd, existingSlugs, defaultCategory = 'academic' }: {
  onClose: () => void;
  onAdd: (subject: Subject) => void;
  existingSlugs: string[];
  defaultCategory?: 'academic' | 'professional' | 'entertainment';
}): JSX.Element {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('puzzle');
  const [customEmoji, setCustomEmoji] = useState('');
  const [useCustomEmoji, setUseCustomEmoji] = useState(false);
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
      id: Date.now(),
      slug,
      name: name.trim(),
      emoji: useCustomEmoji && customEmoji ? customEmoji : selectedIcon,
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
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">Select Icon</label>
            
            {/* Custom Emoji Input */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="useCustomEmoji"
                  checked={useCustomEmoji}
                  onChange={(e) => setUseCustomEmoji(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="useCustomEmoji" className="text-sm text-gray-600 dark:text-secondary-400">
                  Use custom emoji
                </label>
              </div>
              
              {useCustomEmoji ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Paste any emoji here 🎨"
                    className="flex-1 rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100 text-2xl text-center"
                    maxLength={2}
                  />
                  {customEmoji && (
                    <span className="text-2xl">{customEmoji}</span>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {iconOptions.map((opt) => {
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedIcon(opt.key)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                          selectedIcon === opt.key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-secondary-600 hover:border-gray-300 dark:hover:border-secondary-500'
                        }`}
                        title={opt.label}
                      >
                        <IconComponent className={`w-6 h-6 ${
                          selectedIcon === opt.key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-secondary-400'
                        }`} />
                        <span className={`text-xs ${
                          selectedIcon === opt.key ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-secondary-500'
                        }`}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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

// Add Chapter Modal
function AddChapterModal({ onClose, onAdd, subjectName }: {
  onClose: () => void;
  onAdd: (chapterName: string) => void;
  subjectName: string;
}): JSX.Element {
  const [chapterName, setChapterName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!chapterName.trim()) {
      setError('Chapter name is required');
      return;
    }

    onAdd(chapterName.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md border dark:border-secondary-700">
        <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-secondary-100">Add New Chapter</h3>
        <p className="text-gray-500 dark:text-secondary-400 text-sm mb-4">for {subjectName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="chapterName" className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Chapter Name</label>
            <input
              id="chapterName"
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 px-4 py-2 bg-white dark:bg-secondary-900 text-gray-900 dark:text-secondary-100"
              placeholder="e.g., Quantum Mechanics"
            />
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
              className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            >
              Add Chapter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Dashboard Section
function DashboardSection({ onSelectSubject, subjects, allQuestions, onAddSubject }: {
  onSelectSubject: (section: MenuSection) => void;
  subjects: Subject[];
  allQuestions: Record<string, Question[]>;
  onAddSubject: () => void;
}): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Quick Overview</h3>
        <button
          onClick={onAddSubject}
          className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 flex items-center gap-2"
        >
          <span>+</span> Add Subject
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <button
            key={subject.slug}
            onClick={() => onSelectSubject(subject.slug as MenuSection)}
            className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 p-3 text-white">
                {subjectIcons[subject.emoji] || <BookOpen className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{subject.name}</p>
                <p className="text-sm text-gray-500">{(allQuestions[subject.slug] ?? []).length} questions</p>
              </div>
            </div>
          </button>
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
  const [allJokes, setAllJokes] = useState<Joke[]>(() => getItem(STORAGE_KEYS.JOKES, libInitialJokes));

  // Persistence
  useEffect(() => {
    setItem(STORAGE_KEYS.JOKES, allJokes);
  }, [allJokes]);

  return { allJokes, setAllJokes };
}

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

