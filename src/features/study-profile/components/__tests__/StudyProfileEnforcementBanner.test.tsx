import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudyProfileEnforcementBanner } from '../StudyProfileEnforcementBanner';

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../../features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock navigation
const mockNavigate = jest.fn();

describe('StudyProfileEnforcementBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when user has study profile', () => {
    mockUseAuth.mockReturnValue({
      user: { hasStudyProfile: true }
    });

    render(<StudyProfileEnforcementBanner />);
    
    expect(screen.queryByText(/hồ sơ học tập/i)).not.toBeInTheDocument();
  });

  it('should render banner when user lacks study profile', () => {
    mockUseAuth.mockReturnValue({
      user: { hasStudyProfile: false }
    });

    render(<StudyProfileEnforcementBanner />);
    
    expect(screen.getByText(/hồ sơ học tập/i)).toBeInTheDocument();
    expect(screen.getByText(/Hoàn thành ngay/i)).toBeInTheDocument();
  });

  it('should render banner when hasStudyProfile is undefined', () => {
    mockUseAuth.mockReturnValue({
      user: { hasStudyProfile: undefined }
    });

    render(<StudyProfileEnforcementBanner />);
    
    expect(screen.getByText(/hồ sơ học tập/i)).toBeInTheDocument();
  });

  it('should call onNavigate when complete button is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { hasStudyProfile: false }
    });

    render(<StudyProfileEnforcementBanner onNavigate={mockNavigate} />);
    
    const completeButton = screen.getByText(/Hoàn thành ngay/i);
    fireEvent.click(completeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/study-profile/quiz');
  });

  it('should handle missing onNavigate prop gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: { hasStudyProfile: false }
    });

    // Should not throw error when onNavigate is not provided
    expect(() => {
      render(<StudyProfileEnforcementBanner />);
    }).not.toThrow();
  });

  it('should have proper accessibility attributes', () => {
    mockUseAuth.mockReturnValue({
      user: { hasStudyProfile: false }
    });

    render(<StudyProfileEnforcementBanner />);
    
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should display correct Vietnamese text', () => {
    mockUseAuth.mockReturnValue({
      user: { hasStudyProfile: false }
    });

    render(<StudyProfileEnforcementBanner />);
    
    expect(screen.getByText(/Để nhận được gợi ý AI cá nhân hóa/i)).toBeInTheDocument();
    expect(screen.getByText(/Hoàn thành ngay/i)).toBeInTheDocument();
  });

  it('should handle user being null', () => {
    mockUseAuth.mockReturnValue({
      user: null
    });

    render(<StudyProfileEnforcementBanner />);
    
    expect(screen.getByText(/hồ sơ học tập/i)).toBeInTheDocument();
  });

  it('should handle user being undefined', () => {
    mockUseAuth.mockReturnValue({
      user: undefined
    });

    render(<StudyProfileEnforcementBanner />);
    
    expect(screen.getByText(/hồ sơ học tập/i)).toBeInTheDocument();
  });
});
