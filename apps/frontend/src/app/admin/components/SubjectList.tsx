'use client';

import type { Subject } from '../types';

interface SubjectListProps {
  subjects: Subject[];
  total: number;
  onSelectSubject?: (slug: string) => void;
}

export function SubjectList({ subjects, total, onSelectSubject }: SubjectListProps): JSX.Element {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {total} subject{total !== 1 ? 's' : ''}
        </h2>
      </div>
      
      <div className="grid gap-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            onClick={() => onSelectSubject?.(subject.slug)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 cursor-pointer transition-colors"
          >
            <span className="text-2xl">{subject.emoji}</span>
            <div className="flex-1">
              <h3 className="font-medium">{subject.name}</h3>
              <p className="text-sm text-gray-500">{subject.slug}</p>
            </div>
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
              {subject.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
