'use client';

export function SubjectLoadingState(): JSX.Element {
  return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
        >
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
