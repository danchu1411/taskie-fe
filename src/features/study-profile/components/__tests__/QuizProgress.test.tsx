import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizProgress } from '../QuizProgress';

describe('QuizProgress', () => {
  it('should render progress correctly', () => {
    render(<QuizProgress currentStep={2} totalSteps={6} />);
    
    expect(screen.getByText('2 / 6')).toBeInTheDocument();
  });

  it('should show correct progress percentage', () => {
    render(<QuizProgress currentStep={3} totalSteps={6} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should handle edge cases', () => {
    // Test first step
    render(<QuizProgress currentStep={1} totalSteps={6} />);
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    
    // Test last step
    render(<QuizProgress currentStep={6} totalSteps={6} />);
    expect(screen.getByText('6 / 6')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<QuizProgress currentStep={2} totalSteps={6} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Quiz Progress');
  });
});
