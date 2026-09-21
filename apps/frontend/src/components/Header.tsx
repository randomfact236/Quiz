'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAV_ITEMS, NAV_MENU_ITEMS } from '@/lib/nav-config';
import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserCircle, X } from 'lucide-react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSiteBrand } from '@/components/SiteBrandContext';
import { SITE_DOMAIN } from '@/lib/brand-assets';
import { useClickOutside } from '@/hooks/useClickOutside';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { authService } from '@/lib/auth';

/** Brand link from the Site Information settings. Mobile (<md) shows the
 *  dedicated mobile logo when set, else the square app icon (+ site name
 *  unless the admin turned the text off); md+ shows the whole logo only — it
 *  already carries the brand name, so no text is added beside it (unless no
 *  logo is uploaded, in which case the placeholder mark + name are shown).
 *  A dark-mode logo variant swaps in under dark mode when uploaded. Built-in
 *  PigZap marks are the floor: no surface ever falls back to a generic
 *  placeholder. Mobile shows the square icon + the site domain (pigzap.com)
 *  per owner directive; md+ shows the whole logo only. */

function BrandLink(): JSX.Element {
  const { siteName, logo, logoDark, favicon, mobileLogo, mobileShowSiteName } = useSiteBrand();
  const squareIcon = favicon || logo;
  const fullLogo = logo || favicon;
  // The domain text is a mobile-only companion to the square icon; the
  // dedicated mobile logo replaces both.
  const mobileTextVisible = !mobileLogo && mobileShowSiteName;
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label={`${siteName} Home`}>
      {/* Mobile top bar — dedicated mobile logo, else the square app icon */}
      <span className="md:hidden" aria-hidden="true">
        {mobileLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={mobileLogo} alt="" className="h-7 w-auto max-w-[160px] object-contain" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={squareIcon} alt="" className="h-7 w-7 rounded object-contain" />
        )}
      </span>
      {/* Larger screens — whole logo only, filling the nav bar height
          (h-20 with -my-4 cancels the nav's py-4 so it spans edge-to-edge) */}
      <span className="hidden md:block" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fullLogo}
          alt=""
          className={`h-20 -my-4 w-auto max-w-[320px] object-contain ${logoDark ? 'dark:hidden' : ''}`}
        />
        {logoDark && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoDark}
            alt=""
            className="hidden h-20 -my-4 w-auto max-w-[320px] object-contain dark:block"
          />
        )}
      </span>
      {mobileTextVisible && (
        <span className="text-xl font-bold text-primary-600 hover:text-primary-700 md:hidden">
          {SITE_DOMAIN}
        </span>
      )}
    </Link>
  );
}

/** Square icon + site domain row shown at the top of the mobile menu drawer. */
function MobileDrawerBrand(): JSX.Element {
  const { favicon, logo } = useSiteBrand();
  const squareIcon = favicon || logo;
  return (
    <div className="mb-2 flex items-center gap-2 border-b border-secondary-200 pb-3 dark:border-secondary-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={squareIcon} alt="" className="h-8 w-8 rounded object-contain" />
      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
        {SITE_DOMAIN}
      </span>
    </div>
  );
}

export default function Header(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isAdminPage = pathname?.startsWith('/admin');

  useClickOutside(userMenuRef, () => setIsUserMenuOpen(false), isUserMenuOpen);

  // Mobile drawer a11y (audit): Escape closes, body scroll locks, focus moves
  // into the drawer, Tab is trapped inside it, and focus is restored on close.
  useEffect(() => {
    if (!isMenuOpen) return;
    const drawer = drawerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const FOCUSABLE =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    drawer?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !drawer) return;
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const token = getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
    const adminToken = getItem<string | null>(STORAGE_KEYS.ADMIN_TOKEN, null);
    setIsUserLoggedIn(!!token);
    setIsAdminLoggedIn(!!adminToken);
  }, [pathname]);

  const handleUserLogout = () => {
    // Server-side revocation + local cleanup (plan/01 P1: logout must revoke).
    authService.logout();
    setIsUserLoggedIn(false);
    router.push('/');
  };

  const handleAdminLogout = () => {
    authService.logoutAdmin();
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
            <BrandLink />

            <div className="hidden items-center gap-4 md:flex">
              <ul className="flex items-center gap-6">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={
                        isActive(item.href)
                          ? 'font-semibold text-primary-600 transition-colors dark:text-primary-400'
                          : 'text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400'
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3">
                {isAdminLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full">
                      Admin
                    </span>
                    <button
                      onClick={handleAdminLogout}
                      className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-secondary-500 dark:text-secondary-400">
                    Admin Portal
                  </span>
                )}
                <ThemeToggle size="sm" />
              </div>
            </div>

            {/* Mobile top-bar theme toggle (BUG-009) — drawer-only placement
                made switching undiscoverable on phones */}
            <div className="flex items-center md:hidden">
              <ThemeToggle size="sm" />
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 md:hidden dark:text-secondary-300 dark:hover:bg-secondary-800"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="mt-4 space-y-2 border-t border-secondary-200 dark:border-secondary-700 pt-4 md:hidden">
              <MobileDrawerBrand />
              {NAV_MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 mt-2">
                {isAdminLoggedIn ? (
                  <button
                    onClick={() => {
                      handleAdminLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                  >
                    Logout
                  </button>
                ) : (
                  <span className="block rounded-lg px-4 py-2 text-secondary-500 dark:text-secondary-400">
                    Admin Portal
                  </span>
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
    <>
      <header className="sticky top-0 z-50 glass border-b border-secondary-200 dark:border-secondary-800">
        <nav className="container mx-auto px-4 py-4" aria-label="Main navigation">
          <div className="flex items-center justify-between">
            <BrandLink />

            <div className="hidden items-center gap-4 md:flex">
              <ul className="flex items-center gap-6">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={
                        isActive(item.href)
                          ? 'font-semibold text-primary-600 transition-colors dark:text-primary-400'
                          : 'text-secondary-600 hover:text-primary-600 transition-colors dark:text-secondary-300 dark:hover:text-primary-400'
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3">
                {/* Show logout when user OR admin is logged in */}
                {isUserLoggedIn || isAdminLoggedIn ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="menu"
                      aria-label={isUserMenuOpen ? 'Close account menu' : 'Open account menu'}
                      className={`flex items-center gap-1 rounded-md p-1 text-indigo-600 transition-colors dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 ${
                        isUserMenuOpen ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                      }`}
                    >
                      <UserCircle className="h-8 w-8" />
                    </button>
                    {isUserMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-secondary-200 dark:bg-secondary-800 dark:ring-secondary-700"
                      >
                        {isAdminLoggedIn && (
                          <Link
                            href="/admin"
                            role="menuitem"
                            className="block px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-secondary-700"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        {isUserLoggedIn && (
                          <Link
                            href="/profile"
                            role="menuitem"
                            className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 dark:text-secondary-100 dark:hover:bg-secondary-700"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Profile
                          </Link>
                        )}
                        <Link
                          href="/achievements"
                          role="menuitem"
                          className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 dark:text-secondary-100 dark:hover:bg-secondary-700"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Achievements
                        </Link>
                        <div className="border-t border-gray-100 dark:border-secondary-700">
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsUserMenuOpen(false);
                            }}
                            role="menuitem"
                            className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-secondary-700"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
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

            {/* Mobile top-bar theme toggle (BUG-009) — drawer-only placement
                made switching undiscoverable on phones */}
            <div className="flex items-center md:hidden">
              <ThemeToggle size="sm" />
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 md:hidden dark:text-secondary-300 dark:hover:bg-secondary-800"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </nav>
      </header>

      {/* Mobile menu — slides in from the right (owner preference) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.aside
            key="menu-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            ref={drawerRef}
            className="fixed inset-y-0 right-0 z-[70] w-4/5 max-w-xs overflow-y-auto bg-white p-4 shadow-2xl md:hidden dark:bg-secondary-900"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Menu
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-secondary-800"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {NAV_MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="block rounded-lg px-3 py-2.5 text-gray-800 hover:bg-gray-50 dark:text-secondary-100 dark:hover:bg-secondary-800"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-secondary-700">
              {isUserLoggedIn || isAdminLoggedIn ? (
                <>
                  {isAdminLoggedIn && (
                    <Link
                      href="/admin"
                      className="block rounded-lg px-3 py-2.5 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-secondary-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  {isUserLoggedIn && (
                    <Link
                      href="/profile"
                      className="block rounded-lg px-3 py-2.5 text-gray-800 hover:bg-gray-50 dark:text-secondary-100 dark:hover:bg-secondary-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-secondary-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2.5 text-gray-800 hover:bg-gray-50 dark:text-secondary-100 dark:hover:bg-secondary-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
            {/* Brand anchored to the drawer footer (owner preference) */}
            <div className="mt-8 border-t border-gray-200 pt-4 dark:border-secondary-700">
              <MobileDrawerBrand />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
