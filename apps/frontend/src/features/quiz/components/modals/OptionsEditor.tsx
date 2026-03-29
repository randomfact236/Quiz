'use client';

export const CORRECT_LETTERS = ['A', 'B', 'C', 'D'];

interface OptionsEditorProps {
  options: string[];
  correctLetter: string;
  onOptionChange: (index: number, value: string) => void;
  onCorrectLetterChange: (letter: string) => void;
}

export function OptionsEditor({
  options,
  correctLetter,
  onOptionChange,
  onCorrectLetterChange,
}: OptionsEditorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Options
      </label>
      <div className="space-y-2">
        {CORRECT_LETTERS.map((letter, index) => (
          <div key={letter} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctLetter === letter}
              onChange={() => onCorrectLetterChange(letter)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium w-6">{letter}.</span>
            <input
              type="text"
              value={options[index] ?? ''}
              onChange={(e) => onOptionChange(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder={`Option ${letter}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
