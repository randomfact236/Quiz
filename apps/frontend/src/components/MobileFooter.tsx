'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  Home,
  Laugh,
  FileImage,
  X,
  BookOpen,
  Brain,
  Gamepad2,
  Menu as MenuIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { NAV_MENU_ITEMS } from '@/lib/nav-config';

/** Static animation configurations to prevent unnecessary re-renders */
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

/** Bottom-nav items navigate straight to the module pages (BUG-002/BUG-004:
 *  the owner wants page navigation, not per-module selection drawers — each
 *  landing page offers its own subject/difficulty pickers). Only Menu keeps
 *  a drawer, because it holds the secondary destinations. */
const NAV_BUTTONS = [
  { href: '/quiz-mcq', label: 'Quiz', icon: BookOpen, active: 'text-blue-600 dark:text-blue-400' },
  {
    href: '/riddle-mcq',
    label: 'Riddles',
    icon: Brain,
    active: 'text-purple-600 dark:text-purple-400',
  },
  {
    href: '/image-riddles',
    label: 'Images',
    icon: FileImage,
    active: 'text-teal-600 dark:text-teal-400',
  },
  { href: '/jokes', label: 'Jokes', icon: Laugh, active: 'text-orange-600 dark:text-orange-400' },
  {
    href: '/games',
    label: 'Games',
    icon: Gamepad2,
    active: 'text-emerald-600 dark:text-emerald-400',
  },
] as const;

export default function MobileFooter() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const currentPath = pathname;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  // Escape closes an open drawer.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const isItemActive = (href: string): boolean => currentPath?.startsWith(href) ?? false;

  return (
    <>
      {/* Backdrop for Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={drawerTransition}
            className="fixed bottom-[4.5rem] left-0 right-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:hidden dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Menu</h3>
              <button
                onClick={closeMenu}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-secondary-700 dark:bg-gray-700 dark:text-gray-300"
                aria-label="Close drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {NAV_MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isClient && currentPath === item.href ? 'page' : undefined}
                  className="col-span-full flex items-center rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 block border-t border-gray-200 bg-white/95 px-2 pb-1 pt-1 backdrop-blur-lg md:hidden dark:border-gray-700 dark:bg-gray-900/95 h-[4.5rem]"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-full">
          <Link
            href="/"
            className="flex flex-col items-center p-2 text-gray-600 transition-colors hover:text-blue-600 dark:hover:text-blue-300 dark:text-gray-400 dark:hover:text-blue-400 group"
            aria-label="Navigate to Home"
            aria-current={isClient && currentPath === '/' ? 'page' : undefined}
          >
            <Home
              size={24}
              className="group-hover:scale-110 transition-transform"
              aria-hidden="true"
            />
            <span className="mt-1 text-[10px] font-medium">Home</span>
          </Link>

          {NAV_BUTTONS.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center p-2 transition-colors group ${
                isItemActive(href)
                  ? active
                  : 'text-gray-600 dark:text-secondary-300 dark:text-gray-400'
              }`}
              aria-label={`Navigate to ${label}`}
              aria-current={isClient && isItemActive(href) ? 'page' : undefined}
            >
              <Icon
                size={24}
                className="group-hover:scale-110 transition-transform"
                aria-hidden="true"
              />
              <span className="mt-1 text-[10px] font-medium">{label}</span>
            </Link>
          ))}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center p-2 transition-colors ${
              isMenuOpen
                ? 'text-indigo-600 dark:text-indigo-300 dark:text-indigo-400'
                : 'text-gray-600 dark:text-secondary-300 dark:text-gray-400'
            }`}
            aria-label="Open Menu"
            aria-expanded={isMenuOpen}
          >
            <MenuIcon size={24} className={isMenuOpen ? 'scale-110' : ''} aria-hidden="true" />
            <span className="mt-1 text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind footer */}
      <div className="h-20 md:hidden" />
    </>
  );
}
