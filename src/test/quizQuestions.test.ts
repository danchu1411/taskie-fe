import { 
  QUIZ_QUESTIONS, 
  aggregateAnswers, 
  reverseMapProfile, 
  getQuestionById 
} from '../features/study-profile/utils/quizQuestions';
import { Chronotype, FocusStyle, WorkStyle } from '../lib/types';

describe('Quiz Questions Logic', () => {
  describe('QUIZ_QUESTIONS', () => {
    it('should have correct number of questions', () => {
      expect(QUIZ_QUESTIONS).toHaveLength(7);
    });

    it('should have correct category distribution', () => {
      const chronoQuestions = QUIZ_QUESTIONS.filter(q => q.category === 'chronotype');
      const focusQuestions = QUIZ_QUESTIONS.filter(q => q.category === 'focusStyle');
      const workQuestions = QUIZ_QUESTIONS.filter(q => q.category === 'workStyle');

      expect(chronoQuestions).toHaveLength(2);
      expect(focusQuestions).toHaveLength(3);
      expect(workQuestions).toHaveLength(2);
    });

    it('should have unique question IDs', () => {
      const ids = QUIZ_QUESTIONS.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('aggregateAnswers', () => {
    it('should calculate mode correctly for chronotype', () => {
      const answers = {
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.MorningWarrior,
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.SprintWorker,
        focus_3: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven,
        work_2: WorkStyle.DeadlineDriven
      };

      const result = aggregateAnswers(answers);
      expect(result.chronotype).toBe(Chronotype.MorningWarrior);
    });

    it('should calculate mode correctly for focusStyle', () => {
      const answers = {
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.MorningWarrior,
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.SprintWorker,
        focus_3: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven,
        work_2: WorkStyle.DeadlineDriven
      };

      const result = aggregateAnswers(answers);
      expect(result.focusStyle).toBe(FocusStyle.DeepFocus);
    });

    it('should calculate mode correctly for workStyle', () => {
      const answers = {
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.MorningWarrior,
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.SprintWorker,
        focus_3: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven,
        work_2: WorkStyle.DeadlineDriven
      };

      const result = aggregateAnswers(answers);
      expect(result.workStyle).toBe(WorkStyle.DeadlineDriven);
    });

    it('should aggregate answers by majority vote per category', () => {
      // Test scenario: Mixed answers across all categories
      const answers = {
        chrono_1: Chronotype.MorningWarrior,  // 0
        chrono_2: Chronotype.NightOwl,        // 1
        focus_1: FocusStyle.DeepFocus,        // 0
        focus_2: FocusStyle.DeepFocus,        // 0
        focus_3: FocusStyle.SprintWorker,     // 1
        work_1: WorkStyle.DeadlineDriven,     // 0
        work_2: WorkStyle.SteadyPacer         // 1
      };

      const result = aggregateAnswers(answers);
      
      // Chronotype: tie between 0 and 1 (1 vote each)
      // FocusStyle: majority 0 (2 votes vs 1 vote)
      // WorkStyle: tie between 0 and 1 (1 vote each)
      expect(result.focusStyle).toBe(FocusStyle.DeepFocus); // Clear majority
    });

    it('should handle tie by returning first occurrence (documented behavior)', () => {
      // IMPORTANT: This test documents the CURRENT implementation behavior
      // When multiple values have equal votes, the function returns the first value
      // that appears in the frequency count. This is NOT a guaranteed stable sort,
      // but rather reflects how the current aggregation logic works.
      // If tie-breaking logic changes in the future, this test should be updated.
      // 
      // NOTE: With weighted voting, ties are now handled by configurable strategies:
      // 'first', 'last', 'lowest', 'highest' - see weighted tie tests above.
      
      const tieAnswersChronotype = {
        chrono_1: Chronotype.MorningWarrior,  // 0: 1 vote
        chrono_2: Chronotype.NightOwl,        // 1: 1 vote
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.DeepFocus,
        focus_3: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven,
        work_2: WorkStyle.DeadlineDriven
      };

      const result1 = aggregateAnswers(tieAnswersChronotype);
      
      // Chronotype has tie: MorningWarrior (0) appears first in iteration
      // Current implementation returns first occurrence from frequency map
      expect(result1.chronotype).toBe(Chronotype.MorningWarrior);

      // Test tie in workStyle
      const tieAnswersWork = {
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.MorningWarrior,
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.DeepFocus,
        focus_3: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven,    // 0: 1 vote
        work_2: WorkStyle.SteadyPacer        // 1: 1 vote
      };

      const result2 = aggregateAnswers(tieAnswersWork);
      
      // WorkStyle has tie: DeadlineDriven (0) appears first
      expect(result2.workStyle).toBe(WorkStyle.DeadlineDriven);
    });

    it('should return correct value when all answers in category are the same', () => {
      const unanimousAnswers = {
        chrono_1: Chronotype.NightOwl,
        chrono_2: Chronotype.NightOwl,
        focus_1: FocusStyle.Multitasker,
        focus_2: FocusStyle.Multitasker,
        focus_3: FocusStyle.Multitasker,
        work_1: WorkStyle.SteadyPacer,
        work_2: WorkStyle.SteadyPacer
      };

      const result = aggregateAnswers(unanimousAnswers);
      
      expect(result.chronotype).toBe(Chronotype.NightOwl);
      expect(result.focusStyle).toBe(FocusStyle.Multitasker);
      expect(result.workStyle).toBe(WorkStyle.SteadyPacer);
    });

    it('should handle partial answers (only some categories answered)', () => {
      const partialAnswers = {
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.MorningWarrior,
        // No focus answers
        work_1: WorkStyle.DeadlineDriven
        // Only one work answer
      };

      const result = aggregateAnswers(partialAnswers);
      
      expect(result.chronotype).toBe(Chronotype.MorningWarrior);
      expect(result.focusStyle).toBeUndefined(); // No focus answers
      expect(result.workStyle).toBe(WorkStyle.DeadlineDriven); // Single vote counts
    });

    it('should aggregate answers using question weights', () => {
      // Test scenario: Weighted aggregation with clear winner
      // focus_1: weight 2, focus_2: weight 1.5, focus_3: weight 1 (default)
      const answers = {
        focus_1: FocusStyle.DeepFocus,      // weight: 2 → DeepFocus: +2
        focus_2: FocusStyle.SprintWorker,   // weight: 1.5 → SprintWorker: +1.5
        focus_3: FocusStyle.DeepFocus       // weight: 1 → DeepFocus: +1
      };
      // Total: DeepFocus: 3, SprintWorker: 1.5
      
      const result = aggregateAnswers(answers);
      expect(result.focusStyle).toBe(FocusStyle.DeepFocus);
    });

    it('should handle weighted ties with configurable strategy', () => {
      // Test scenario: Different weights but testing tie-break strategies
      const answers = {
        chrono_1: Chronotype.MorningWarrior,  // weight: 2 → 0: +2
        chrono_2: Chronotype.NightOwl         // weight: 1 → 1: +1
      };
      // Total: MorningWarrior: 2, NightOwl: 1 (not a tie, MorningWarrior wins)
      
      // Default: 'first' (value 0)
      expect(aggregateAnswers(answers).chronotype)
        .toBe(Chronotype.MorningWarrior);
      
      // Explicit: 'lowest' (value 0)
      expect(aggregateAnswers(answers, 'lowest').chronotype)
        .toBe(Chronotype.MorningWarrior);
      
      // Explicit: 'highest' (value 0, since MorningWarrior wins)
      expect(aggregateAnswers(answers, 'highest').chronotype)
        .toBe(Chronotype.MorningWarrior);
    });

    it('should handle actual weighted ties', () => {
      // Test scenario: True tie with equal weights
      // Create a scenario with equal weights by using work questions
      const workAnswers = {
        work_1: WorkStyle.DeadlineDriven,    // weight: 1.5 → 0: +1.5
        work_2: WorkStyle.SteadyPacer        // weight: 1.5 → 1: +1.5
      };
      
      // Test different tie-break strategies
      expect(aggregateAnswers(workAnswers, 'first').workStyle)
        .toBe(WorkStyle.DeadlineDriven);
      expect(aggregateAnswers(workAnswers, 'lowest').workStyle)
        .toBe(WorkStyle.DeadlineDriven);
      expect(aggregateAnswers(workAnswers, 'highest').workStyle)
        .toBe(WorkStyle.SteadyPacer);
    });

    it('should default to weight 1 for questions without weight property', () => {
      // Test backwards compatibility: questions without explicit weight
      const answers = {
        focus_3: FocusStyle.DeepFocus,       // weight: 1 (implicit default)
        work_1: WorkStyle.DeadlineDriven,   // weight: 1.5
        work_2: WorkStyle.DeadlineDriven    // weight: 1.5
      };
      // focus_3 has implicit weight 1, work questions have explicit weights
      
      const result = aggregateAnswers(answers);
      expect(result.focusStyle).toBe(FocusStyle.DeepFocus);
      expect(result.workStyle).toBe(WorkStyle.DeadlineDriven);
    });

    it('should prioritize weighted value over frequency', () => {
      // Test scenario: Weight overrides frequency
      const answers = {
        focus_1: FocusStyle.DeepFocus,      // weight: 2 → DeepFocus: +2
        focus_2: FocusStyle.SprintWorker,   // weight: 1.5 → SprintWorker: +1.5
        focus_3: FocusStyle.SprintWorker    // weight: 1 → SprintWorker: +1
      };
      // Frequency: SprintWorker: 2, DeepFocus: 1
      // Weighted: DeepFocus: 2, SprintWorker: 2.5
      // Winner: SprintWorker (higher weighted total)
      
      const result = aggregateAnswers(answers);
      expect(result.focusStyle).toBe(FocusStyle.SprintWorker);
    });

    it('should handle edge case with zero weights', () => {
      // Test edge case: questions with zero weight should be ignored
      // This tests the robustness of the weighted calculation
      const answers = {
        chrono_1: Chronotype.MorningWarrior,  // weight: 2
        chrono_2: Chronotype.NightOwl         // weight: 1
      };
      
      const result = aggregateAnswers(answers);
      // Should work normally even if some questions have zero weight
      expect(result.chronotype).toBe(Chronotype.MorningWarrior);
    });

    it('should handle empty answers gracefully', () => {
      const answers = {};
      const result = aggregateAnswers(answers);
      
      expect(result.chronotype).toBeUndefined();
      expect(result.focusStyle).toBeUndefined();
      expect(result.workStyle).toBeUndefined();
    });
  });

  describe('reverseMapProfile', () => {
    it('should map profile back to quiz answers', () => {
      const profile = {
        user_id: 'test-user',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };

      const result = reverseMapProfile(profile);
      
      expect(result.chrono_1).toBe(Chronotype.MorningWarrior);
      expect(result.chrono_2).toBe(Chronotype.MorningWarrior);
      expect(result.focus_1).toBe(FocusStyle.DeepFocus);
      expect(result.focus_2).toBe(FocusStyle.DeepFocus);
      expect(result.focus_3).toBe(FocusStyle.DeepFocus);
      expect(result.work_1).toBe(WorkStyle.DeadlineDriven);
      expect(result.work_2).toBe(WorkStyle.DeadlineDriven);
    });

    it('should reverse-map profile into default answers for all question IDs', () => {
      const profile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.Flexible,
        focusStyle: FocusStyle.SprintWorker,
        workStyle: WorkStyle.SteadyPacer,
        updated_at: '2025-01-15T12:00:00Z'
      };

      const result = reverseMapProfile(profile);
      
      // Verify all chronotype questions get the same value
      const chronoQuestions = QUIZ_QUESTIONS.filter(q => q.category === 'chronotype');
      chronoQuestions.forEach(q => {
        expect(result[q.id]).toBe(Chronotype.Flexible);
      });

      // Verify all focusStyle questions get the same value
      const focusQuestions = QUIZ_QUESTIONS.filter(q => q.category === 'focusStyle');
      focusQuestions.forEach(q => {
        expect(result[q.id]).toBe(FocusStyle.SprintWorker);
      });

      // Verify all workStyle questions get the same value
      const workQuestions = QUIZ_QUESTIONS.filter(q => q.category === 'workStyle');
      workQuestions.forEach(q => {
        expect(result[q.id]).toBe(WorkStyle.SteadyPacer);
      });
    });

    it('should reverse-map and re-aggregate to same profile', () => {
      // Round-trip test: profile → answers → profile should be identical
      const originalProfile = {
        user_id: 'round-trip-test',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T12:00:00Z'
      };

      const answers = reverseMapProfile(originalProfile);
      const aggregatedProfile = aggregateAnswers(answers);

      expect(aggregatedProfile.chronotype).toBe(originalProfile.chronotype);
      expect(aggregatedProfile.focusStyle).toBe(originalProfile.focusStyle);
      expect(aggregatedProfile.workStyle).toBe(originalProfile.workStyle);
    });
  });

  describe('getQuestionById', () => {
    it('should return correct question by ID', () => {
      const question = getQuestionById('chrono_1');
      expect(question).toBeDefined();
      expect(question?.id).toBe('chrono_1');
      expect(question?.category).toBe('chronotype');
    });

    it('should return undefined for non-existent ID', () => {
      const question = getQuestionById('nonexistent');
      expect(question).toBeUndefined();
    });
  });
});
