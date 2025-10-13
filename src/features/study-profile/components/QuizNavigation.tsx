import { motion, AnimatePresence } from 'framer-motion';
import { getLocalizedText } from '../i18n/quizCopy';
import { useAnimationConfig } from '../hooks/useAnimationConfig';

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
  const { shouldAnimate } = useAnimationConfig();
  
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
      <motion.button
        onClick={onPrev}
        disabled={!canGoPrev || isSaving}
        whileHover={canGoPrev && !isSaving && shouldAnimate ? { scale: 1.05 } : undefined}
        whileTap={canGoPrev && !isSaving && shouldAnimate ? { scale: 0.95 } : undefined}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          canGoPrev && !isSaving
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
      >
        {getLocalizedText('navigation.back', locale)}
      </motion.button>

      <div className="flex items-center space-x-2">
        <AnimatePresence mode="wait">
          {isSaving && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center space-x-2 text-blue-600"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="rounded-full h-4 w-4 border-b-2 border-blue-600"
              />
              <span className="text-sm">Đang lưu...</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={handleNext}
          disabled={!canGoNext || isSaving}
          whileHover={canGoNext && !isSaving && shouldAnimate ? { scale: 1.05 } : undefined}
          whileTap={canGoNext && !isSaving && shouldAnimate ? { scale: 0.95 } : undefined}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canGoNext && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {nextButtonText}
        </motion.button>
      </div>
    </div>
  );
}
