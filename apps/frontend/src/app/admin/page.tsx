'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

// Types
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
};

type Subject = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  category: 'academic' | 'professional';
};

type MenuSection = 'dashboard' | 'science' | 'math' | 'history' | 'geography' | 'english' | 'technology' | 'jokes' | 'riddles' | 'image-riddles' | 'users' | 'settings';

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
    { id: 1, question: 'What is 15 × 8?', optionA: '110', optionB: '120', optionC: '130', optionD: '140', correctAnswer: 'B', level: 'easy', chapter: 'Multiplication' },
    { id: 2, question: 'What is the square root of 144?', optionA: '10', optionB: '11', optionC: '12', optionD: '13', correctAnswer: 'C', level: 'easy', chapter: 'Square Roots' },
    { id: 3, question: 'What is the value of π (pi) to 2 decimal places?', optionA: '3.12', optionB: '3.14', optionC: '3.16', optionD: '3.18', correctAnswer: 'B', level: 'easy', chapter: 'Constants' },
    { id: 4, question: 'Solve: 2x + 5 = 15', optionA: 'x = 3', optionB: 'x = 4', optionC: 'x = 5', optionD: 'x = 6', correctAnswer: 'C', level: 'medium', chapter: 'Algebra' },
    { id: 5, question: 'What is 25% of 200?', optionA: '25', optionB: '50', optionC: '75', optionD: '100', correctAnswer: 'B', level: 'easy', chapter: 'Percentages' },
    { id: 6, question: 'What is the sum of angles in a triangle?', optionA: '90°', optionB: '180°', optionC: '270°', optionD: '360°', correctAnswer: 'B', level: 'easy', chapter: 'Geometry' },
    { id: 7, question: 'What is 7² + 3²?', optionA: '52', optionB: '58', optionC: '62', optionD: '68', correctAnswer: 'B', level: 'medium', chapter: 'Exponents' },
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

const initialSubjects: Subject[] = [
  { id: 1, slug: 'science', name: 'Science', emoji: '🔬', category: 'academic' },
  { id: 2, slug: 'math', name: 'Math', emoji: '🔢', category: 'academic' },
  { id: 3, slug: 'history', name: 'History', emoji: '📜', category: 'academic' },
  { id: 4, slug: 'geography', name: 'Geography', emoji: '🌍', category: 'academic' },
  { id: 5, slug: 'english', name: 'English', emoji: '📖', category: 'academic' },
  { id: 6, slug: 'technology', name: 'Technology', emoji: '💻', category: 'professional' },
];

export default function AdminPage(): JSX.Element {
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quizModuleExpanded, setQuizModuleExpanded] = useState(true);
  const [otherModulesExpanded, setOtherModulesExpanded] = useState(true);
  
  // Dynamic data state
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [allQuestions, setAllQuestions] = useState<Record<string, Question[]>>(initialQuestions);

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [selectedSubjectForChapter, setSelectedSubjectForChapter] = useState<string>('');

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">🎮 Admin Panel</h1>}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-gray-800"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* Dashboard */}
          <MenuItem 
            emoji="📊" 
            label="Dashboard" 
            active={activeSection === 'dashboard'}
            expanded={sidebarOpen}
            onClick={() => setActiveSection('dashboard')}
          />

          {/* Quiz Module Header */}
          <button
            onClick={() => setQuizModuleExpanded(!quizModuleExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <>
                <span>📚 Quiz Module</span>
                <span className={`transition-transform ${quizModuleExpanded ? 'rotate-180' : ''}`}>▼</span>
              </>
            ) : (
              <span className="text-lg">📚</span>
            )}
          </button>

          {/* Subject List - Dynamic */}
          {quizModuleExpanded && subjects.map((subject) => (
            <MenuItem 
              key={subject.id}
              emoji={subject.emoji} 
              label={subject.name} 
              active={activeSection === subject.slug as MenuSection}
              expanded={sidebarOpen}
              onClick={() => setActiveSection(subject.slug as MenuSection)}
            />
          ))}

          {/* Other Modules Header */}
          <button
            onClick={() => setOtherModulesExpanded(!otherModulesExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <>
                <span>🎮 Other Modules</span>
                <span className={`transition-transform ${otherModulesExpanded ? 'rotate-180' : ''}`}>▼</span>
              </>
            ) : (
              <span className="text-lg">🎮</span>
            )}
          </button>

          {/* Dad Jokes & Riddles */}
          {otherModulesExpanded && (
            <>
              <MenuItem 
                emoji="😂" 
                label="Dad Jokes" 
                active={activeSection === 'jokes'}
                expanded={sidebarOpen}
                onClick={() => setActiveSection('jokes')}
              />
              <MenuItem 
                emoji="🎭" 
                label="Riddles" 
                active={activeSection === 'riddles'}
                expanded={sidebarOpen}
                onClick={() => setActiveSection('riddles')}
              />
              <MenuItem 
                emoji="🖼️" 
                label="Image Riddles" 
                active={activeSection === 'image-riddles'}
                expanded={sidebarOpen}
                onClick={() => setActiveSection('image-riddles')}
              />
            </>
          )}

          {/* System */}
          {sidebarOpen && (
            <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ⚙️ System
            </div>
          )}
          <MenuItem 
            emoji="👥" 
            label="Users" 
            active={activeSection === 'users'}
            expanded={sidebarOpen}
            onClick={() => setActiveSection('users')}
          />
          <MenuItem 
            emoji="⚙️" 
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
            <span>🏠</span>
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {activeSection === 'dashboard' && '📊 Dashboard'}
              {activeSection === 'jokes' && '😂 Dad Jokes Management'}
              {activeSection === 'riddles' && '🎭 Riddles Management'}
              {activeSection === 'image-riddles' && '🖼️ Image Riddles Management'}
              {activeSection === 'users' && '👥 User Management'}
              {activeSection === 'settings' && '⚙️ Settings'}
              {subjects.some(s => s.slug === activeSection) && (
                `${subjects.find(s => s.slug === activeSection)?.emoji ?? ''} ${subjects.find(s => s.slug === activeSection)?.name ?? ''} - Question Management`
              )}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, Admin</span>
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
            />
          )}
          {activeSection === 'jokes' && <JokesSection />}
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
function MenuItem({ emoji, label, active, expanded, onClick }: {
  emoji: string;
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
      <span className="text-xl">{emoji}</span>
      {expanded && <span>{label}</span>}
    </button>
  );
}

// Add Subject Modal
function AddSubjectModal({ onClose, onAdd, existingSlugs }: {
  onClose: () => void;
  onAdd: (subject: Subject) => void;
  existingSlugs: string[];
}): JSX.Element {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [category, setCategory] = useState<'academic' | 'professional'>('academic');
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
      emoji,
      category,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add New Subject</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input
              id="subjectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="e.g., Physics"
            />
          </div>
          <div>
            <label htmlFor="subjectEmoji" className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
            <input
              id="subjectEmoji"
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="e.g., ⚛️"
            />
          </div>
          <div>
            <label htmlFor="subjectCategory" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="subjectCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'academic' | 'professional')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="academic">Academic</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
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
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-1">Add New Chapter</h3>
        <p className="text-gray-500 text-sm mb-4">for {subjectName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="chapterName" className="block text-sm font-medium text-gray-700 mb-1">Chapter Name</label>
            <input
              id="chapterName"
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="e.g., Quantum Mechanics"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
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
              <div className="rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 p-3 text-2xl">
                {subject.emoji}
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

// Convert questions to CSV format
function questionsToCSV(questions: Question[], subjectName: string): string {
  const headers = ['ID', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Level', 'Chapter', 'Subject'];
  const rows = questions.map(q => [
    q.id,
    `"${q.question.replace(/"/g, '""')}"`,
    `"${q.optionA.replace(/"/g, '""')}"`,
    `"${q.optionB.replace(/"/g, '""')}"`,
    `"${q.optionC.replace(/"/g, '""')}"`,
    `"${q.optionD.replace(/"/g, '""')}"`,
    q.correctAnswer,
    q.level,
    `"${q.chapter.replace(/"/g, '""')}"`,
    subjectName,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Parse CSV to questions
function parseCSV(csvText: string): Partial<Question>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const firstLine = lines[0];
  if (!firstLine) return [];
  
  const headers = firstLine.split(',').map(h => (h?.trim() ?? '').toLowerCase().replace(/"/g, ''));
  const questions: Partial<Question>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = parseCSVLine(line);
    if (values.length < 8) continue;
    
    // Helper to safely get value from headers or fallback to index
    const getValue = (index: number, headerName: string): string => {
      const headerIndex = headers.indexOf(headerName);
      if (headerIndex !== -1 && headerIndex < values.length && values[headerIndex]) {
        return values[headerIndex] ?? '';
      }
      return (index < values.length ? values[index] : '') ?? '';
    };
    
    const q: Partial<Question> = {
      question: getValue(1, 'question'),
      optionA: getValue(2, 'option a'),
      optionB: getValue(3, 'option b'),
      optionC: getValue(4, 'option c'),
      optionD: getValue(5, 'option d'),
      correctAnswer: getValue(6, 'correct answer'),
      level: (getValue(7, 'level') || 'easy') as Question['level'],
      chapter: getValue(8, 'chapter') || 'General',
    };
    
    if (q.question) questions.push(q);
  }
  
  return questions;
}

// Parse a single CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Download file helper
function downloadFile(content: string, filename: string, type: string): void {
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

// Question Management Section with Table
function QuestionManagementSection({ 
  subject, 
  questions, 
  allSubjects, 
  onSubjectSelect,
  onAddChapter,
  onQuestionsImport,
}: { 
  subject: Subject; 
  questions: Question[]; 
  allSubjects: Subject[];
  onSubjectSelect: (slug: string) => void;
  onAddChapter: () => void;
  onQuestionsImport: (subjectSlug: string, newQuestions: Question[]) => void;
}): JSX.Element {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState<Partial<Question>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique chapters for this subject
  const chapters = [...new Set(questions.map(q => q.chapter))];

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const matchesLevel = filterLevel === 'all' || q.level === filterLevel;
    const matchesChapter = filterChapter === 'all' || q.chapter === filterChapter;
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesChapter && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const csv = questionsToCSV(filteredQuestions, subject.name);
    downloadFile(csv, `${subject.name}_questions.csv`, 'text/csv');
  };

  // Export to JSON
  const handleExportJSON = () => {
    const data = {
      subject: subject.name,
      exportedAt: new Date().toISOString(),
      questions: filteredQuestions,
    };
    downloadFile(JSON.stringify(data, null, 2), `${subject.name}_questions.json`, 'application/json');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportError('');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: Partial<Question>[] = [];
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          parsed = Array.isArray(data.questions) ? data.questions : Array.isArray(data) ? data : [];
        } else {
          parsed = parseCSV(content);
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
  };

  // Confirm import
  const handleConfirmImport = () => {
    const newQuestions: Question[] = importPreview
      .filter(q => q.question && q.question.trim())
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
      }));
    
    onQuestionsImport(subject.slug, newQuestions);
    setShowImportModal(false);
    setImportPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getLevelBadgeColor = (level: string): string => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      case 'extreme': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelButtonColor = (level: string): string => {
    switch (level) {
      case 'easy': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'hard': return 'bg-orange-500 text-white';
      case 'expert': return 'bg-red-500 text-white';
      case 'extreme': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div>
      {/* Subject Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{subject.emoji}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
            <p className="text-sm text-gray-500">{questions.length} total questions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 flex items-center gap-2">
              📤 Export
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg text-sm"
              >
                Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg text-sm"
              >
                Export as JSON
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowImportModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 flex items-center gap-2"
          >
            📥 Import
          </button>
          <button className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
            + Add Question
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md space-y-4">
        {/* Subject Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Subject:</span>
          {allSubjects.map(s => (
            <button
              key={s.slug}
              onClick={() => onSubjectSelect(s.slug)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                subject.slug === s.slug 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.emoji} {s.name}
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
          >
            All Chapters
          </button>
          {chapters.map(ch => (
            <button
              key={ch}
              onClick={() => setFilterChapter(ch)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterChapter === ch 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {ch}
            </button>
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
          {['all', 'easy', 'medium', 'hard', 'expert', 'extreme'].map(level => (
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
            >
              {level === 'all' ? 'All Levels' : level}
            </button>
          ))}
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Search:</span>
          <input 
            type="text" 
            placeholder="Type to search questions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4">Bulk Import Questions</h3>
            
            {!importPreview.length ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
                  >
                    📁 Select CSV or JSON File
                  </button>
                  <p className="text-gray-500 mt-2 text-sm">
                    Supported formats: CSV, JSON
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p className="font-medium mb-2">CSV Format (with headers):</p>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                    Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
                  </code>
                  <p className="font-medium mt-3 mb-2">JSON Format:</p>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                    {`{"questions": [{"question": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctAnswer": "A", "level": "easy", "chapter": "..."}]}`}
                  </code>
                </div>
                
                {importError && (
                  <p className="text-red-500 text-sm">{importError}</p>
                )}
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
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
                        <tr key={i} className="border-t">
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
                      if (fileInputRef.current) fileInputRef.current.value = '';
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

      {/* Questions Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-28">Option A</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-28">Option B</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-28">Option C</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-28">Option D</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-20">Answer</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-24">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQuestions.map((q, index) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 align-top">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900" title={q.question}>
                        {q.question}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{q.chapter}</p>
                      <div className="flex gap-2 mt-2">
                        <button className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200" title="Edit">
                          ✏️ Edit
                        </button>
                        <button className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200" title="Delete">
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm align-top">
                    <span className={`px-2 py-1 rounded ${q.correctAnswer === 'A' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                      {q.optionA}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm align-top">
                    <span className={`px-2 py-1 rounded ${q.correctAnswer === 'B' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                      {q.optionB}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm align-top">
                    <span className={`px-2 py-1 rounded ${q.correctAnswer === 'C' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                      {q.optionC}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm align-top">
                    <span className={`px-2 py-1 rounded ${q.correctAnswer === 'D' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                      {q.optionD}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center align-top">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      {q.correctAnswer}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center align-top">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getLevelBadgeColor(q.level)}`}>
                      {q.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredQuestions.length}</span> of <span className="font-medium">{questions.length}</span> questions
          </p>
          <div className="flex gap-1">
            <button className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">Previous</button>
            <button className="rounded bg-blue-500 px-3 py-1 text-sm text-white">1</button>
            <button className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Types for Jokes (Simple format - no levels)
type Joke = {
  id: number;
  joke: string;
  category: string;
};

type JokeCategory = {
  id: number;
  name: string;
  emoji: string;
};

// Types for Riddles (Quiz format - no subjects, only chapters)
type Riddle = {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
};

// Initial data for Jokes (Simple format)
const initialJokeCategories: JokeCategory[] = [
  { id: 1, name: 'Classic Dad Jokes', emoji: '😂' },
  { id: 2, name: 'Programming Jokes', emoji: '💻' },
  { id: 3, name: 'Kids Jokes', emoji: '🧒' },
  { id: 4, name: 'Office Jokes', emoji: '💼' },
];

const initialJokes: Joke[] = [
  { id: 1, joke: 'Why don\'t scientists trust atoms? Because they make up everything!', category: 'Classic Dad Jokes' },
  { id: 2, joke: 'Why did the scarecrow win an award? He was outstanding in his field!', category: 'Classic Dad Jokes' },
  { id: 3, joke: 'Why do programmers prefer dark mode? Because light attracts bugs!', category: 'Programming Jokes' },
  { id: 4, joke: 'What do you call a fake noodle? An impasta!', category: 'Classic Dad Jokes' },
  { id: 5, joke: 'Why did the bicycle fall over? It was two tired!', category: 'Classic Dad Jokes' },
  { id: 6, joke: 'How do you organize a space party? You planet!', category: 'Classic Dad Jokes' },
];

// Initial data for Riddles (Same format as Quiz - no subjects, only chapters)
const initialRiddles: Riddle[] = [
  { id: 1, question: 'What has keys but no locks?', optionA: 'A piano', optionB: 'A keyboard', optionC: 'A map', optionD: 'A car', correctAnswer: 'A', level: 'easy', chapter: 'Object Riddles' },
  { id: 2, question: 'What has a head and a tail but no body?', optionA: 'A coin', optionB: 'A snake', optionC: 'A rope', optionD: 'A bookmark', correctAnswer: 'A', level: 'easy', chapter: 'Object Riddles' },
  { id: 3, question: 'What gets wetter the more it dries?', optionA: 'A towel', optionB: 'A sponge', optionC: 'Water', optionD: 'Rain', correctAnswer: 'A', level: 'easy', chapter: 'Object Riddles' },
  { id: 4, question: 'I speak without a mouth and hear without ears. What am I?', optionA: 'An echo', optionB: 'A ghost', optionC: 'A phone', optionD: 'Radio', correctAnswer: 'A', level: 'medium', chapter: 'Nature Riddles' },
  { id: 5, question: 'The more you take, the more you leave behind. What am I?', optionA: 'Footsteps', optionB: 'Memories', optionC: 'Time', optionD: 'Money', correctAnswer: 'A', level: 'medium', chapter: 'Abstract Riddles' },
  { id: 6, question: 'What has cities but no houses, forests but no trees?', optionA: 'A map', optionB: 'A globe', optionC: 'A book', optionD: 'A painting', correctAnswer: 'A', level: 'easy', chapter: 'Object Riddles' },
];

// Jokes Section (Simple format - no levels)
function JokesSection(): JSX.Element {
  const [jokeCategories] = useState<JokeCategory[]>(initialJokeCategories);
  const [allJokes] = useState<Joke[]>(initialJokes);
  const [jokeFilterCategory, setJokeFilterCategory] = useState<string>('');
  const [jokeSearch, setJokeSearch] = useState<string>('');
  const [jokePage, setJokePage] = useState(1);
  const jokesPerPage = 10;

  const filteredJokes = allJokes.filter(joke => {
    const matchesCategory = !jokeFilterCategory || joke.category === jokeFilterCategory;
    const matchesSearch = !jokeSearch || 
      joke.joke.toLowerCase().includes(jokeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalJokePages = Math.ceil(filteredJokes.length / jokesPerPage);
  const paginatedJokes = filteredJokes.slice((jokePage - 1) * jokesPerPage, jokePage * jokesPerPage);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">😂 Dad Jokes Management</h3>
        <div className="flex gap-2">
          <button className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600">
            📤 Bulk Import
          </button>
          <button className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
            + Add Joke
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select 
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={jokeFilterCategory}
          onChange={(e) => setJokeFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {jokeCategories.map(c => (
            <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>
          ))}
        </select>
        <input 
          type="text" 
          placeholder="Search jokes..." 
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={jokeSearch}
          onChange={(e) => setJokeSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Joke</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedJokes.map((joke) => (
              <tr key={joke.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">#{joke.id}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-800">{joke.joke}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                    {joke.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200">Edit</button>
                    <button className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedJokes.length === 0 && (
          <div className="p-8 text-center text-gray-500">No jokes found matching your filters</div>
        )}
      </div>

      {/* Pagination */}
      {totalJokePages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((jokePage - 1) * jokesPerPage) + 1} - {Math.min(jokePage * jokesPerPage, filteredJokes.length)} of {filteredJokes.length} jokes
          </p>
          <div className="flex gap-2">
            <button 
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => setJokePage(p => p - 1)}
              disabled={jokePage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">{jokePage} / {totalJokePages}</span>
            <button 
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => setJokePage(p => p + 1)}
              disabled={jokePage === totalJokePages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Riddles Section (Quiz format - no subject, only chapters)
function RiddlesSection(): JSX.Element {
  const [allRiddles] = useState<Riddle[]>(initialRiddles);
  const [riddleFilterLevel, setRiddleFilterLevel] = useState<string>('');
  const [riddleFilterChapter, setRiddleFilterChapter] = useState<string>('');
  const [riddleSearch, setRiddleSearch] = useState<string>('');
  const [riddlePage, setRiddlePage] = useState(1);
  const riddlesPerPage = 10;

  // Get unique chapters from riddles
  const chapters = Array.from(new Set(allRiddles.map(r => r.chapter)));

  const filteredRiddles = allRiddles.filter(riddle => {
    const matchesLevel = !riddleFilterLevel || riddle.level === riddleFilterLevel;
    const matchesChapter = !riddleFilterChapter || riddle.chapter === riddleFilterChapter;
    const matchesSearch = !riddleSearch || 
      riddle.question.toLowerCase().includes(riddleSearch.toLowerCase()) ||
      riddle.optionA.toLowerCase().includes(riddleSearch.toLowerCase()) ||
      riddle.optionB.toLowerCase().includes(riddleSearch.toLowerCase());
    return matchesLevel && matchesChapter && matchesSearch;
  });

  const totalRiddlePages = Math.ceil(filteredRiddles.length / riddlesPerPage);
  const paginatedRiddles = filteredRiddles.slice((riddlePage - 1) * riddlesPerPage, riddlePage * riddlesPerPage);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      case 'extreme': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isCorrectOption = (riddle: Riddle, option: string) => riddle.correctAnswer === option;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🎭 Riddles Management</h3>
          <p className="text-sm text-gray-500">{filteredRiddles.length} total riddles</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600">
            📥 Export
          </button>
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600">
            📤 Import
          </button>
          <button className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
            + Add Riddle
          </button>
        </div>
      </div>

      {/* Filters - Chapter and Level as button rows */}
      <div className="mb-4 space-y-3">
        {/* Chapter Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 mr-1">Chapter:</span>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              riddleFilterChapter === '' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setRiddleFilterChapter('')}
          >
            All Chapters
          </button>
          {chapters.map(chapter => (
            <button
              key={chapter}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                riddleFilterChapter === chapter 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setRiddleFilterChapter(chapter)}
            >
              {chapter}
            </button>
          ))}
          <button className="rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors">
            + Add Chapter
          </button>
        </div>

        {/* Level Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 mr-1">Level:</span>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              riddleFilterLevel === '' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setRiddleFilterLevel('')}
          >
            All Levels
          </button>
          {[
            { value: 'easy', label: 'Easy', color: 'bg-green-500' },
            { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
            { value: 'hard', label: 'Hard', color: 'bg-orange-500' },
            { value: 'expert', label: 'Expert', color: 'bg-red-500' },
            { value: 'extreme', label: 'Extreme', color: 'bg-gray-700' },
          ].map(({ value, label }) => (
            <button
              key={value}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                riddleFilterLevel === value 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setRiddleFilterLevel(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-1">Search:</span>
          <input 
            type="text" 
            placeholder="Type to search riddles..." 
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
            value={riddleSearch}
            onChange={(e) => setRiddleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table - Exact Quiz format with separate option columns */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">QUESTION</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">OPTION A</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">OPTION B</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">OPTION C</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">OPTION D</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">ANSWER</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">LEVEL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRiddles.map((riddle, index) => (
              <tr key={riddle.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 text-sm text-gray-600">{index + 1}</td>
                <td className="px-3 py-4">
                  <p className="text-sm font-medium text-gray-800">{riddle.question}</p>
                  <p className="text-xs text-gray-500 mt-1">{riddle.chapter}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100">
                      ✏️ Edit
                    </button>
                    <button className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100">
                      🗑️ Delete
                    </button>
                  </div>
                </td>
                <td className={`px-3 py-4 text-sm ${isCorrectOption(riddle, 'A') ? 'font-semibold text-green-700 bg-green-50' : 'text-gray-700'}`}>
                  {riddle.optionA}
                </td>
                <td className={`px-3 py-4 text-sm ${isCorrectOption(riddle, 'B') ? 'font-semibold text-green-700 bg-green-50' : 'text-gray-700'}`}>
                  {riddle.optionB}
                </td>
                <td className={`px-3 py-4 text-sm ${isCorrectOption(riddle, 'C') ? 'font-semibold text-green-700 bg-green-50' : 'text-gray-700'}`}>
                  {riddle.optionC}
                </td>
                <td className={`px-3 py-4 text-sm ${isCorrectOption(riddle, 'D') ? 'font-semibold text-green-700 bg-green-50' : 'text-gray-700'}`}>
                  {riddle.optionD}
                </td>
                <td className="px-3 py-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    {riddle.correctAnswer}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getLevelColor(riddle.level)}`}>
                    {riddle.level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedRiddles.length === 0 && (
          <div className="p-8 text-center text-gray-500">No riddles found matching your filters</div>
        )}
      </div>

      {/* Pagination */}
      {totalRiddlePages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((riddlePage - 1) * riddlesPerPage) + 1} - {Math.min(riddlePage * riddlesPerPage, filteredRiddles.length)} of {filteredRiddles.length} riddles
          </p>
          <div className="flex gap-2">
            <button 
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => setRiddlePage(p => p - 1)}
              disabled={riddlePage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">{riddlePage} / {totalRiddlePages}</span>
            <button 
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => setRiddlePage(p => p + 1)}
              disabled={riddlePage === totalRiddlePages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
            ].map((user, i) => (
              <tr key={i} className="hover:bg-gray-50">
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
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
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

// Image Riddles Admin Section
function ImageRiddlesAdminSection(): JSX.Element {
  const [imageRiddles, setImageRiddles] = useState([
    {
      id: '1',
      title: 'What is hidden in this painting?',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop',
      answer: 'A face looking to the left',
      hint: 'Look at the center and tilt your head',
      difficulty: 'medium',
      timerSeconds: null,
      showTimer: true,
      isActive: true,
      category: { name: 'Optical Illusions', emoji: '👁️' },
    },
    {
      id: '2',
      title: 'Spot the anomaly in this landscape',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      answer: 'The reflection is upside down',
      hint: 'Check the water carefully',
      difficulty: 'hard',
      timerSeconds: 90,
      showTimer: true,
      isActive: true,
      category: { name: 'Hidden Objects', emoji: '🔍' },
    },
    {
      id: '3',
      title: 'How many animals can you find?',
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop',
      answer: 'Five: two birds, a deer, a rabbit, and a fox',
      hint: 'Look carefully at the trees and bushes',
      difficulty: 'easy',
      timerSeconds: null,
      showTimer: true,
      isActive: true,
      category: { name: 'Hidden Objects', emoji: '🔍' },
    },
    {
      id: '4',
      title: 'Count the triangles',
      imageUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=400&fit=crop',
      answer: '16 triangles total',
      hint: 'Count both small and large triangles',
      difficulty: 'medium',
      timerSeconds: null,
      showTimer: true,
      isActive: true,
      category: { name: 'Pattern Recognition', emoji: '🔲' },
    },
    {
      id: '5',
      title: 'What time does the sundial show?',
      imageUrl: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&h=400&fit=crop',
      answer: 'About 2:30 PM',
      hint: 'Look at the shadow and the Roman numerals',
      difficulty: 'expert',
      timerSeconds: null,
      showTimer: true,
      isActive: true,
      category: { name: 'Perspective Puzzles', emoji: '📐' },
    },
  ]);

  const [categories] = useState([
    { id: '1', name: 'Optical Illusions', emoji: '👁️', count: 2 },
    { id: '2', name: 'Hidden Objects', emoji: '🔍', count: 2 },
    { id: '3', name: 'Pattern Recognition', emoji: '🔲', count: 1 },
    { id: '4', name: 'Perspective Puzzles', emoji: '📐', count: 1 },
  ]);

  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRiddles = imageRiddles.filter(riddle => {
    const matchesDifficulty = !filterDifficulty || riddle.difficulty === filterDifficulty;
    const matchesCategory = !filterCategory || riddle.category?.name === filterCategory;
    const matchesSearch = !searchTerm || riddle.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDifficulty && matchesCategory && matchesSearch;
  });

  const toggleActive = (id: string) => {
    setImageRiddles(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const deleteRiddle = (id: string) => {
    if (confirm('Are you sure you want to delete this riddle?')) {
      setImageRiddles(prev => prev.filter(r => r.id !== id));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: imageRiddles.length,
    active: imageRiddles.filter(r => r.isActive).length,
    categories: categories.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Riddles</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <span className="text-4xl">🧩</span>
          </div>
        </div>
        <div className="rounded-xl bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>
        <div className="rounded-xl bg-purple-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.categories}</p>
            </div>
            <span className="text-4xl">🏷️</span>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search riddles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex-1" />
          <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600">
            + Add Riddle
          </button>
        </div>
      </div>

      {/* Categories Row */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Categories:</span>
          <button
            onClick={() => setFilterCategory('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategory === '' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.name ? '' : cat.name)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterCategory === cat.name 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Row */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Difficulty:</span>
          <button
            onClick={() => setFilterDifficulty('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterDifficulty === '' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {['easy', 'medium', 'hard', 'expert'].map(diff => (
            <button
              key={diff}
              onClick={() => setFilterDifficulty(filterDifficulty === diff ? '' : diff)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filterDifficulty === diff 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Riddles Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Difficulty</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Timer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredRiddles.map((riddle) => (
              <tr key={riddle.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={riddle.imageUrl}
                    alt={riddle.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{riddle.title}</p>
                  <p className="text-sm text-gray-500 truncate max-w-xs">Answer: {riddle.answer}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {riddle.category?.emoji} {riddle.category?.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(riddle.difficulty)}`}>
                    {riddle.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {riddle.timerSeconds ? `${riddle.timerSeconds}s` : 'Default (90s)'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(riddle.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      riddle.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {riddle.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRiddle(riddle.id)}
                      className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Categories Section */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600">
            + Add Category
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className="text-sm text-gray-500">{cat.count} riddles</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings Section
function SettingsSection(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold">General Settings</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">Site Name</label>
            <input id="siteName" type="text" defaultValue="AI Quiz Platform" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">Site Description</label>
            <textarea id="siteDescription" defaultValue="A fun and educational quiz platform" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" rows={3} />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold">Quiz Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Enable Timer Mode</span>
            <button className="rounded-full bg-blue-500 px-4 py-2 text-white">ON</button>
          </div>
          <div className="flex items-center justify-between">
            <span>Show Explanations</span>
            <button className="rounded-full bg-blue-500 px-4 py-2 text-white">ON</button>
          </div>
          <div>
            <label htmlFor="questionsPerQuiz" className="block text-sm font-medium text-gray-700">Questions per Quiz</label>
            <input id="questionsPerQuiz" type="number" defaultValue="10" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600">
          Save Settings
        </button>
      </div>
    </div>
  );
}
