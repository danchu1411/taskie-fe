import { getLocalizedText } from '../i18n/quizCopy';

interface QuizNavigationProps {
  currentStep: number;
  totalQuestions: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  isComplete: boolean;
  isSaving: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  locale?: 'vi' | 'en';
}

export function QuizNavigation({ 
  currentStep, 
  totalQuestions, 
  canGoNext, 
  canGoPrev, 
  isComplete, 
  isSaving,
  onNext, 
  onPrev, 
  onSubmit,
  locale = 'vi'
}: QuizNavigationProps) {
  const handleNext = () => {
    if (isComplete) {
      onSubmit();
    } else {
      onNext();
    }
  };

  const nextButtonText = isComplete 
    ? getLocalizedText('navigation.submit', locale)
    : getLocalizedText('navigation.next', locale);

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      <button
        onClick={onPrev}
        disabled={!canGoPrev || isSaving}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          canGoPrev && !isSaving
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
      >
        {getLocalizedText('navigation.back', locale)}
      </button>

      <div className="flex items-center space-x-2">
        {isSaving && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Đang lưu...</span>
          </div>
        )}
        
        <button
          onClick={handleNext}
          disabled={!canGoNext || isSaving}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canGoNext && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {nextButtonText}
        </button>
      </div>
    </div>
  );
}
