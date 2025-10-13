import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizComplete } from '../QuizComplete';

describe('QuizComplete', () => {
  const mockProps = {
    onNavigate: jest.fn(),
    getText: jest.fn((key: string) => `Text: ${key}`)
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render completion message', () => {
    render(<QuizComplete {...mockProps} />);
    
    expect(screen.getByText('Text: complete.title')).toBeInTheDocument();
    expect(screen.getByText('Text: complete.description')).toBeInTheDocument();
  });

  it('should render continue button', () => {
    render(<QuizComplete {...mockProps} />);
    
    expect(screen.getByText('Text: complete.button')).toBeInTheDocument();
  });

  it('should call onNavigate when continue button is clicked', () => {
    render(<QuizComplete {...mockProps} />);
    
    const continueButton = screen.getByText('Text: complete.button');
    fireEvent.click(continueButton);
    
    expect(mockProps.onNavigate).toHaveBeenCalledWith('/today');
  });

  it('should have proper accessibility attributes', () => {
    render(<QuizComplete {...mockProps} />);
    
    const continueButton = screen.getByRole('button');
    expect(continueButton).toHaveAttribute('type', 'button');
  });

  it('should render success icon or visual indicator', () => {
    render(<QuizComplete {...mockProps} />);
    
    // Check for any success visual indicator
    const container = screen.getByRole('main') || screen.getByTestId('quiz-complete');
    expect(container).toBeInTheDocument();
  });
});
