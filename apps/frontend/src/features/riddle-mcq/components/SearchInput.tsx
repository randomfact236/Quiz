'use client';

import { useState, useCallback, useMemo } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  debounceMs?: number;
}

export function SearchInput({ value, onChange, debounceMs = 300 }: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);

  const debouncedOnChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (val: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onChange(val || undefined);
      }, debounceMs);
    };
  }, [onChange, debounceMs]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      debouncedOnChange(val);
    },
    [debouncedOnChange]
  );

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="riddle-search" className="text-sm font-medium text-gray-700">
        Search:
      </label>
      <input
        id="riddle-search"
        type="text"
        placeholder="Type to search riddles..."
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
}
