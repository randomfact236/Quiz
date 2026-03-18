'use client';

import { cn } from '@/lib/utils';

export interface LevelFilterProps {
  value: string;
  onChange: (value: string) => void;
  counts?: Record<string, number>;
  className?: string;
}

const LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'easy', label: 'Easy', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'hard', label: 'Hard', color: 'yellow' },
  { value: 'expert', label: 'Expert', color: 'orange' },
  { value: 'extreme', label: 'Extreme', color: 'red' },
];

const COLOR_MAP = {
  green: {
    active: 'bg-green-500 text-white border-green-500',
    inactive: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  blue: {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  yellow: {
    active: 'bg-yellow-500 text-white border-yellow-500',
    inactive: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  },
  orange: {
    active: 'bg-orange-500 text-white border-orange-500',
    inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  },
  red: {
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
};

export function LevelFilter({ value, onChange, counts = {}, className }: LevelFilterProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {LEVELS.map((level) => {
        const isActive = value === level.value;
        const count = level.value === 'all' ? totalCount : (counts[level.value] || 0);
        
        return (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              level.value === 'all'
                ? isActive
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                : isActive
                  ? COLOR_MAP[level.color as keyof typeof COLOR_MAP]?.active || 'bg-gray-600 text-white border-gray-600'
                  : COLOR_MAP[level.color as keyof typeof COLOR_MAP]?.inactive || 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            )}
          >
            <span>{level.label}</span>
            {count > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded text-xs font-semibold',
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default LevelFilter;
