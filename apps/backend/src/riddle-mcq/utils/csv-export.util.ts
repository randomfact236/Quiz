export function buildCsvHeaders(): string[] {
  return [
    '#',
    'question',
    'optionA',
    'optionB',
    'optionC',
    'optionD',
    'answer',
    'level',
    'subject',
    'hint',
    'explanation',
    'status',
  ];
}

export function formatAnswerText(riddle: {
  level: string;
  answer?: string | null;
  correctLetter?: string | null;
  options?: (string | null)[] | null;
}): string {
  const optionMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  if (riddle.level === 'expert') {
    return riddle.answer || '';
  }
  if (riddle.correctLetter && optionMap[riddle.correctLetter] !== undefined) {
    return `${riddle.correctLetter}. ${riddle.options?.[optionMap[riddle.correctLetter]] || ''}`;
  }
  return '';
}

function escapeCsvValue(value: string): string {
  return `"${(value || '').replace(/"/g, '""')}"`;
}

export function buildCsvRow(
  counter: number,
  riddle: {
    question?: string | null;
    options?: (string | null)[] | null;
    level: string;
    answer?: string | null;
    correctLetter?: string | null;
    subject?: { name?: string } | null;
    hint?: string | null;
    explanation?: string | null;
    status?: string;
  },
  answerText: string
): string {
  return [
    counter,
    escapeCsvValue(riddle.question || ''),
    escapeCsvValue(riddle.options?.[0] || ''),
    escapeCsvValue(riddle.options?.[1] || ''),
    escapeCsvValue(riddle.options?.[2] || ''),
    escapeCsvValue(riddle.options?.[3] || ''),
    escapeCsvValue(answerText),
    riddle.level,
    riddle.subject?.name || '',
    escapeCsvValue(riddle.hint || ''),
    escapeCsvValue(riddle.explanation || ''),
    riddle.status,
  ].join(',');
}
