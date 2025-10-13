import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudyProfileQuiz } from '../StudyProfileQuiz';
import { Chronotype, FocusStyle, WorkStyle } from '../../../lib/types';
import { renderWithProviders, createMockUser, createMockTokens } from '../../../test/utils/test-utils';
import { saveStudyProfile } from '../../../lib/api-study-profile';

// Mock API functions
jest.mock('../../../lib/api-study-profile');
const mockedSaveStudyProfile = saveStudyProfile as jest.MockedFunction<typeof saveStudyProfile>;

// Mock navigation
const mockNavigate = jest.fn();

// Mock AuthContext
const mockUpdateUserProfile = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    updateUserProfile: mockUpdateUserProfile,
    user: createMockUser({ hasStudyProfile: false })
  })
}));

describe('StudyProfileQuiz - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Quiz Flow', () => {
    it('should complete quiz and update AuthContext', async () => {
      const mockProfile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedSaveStudyProfile.mockResolvedValue(mockProfile);
      
      jest.mocked(require('../../auth/AuthContext').useAuth).mockReturnValue({
        updateUserProfile: mockUpdateUserProfile,
        user: createMockUser({ hasStudyProfile: false })
      });

      const { getByText } = renderWithProviders(
        <StudyProfileQuiz onNavigate={mockNavigate} />
      );

      // Step 1: Welcome screen
      expect(getByText(/Khám phá phong cách học tập/i)).toBeInTheDocument();
      
      // Start quiz
      fireEvent.click(getByText(/Bắt đầu/i));

      // Step 2: Answer all questions using role selectors
      // Question 1: Chronotype
      const chrono1Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Morning') || btn.textContent?.includes('Evening') || btn.textContent?.includes('Flexible')
      );
      fireEvent.click(chrono1Options[0]); // First option
      fireEvent.click(getByText(/Tiếp theo/i));

      // Question 2: Chronotype
      const chrono2Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Early') || btn.textContent?.includes('Late') || btn.textContent?.includes('Variable')
      );
      fireEvent.click(chrono2Options[0]); // First option
      fireEvent.click(getByText(/Tiếp theo/i));

      // Question 3: Focus Style
      const focus1Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Deep') || btn.textContent?.includes('Sprint') || btn.textContent?.includes('Multitask')
      );
      fireEvent.click(focus1Options[0]); // First option
      fireEvent.click(getByText(/Tiếp theo/i));

      // Question 4: Focus Style
      const focus2Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Plan') || btn.textContent?.includes('Improvise') || btn.textContent?.includes('Multitask')
      );
      fireEvent.click(focus2Options[0]); // First option
      fireEvent.click(getByText(/Tiếp theo/i));

      // Question 5: Focus Style
      const focus3Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Quiet') || btn.textContent?.includes('Collaborative') || btn.textContent?.includes('Anywhere')
      );
      fireEvent.click(focus3Options[0]); // First option
      fireEvent.click(getByText(/Tiếp theo/i));

      // Question 6: Work Style
      const work1Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Deadline') || btn.textContent?.includes('Steady')
      );
      fireEvent.click(work1Options[0]); // First option
      fireEvent.click(getByText(/Tiếp theo/i));

      // Question 7: Work Style (last question)
      const work2Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Structured') || btn.textContent?.includes('Spontaneous')
      );
      fireEvent.click(work2Options[0]); // First option
      fireEvent.click(getByText(/Hoàn thành/i));

      // Wait: For API call to complete
      await waitFor(() => {
        expect(mockUpdateUserProfile).toHaveBeenCalledWith({ hasStudyProfile: true });
      });

      // Verify: Success screen
      await waitFor(() => {
        expect(getByText(/Hoàn thành/i)).toBeInTheDocument();
      });

      // Verify: Navigation to return URL
      fireEvent.click(getByText(/Bắt đầu sử dụng/i));
      expect(mockNavigate).toHaveBeenCalledWith('/today');
    });

    it('should pre-fill answers when editing existing profile', async () => {
      const existingProfile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };

      const { getByText } = renderWithProviders(
        <StudyProfileQuiz 
          onNavigate={mockNavigate} 
          existingProfile={existingProfile}
        />
      );

      // Verify: First question has pre-selected answer
      await waitFor(() => {
        const selectedOptions = screen.getAllByRole('button').filter(btn => 
          btn.classList.contains('selected') || btn.classList.contains('bg-blue-500')
        );
        expect(selectedOptions.length).toBeGreaterThan(0);
      });
    });

    it('should handle network error with retry', async () => {
      const error = new Error('Network error');
      mockedSaveStudyProfile.mockRejectedValueOnce(error);

      const { getByText, queryByText } = renderWithProviders(
        <StudyProfileQuiz onNavigate={mockNavigate} />
      );

      // Complete quiz quickly
      fireEvent.click(getByText(/Bắt đầu/i));
      
      // Answer first question
      const chrono1Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Morning') || btn.textContent?.includes('Evening') || btn.textContent?.includes('Flexible')
      );
      fireEvent.click(chrono1Options[0]);
      fireEvent.click(getByText(/Tiếp theo/i));
      
      // Answer second question
      const chrono2Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Early') || btn.textContent?.includes('Late') || btn.textContent?.includes('Variable')
      );
      fireEvent.click(chrono2Options[0]);
      fireEvent.click(getByText(/Tiếp theo/i));
      
      // Answer third question
      const focus1Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Deep') || btn.textContent?.includes('Sprint') || btn.textContent?.includes('Multitask')
      );
      fireEvent.click(focus1Options[0]);
      fireEvent.click(getByText(/Tiếp theo/i));
      
      // Answer fourth question
      const focus2Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Plan') || btn.textContent?.includes('Improvise') || btn.textContent?.includes('Multitask')
      );
      fireEvent.click(focus2Options[0]);
      fireEvent.click(getByText(/Tiếp theo/i));
      
      // Answer fifth question
      const focus3Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Quiet') || btn.textContent?.includes('Collaborative') || btn.textContent?.includes('Anywhere')
      );
      fireEvent.click(focus3Options[0]);
      fireEvent.click(getByText(/Tiếp theo/i));
      
      // Answer sixth question
      const work1Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Deadline') || btn.textContent?.includes('Steady')
      );
      fireEvent.click(work1Options[0]);
      fireEvent.click(getByText(/Tiếp theo/i));
      
      // Answer seventh question and submit
      const work2Options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Structured') || btn.textContent?.includes('Spontaneous')
      );
      fireEvent.click(work2Options[0]);
      fireEvent.click(getByText(/Hoàn thành/i));

      // Wait: For error message
      await waitFor(() => {
        expect(queryByText(/lỗi xảy ra/i)).toBeInTheDocument();
      });

      // Retry: Mock success
      mockedSaveStudyProfile.mockResolvedValueOnce({
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      });

      fireEvent.click(getByText(/Thử lại/i));

      // Verify: Success after retry
      await waitFor(() => {
        expect(queryByText(/Hoàn thành/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Return URL', () => {
    it('should preserve return URL from query params', async () => {
      const mockProfile = {
        user_id: 'test-user-123',
        chronotype: Chronotype.MorningWarrior,
        focusStyle: FocusStyle.DeepFocus,
        workStyle: WorkStyle.DeadlineDriven,
        updated_at: '2025-01-15T10:30:00Z'
      };
      mockedSaveStudyProfile.mockResolvedValue(mockProfile);

      const { getByText } = renderWithProviders(
        <StudyProfileQuiz onNavigate={mockNavigate} />,
        { initialEntries: ['/study-profile/quiz?return=/dashboard'] }
      );

      // Complete quiz quickly
      fireEvent.click(getByText(/Bắt đầu/i));
      
      // Answer all questions quickly
      for (let i = 0; i < 7; i++) {
        const allButtons = screen.getAllByRole('button');
        const optionButtons = allButtons.filter(btn => 
          btn.textContent && !btn.textContent.includes('Tiếp theo') && !btn.textContent.includes('Hoàn thành') && !btn.textContent.includes('Bắt đầu')
        );
        
        if (optionButtons.length > 0) {
          fireEvent.click(optionButtons[0]);
        }
        
        if (i < 6) {
          fireEvent.click(getByText(/Tiếp theo/i));
        } else {
          fireEvent.click(getByText(/Hoàn thành/i));
        }
      }

      // Wait for completion
      await waitFor(() => {
        expect(getByText(/Hoàn thành/i)).toBeInTheDocument();
      });

      // Click complete button
      fireEvent.click(getByText(/Bắt đầu sử dụng/i));

      // Verify: Navigate to return URL
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
