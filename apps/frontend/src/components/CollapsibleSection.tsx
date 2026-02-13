'use client';

import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerColor?: string;
  icon?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultOpen = true,
  headerColor = 'from-blue-500 to-indigo-500',
  icon = '📚',
}: CollapsibleSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gradient-to-r ${headerColor} p-4 flex items-center justify-between transition-all hover:opacity-90`}
      >
        <div className="text-left">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{icon}</span>
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
        </div>
        <div className="text-white transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '2000px' : '0',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
        }}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
