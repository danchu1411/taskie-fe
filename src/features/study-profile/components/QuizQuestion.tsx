import type { QuizQuestion } from '../utils/quizQuestions';
import { getQuestionText, getOptionText } from '../utils/quizQuestions';

interface QuizQuestionProps {
  question: QuizQuestion;
  selectedValue?: number;
  onSelect: (value: number) => void;
  locale?: 'vi' | 'en';
}

export function QuizQuestionCard({ question, selectedValue, onSelect, locale = 'vi' }: QuizQuestionProps) {
  const questionText = getQuestionText(question.id, locale);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        {questionText}
      </h3>
      
      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
              selectedValue === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.icon}</span>
              <span className="font-medium">
                {getOptionText(option.labelKey, locale)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
