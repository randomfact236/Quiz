import { Subject } from '@/app/admin/types';

export interface QuizData {
  subjects: Subject[];
  questions: Record<string, any[]>;
  lastUpdated: string;
}

const DATA_FILE_PATH = '/data/questions.json';

let cachedData: QuizData | null = null;

export async function loadQuizData(): Promise<QuizData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(DATA_FILE_PATH);
    if (response.ok) {
      const data = await response.json();
      if (data.questions && Object.keys(data.questions).length > 0) {
        cachedData = data;
        return cachedData!;
      }
    }
  } catch (error) {
    console.error('Failed to load quiz data:', error);
  }

  cachedData = {
    subjects: [],
    questions: {},
    lastUpdated: new Date().toISOString(),
  };
  return cachedData;
}

export async function loadQuestionsFromFile(): Promise<Record<string, any[]>> {
  try {
    const response = await fetch(DATA_FILE_PATH);
    if (response.ok) {
      const data = await response.json();
      if (data.questions && Object.keys(data.questions).length > 0) {
        return data.questions;
      }
    }
  } catch (error) {
    console.error('Failed to load questions from file:', error);
  }
  return {};
}

export async function saveQuizData(data: QuizData): Promise<boolean> {
  cachedData = {
    ...data,
    lastUpdated: new Date().toISOString(),
  };

  try {
    const response = await fetch('/api/quiz-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cachedData),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save quiz data:', error);
    return false;
  }
}

export function exportQuizDataToFile(data: QuizData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'questions.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importQuizDataFromFile(file: File): Promise<QuizData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as QuizData;
        if (data.subjects && data.questions) {
          resolve(data);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}
