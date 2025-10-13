import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizNavigation } from '../QuizNavigation';

describe('QuizNavigation', () => {
  const mockProps = {
    currentStep: 2,
    totalSteps: 6,
    canGoBack: true,
    canGoNext: true,
    isSubmitting: false,
    onBack: jest.fn(),
    onNext: jest.fn(),
    onSubmit: jest.fn(),
    getText: jest.fn((key: string) => `Text: ${key}`)
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render navigation buttons', () => {
    render(<QuizNavigation {...mockProps} />);
    
    expect(screen.getByText('Text: back')).toBeInTheDocument();
    expect(screen.getByText('Text: next')).toBeInTheDocument();
  });

  it('should disable back button when canGoBack is false', () => {
    render(<QuizNavigation {...mockProps} canGoBack={false} />);
    
    const backButton = screen.getByText('Text: back');
    expect(backButton).toBeDisabled();
  });

  it('should disable next button when canGoNext is false', () => {
    render(<QuizNavigation {...mockProps} canGoNext={false} />);
    
    const nextButton = screen.getByText('Text: next');
    expect(nextButton).toBeDisabled();
  });

  it('should call onBack when back button is clicked', () => {
    render(<QuizNavigation {...mockProps} />);
    
    const backButton = screen.getByText('Text: back');
    fireEvent.click(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('should call onNext when next button is clicked', () => {
    render(<QuizNavigation {...mockProps} />);
    
    const nextButton = screen.getByText('Text: next');
    fireEvent.click(nextButton);
    
    expect(mockProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('should show submit button on last step', () => {
    render(<QuizNavigation {...mockProps} currentStep={6} totalSteps={6} />);
    
    expect(screen.getByText('Text: submit')).toBeInTheDocument();
    expect(screen.queryByText('Text: next')).not.toBeInTheDocument();
  });

  it('should call onSubmit when submit button is clicked', () => {
    render(<QuizNavigation {...mockProps} currentStep={6} totalSteps={6} />);
    
    const submitButton = screen.getByText('Text: submit');
    fireEvent.click(submitButton);
    
    expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when submitting', () => {
    render(<QuizNavigation {...mockProps} isSubmitting={true} />);
    
    const nextButton = screen.getByText('Text: next');
    expect(nextButton).toBeDisabled();
  });

  it('should disable all buttons when submitting', () => {
    render(<QuizNavigation {...mockProps} isSubmitting={true} currentStep={6} totalSteps={6} />);
    
    const backButton = screen.getByText('Text: back');
    const submitButton = screen.getByText('Text: submit');
    
    expect(backButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
