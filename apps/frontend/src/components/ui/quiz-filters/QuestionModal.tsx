'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { cn } from '@/lib/utils';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  mode: 'add' | 'edit';
  initialData?: any;
  subjects: { id: string; slug: string; name: string }[];
  chapters: { id: string; name: string; subjectId: string }[];
}

const LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'];
const CORRECT_OPTIONS = ['A', 'B', 'C', 'D'];

const LEVEL_COLORS: Record<string, string> = {
  easy: 'bg-green-500',
  medium: 'bg-blue-500',
  hard: 'bg-yellow-500',
  expert: 'bg-orange-500',
  extreme: 'bg-red-500',
};

export function QuestionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  mode, 
  initialData,
  subjects,
  chapters 
}: QuestionModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [level, setLevel] = useState('easy');
  const [chapterId, setChapterId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');

  // Filter chapters by selected subject
  const filteredChapters = chapters.filter(ch => ch.subjectId === subjectId);

  const isExtreme = level === 'extreme';

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setQuestion(initialData.question || '');
        setOptions(initialData.options || ['', '', '', '']);
        setCorrectAnswer(initialData.correctLetter || 'A');
        setLevel(initialData.level || 'easy');
        setChapterId(initialData.chapterId || '');
        setSubjectId(initialData.subjectId || '');
        setStatus(initialData.status || 'draft');
        setOpenEndedAnswer(initialData.correctAnswer || '');
      } else {
        setQuestion('');
        setOptions(['', '', '', '']);
        setCorrectAnswer('A');
        setLevel('easy');
        setChapterId('');
        setSubjectId(subjects[0]?.id || '');
        setStatus('draft');
        setOpenEndedAnswer('');
      }
    }
  }, [isOpen, mode, initialData, subjects]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    if (!isExtreme && options.some(opt => !opt.trim())) return;
    if (!isExtreme && !correctAnswer) return;
    if (!chapterId) return;
    if (!subjectId) return;

    const data: any = {
      question: question.trim(),
      level,
      chapterId,
      status,
    };

    if (isExtreme) {
      data.options = null;
      data.correctAnswer = openEndedAnswer.trim();
      data.correctLetter = null;
    } else {
      data.options = options.map(o => o.trim());
      data.correctAnswer = options[CORRECT_OPTIONS.indexOf(correctAnswer)];
      data.correctLetter = correctAnswer;
    }

    onSave(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Question' : 'Edit Question'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject & Chapter */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setChapterId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapter <span className="text-red-500">*</span>
            </label>
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!subjectId}
            >
              <option value="">Select chapter</option>
              {filteredChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Level & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
                    level === lvl
                      ? `${LEVEL_COLORS[lvl]} text-white border-transparent`
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  )}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
            {level === 'extreme' && (
              <p className="text-xs text-red-600 mt-1">
                Open-ended question (no multiple choice options)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
                  status === 'draft'
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                )}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
                  status === 'published'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                )}
              >
                Published
              </button>
            </div>
          </div>
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question <span className="text-red-500">*</span>
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your question..."
            rows={3}
            required
          />
        </div>

        {/* Options (for non-extreme) */}
        {!isExtreme && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CORRECT_OPTIONS.map((opt, index) => (
                <div key={opt} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(opt)}
                    className={cn(
                      'w-8 h-8 text-sm font-bold rounded-lg border-2 transition-colors flex items-center justify-center',
                      correctAnswer === opt
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    )}
                  >
                    {opt}
                  </button>
                  <input
                    type="text"
                    value={options[index]}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${opt}`}
                  />
                  {correctAnswer === opt && (
                    <span className="text-green-500 text-sm font-medium">Correct</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open-ended Answer (for extreme) */}
        {isExtreme && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correct Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={openEndedAnswer}
              onChange={(e) => setOpenEndedAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the correct answer/explanation..."
              rows={3}
              required={isExtreme}
            />
          </div>
        )}

        {/* Actions */}
        <ModalFooter
          onCancel={onClose}
          saveLabel={mode === 'add' ? 'Add Question' : 'Save Changes'}
        />
      </form>
    </Modal>
  );
}

export default QuestionModal;