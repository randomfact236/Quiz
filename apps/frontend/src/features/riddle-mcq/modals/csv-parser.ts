export interface ParsedRiddle {
  question: string;
  options: string[];
  correctLetter: string;
  level: string;
  subjectName: string;
  categoryName: string;
  hint: string;
  explanation: string;
  answer: string;
  status: string;
}

export interface ImportError {
  row: number;
  message: string;
}

export function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvContent(content: string): {
  riddles: ParsedRiddle[];
  categoryName: string;
} {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { riddles: [], categoryName: '' };

  let headerLineIdx = 0;
  let dataStartIdx = 1;
  let categoryName = '';

  if (lines[0]?.startsWith('# Category:')) {
    categoryName = lines[0]!
      .replace(/^#\s*Category:\s*/i, '')
      .replace(/,+$/, '')
      .trim();
    headerLineIdx = 1;
    dataStartIdx = 2;
  }

  const headers = parseCSVRow(lines[headerLineIdx]!).map((h) => h.toLowerCase().trim());
  const riddles: ParsedRiddle[] = [];

  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;

    const values = parseCSVRow(line);
    if (values.length < 2) continue;

    const getValue = (colName: string): string => {
      const idx = headers.indexOf(colName.toLowerCase());
      return idx >= 0 && values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
    };

    const question = getValue('question');
    if (!question) continue;

    const optA = getValue('optiona');
    const optB = getValue('optionb');
    const optC = getValue('optionc');
    const optD = getValue('optiond');

    const answerRaw = getValue('answer');

    let correctLetter = '';
    let answerText = '';

    if (answerRaw) {
      const letterMatch = answerRaw.match(/^([A-D])\.\s*(.*)$/i);
      if (letterMatch) {
        correctLetter = letterMatch[1]!.toUpperCase();
        answerText = letterMatch[2]!.trim();
      } else {
        answerText = answerRaw;
      }
    }

    let options: string[] = [];
    if (optA) options.push(optA);
    if (optB) options.push(optB);
    if (optC) options.push(optC);
    if (optD) options.push(optD);

    if (answerText && correctLetter) {
      const letterIndex = correctLetter.charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < options.length) {
        options[letterIndex] = answerText;
      }
    }

    riddles.push({
      question,
      options,
      correctLetter,
      level: getValue('level') || 'easy',
      subjectName: getValue('subject'),
      categoryName,
      hint: getValue('hint'),
      explanation: getValue('explanation'),
      answer: answerText || '',
      status: getValue('status') || 'draft',
    });
  }

  return { riddles, categoryName };
}
