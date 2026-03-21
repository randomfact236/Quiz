'use client';

import { Plus, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  counts?: { status: string; count: number }[];
  onAddQuestion?: () => void;
  onImport?: () => void;
  onExport?: () => void;
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
  onAddQuestion,
  onImport,
  onExport,
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
      <div className="flex items-center justify-between gap-4">
        <div className="grid grid-cols-4 gap-3 flex-1">
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

        {/* Action Buttons - Right Side */}
        <div className="flex items-center gap-2 shrink-0">
          {onAddQuestion && (
            <button
              onClick={onAddQuestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          )}
          {onImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusFilter;