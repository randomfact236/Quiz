'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/jokes', label: 'Dad Jokes' },
  { href: '/riddles', label: 'Riddles' },
  { href: '/about', label: 'About' },
  { href: '/admin', label: 'Admin' },
];

export default function Header(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-secondary-200 dark:border-secondary-800">
      <nav className="container mx-auto px-4 py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700" aria-label="AI Quiz Home">
            AI Quiz
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            <ul className="flex items-center gap-6" role="menubar">
              {navLinks.map((link) => (
                <li key={link.href} role="none">
                  <Link
                    href={link.href}
                    className="text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400"
                    role="menuitem"
                    aria-current={isActive(link.href) ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ThemeToggle size="sm" />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 md:hidden dark:text-secondary-300 dark:hover:bg-secondary-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen ? (
          <div id="mobile-menu" className="mt-4 space-y-2 border-t border-secondary-200 pt-4 md:hidden">
            <ul className="space-y-2" role="menu">
              {navLinks.map((link) => (
                <li key={link.href} role="none">
                  <Link
                    href={link.href}
                    className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                    aria-current={isActive(link.href) ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-secondary-200 pt-2 dark:border-secondary-700">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">Theme</span>
                <ThemeToggle size="sm" variant="dropdown" />
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}