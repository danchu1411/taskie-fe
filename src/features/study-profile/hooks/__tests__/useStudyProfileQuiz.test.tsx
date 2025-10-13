import { renderHook, act } from '@testing-library/react';
import { useStudyProfileQuiz } from '../useStudyProfileQuiz';
import { Chronotype, FocusStyle, WorkStyle, StudyProfile } from '../../../../lib/types';

// Mock the quiz questions
jest.mock('../utils/quizQuestions', () => ({
  QUIZ_QUESTIONS: [
    {
      id: 'chronotype_1',
      category: 'chronotype',
      questionKey: 'chronotype_1',
      options: [
        { value: Chronotype.MorningWarrior, labelKey: 'Morning Warrior' },
        { value: Chronotype.NightOwl, labelKey: 'Night Owl' },
        { value: Chronotype.Flexible, labelKey: 'Flexible' }
      ]
    },
    {
      id: 'chronotype_2',
      category: 'chronotype',
      questionKey: 'chronotype_2',
      options: [
        { value: Chronotype.MorningWarrior, labelKey: 'Early Morning' },
        { value: Chronotype.NightOwl, labelKey: 'Late Evening' },
        { value: Chronotype.Flexible, labelKey: 'Flexible Time' }
      ]
    },
    {
      id: 'focusStyle_1',
      category: 'focusStyle',
      questionKey: 'focusStyle_1',
      options: [
        { value: FocusStyle.DeepFocus, labelKey: 'Deep Focus' },
        { value: FocusStyle.SprintWorker, labelKey: 'Sprint Worker' },
        { value: FocusStyle.Multitasker, labelKey: 'Multitasker' }
      ]
    },
    {
      id: 'focusStyle_2',
      category: 'focusStyle',
      questionKey: 'focusStyle_2',
      options: [
        { value: FocusStyle.DeepFocus, labelKey: 'One Task' },
        { value: FocusStyle.SprintWorker, labelKey: 'Short Sessions' },
        { value: FocusStyle.Multitasker, labelKey: 'Multiple Tasks' }
      ]
    },
    {
      id: 'workStyle_1',
      category: 'workStyle',
      questionKey: 'workStyle_1',
      options: [
        { value: WorkStyle.DeadlineDriven, labelKey: 'Deadline Driven' },
        { value: WorkStyle.SteadyPacer, labelKey: 'Steady Pacer' }
      ]
    },
    {
      id: 'workStyle_2',
      category: 'workStyle',
      questionKey: 'workStyle_2',
      options: [
        { value: WorkStyle.DeadlineDriven, labelKey: 'Quick Finish' },
        { value: WorkStyle.SteadyPacer, labelKey: 'Consistent Pace' }
      ]
    }
  ],
  aggregateAnswers: jest.fn(),
  reverseMapProfile: jest.fn(),
  validateAnswers: jest.fn()
}));

describe('useStudyProfileQuiz', () => {
  const mockOnSubmit = jest.fn();
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with first step', () => {
    const { result } = renderHook(() => 
      useStudyProfileQuiz({ onSubmit: mockOnSubmit, onNavigate: mockOnNavigate })
    );

    expect(result.current.currentStep).toBe(0);
    expect(result.current.currentQuestion.id).toBe('chronotype_1');
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoNext).toBe(false);
  });

  it('should handle answer selection', () => {
    const { result } = renderHook(() => 
      useStudyProfileQuiz({ onSubmit: mockOnSubmit, onNavigate: mockOnNavigate })
    );

    act(() => {
      result.current.handleAnswer(Chronotype.MorningWarrior);
    });

    expect(result.current.answers).toEqual({
      chronotype_1: Chronotype.MorningWarrior
    });
    expect(result.current.canGoNext).toBe(true);
  });

  it('should navigate to next step', () => {
    const { result } = renderHook(() => 
      useStudyProfileQuiz({ onSubmit: mockOnSubmit, onNavigate: mockOnNavigate })
    );

    // Answer first question
    act(() => {
      result.current.handleAnswer(Chronotype.MorningWarrior);
    });

    // Go to next step
    act(() => {
      result.current.handleNext();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.currentQuestion.id).toBe('chronotype_2');
    expect(result.current.canGoBack).toBe(true);
  });

  it('should navigate to previous step', () => {
    const { result } = renderHook(() => 
      useStudyProfileQuiz({ onSubmit: mockOnSubmit, onNavigate: mockOnNavigate })
    );

    // Answer first question and go to next
    act(() => {
      result.current.handleAnswer(Chronotype.MorningWarrior);
      result.current.handleNext();
    });

    // Go back
    act(() => {
      result.current.handleBack();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.currentQuestion.id).toBe('chronotype_1');
    expect(result.current.canGoBack).toBe(false);
  });

  it('should handle form submission on last step', () => {
    const mockAggregateAnswers = require('../utils/quizQuestions').aggregateAnswers;
    const mockValidateAnswers = require('../utils/quizQuestions').validateAnswers;
    
    mockAggregateAnswers.mockReturnValue({
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven
    });
    mockValidateAnswers.mockReturnValue(true);

    const { result } = renderHook(() => 
      useStudyProfileQuiz({ onSubmit: mockOnSubmit, onNavigate: mockOnNavigate })
    );

    // Answer all questions
    act(() => {
      result.current.handleAnswer(Chronotype.MorningWarrior);
      result.current.handleNext();
      result.current.handleAnswer(Chronotype.MorningWarrior);
      result.current.handleNext();
      result.current.handleAnswer(FocusStyle.DeepFocus);
      result.current.handleNext();
      result.current.handleAnswer(FocusStyle.DeepFocus);
      result.current.handleNext();
      result.current.handleAnswer(WorkStyle.DeadlineDriven);
      result.current.handleNext();
      result.current.handleAnswer(WorkStyle.DeadlineDriven);
    });

    // Submit
    act(() => {
      result.current.handleSubmit();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven
    });
  });

  it('should pre-fill answers from existing profile', () => {
    const mockReverseMapProfile = require('../utils/quizQuestions').reverseMapProfile;
    const existingProfile: StudyProfile = {
      user_id: 'test-user',
      chronotype: Chronotype.NightOwl,
      focusStyle: FocusStyle.SprintWorker,
      workStyle: WorkStyle.SteadyPacer,
      updated_at: '2025-01-15T10:30:00Z'
    };

    mockReverseMapProfile.mockReturnValue({
      chronotype_1: Chronotype.NightOwl,
      chronotype_2: Chronotype.NightOwl,
      focusStyle_1: FocusStyle.SprintWorker,
      focusStyle_2: FocusStyle.SprintWorker,
      workStyle_1: WorkStyle.SteadyPacer,
      workStyle_2: WorkStyle.SteadyPacer
    });

    const { result } = renderHook(() => 
      useStudyProfileQuiz({ 
        onSubmit: mockOnSubmit, 
        onNavigate: mockOnNavigate,
        existingProfile 
      })
    );

    expect(result.current.answers).toEqual({
      chronotype_1: Chronotype.NightOwl,
      chronotype_2: Chronotype.NightOwl,
      focusStyle_1: FocusStyle.SprintWorker,
      focusStyle_2: FocusStyle.SprintWorker,
      workStyle_1: WorkStyle.SteadyPacer,
      workStyle_2: WorkStyle.SteadyPacer
    });
  });

  it('should handle validation errors', () => {
    const mockValidateAnswers = require('../utils/quizQuestions').validateAnswers;
    mockValidateAnswers.mockReturnValue(false);

    const { result } = renderHook(() => 
      useStudyProfileQuiz({ onSubmit: mockOnSubmit, onNavigate: mockOnNavigate })
    );

    // Try to submit without answering all questions
    act(() => {
      result.current.handleSubmit();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Please answer all questions');
  });
});
