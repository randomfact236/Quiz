'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, Laugh, FileImage, X, BookOpen, Brain } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Drawer Types
type DrawerType = 'quiz' | 'jokes' | 'riddles' | 'image-riddles' | null;

const DRAWER_TYPES = {
    QUIZ: 'quiz',
    JOKES: 'jokes',
    RIDDLES: 'riddles',
    IMAGE_RIDDLES: 'image-riddles',
} as const;

// Content Data
const QUIZ_SUBJECTS = [
    { id: 'science', label: 'Science', icon: '🔬' },
    { id: 'math', label: 'Math', icon: '🔢' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'geography', label: 'Geography', icon: '🌍' },
    { id: 'english', label: 'English', icon: '📖' },
    { id: 'environment', label: 'Environment', icon: '🌱' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'health', label: 'Health', icon: '💪' },
    { id: 'parenting', label: 'Parenting', icon: '👶' },
];

const JOKE_CATEGORIES = [
    { title: 'Classic Dad Jokes', icon: '😄' },
    { title: 'Tech Geek Dad Jokes', icon: '💻' },
    { title: 'Parenting Dad Jokes', icon: '👶' },
    { title: 'Work Office Dad Jokes', icon: '💼' },
];

const RIDDLE_CHAPTERS = Array.from({ length: 20 }, (_, i) => ({
    num: i + 1,
    title: `Chapter ${i + 1}`,
}));

const IMAGE_RIDDLE_LEVELS = [
    { id: 'easy', label: 'Easy', icon: '🌱' },
    { id: 'medium', label: 'Medium', icon: '⭐' },
    { id: 'hard', label: 'Hard', icon: '🔥' },
    { id: 'expert', label: 'Expert', icon: '💎' },
];

// Static animation configurations to prevent unnecessary re-renders
const backdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const drawerVariants = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
};

const drawerTransition = { type: 'spring' as const, damping: 25, stiffness: 200 };

export default function MobileFooter() {
    const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

    const toggleDrawer = (drawer: DrawerType) => {
        if (activeDrawer === drawer) {
            setActiveDrawer(null);
        } else {
            setActiveDrawer(drawer);
        }
    };

    const closeDrawer = () => setActiveDrawer(null);

    return (
        <>
            {/* Backdrop for Drawer */}
            <AnimatePresence>
                {activeDrawer && (
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        onClick={closeDrawer}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Drawer Content */}
            <AnimatePresence>
                {activeDrawer && (
                    <motion.div
                        variants={drawerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={drawerTransition}
                        className="fixed bottom-[4.5rem] left-0 right-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                {activeDrawer === DRAWER_TYPES.QUIZ && 'Select Subject'}
                                {activeDrawer === DRAWER_TYPES.JOKES && 'Joke Categories'}
                                {activeDrawer === DRAWER_TYPES.RIDDLES && 'Riddle Chapters'}
                                {activeDrawer === DRAWER_TYPES.IMAGE_RIDDLES && 'Difficulty Levels'}
                            </h3>
                            <button
                                onClick={closeDrawer}
                                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                                aria-label="Close drawer"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {/* Quiz content */}
                            {activeDrawer === DRAWER_TYPES.QUIZ &&
                                QUIZ_SUBJECTS.map((subject) => (
                                    <Link
                                        key={subject.id}
                                        href={`/quiz?subject=${subject.id}`}
                                        onClick={closeDrawer}
                                        className="flex flex-col items-center rounded-xl bg-gray-50 p-4 text-center transition-colors hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
                                        <span className="mb-2 text-2xl">{subject.icon}</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {subject.label}
                                        </span>
                                    </Link>
                                ))}

                            {/* Jokes content */}
                            {activeDrawer === DRAWER_TYPES.JOKES &&
                                JOKE_CATEGORIES.map((cat) => (
                                    <Link
                                        key={cat.title}
                                        href="/jokes" // Jokes page doesn't have query params yet, defaulting to root
                                        onClick={closeDrawer}
                                        className="flex flex-col items-center rounded-xl bg-gray-50 p-4 text-center transition-colors hover:bg-orange-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
                                        <span className="mb-2 text-2xl">{cat.icon}</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {cat.title}
                                        </span>
                                    </Link>
                                ))}

                            {/* Riddles content */}
                            {activeDrawer === DRAWER_TYPES.RIDDLES &&
                                RIDDLE_CHAPTERS.map((chapter) => (
                                    <Link
                                        key={chapter.num}
                                        href="/riddles"
                                        onClick={closeDrawer}
                                        className="flex flex-col items-center rounded-xl bg-gray-50 p-3 text-center transition-colors hover:bg-purple-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Chapter {chapter.num}
                                        </span>
                                    </Link>
                                ))}

                            {/* Image Riddles content */}
                            {activeDrawer === DRAWER_TYPES.IMAGE_RIDDLES &&
                                IMAGE_RIDDLE_LEVELS.map((level) => (
                                    <Link
                                        key={level.id}
                                        href="/image-riddles" // Assuming filter is client side for now
                                        onClick={closeDrawer}
                                        className="flex flex-col items-center rounded-xl bg-gray-50 p-4 text-center transition-colors hover:bg-teal-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
                                        <span className="mb-2 text-2xl">{level.icon}</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {level.label}
                                        </span>
                                    </Link>
                                ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 block border-t border-gray-200 bg-white/95 px-4 pb-1 pt-1 backdrop-blur-lg lg:hidden dark:border-gray-700 dark:bg-gray-900/95 h-[4.5rem]" role="tablist" aria-label="Mobile navigation">
                <div className="flex items-center justify-around h-full">
                    <Link
                        href="/"
                        className="flex flex-col items-center p-2 text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 group"
                        aria-label="Navigate to Home"
                        aria-selected={activeDrawer === null && typeof window !== 'undefined' && window.location.pathname === '/'}
                        role="tab"
                    >
                        <Home size={24} className="group-hover:scale-110 transition-transform" aria-hidden="true" />
                        <span className="mt-1 text-[10px] font-medium">Home</span>
                    </Link>

                    <button
                        onClick={() => toggleDrawer(DRAWER_TYPES.JOKES)}
                        className={`flex flex-col items-center p-2 transition-colors ${activeDrawer === DRAWER_TYPES.JOKES ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                            }`}
                        aria-label="Open Jokes categories"
                        aria-expanded={activeDrawer === DRAWER_TYPES.JOKES}
                        aria-selected={activeDrawer === DRAWER_TYPES.JOKES}
                        role="tab"
                    >
                        <Laugh size={24} className={activeDrawer === DRAWER_TYPES.JOKES ? 'scale-110' : ''} aria-hidden="true" />
                        <span className="mt-1 text-[10px] font-medium">Jokes</span>
                    </button>

                    <button
                        onClick={() => toggleDrawer(DRAWER_TYPES.RIDDLES)}
                        className={`flex flex-col items-center p-2 transition-colors ${activeDrawer === DRAWER_TYPES.RIDDLES ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                            }`}
                        aria-label="Open Riddles chapters"
                        aria-expanded={activeDrawer === DRAWER_TYPES.RIDDLES}
                        aria-selected={activeDrawer === DRAWER_TYPES.RIDDLES}
                        role="tab"
                    >
                        <Brain size={24} className={activeDrawer === DRAWER_TYPES.RIDDLES ? 'scale-110' : ''} aria-hidden="true" />
                        <span className="mt-1 text-[10px] font-medium">Riddles</span>
                    </button>

                    <button
                        onClick={() => toggleDrawer(DRAWER_TYPES.IMAGE_RIDDLES)}
                        className={`flex flex-col items-center p-2 transition-colors ${activeDrawer === DRAWER_TYPES.IMAGE_RIDDLES ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'
                            }`}
                        aria-label="Open Image Riddles levels"
                        aria-expanded={activeDrawer === DRAWER_TYPES.IMAGE_RIDDLES}
                        aria-selected={activeDrawer === DRAWER_TYPES.IMAGE_RIDDLES}
                        role="tab"
                    >
                        <FileImage size={24} className={activeDrawer === DRAWER_TYPES.IMAGE_RIDDLES ? 'scale-110' : ''} aria-hidden="true" />
                        <span className="mt-1 text-[10px] font-medium">Images</span>
                    </button>

                    <button
                        onClick={() => toggleDrawer(DRAWER_TYPES.QUIZ)}
                        className={`flex flex-col items-center p-2 transition-colors ${activeDrawer === DRAWER_TYPES.QUIZ ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                            }`}
                        aria-label="Open Quiz subjects"
                        aria-expanded={activeDrawer === DRAWER_TYPES.QUIZ}
                        aria-selected={activeDrawer === DRAWER_TYPES.QUIZ}
                        role="tab"
                    >
                        <BookOpen size={24} className={activeDrawer === DRAWER_TYPES.QUIZ ? 'scale-110' : ''} aria-hidden="true" />
                        <span className="mt-1 text-[10px] font-medium">Quiz</span>
                    </button>
                </div>
            </nav>

            {/* Spacer to prevent content from being hidden behind footer */}
            <div className="h-20 lg:hidden" />
        </>
    );
}
