/**
 * ============================================================================
 * THEME TOGGLE COMPONENT
 * ============================================================================
 */

'use client';

import { useTheme } from '@/contexts/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'dropdown';
}

export function ThemeToggle({ 
  className = '', 
  size = 'md',
  variant = 'icon' 
}: ThemeToggleProps): JSX.Element {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Icon-only toggle (cycles through light/dark)
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          rounded-lg
          flex items-center justify-center
          transition-all duration-200 ease-in-out
          text-secondary-600 dark:text-secondary-300
          hover:bg-secondary-100 dark:hover:bg-secondary-800
          hover:text-primary-600 dark:hover:text-primary-400
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-secondary-900
          ${className}
        `}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          // Sun icon for dark mode (click to go light)
          <svg
            className={`${iconSizes[size]} transition-transform duration-200`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // Moon icon for light mode (click to go dark)
          <svg
            className={`${iconSizes[size]} transition-transform duration-200`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
    );
  }

  // Button with text
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          rounded-lg font-medium text-sm
          transition-all duration-200 ease-in-out
          bg-secondary-100 dark:bg-secondary-800
          text-secondary-700 dark:text-secondary-200
          hover:bg-secondary-200 dark:hover:bg-secondary-700
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-secondary-900
          ${className}
        `}
      >
        {isDark ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // Dropdown with all 3 options
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className="
          appearance-none
          bg-secondary-100 dark:bg-secondary-800
          text-secondary-700 dark:text-secondary-200
          pl-10 pr-8 py-2 rounded-lg
          font-medium text-sm
          border border-transparent
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          cursor-pointer
          transition-colors duration-200
        "
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      {/* Icon on the left */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        {resolvedTheme === 'dark' ? (
          <svg className="w-4 h-4 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </div>
      {/* Dropdown arrow */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export default ThemeToggle;
