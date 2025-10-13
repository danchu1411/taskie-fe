import { Chronotype, FocusStyle, WorkStyle } from '../../../lib/types';
import { getQuizCopy } from '../i18n/quizCopy';

// Quiz question types
export interface QuizOption {
  value: number;
  labelKey: string;
  icon: string;
}

export interface QuizQuestion {
  id: string;
  category: 'chronotype' | 'focusStyle' | 'workStyle';
  questionKey: string;
  options: QuizOption[];
  weight?: number; // Optional weight (default: 1)
}

// 2-3 questions per category = 7 total
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Chronotype (2 questions)
  {
    id: 'chrono_1',
    category: 'chronotype',
    questionKey: 'questions.chrono_1',
    weight: 2, // Primary diagnostic question
    options: [
      { value: 0, labelKey: 'options.chrono_morning', icon: '🌅' },
      { value: 1, labelKey: 'options.chrono_evening', icon: '🌙' },
      { value: 2, labelKey: 'options.chrono_flexible', icon: '🔄' }
    ]
  },
  {
    id: 'chrono_2',
    category: 'chronotype',
    questionKey: 'questions.chrono_2',
    weight: 1, // Secondary confirmation question
    options: [
      { value: 0, labelKey: 'options.chrono_early_bed', icon: '🌅' },
      { value: 1, labelKey: 'options.chrono_late_bed', icon: '🌙' },
      { value: 2, labelKey: 'options.chrono_variable', icon: '🔄' }
    ]
  },
  
  // FocusStyle (3 questions)
  {
    id: 'focus_1',
    category: 'focusStyle',
    questionKey: 'questions.focus_1',
    weight: 2, // Core focus style indicator
    options: [
      { value: 0, labelKey: 'options.focus_deep', icon: '🎯' },
      { value: 1, labelKey: 'options.focus_sprint', icon: '⚡' },
      { value: 2, labelKey: 'options.focus_multitask', icon: '🔀' }
    ]
  },
  {
    id: 'focus_2',
    category: 'focusStyle',
    questionKey: 'questions.focus_2',
    weight: 1.5, // Secondary indicator
    options: [
      { value: 0, labelKey: 'options.focus_plan_ahead', icon: '📋' },
      { value: 1, labelKey: 'options.focus_improvise', icon: '🎭' },
      { value: 2, labelKey: 'options.focus_multitask', icon: '🔀' }
    ]
  },
  {
    id: 'focus_3',
    category: 'focusStyle',
    questionKey: 'questions.focus_3',
    // weight: 1 (implicit default)
    options: [
      { value: 0, labelKey: 'options.focus_quiet_space', icon: '🤫' },
      { value: 1, labelKey: 'options.focus_collaborative', icon: '👥' },
      { value: 2, labelKey: 'options.focus_anywhere', icon: '🌍' }
    ]
  },
  
  // WorkStyle (2 questions)  
  {
    id: 'work_1',
    category: 'workStyle',
    questionKey: 'questions.work_1',
    weight: 1.5, // Balanced weighting
    options: [
      { value: 0, labelKey: 'options.work_deadline', icon: '⏰' },
      { value: 1, labelKey: 'options.work_steady', icon: '📊' }
    ]
  },
  {
    id: 'work_2',
    category: 'workStyle',
    questionKey: 'questions.work_2',
    weight: 1.5,
    options: [
      { value: 0, labelKey: 'options.work_structured', icon: '📅' },
      { value: 1, labelKey: 'options.work_spontaneous', icon: '✨' }
    ]
  }
];

/**
 * Calculate weighted winner from array of votes with weights
 * @param votesWithWeights Array of vote objects with value and weight
 * @param tieBreakStrategy Strategy for handling ties: 'first', 'last', 'lowest', 'highest'
 * @returns The winning value based on weighted voting
 */
function calculateWeightedWinner(
  votesWithWeights: Array<{ value: number; weight: number }>,
  tieBreakStrategy?: 'first' | 'last' | 'lowest' | 'highest'
): number {
  // Sum weights for each unique value
  const weightSums: Record<number, number> = {};
  
  votesWithWeights.forEach(({ value, weight }) => {
    weightSums[value] = (weightSums[value] || 0) + weight;
  });
  
  // Find value(s) with maximum total weight
  let maxWeight = 0;
  let winners: number[] = [];
  
  Object.entries(weightSums).forEach(([value, totalWeight]) => {
    const numValue = parseInt(value);
    if (totalWeight > maxWeight) {
      maxWeight = totalWeight;
      winners = [numValue];
    } else if (totalWeight === maxWeight) {
      winners.push(numValue);
    }
  });
  
  // Handle ties with configurable strategy
  if (winners.length === 1) return winners[0];
  
  switch (tieBreakStrategy || 'first') {
    case 'first': return winners[0];
    case 'last': return winners[winners.length - 1];
    case 'lowest': return Math.min(...winners);
    case 'highest': return Math.max(...winners);
    default: return winners[0];
  }
}

/**
 * Legacy function kept for backwards compatibility
 * @deprecated Use calculateWeightedWinner instead for new implementations
 */
function calculateMode(votes: number[]): number {
  const frequency: Record<number, number> = {};
  
  votes.forEach(vote => {
    frequency[vote] = (frequency[vote] || 0) + 1;
  });
  
  let maxCount = 0;
  let mode = votes[0]; // Default to first vote
  
  Object.entries(frequency).forEach(([value, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mode = parseInt(value);
    }
  });
  
  return mode;
}

/**
 * Smart aggregation logic with weighted voting
 * 
 * Aggregates quiz answers by category using weighted voting instead of simple mode calculation.
 * Each question can have a weight (default: 1) that determines its importance in the final result.
 * 
 * @param answers Record of question IDs to answer values
 * @param tieBreakStrategy Strategy for handling ties: 'first', 'last', 'lowest', 'highest'
 * @returns Aggregated profile with chronotype, focusStyle, and workStyle
 * 
 * @example
 * ```typescript
 * const answers = {
 *   chrono_1: Chronotype.MorningWarrior,  // weight: 2
 *   chrono_2: Chronotype.NightOwl,         // weight: 1
 *   focus_1: FocusStyle.DeepFocus         // weight: 2
 * };
 * 
 * const profile = aggregateAnswers(answers);
 * // Result: chronotype: MorningWarrior (2 > 1), focusStyle: DeepFocus
 * ```
 */
export function aggregateAnswers(
  answers: Record<string, number>,
  tieBreakStrategy?: 'first' | 'last' | 'lowest' | 'highest'
) {
  // Helper to aggregate by category with weights
  const aggregateCategory = (category: string) => {
    const categoryQuestions = QUIZ_QUESTIONS.filter(q => q.category === category);
    const votesWithWeights = categoryQuestions
      .filter(q => answers[q.id] !== undefined)
      .map(q => ({
        value: answers[q.id],
        weight: q.weight ?? 1 // Default weight: 1
      }));
    
    if (votesWithWeights.length === 0) return undefined;
    return calculateWeightedWinner(votesWithWeights, tieBreakStrategy);
  };
  
  return {
    chronotype: aggregateCategory('chronotype') as Chronotype,
    focusStyle: aggregateCategory('focusStyle') as FocusStyle,
    workStyle: aggregateCategory('workStyle') as WorkStyle
  };
}

// Reverse mapping: convert profile back to quiz answers for editing
export function reverseMapProfile(profile: { chronotype: Chronotype; focusStyle: FocusStyle; workStyle: WorkStyle }) {
  const answers: Record<string, number> = {};
  
  // For editing, we'll use the profile values as defaults
  // This is a simplified approach - in practice you might want more sophisticated mapping
  answers.chrono_1 = profile.chronotype;
  answers.chrono_2 = profile.chronotype;
  answers.focus_1 = profile.focusStyle;
  answers.focus_2 = profile.focusStyle;
  answers.focus_3 = profile.focusStyle;
  answers.work_1 = profile.workStyle;
  answers.work_2 = profile.workStyle;
  
  return answers;
}

// Helper to get localized question text
export function getQuestionText(questionId: string, locale: 'vi' | 'en' = 'vi'): string {
  const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
  if (!question) return questionId;
  
  const copy = getQuizCopy(locale);
  const keys = question.questionKey.split('.');
  let value: any = copy;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || questionId;
}

// Helper to get localized option text
export function getOptionText(labelKey: string, locale: 'vi' | 'en' = 'vi'): string {
  const copy = getQuizCopy(locale);
  const keys = labelKey.split('.');
  let value: any = copy;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || labelKey;
}

// Helper to get question by ID
export function getQuestionById(questionId: string): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find(q => q.id === questionId);
}

// Validation helpers
export function validateAnswers(answers: Record<string, number>): { isValid: boolean; missingQuestions: string[] } {
  const missingQuestions: string[] = [];
  
  QUIZ_QUESTIONS.forEach(question => {
    if (answers[question.id] === undefined) {
      missingQuestions.push(question.id);
    }
  });
  
  return {
    isValid: missingQuestions.length === 0,
    missingQuestions
  };
}
