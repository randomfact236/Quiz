'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getItem, removeItem, STORAGE_KEYS } from '@/lib/storage';

export default function Header(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    const token = getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
    const adminToken = getItem<string | null>(STORAGE_KEYS.ADMIN_TOKEN, null);
    setIsUserLoggedIn(!!token);
    setIsAdminLoggedIn(!!adminToken);
  }, [pathname]);

  const handleUserLogout = () => {
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    setIsUserLoggedIn(false);
    router.push('/');
  };

  const handleAdminLogout = () => {
    removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
    setIsAdminLoggedIn(false);
    router.push('/');
  };

  const handleLogout = () => {
    // Logout from whatever is active
    if (isAdminLoggedIn) {
      handleAdminLogout();
    } else if (isUserLoggedIn) {
      handleUserLogout();
    }
  };

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href) ?? false;
  };

  // ADMIN PAGE HEADER
  if (isAdminPage) {
    return (
      <header className="sticky top-0 z-50 glass border-b border-secondary-200 dark:border-secondary-800">
        <nav className="container mx-auto px-4 py-4" aria-label="Main navigation">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700" aria-label="AI Quiz Home">
              AI Quiz
            </Link>

            <div className="hidden items-center gap-4 md:flex">
              <ul className="flex items-center gap-6" role="menubar">
                <li><Link href="/" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/') ? 'text-primary-600' : ''}`}>Home</Link></li>
                <li><Link href="/quiz" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/quiz') ? 'text-primary-600' : ''}`}>Quiz</Link></li>
                <li><Link href="/jokes" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/jokes') ? 'text-primary-600' : ''}`}>Dad Jokes</Link></li>
                <li><Link href="/riddles" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/riddles') ? 'text-primary-600' : ''}`}>Riddles</Link></li>
                <li><Link href="/about" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/about') ? 'text-primary-600' : ''}`}>About</Link></li>
              </ul>
              <div className="flex items-center gap-3">
                {isAdminLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">Admin</span>
                    <button
                      onClick={handleAdminLogout}
                      className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-secondary-500">Admin Portal</span>
                )}
                <ThemeToggle size="sm" />
              </div>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 md:hidden dark:text-secondary-300 dark:hover:bg-secondary-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="mt-4 space-y-2 border-t border-secondary-200 pt-4 md:hidden">
              <Link href="/" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/quiz" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Quiz</Link>
              <Link href="/jokes" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Dad Jokes</Link>
              <Link href="/riddles" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Riddles</Link>
              <Link href="/about" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>About</Link>
              <div className="border-t border-secondary-200 pt-2 mt-2">
                {isAdminLoggedIn ? (
                  <button
                    onClick={() => { handleAdminLogout(); setIsMenuOpen(false); }}
                    className="w-full text-left block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                  >
                    Logout
                  </button>
                ) : (
                  <span className="block rounded-lg px-4 py-2 text-secondary-500">Admin Portal</span>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>
    );
  }

  // USER PAGE HEADER
  return (
    <header className="sticky top-0 z-50 glass border-b border-secondary-200 dark:border-secondary-800">
      <nav className="container mx-auto px-4 py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700" aria-label="AI Quiz Home">
            AI Quiz
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <ul className="flex items-center gap-6" role="menubar">
              <li><Link href="/" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/') ? 'text-primary-600' : ''}`}>Home</Link></li>
              <li><Link href="/quiz" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/quiz') ? 'text-primary-600' : ''}`}>Quiz</Link></li>
              <li><Link href="/jokes" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/jokes') ? 'text-primary-600' : ''}`}>Dad Jokes</Link></li>
              <li><Link href="/riddles" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/riddles') ? 'text-primary-600' : ''}`}>Riddles</Link></li>
              <li><Link href="/about" className={`text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400 ${isActive('/about') ? 'text-primary-600' : ''}`}>About</Link></li>
            </ul>
            <div className="flex items-center gap-3">
              {/* Show logout when user OR admin is logged in */}
              {(isUserLoggedIn || isAdminLoggedIn) ? (
                <div className="flex items-center gap-3">
                  {isAdminLoggedIn && (
                    <Link
                      href="/admin"
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {isUserLoggedIn && (
                    <span className="text-sm text-secondary-600 dark:text-secondary-300">User</span>
                  )}
                  {isAdminLoggedIn && (
                    <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Admin</span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Login
                </Link>
              )}
              <ThemeToggle size="sm" />
            </div>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 md:hidden dark:text-secondary-300 dark:hover:bg-secondary-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="mt-4 space-y-2 border-t border-secondary-200 pt-4 md:hidden">
            <Link href="/" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link href="/quiz" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Quiz</Link>
            <Link href="/jokes" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Dad Jokes</Link>
            <Link href="/riddles" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>Riddles</Link>
            <Link href="/about" className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" onClick={() => setIsMenuOpen(false)}>About</Link>
            <div className="border-t border-secondary-200 pt-2 mt-2">
              {(isUserLoggedIn || isAdminLoggedIn) ? (
                <>
                  {isAdminLoggedIn && (
                    <Link
                      href="/admin"
                      className="block rounded-lg px-4 py-2 text-indigo-600 hover:bg-secondary-100 dark:text-indigo-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="w-full text-left block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
