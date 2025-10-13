import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizQuestion } from '../QuizQuestion';
import { Chronotype, FocusStyle, WorkStyle } from '../../../../lib/types';

describe('QuizQuestion', () => {
  const mockQuestion = {
    id: 'chronotype_1',
    category: 'chronotype' as const,
    questionKey: 'chronotype_1',
    options: [
      { value: Chronotype.MorningWarrior, labelKey: 'Morning Warrior' },
      { value: Chronotype.NightOwl, labelKey: 'Night Owl' },
      { value: Chronotype.Flexible, labelKey: 'Flexible' }
    ]
  };

  const mockProps = {
    question: mockQuestion,
    selectedValue: null,
    onAnswer: jest.fn(),
    getQuestionText: jest.fn((key: string) => `Question: ${key}`),
    getOptionText: jest.fn((key: string) => `Option: ${key}`)
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render question and options', () => {
    render(<QuizQuestion {...mockProps} />);
    
    expect(screen.getByText('Question: chronotype_1')).toBeInTheDocument();
    expect(screen.getByText('Option: Morning Warrior')).toBeInTheDocument();
    expect(screen.getByText('Option: Night Owl')).toBeInTheDocument();
    expect(screen.getByText('Option: Flexible')).toBeInTheDocument();
  });

  it('should call onAnswer when option is clicked', () => {
    render(<QuizQuestion {...mockProps} />);
    
    const morningOption = screen.getByText('Option: Morning Warrior');
    fireEvent.click(morningOption);
    
    expect(mockProps.onAnswer).toHaveBeenCalledWith(Chronotype.MorningWarrior);
  });

  it('should show selected option', () => {
    render(<QuizQuestion {...mockProps} selectedValue={Chronotype.NightOwl} />);
    
    const nightOption = screen.getByText('Option: Night Owl');
    expect(nightOption).toHaveAttribute('data-selected', 'true');
  });

  it('should handle different question categories', () => {
    const focusQuestion = {
      ...mockQuestion,
      id: 'focusStyle_1',
      category: 'focusStyle' as const,
      questionKey: 'focusStyle_1',
      options: [
        { value: FocusStyle.DeepFocus, labelKey: 'Deep Focus' },
        { value: FocusStyle.SprintWorker, labelKey: 'Sprint Worker' }
      ]
    };

    render(<QuizQuestion {...mockProps} question={focusQuestion} />);
    
    expect(screen.getByText('Question: focusStyle_1')).toBeInTheDocument();
    expect(screen.getByText('Option: Deep Focus')).toBeInTheDocument();
  });

  it('should handle workStyle questions (only 2 options)', () => {
    const workQuestion = {
      ...mockQuestion,
      id: 'workStyle_1',
      category: 'workStyle' as const,
      questionKey: 'workStyle_1',
      options: [
        { value: WorkStyle.DeadlineDriven, labelKey: 'Deadline Driven' },
        { value: WorkStyle.SteadyPacer, labelKey: 'Steady Pacer' }
      ]
    };

    render(<QuizQuestion {...mockProps} question={workQuestion} />);
    
    expect(screen.getByText('Question: workStyle_1')).toBeInTheDocument();
    expect(screen.getByText('Option: Deadline Driven')).toBeInTheDocument();
    expect(screen.getByText('Option: Steady Pacer')).toBeInTheDocument();
  });
});
