'use client';

import { cn } from '@/lib/utils';

export interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  counts?: { status: string; count: number }[];
  className?: string;
}

const STATUSES = [
  { value: 'all', label: 'All', colorKey: 'gray' },
  { value: 'published', label: 'Published', colorKey: 'green' },
  { value: 'draft', label: 'Draft', colorKey: 'yellow' },
  { value: 'trash', label: 'Trash', colorKey: 'red' },
] as const;

const DEFAULT_COLORS = { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' };

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
};

export function StatusFilter({ 
  value, 
  onChange, 
  counts = [],
  className 
}: StatusFilterProps) {
  const getCount = (status: string): number => {
    if (status === 'all') {
      return counts.reduce((sum, c) => sum + c.count, 0);
    }
    return counts.find(c => c.status === status)?.count || 0;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Status Blocks Row */}
      <div className="grid grid-cols-4 gap-3">
        {STATUSES.map((status) => {
          const isActive = value === status.value;
          const count = getCount(status.value);
          const colors = COLOR_MAP[status.colorKey] ?? DEFAULT_COLORS;
          
          return (
            <button
              key={status.value}
              onClick={() => onChange(status.value)}
              className={cn(
                'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                isActive 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : `${colors.bg} ${colors.border} hover:shadow-sm`,
                !isActive && colors.text
              )}
            >
              <span className={cn(
                'text-xs font-medium uppercase tracking-wide mb-1',
                isActive ? 'text-blue-600' : colors.text
              )}>
                {status.label}
              </span>
              <span className={cn(
                'text-2xl font-bold',
                isActive ? 'text-blue-700' : 'text-gray-800'
              )}>
                {count}
              </span>
              {!isActive && (
                <span className={cn('absolute top-2 right-2 w-2 h-2 rounded-full', colors.dot)} />
              )}
              {isActive && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StatusFilter;