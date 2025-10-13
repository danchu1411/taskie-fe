import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { StudyProfile } from '../../lib/types';
import { useStudyProfileQuiz } from './hooks/useStudyProfileQuiz';
import { QuizProgress } from './components/QuizProgress';
import { QuizQuestionCard } from './components/QuizQuestion';
import { QuizNavigation } from './components/QuizNavigation';
import { QuizComplete } from './components/QuizComplete';
import { getLocalizedText } from './i18n/quizCopy';

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
    submitQuiz,
    isSaving,
    saveError
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

  const handleSubmit = useCallback(async () => {
    try {
      await submitQuiz();
      setShowComplete(true);
    } catch (error) {
      console.error('Quiz submission failed:', error);
      // Error handling will be shown via saveError
    }
  }, [submitQuiz]);

  const handleComplete = useCallback(() => {
    onNavigate(returnUrl);
  }, [onNavigate, returnUrl]);

  const canGoNext = validation.isValid || (currentStep < totalQuestions - 1 && answers[currentQuestion.id] !== undefined);
  const canGoPrev = currentStep > 0;

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {getLocalizedText('welcome.title')}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {getLocalizedText('welcome.description')}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              {getLocalizedText('welcome.estimatedTime')}
            </p>
            
            <button
              onClick={() => setShowWelcome(false)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Bắt đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <QuizComplete onComplete={handleComplete} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <QuizProgress 
            progress={progress}
            currentStep={currentStep}
            totalQuestions={totalQuestions}
          />

          {currentQuestion && (
            <QuizQuestionCard
              question={currentQuestion}
              selectedValue={answers[currentQuestion.id]}
              onSelect={handleAnswerSelect}
            />
          )}

          {saveError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                Có lỗi xảy ra khi lưu profile. Vui lòng thử lại.
              </p>
            </div>
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
        </div>
      </div>
    </div>
  );
}
