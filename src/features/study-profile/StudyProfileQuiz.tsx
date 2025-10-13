import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudyProfile } from '../../lib/types';
import { useStudyProfileQuiz } from './hooks/useStudyProfileQuiz';
import { QuizProgress } from './components/QuizProgress';
import { QuizQuestionCard } from './components/QuizQuestion';
import { QuizNavigation } from './components/QuizNavigation';
import { QuizComplete } from './components/QuizComplete';
import { LoadingOverlay } from './components/LoadingOverlay';
// import { QuizSkeleton } from './components/QuizSkeleton'; // TODO: Add loading state later
import { getLocalizedText } from './i18n/quizCopy';
import { useAnimationConfig, ANIMATION_VARIANTS } from './hooks/useAnimationConfig';

interface StudyProfileQuizProps {
  onNavigate: (path: string) => void;
  existingProfile?: StudyProfile | null;
}

export function StudyProfileQuiz({ onNavigate, existingProfile }: StudyProfileQuizProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('return') || '/today';
  
  const [showWelcome, setShowWelcome] = useState(!existingProfile);
  const [showComplete, setShowComplete] = useState(false);
  
  const {
    currentStep,
    answers,
    progress,
    isComplete,
    validation,
    currentQuestion,
    totalQuestions,
    setAnswer,
    nextStep,
    prevStep,
    submitQuizOptimistic,
    isSaving,
    saveError,
    loadingState,
    optimisticError
  } = useStudyProfileQuiz(existingProfile);

  const handleAnswerSelect = useCallback((value: number) => {
    setAnswer(currentQuestion.id, value);
  }, [currentQuestion.id, setAnswer]);

  const handleNext = useCallback(() => {
    if (isComplete) {
      handleSubmit();
    } else {
      nextStep();
    }
  }, [isComplete, nextStep]);

  // Optimistic submit: Show success immediately, save in background
  const handleSubmit = useCallback(async () => {
    try {
      // Show success screen immediately (optimistic)
      setShowComplete(true);
      
      // Save in background
      await submitQuizOptimistic();
      
      // If we reach here, save succeeded
      // Success screen is already showing
    } catch (error) {
      // Rollback on error
      setShowComplete(false);
      console.error('Quiz submission failed:', error);
      // Error will be shown via optimisticError
    }
  }, [submitQuizOptimistic]);

  const handleComplete = useCallback(() => {
    onNavigate(returnUrl);
  }, [onNavigate, returnUrl]);

  const { shouldAnimate } = useAnimationConfig();
  const canGoNext = validation.isValid || (currentStep < totalQuestions - 1 && answers[currentQuestion.id] !== undefined);
  const canGoPrev = currentStep > 0;

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-8 text-center"
            variants={shouldAnimate ? ANIMATION_VARIANTS.scale : undefined}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h1 
              className="text-3xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldAnimate ? 0.3 : 0, delay: shouldAnimate ? 0.1 : 0 }}
            >
              {getLocalizedText('welcome.title')}
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-600 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: shouldAnimate ? 0.3 : 0, delay: shouldAnimate ? 0.2 : 0 }}
            >
              {getLocalizedText('welcome.description')}
            </motion.p>
            <motion.p 
              className="text-sm text-gray-500 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: shouldAnimate ? 0.3 : 0, delay: shouldAnimate ? 0.3 : 0 }}
            >
              {getLocalizedText('welcome.estimatedTime')}
            </motion.p>
            
            <motion.button
              onClick={() => setShowWelcome(false)}
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldAnimate ? 0.3 : 0, delay: shouldAnimate ? 0.4 : 0 }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Bắt đầu
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-8"
            variants={shouldAnimate ? ANIMATION_VARIANTS.scale : undefined}
            initial="hidden"
            animate="visible"
          >
            <QuizComplete onComplete={handleComplete} />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldAnimate ? 0.3 : 0 }}
          >
            <QuizProgress 
              progress={progress}
              currentStep={currentStep}
              totalQuestions={totalQuestions}
            />

            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: shouldAnimate ? 0.25 : 0 }}
                >
                  <QuizQuestionCard
                    question={currentQuestion}
                    selectedValue={answers[currentQuestion.id]}
                    onSelect={handleAnswerSelect}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message with retry */}
            {(optimisticError || (saveError as Error | null)) && (
              <motion.div 
                initial={{ opacity: 0, x: 0 }}
                animate={{ 
                  opacity: 1, 
                  x: shouldAnimate ? [-10, 10, -10, 10, 0] : 0 
                }}
                transition={{ duration: shouldAnimate ? 0.5 : 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-800 mb-3">
                  Có lỗi xảy ra khi lưu profile. Vui lòng thử lại.
                </p>
                <motion.button
                  onClick={handleSubmit}
                  whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                >
                  Thử lại
                </motion.button>
              </motion.div>
            )}

            <QuizNavigation
              currentStep={currentStep}
              totalQuestions={totalQuestions}
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
              isComplete={isComplete}
              isSaving={isSaving}
              onNext={handleNext}
              onPrev={prevStep}
              onSubmit={handleSubmit}
            />
          </motion.div>
        </div>
      </div>

      {/* Loading overlay - shows during save */}
      <AnimatePresence>
        <LoadingOverlay 
          isVisible={loadingState === 'saving'}
          message="Đang lưu hồ sơ học tập..."
        />
      </AnimatePresence>
    </>
  );
}
