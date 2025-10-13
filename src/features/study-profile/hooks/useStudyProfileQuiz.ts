import { useState, useCallback, useMemo } from 'react';
import type { StudyProfile } from '../../../lib/types';
import { QUIZ_QUESTIONS, aggregateAnswers, reverseMapProfile, validateAnswers } from '../utils/quizQuestions';
import { useStudyProfileData } from './useStudyProfileData';

export interface QuizState {
  currentStep: number;
  answers: Record<string, number>;
  progress: number;
  isComplete: boolean;
  validation: {
    isValid: boolean;
    missingQuestions: string[];
  };
}

export interface QuizActions {
  setAnswer: (questionId: string, value: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitQuiz: () => Promise<void>;
  resetQuiz: () => void;
}

export function useStudyProfileQuiz(existingProfile?: StudyProfile | null) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    // Pre-fill with existing profile if editing
    if (existingProfile) {
      return reverseMapProfile(existingProfile);
    }
    return {};
  });

  const { saveProfile, isSaving, saveError } = useStudyProfileData();

  const progress = useMemo(() => {
    return ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;
  }, [currentStep]);

  const isComplete = useMemo(() => {
    return currentStep === QUIZ_QUESTIONS.length - 1;
  }, [currentStep]);

  const validation = useMemo(() => {
    return validateAnswers(answers);
  }, [answers]);

  const setAnswer = useCallback((questionId: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const submitQuiz = useCallback(async () => {
    if (!validation.isValid) {
      throw new Error('Please complete all questions before submitting');
    }

    const profileData = aggregateAnswers(answers);
    await saveProfile(profileData);
  }, [answers, validation.isValid, saveProfile]);

  const resetQuiz = useCallback(() => {
    setCurrentStep(0);
    setAnswers(existingProfile ? reverseMapProfile(existingProfile) : {});
  }, [existingProfile]);

  const state: QuizState = {
    currentStep,
    answers,
    progress,
    isComplete,
    validation
  };

  const actions: QuizActions = {
    setAnswer,
    nextStep,
    prevStep,
    submitQuiz,
    resetQuiz
  };

  return {
    ...state,
    ...actions,
    isSaving,
    saveError,
    currentQuestion: QUIZ_QUESTIONS[currentStep],
    totalQuestions: QUIZ_QUESTIONS.length
  };
}
