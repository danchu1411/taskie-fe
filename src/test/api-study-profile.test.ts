import { getStudyProfile, saveStudyProfile } from '../lib/api-study-profile';
import api from '../lib/api';
import { Chronotype, FocusStyle, WorkStyle } from '../lib/types';

// Mock the api module
jest.mock('../lib/api');
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
      expect(mockedApi.get).toHaveBeenCalledWith('/study-profile');
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
      expect(mockedApi.get).toHaveBeenCalledWith('/study-profile');
    });

    it('should throw error on other failures', async () => {
      // Arrange
      const error = { response: { status: 500, data: { error: 'Server error' } } };
      mockedApi.get.mockRejectedValue(error);

      // Act & Assert
      await expect(getStudyProfile()).rejects.toEqual(error);
      expect(mockedApi.get).toHaveBeenCalledWith('/study-profile');
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
      const savedProfile = {
        user_id: 'test-user',
        ...profileData,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedApi.post.mockResolvedValue({ data: savedProfile });

      // Act
      const result = await saveStudyProfile(profileData);

      // Assert
      expect(result).toEqual(savedProfile);
      expect(mockedApi.post).toHaveBeenCalledWith('/study-profile', profileData);
      expect(mockedApi.post).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const profileData = {
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: 2 as any // Invalid workStyle - cast to any to test validation
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
      expect(mockedApi.post).toHaveBeenCalledWith('/study-profile', profileData);
    });
  });
});
