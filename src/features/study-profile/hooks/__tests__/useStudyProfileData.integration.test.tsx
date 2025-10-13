import { renderHook, waitFor, act } from '@testing-library/react';
import { useStudyProfileData } from '../useStudyProfileData';
import { Chronotype, FocusStyle, WorkStyle } from '../../../../lib/types';
import { renderHookWithProviders, createMockUser, createMockTokens } from '../../../../test/utils/test-utils';
import { getStudyProfile, saveStudyProfile } from '../../../../lib/api-study-profile';

// Mock API functions
jest.mock('../../../../lib/api-study-profile');
const mockedGetStudyProfile = getStudyProfile as jest.MockedFunction<typeof getStudyProfile>;
const mockedSaveStudyProfile = saveStudyProfile as jest.MockedFunction<typeof saveStudyProfile>;

// Mock AuthContext
const mockUpdateUserProfile = jest.fn();
jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({
    updateUserProfile: mockUpdateUserProfile,
    user: createMockUser({ hasStudyProfile: true })
  })
}));

describe('useStudyProfileData - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Fetching', () => {
    it('should fetch profile successfully when hasStudyProfile=true', async () => {
      const mockProfile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedGetStudyProfile.mockResolvedValue(mockProfile);

      const { result } = renderHookWithProviders(() => useStudyProfileData());

      // Verify: Loading state initially
      expect(result.current.isLoading).toBe(true);

      // Wait: For query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Profile loaded
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
    });

    it('should skip fetch when hasStudyProfile=false', () => {
      // Mock user without profile
      jest.mocked(require('../../../auth/AuthContext').useAuth).mockReturnValue({
        updateUserProfile: mockUpdateUserProfile,
        user: createMockUser({ hasStudyProfile: false })
      });

      const { result } = renderHookWithProviders(() => useStudyProfileData());

      // Assert: Query disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.profile).toBeUndefined();
    });

    it('should handle 404 and return null', async () => {
      mockedGetStudyProfile.mockResolvedValue(null);

      const { result } = renderHookWithProviders(() => useStudyProfileData());

      await waitFor(() => {
        expect(result.current.profile).toBeNull();
      });
    });

    it('should handle server errors', async () => {
      const error = new Error('Server error');
      mockedGetStudyProfile.mockRejectedValue(error);

      const { result } = renderHookWithProviders(() => useStudyProfileData());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('Profile Saving', () => {
    it('should save profile and update cache', async () => {
      const mockProfile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedSaveStudyProfile.mockResolvedValue(mockProfile);

      const { result, queryClient } = renderHookWithProviders(() => useStudyProfileData());

      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };

      // Act: Save profile
      act(() => {
        result.current.saveProfile(profileData);
      });

      // Assert: Saving state
      expect(result.current.isSaving).toBe(true);

      // Wait: For mutation to complete
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });

      // Verify: Cache updated
      const cachedProfile = queryClient.getQueryData(['study-profile']);
      expect(cachedProfile).toMatchObject(profileData);
    });

    it('should update AuthContext hasStudyProfile on success', async () => {
      const mockProfile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedSaveStudyProfile.mockResolvedValue(mockProfile);
      
      jest.mocked(require('../../../auth/AuthContext').useAuth).mockReturnValue({
        updateUserProfile: mockUpdateUserProfile,
        user: createMockUser({ hasStudyProfile: false })
      });

      const { result } = renderHookWithProviders(() => useStudyProfileData());

      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven
      };

      // Act: Save profile
      await act(async () => {
        result.current.saveProfile(profileData);
      });

      // Wait for mutation
      await waitFor(() => {
        expect(mockUpdateUserProfile).toHaveBeenCalledWith({ hasStudyProfile: true });
      });
    });

    it('should handle validation errors', async () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Validation failed', details: { workStyle: 'Must be 0 or 1' } }
        }
      };
      mockedSaveStudyProfile.mockRejectedValue(error);

      const { result } = renderHookWithProviders(() => useStudyProfileData());

      const invalidData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: 2 as any // Invalid
      };

      // Act: Try to save invalid data
      await act(async () => {
        result.current.saveProfile(invalidData);
      });

      // Assert: Error captured
      await waitFor(() => {
        expect(result.current.saveError).toBeDefined();
        expect((result.current.saveError as any)?.response?.status).toBe(400);
      });
    });
  });

  describe('Cache Behavior', () => {
    it('should invalidate cache after successful save', async () => {
      const mockProfile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.NightOwl,
        focusStyle: FocusStyle.SprintWorker,
        workStyle: WorkStyle.SteadyPacer,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedSaveStudyProfile.mockResolvedValue(mockProfile);

      const { result, queryClient } = renderHookWithProviders(() => useStudyProfileData());

      // Setup: Set stale cache data
      queryClient.setQueryData(['study-profile'], { old: 'data' });

      const newProfileData = {
        chronotype: Chronotype.NightOwl,
        focusStyle: FocusStyle.SprintWorker,
        workStyle: WorkStyle.SteadyPacer
      };

      // Act: Save new profile
      await act(async () => {
        result.current.saveProfile(newProfileData);
      });

      // Wait: For mutation to complete
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });

      // Verify: Cache updated with new data
      const cachedProfile = queryClient.getQueryData(['study-profile']);
      expect(cachedProfile).toMatchObject(newProfileData);
    });

    it('should preserve cache on error', async () => {
      const error = new Error('Server error');
      mockedSaveStudyProfile.mockRejectedValue(error);

      const { result, queryClient } = renderHookWithProviders(() => useStudyProfileData());

      // Setup: Set existing cache
      const existingProfile = { 
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      queryClient.setQueryData(['study-profile'], existingProfile);

      // Act: Try to save (will fail)
      await act(async () => {
        result.current.saveProfile({
          chronotype: Chronotype.NightOwl,
          focusStyle: FocusStyle.SprintWorker,
          workStyle: WorkStyle.SteadyPacer
        });
      });

      // Wait: For error
      await waitFor(() => {
        expect(result.current.saveError).toBeDefined();
      });

      // Verify: Old cache preserved
      const cachedProfile = queryClient.getQueryData(['study-profile']);
      expect(cachedProfile).toEqual(existingProfile);
    });
  });
});
