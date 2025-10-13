# Study Profile Quiz Unit Tests

## Test Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/features/study-profile/**/*.{js,jsx,ts,tsx}',
    'src/lib/api-study-profile.ts',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ]
};
```

### Test Setup File
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { QueryClient } from '@tanstack/react-query';

// Mock API
jest.mock('../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/study-profile/quiz',
    search: '',
    hash: '',
    state: null,
    key: 'test'
  }),
  useNavigate: () => jest.fn()
}));

// Create test query client
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

// Test utilities
export const createMockProfile = (overrides = {}) => ({
  user_id: 'test-user',
  chronotype: 0,
  focusStyle: 1,
  workStyle: 0,
  updated_at: '2025-01-15T10:30:00Z',
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  hasStudyProfile: false,
  ...overrides
});
```

---

## 1. Quiz Logic Tests

### Test Suite 1: Quiz Questions & Aggregation
```typescript
// src/features/study-profile/utils/__tests__/quizQuestions.test.ts
import { 
  QUIZ_QUESTIONS, 
  aggregateAnswers, 
  reverseMapProfile, 
  validateAnswers,
  getQuestionText,
  getOptionText
} from '../quizQuestions';
import { Chronotype, FocusStyle, WorkStyle } from '../../../../lib/types';

describe('Quiz Questions', () => {
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

    it('should have valid option values', () => {
      QUIZ_QUESTIONS.forEach(question => {
        question.options.forEach(option => {
          expect(typeof option.value).toBe('number');
          expect(option.value).toBeGreaterThanOrEqual(0);
          expect(option.value).toBeLessThanOrEqual(2);
        });
      });
    });

    it('should have workStyle options limited to 0-1', () => {
      const workQuestions = QUIZ_QUESTIONS.filter(q => q.category === 'workStyle');
      workQuestions.forEach(question => {
        question.options.forEach(option => {
          expect(option.value).toBeLessThanOrEqual(1);
        });
      });
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

    it('should handle tie votes by choosing first occurrence', () => {
      const answers = {
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.NightOwl,
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.SprintWorker,
        focus_3: FocusStyle.Multitasker,
        work_1: WorkStyle.DeadlineDriven,
        work_2: WorkStyle.SteadyPacer
      };

      const result = aggregateAnswers(answers);
      // Should return first value when tied
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
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
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
  });

  describe('validateAnswers', () => {
    it('should return valid for complete answers', () => {
      const answers = {
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.MorningWarrior,
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.SprintWorker,
        focus_3: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven,
        work_2: WorkStyle.DeadlineDriven
      };

      const result = validateAnswers(answers);
      expect(result.isValid).toBe(true);
      expect(result.missingQuestions).toHaveLength(0);
    });

    it('should return invalid for incomplete answers', () => {
      const answers = {
        chrono_1: Chronotype.MorningWarrior,
        // Missing other questions
      };

      const result = validateAnswers(answers);
      expect(result.isValid).toBe(false);
      expect(result.missingQuestions.length).toBeGreaterThan(0);
    });

    it('should identify specific missing questions', () => {
      const answers = {
        chrono_1: Chronotype.MorningWarrior,
        focus_1: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven
      };

      const result = validateAnswers(answers);
      expect(result.missingQuestions).toContain('chrono_2');
      expect(result.missingQuestions).toContain('focus_2');
      expect(result.missingQuestions).toContain('focus_3');
      expect(result.missingQuestions).toContain('work_2');
    });
  });

  describe('getQuestionText', () => {
    it('should return localized question text', () => {
      const text = getQuestionText('chrono_1', 'vi');
      expect(text).toBe('Khi nào bạn cảm thấy năng suất nhất?');
    });

    it('should return question ID if text not found', () => {
      const text = getQuestionText('nonexistent_question', 'vi');
      expect(text).toBe('nonexistent_question');
    });
  });

  describe('getOptionText', () => {
    it('should return localized option text', () => {
      const text = getOptionText('options.chrono_morning', 'vi');
      expect(text).toBe('Buổi sáng (6h-12h)');
    });

    it('should return labelKey if text not found', () => {
      const text = getOptionText('nonexistent_option', 'vi');
      expect(text).toBe('nonexistent_option');
    });
  });
});
```

---

## 2. API Client Tests

### Test Suite 2: API Client Functions
```typescript
// src/lib/__tests__/api-study-profile.test.ts
import { getStudyProfile, saveStudyProfile } from '../api-study-profile';
import api from '../api';
import { Chronotype, FocusStyle, WorkStyle } from '../types';

// Mock the api module
jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Study Profile API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudyProfile', () => {
    it('should return profile data on success', async () => {
      // Arrange
      const mockProfile = {
        user_id: 'test-user',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedApi.get.mockResolvedValue({ data: mockProfile });

      // Act
      const result = await getStudyProfile();

      // Assert
      expect(result).toEqual(mockProfile);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/study-profile');
      expect(mockedApi.get).toHaveBeenCalledTimes(1);
    });

    it('should return null on 404', async () => {
      // Arrange
      const error = { response: { status: 404 } };
      mockedApi.get.mockRejectedValue(error);

      // Act
      const result = await getStudyProfile();

      // Assert
      expect(result).toBeNull();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/study-profile');
    });

    it('should throw error on other failures', async () => {
      // Arrange
      const error = { response: { status: 500, data: { error: 'Server error' } } };
      mockedApi.get.mockRejectedValue(error);

      // Act & Assert
      await expect(getStudyProfile()).rejects.toEqual(error);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/study-profile');
    });

    it('should throw error on network failure', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedApi.get.mockRejectedValue(error);

      // Act & Assert
      await expect(getStudyProfile()).rejects.toThrow('Network error');
    });
  });

  describe('saveStudyProfile', () => {
    it('should save profile data successfully', async () => {
      // Arrange
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };
      const mockResponse = {
        user_id: 'test-user',
        ...profileData,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedApi.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await saveStudyProfile(profileData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/study-profile', profileData);
      expect(mockedApi.post).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: 2 // Invalid workStyle
      };
      const error = {
        response: {
          status: 400,
          data: { error: 'Validation failed', details: { workStyle: 'Must be 0 or 1' } }
        }
      };
      mockedApi.post.mockRejectedValue(error);

      // Act & Assert
      await expect(saveStudyProfile(profileData)).rejects.toEqual(error);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/study-profile', profileData);
    });

    it('should handle server errors', async () => {
      // Arrange
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };
      mockedApi.post.mockRejectedValue(error);

      // Act & Assert
      await expect(saveStudyProfile(profileData)).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      // Arrange
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };
      const error = new Error('Network timeout');
      mockedApi.post.mockRejectedValue(error);

      // Act & Assert
      await expect(saveStudyProfile(profileData)).rejects.toThrow('Network timeout');
    });
  });
});
```

---

## 3. React Hook Tests

### Test Suite 3: useStudyProfileQuiz Hook
```typescript
// src/features/study-profile/hooks/__tests__/useStudyProfileQuiz.test.ts
import { renderHook, act } from '@testing-library/react';
import { useStudyProfileQuiz } from '../useStudyProfileQuiz';
import { Chronotype, FocusStyle, WorkStyle } from '../../../../lib/types';

// Mock the useStudyProfileData hook
jest.mock('../useStudyProfileData', () => ({
  useStudyProfileData: () => ({
    saveProfile: jest.fn(),
    isSaving: false,
    saveError: null
  })
}));

describe('useStudyProfileQuiz', () => {
  const mockSaveProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useStudyProfileData
    require('../useStudyProfileData').useStudyProfileData.mockReturnValue({
      saveProfile: mockSaveProfile,
      isSaving: false,
      saveError: null
    });
  });

  describe('initialization', () => {
    it('should initialize with empty answers for new user', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      expect(result.current.currentStep).toBe(0);
      expect(result.current.answers).toEqual({});
      expect(result.current.progress).toBeCloseTo(14.29, 2); // 1/7 * 100
      expect(result.current.isComplete).toBe(false);
    });

    it('should initialize with pre-filled answers for existing profile', () => {
      const existingProfile = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };

      const { result } = renderHook(() => useStudyProfileQuiz(existingProfile));

      expect(result.current.answers).toEqual({
        chrono_1: Chronotype.MorningWarrior,
        chrono_2: Chronotype.MorningWarrior,
        focus_1: FocusStyle.DeepFocus,
        focus_2: FocusStyle.DeepFocus,
        focus_3: FocusStyle.DeepFocus,
        work_1: WorkStyle.DeadlineDriven,
        work_2: WorkStyle.DeadlineDriven
      });
    });
  });

  describe('answer management', () => {
    it('should set answer correctly', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      act(() => {
        result.current.setAnswer('chrono_1', Chronotype.MorningWarrior);
      });

      expect(result.current.answers.chrono_1).toBe(Chronotype.MorningWarrior);
    });

    it('should update existing answer', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      act(() => {
        result.current.setAnswer('chrono_1', Chronotype.MorningWarrior);
      });

      act(() => {
        result.current.setAnswer('chrono_1', Chronotype.NightOwl);
      });

      expect(result.current.answers.chrono_1).toBe(Chronotype.NightOwl);
    });
  });

  describe('navigation', () => {
    it('should navigate to next step', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      expect(result.current.currentStep).toBe(0);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not go below step 0', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should not go beyond last step', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      // Navigate to last step
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.nextStep();
        });
      }

      expect(result.current.currentStep).toBe(6); // Last step (0-indexed)
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress correctly', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      expect(result.current.progress).toBeCloseTo(14.29, 2); // 1/7 * 100

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.progress).toBeCloseTo(28.57, 2); // 2/7 * 100
    });

    it('should mark as complete on last step', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      // Navigate to last step
      for (let i = 0; i < 6; i++) {
        act(() => {
          result.current.nextStep();
        });
      }

      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate complete answers', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      // Set all answers
      act(() => {
        result.current.setAnswer('chrono_1', Chronotype.MorningWarrior);
        result.current.setAnswer('chrono_2', Chronotype.MorningWarrior);
        result.current.setAnswer('focus_1', FocusStyle.DeepFocus);
        result.current.setAnswer('focus_2', FocusStyle.DeepFocus);
        result.current.setAnswer('focus_3', FocusStyle.DeepFocus);
        result.current.setAnswer('work_1', WorkStyle.DeadlineDriven);
        result.current.setAnswer('work_2', WorkStyle.DeadlineDriven);
      });

      expect(result.current.validation.isValid).toBe(true);
      expect(result.current.validation.missingQuestions).toHaveLength(0);
    });

    it('should validate incomplete answers', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      // Set only some answers
      act(() => {
        result.current.setAnswer('chrono_1', Chronotype.MorningWarrior);
        result.current.setAnswer('focus_1', FocusStyle.DeepFocus);
      });

      expect(result.current.validation.isValid).toBe(false);
      expect(result.current.validation.missingQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('quiz submission', () => {
    it('should submit quiz with valid answers', async () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      // Set all answers
      act(() => {
        result.current.setAnswer('chrono_1', Chronotype.MorningWarrior);
        result.current.setAnswer('chrono_2', Chronotype.MorningWarrior);
        result.current.setAnswer('focus_1', FocusStyle.DeepFocus);
        result.current.setAnswer('focus_2', FocusStyle.DeepFocus);
        result.current.setAnswer('focus_3', FocusStyle.DeepFocus);
        result.current.setAnswer('work_1', WorkStyle.DeadlineDriven);
        result.current.setAnswer('work_2', WorkStyle.DeadlineDriven);
      });

      await act(async () => {
        await result.current.submitQuiz();
      });

      expect(mockSaveProfile).toHaveBeenCalledWith({
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      });
    });

    it('should throw error for invalid answers', async () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      await expect(async () => {
        await act(async () => {
          await result.current.submitQuiz();
        });
      }).rejects.toThrow('Please complete all questions before submitting');
    });
  });

  describe('quiz reset', () => {
    it('should reset quiz to initial state', () => {
      const { result } = renderHook(() => useStudyProfileQuiz());

      // Set some answers and navigate
      act(() => {
        result.current.setAnswer('chrono_1', Chronotype.MorningWarrior);
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);
      expect(result.current.answers.chrono_1).toBe(Chronotype.MorningWarrior);

      act(() => {
        result.current.resetQuiz();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.answers).toEqual({});
    });

    it('should reset with existing profile data', () => {
      const existingProfile = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };

      const { result } = renderHook(() => useStudyProfileQuiz(existingProfile));

      // Navigate and modify answers
      act(() => {
        result.current.nextStep();
        result.current.setAnswer('chrono_1', Chronotype.NightOwl);
      });

      act(() => {
        result.current.resetQuiz();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.answers.chrono_1).toBe(Chronotype.MorningWarrior);
    });
  });
});
```

### Test Suite 4: useStudyProfileData Hook
```typescript
// src/features/study-profile/hooks/__tests__/useStudyProfileData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudyProfileData } from '../useStudyProfileData';
import { getStudyProfile, saveStudyProfile } from '../../../../lib/api-study-profile';
import { Chronotype, FocusStyle, WorkStyle } from '../../../../lib/types';

// Mock the API functions
jest.mock('../../../../lib/api-study-profile');
const mockedGetStudyProfile = getStudyProfile as jest.MockedFunction<typeof getStudyProfile>;
const mockedSaveStudyProfile = saveStudyProfile as jest.MockedFunction<typeof saveStudyProfile>;

// Mock AuthContext
const mockAuthContext = {
  setAuthState: jest.fn(),
  user: { id: 'test-user', hasStudyProfile: true },
  authState: { user: { id: 'test-user' }, tokens: { accessToken: 'token' } }
};

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

describe('useStudyProfileData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('profile fetching', () => {
    it('should fetch profile data successfully', async () => {
      // Arrange
      const mockProfile = {
        user_id: 'test-user',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedGetStudyProfile.mockResolvedValue(mockProfile);

      // Act
      const { result } = renderHook(() => useStudyProfileData(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle profile not found', async () => {
      // Arrange
      mockedGetStudyProfile.mockResolvedValue(null);

      // Act
      const { result } = renderHook(() => useStudyProfileData(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.profile).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle fetch error', async () => {
      // Arrange
      const error = new Error('Fetch failed');
      mockedGetStudyProfile.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useStudyProfileData(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.profile).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toEqual(error);
      });
    });

    it('should not fetch when user has no study profile', () => {
      // Arrange
      const userWithoutProfile = { ...mockAuthContext.user, hasStudyProfile: false };
      jest.mocked(require('../../../auth/AuthContext').useAuth).mockReturnValue({
        ...mockAuthContext,
        user: userWithoutProfile
      });

      // Act
      renderHook(() => useStudyProfileData(), { wrapper });

      // Assert
      expect(mockedGetStudyProfile).not.toHaveBeenCalled();
    });
  });

  describe('profile saving', () => {
    it('should save profile successfully', async () => {
      // Arrange
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };
      const savedProfile = {
        user_id: 'test-user',
        ...profileData,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedSaveStudyProfile.mockResolvedValue(savedProfile);

      // Act
      const { result } = renderHook(() => useStudyProfileData(), { wrapper });

      await waitFor(() => {
        result.current.saveProfile(profileData);
      });

      // Assert
      await waitFor(() => {
        expect(mockedSaveStudyProfile).toHaveBeenCalledWith(profileData);
        expect(mockAuthContext.setAuthState).toHaveBeenCalledWith({
          user: { ...mockAuthContext.user, hasStudyProfile: true },
          tokens: mockAuthContext.authState.tokens
        });
      });
    });

    it('should handle save error', async () => {
      // Arrange
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };
      const error = new Error('Save failed');
      mockedSaveStudyProfile.mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useStudyProfileData(), { wrapper });

      await waitFor(() => {
        result.current.saveProfile(profileData);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.saveError).toEqual(error);
        expect(result.current.isSaving).toBe(false);
      });
    });
  });
});
```

---

## 4. Component Tests

### Test Suite 5: Quiz Components
```typescript
// src/features/study-profile/components/__tests__/QuizProgress.test.tsx
import { render, screen } from '@testing-library/react';
import { QuizProgress } from '../QuizProgress';

describe('QuizProgress', () => {
  it('should render progress correctly', () => {
    render(
      <QuizProgress
        progress={42.5}
        currentStep={2}
        totalQuestions={7}
      />
    );

    expect(screen.getByText('Câu hỏi 3 / 7')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();
  });

  it('should display correct progress bar width', () => {
    render(
      <QuizProgress
        progress={75}
        currentStep={5}
        totalQuestions={7}
      />
    );

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle('width: 75%');
  });

  it('should handle edge cases', () => {
    render(
      <QuizProgress
        progress={0}
        currentStep={0}
        totalQuestions={7}
      />
    );

    expect(screen.getByText('Câu hỏi 1 / 7')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
```

```typescript
// src/features/study-profile/components/__tests__/QuizQuestion.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizQuestionCard } from '../QuizQuestion';
import { QUIZ_QUESTIONS } from '../../utils/quizQuestions';

describe('QuizQuestionCard', () => {
  const mockQuestion = QUIZ_QUESTIONS[0];
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render question and options', () => {
    render(
      <QuizQuestionCard
        question={mockQuestion}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Khi nào bạn cảm thấy năng suất nhất?')).toBeInTheDocument();
    expect(screen.getByText('Buổi sáng (6h-12h)')).toBeInTheDocument();
    expect(screen.getByText('Buổi tối (18h-24h)')).toBeInTheDocument();
    expect(screen.getByText('Linh hoạt theo ngày')).toBeInTheDocument();
  });

  it('should call onSelect when option is clicked', () => {
    render(
      <QuizQuestionCard
        question={mockQuestion}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Buổi sáng (6h-12h)'));
    expect(mockOnSelect).toHaveBeenCalledWith(0);
  });

  it('should highlight selected option', () => {
    render(
      <QuizQuestionCard
        question={mockQuestion}
        selectedValue={0}
        onSelect={mockOnSelect}
      />
    );

    const selectedOption = screen.getByText('Buổi sáng (6h-12h)').closest('button');
    expect(selectedOption).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('should display icons correctly', () => {
    render(
      <QuizQuestionCard
        question={mockQuestion}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('🌅')).toBeInTheDocument();
    expect(screen.getByText('🌙')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();
  });
});
```

```typescript
// src/features/study-profile/components/__tests__/QuizNavigation.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizNavigation } from '../QuizNavigation';

describe('QuizNavigation', () => {
  const mockOnNext = jest.fn();
  const mockOnPrev = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render navigation buttons', () => {
    render(
      <QuizNavigation
        currentStep={2}
        totalQuestions={7}
        canGoNext={true}
        canGoPrev={true}
        isComplete={false}
        isSaving={false}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Quay lại')).toBeInTheDocument();
    expect(screen.getByText('Tiếp theo')).toBeInTheDocument();
  });

  it('should call onPrev when back button is clicked', () => {
    render(
      <QuizNavigation
        currentStep={2}
        totalQuestions={7}
        canGoNext={true}
        canGoPrev={true}
        isComplete={false}
        isSaving={false}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Quay lại'));
    expect(mockOnPrev).toHaveBeenCalled();
  });

  it('should call onNext when next button is clicked', () => {
    render(
      <QuizNavigation
        currentStep={2}
        totalQuestions={7}
        canGoNext={true}
        canGoPrev={true}
        isComplete={false}
        isSaving={false}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Tiếp theo'));
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('should show submit button when complete', () => {
    render(
      <QuizNavigation
        currentStep={6}
        totalQuestions={7}
        canGoNext={true}
        canGoPrev={true}
        isComplete={true}
        isSaving={false}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
  });

  it('should disable buttons when saving', () => {
    render(
      <QuizNavigation
        currentStep={2}
        totalQuestions={7}
        canGoNext={true}
        canGoPrev={true}
        isComplete={false}
        isSaving={true}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Quay lại')).toBeDisabled();
    expect(screen.getByText('Tiếp theo')).toBeDisabled();
  });

  it('should show loading state when saving', () => {
    render(
      <QuizNavigation
        currentStep={2}
        totalQuestions={7}
        canGoNext={true}
        canGoPrev={true}
        isComplete={false}
        isSaving={true}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Đang lưu...')).toBeInTheDocument();
  });
});
```

---

## 5. Integration Tests

### Test Suite 6: Component Integration
```typescript
// src/features/study-profile/__tests__/StudyProfileQuiz.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudyProfileQuiz } from '../StudyProfileQuiz';
import { Chronotype, FocusStyle, WorkStyle } from '../../../lib/types';

// Mock dependencies
jest.mock('../../../lib/api-study-profile');
jest.mock('../../auth/AuthContext');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/study-profile/quiz',
    search: '?return=/today',
    hash: '',
    state: null,
    key: 'test'
  }),
  useNavigate: () => mockNavigate
}));

describe('StudyProfileQuiz Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should complete full quiz flow', async () => {
    // Mock successful save
    const { saveStudyProfile } = require('../../../lib/api-study-profile');
    saveStudyProfile.mockResolvedValue({
      user_id: 'test-user',
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven,
      updated_at: '2025-01-15T10:30:00Z'
    });

    render(
      <StudyProfileQuiz onNavigate={mockNavigate} />,
      { wrapper }
    );

    // Should show welcome screen initially
    expect(screen.getByText('Khám phá phong cách học tập của bạn')).toBeInTheDocument();

    // Click start button
    fireEvent.click(screen.getByText('Bắt đầu'));

    // Should show first question
    await waitFor(() => {
      expect(screen.getByText('Khi nào bạn cảm thấy năng suất nhất?')).toBeInTheDocument();
    });

    // Answer first question
    fireEvent.click(screen.getByText('Buổi sáng (6h-12h)'));

    // Navigate through all questions
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText('Tiếp theo'));
      
      // Answer each question with first option
      const firstOption = screen.getAllByRole('button')[0];
      fireEvent.click(firstOption);
    }

    // Should show submit button on last question
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();

    // Submit quiz
    fireEvent.click(screen.getByText('Hoàn thành'));

    // Should show success screen
    await waitFor(() => {
      expect(screen.getByText('Hoàn thành! 🎉')).toBeInTheDocument();
    });

    // Click complete button
    fireEvent.click(screen.getByText('Dùng thử AI Suggestions'));

    // Should navigate to return URL
    expect(mockNavigate).toHaveBeenCalledWith('/today');
  });

  it('should handle quiz with existing profile', async () => {
    const existingProfile = {
      user_id: 'test-user',
      chronotype: Chronotype.MorningWarrior,
      focusStyle: FocusStyle.DeepFocus,
      workStyle: WorkStyle.DeadlineDriven,
      updated_at: '2025-01-15T10:30:00Z'
    };

    render(
      <StudyProfileQuiz onNavigate={mockNavigate} existingProfile={existingProfile} />,
      { wrapper }
    );

    // Should skip welcome screen and go directly to quiz
    await waitFor(() => {
      expect(screen.getByText('Khi nào bạn cảm thấy năng suất nhất?')).toBeInTheDocument();
    });

    // First option should be pre-selected
    const firstOption = screen.getByText('Buổi sáng (6h-12h)').closest('button');
    expect(firstOption).toHaveClass('border-blue-500');
  });

  it('should handle save error', async () => {
    // Mock save error
    const { saveStudyProfile } = require('../../../lib/api-study-profile');
    saveStudyProfile.mockRejectedValue(new Error('Save failed'));

    render(
      <StudyProfileQuiz onNavigate={mockNavigate} />,
      { wrapper }
    );

    // Complete quiz flow
    fireEvent.click(screen.getByText('Bắt đầu'));

    await waitFor(() => {
      expect(screen.getByText('Khi nào bạn cảm thấy năng suất nhất?')).toBeInTheDocument();
    });

    // Answer all questions quickly
    for (let i = 0; i < 7; i++) {
      const firstOption = screen.getAllByRole('button')[0];
      fireEvent.click(firstOption);
      
      if (i < 6) {
        fireEvent.click(screen.getByText('Tiếp theo'));
      }
    }

    // Submit quiz
    fireEvent.click(screen.getByText('Hoàn thành'));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Có lỗi xảy ra khi lưu profile. Vui lòng thử lại.')).toBeInTheDocument();
    });
  });
});
```

---

## 6. Test Execution

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=quizQuestions
npm test -- --testPathPattern=api-study-profile
npm test -- --testPathPattern=useStudyProfileQuiz

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run integration tests only
npm test -- --testPathPattern=integration
```

### Test Coverage Goals
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

---

## Conclusion

Unit tests này cover toàn bộ Study Profile Quiz system với:

- **Quiz Logic**: Questions, aggregation, validation
- **API Client**: CRUD operations, error handling
- **React Hooks**: State management, data fetching
- **Components**: UI rendering, user interactions
- **Integration**: Complete user flows

Tests đảm bảo code quality và reliability của hệ thống trước khi deploy production.

---

**Test Coverage**: Comprehensive  
**Status**: Ready for execution  
**Next Steps**: Run tests và fix any failures
