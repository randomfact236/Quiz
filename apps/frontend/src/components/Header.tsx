'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAV_ITEMS, NAV_MENU_ITEMS } from '@/lib/nav-config';
import { useState, useEffect } from 'react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandMark } from '@/components/BrandMark';
import { useSiteBrand } from '@/components/SiteBrandContext';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { authService } from '@/lib/auth';

/** Brand link from the Site Information settings. Mobile (<md) shows the
 *  square app icon + site name; md+ shows the whole logo only — it already
 *  carries the brand name, so no text is added beside it (unless no logo is
 *  uploaded, in which case the placeholder mark + name are shown). */
function BrandLink(): JSX.Element {
  const { siteName, logo, favicon } = useSiteBrand();
  const squareIcon = favicon || logo;
  const fullLogo = logo || favicon;
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label={`${siteName} Home`}>
      {/* Mobile top bar — square app icon */}
      <span className="md:hidden" aria-hidden="true">
        {squareIcon ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={squareIcon} alt="" className="h-7 w-7 rounded object-contain" />
        ) : (
          <BrandMark size={28} />
        )}
      </span>
      {/* Larger screens — whole logo only */}
      <span className="hidden md:block" aria-hidden="true">
        {fullLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={fullLogo} alt="" className="h-9 w-auto max-w-[190px] object-contain" />
        ) : (
          <BrandMark size={32} />
        )}
      </span>
      {/* Site name: always on mobile; on md+ only when no logo is uploaded
          (the placeholder mark alone would leave the brand nameless) */}
      <span
        className={`text-xl font-bold text-primary-600 hover:text-primary-700 ${
          fullLogo ? 'md:hidden' : ''
        }`}
      >
        {siteName}
      </span>
    </Link>
  );
}

/** Square icon + site name row shown at the top of the mobile menu drawer. */
function MobileDrawerBrand(): JSX.Element {
  const { siteName, favicon, logo } = useSiteBrand();
  const squareIcon = favicon || logo;
  return (
    <div className="mb-2 flex items-center gap-2 border-b border-secondary-200 pb-3 dark:border-secondary-700">
      {squareIcon ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={squareIcon} alt="" className="h-8 w-8 rounded object-contain" />
      ) : (
        <BrandMark size={32} />
      )}
      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{siteName}</span>
    </div>
  );
}

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
              <ul className="flex items-center gap-6" role="menubar">
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
              <div className="flex items-center justify-between rounded-lg px-4 py-2">
                <span className="text-sm text-secondary-500 dark:text-secondary-400">Theme</span>
                <ThemeToggle size="sm" />
              </div>
              {NAV_MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800"
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
                    className="w-full text-left block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800"
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
    <header className="sticky top-0 z-50 glass border-b border-secondary-200 dark:border-secondary-800">
      <nav className="container mx-auto px-4 py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          <BrandLink />

          <div className="hidden items-center gap-4 md:flex">
            <ul className="flex items-center gap-6" role="menubar">
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
                <div className="flex items-center gap-3">
                  {isAdminLoggedIn && (
                    <Link
                      href="/admin"
                      className="text-sm text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {isUserLoggedIn && (
                    <Link
                      href="/profile"
                      className="text-sm text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 font-medium dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Profile
                    </Link>
                  )}
                  {isAdminLoggedIn && (
                    <span className="text-sm bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                      Admin
                    </span>
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

        {isMenuOpen && (
          <div className="mt-4 space-y-2 border-t border-secondary-200 dark:border-secondary-700 pt-4 md:hidden">
            <MobileDrawerBrand />
            <div className="flex items-center justify-between rounded-lg px-4 py-2">
              <span className="text-sm text-secondary-500 dark:text-secondary-400">Theme</span>
              <ThemeToggle size="sm" />
            </div>
            {NAV_MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 mt-2">
              {isUserLoggedIn || isAdminLoggedIn ? (
                <>
                  {isAdminLoggedIn && (
                    <Link
                      href="/admin"
                      className="block rounded-lg px-4 py-2 text-indigo-600 dark:text-indigo-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 dark:text-indigo-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  {isUserLoggedIn && (
                    <Link
                      href="/profile"
                      className="block rounded-lg px-4 py-2 text-indigo-600 dark:text-indigo-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 dark:text-indigo-400"
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
                    className="w-full text-left block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800 dark:hover:bg-secondary-800"
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
