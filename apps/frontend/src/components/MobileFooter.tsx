'use client';

import { usePathname } from 'next/navigation';
import { Home, Laugh, FileImage, BookOpen, Brain, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/** Bottom-nav items navigate straight to the module pages (BUG-002/BUG-004:
 *  the owner wants page navigation, not per-module selection drawers — each
 *  landing page offers its own subject/difficulty pickers). Owner request
 *  2026-09-18: no Menu item — every footer entry is a direct page link
 *  (secondary destinations live in the header's mobile menu). */
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
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const currentPath = pathname;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isItemActive = (href: string): boolean => currentPath?.startsWith(href) ?? false;

  return (
    <>
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
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind footer */}
      <div className="h-20 md:hidden" />
    </>
  );
}
