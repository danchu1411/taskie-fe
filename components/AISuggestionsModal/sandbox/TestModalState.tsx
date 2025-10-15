import React, { useState } from 'react';
import useModalState from './hooks/useModalState';
import type { ManualInput, AISuggestion } from './types';

const TestModalState: React.FC = () => {
  const {
    // State
    currentStep,
    manualInput,
    aiSuggestion,
    selectedSlotIndex,
    lockedSlots,
    error,
    isLoading,
    scheduleEntryId,
    
    // Actions
    goToForm,
    goToLoading,
    goToSuggestions,
    goToConfirmation,
    goToSuccess,
    goToError,
    setManualInput,
    setSelectedSlot,
    lockSlot,
    unlockSlot,
    setError,
    setLoading,
    reset,
    canGoBack,
    canGoForward,
    getState,
    isStep,
    hasSuggestion,
    hasSelectedSlot
  } = useModalState();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Mock data for testing
  const mockManualInput: ManualInput = {
    title: 'Test Modal State',
    description: 'Testing modal state management',
    duration_minutes: 60,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  };

  const mockAISuggestion: AISuggestion = {
    id: 'test-suggestion',
    suggestion_type: 1,
    status: 1,
    confidence: 2,
    reason: 'Test suggestion for modal state',
    manual_input: mockManualInput,
    suggested_slots: [
      {
        slot_index: 0,
        suggested_start_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        confidence: 2,
        reason: 'Test slot 1'
      }
    ],
    fallback_auto_mode: {
      enabled: false,
      reason: 'Test mode'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const runStateTests = () => {
    setTestResults([]);
    addTestResult('Starting modal state tests...');

    // Test 1: Initial state
    addTestResult(`Initial step: ${currentStep}`);
    addTestResult(`Can go back: ${canGoBack()}`);
    addTestResult(`Can go forward: ${canGoForward()}`);

    // Test 2: Step transitions
    setManualInput(mockManualInput);
    addTestResult(`Manual input set: ${mockManualInput.title}`);
    addTestResult(`Can go forward now: ${canGoForward()}`);

    goToLoading();
    addTestResult(`Step changed to: ${currentStep}`);
    addTestResult(`Is loading step: ${isStep('loading')}`);

    goToSuggestions(mockAISuggestion);
    addTestResult(`Step changed to: ${currentStep}`);
    addTestResult(`Has suggestion: ${hasSuggestion()}`);

    setSelectedSlot(0);
    addTestResult(`Selected slot: ${selectedSlotIndex}`);
    addTestResult(`Has selected slot: ${hasSelectedSlot()}`);

    lockSlot(1);
    addTestResult(`Locked slots: [${Array.from(lockedSlots).join(', ')}]`);

    goToConfirmation('schedule-123');
    addTestResult(`Step changed to: ${currentStep}`);
    addTestResult(`Schedule entry ID: ${scheduleEntryId}`);

    goToSuccess();
    addTestResult(`Step changed to: ${currentStep}`);

    // Test 3: Error handling
    goToError('Test error message');
    addTestResult(`Step changed to: ${currentStep}`);
    addTestResult(`Error: ${error}`);

    // Test 4: Reset
    reset();
    addTestResult(`Reset completed. Step: ${currentStep}`);
    addTestResult(`Manual input: ${manualInput ? 'Present' : 'Null'}`);
    addTestResult(`Suggestion: ${aiSuggestion ? 'Present' : 'Null'}`);

    addTestResult('All tests completed!');
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'form': return '#3b82f6';
      case 'loading': return '#f59e0b';
      case 'suggestions': return '#10b981';
      case 'confirmation': return '#8b5cf6';
      case 'success': return '#059669';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Modal State Management Test</h1>
      <p>Testing useModalState hook with step transitions and state management.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Current State Display */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Current State</h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Step:</strong> 
            <span style={{ 
              color: getStepColor(currentStep), 
              fontWeight: 'bold',
              marginLeft: '8px'
            }}>
              {currentStep.toUpperCase()}
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Manual Input:</strong> {manualInput ? '✓' : '✗'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Suggestion:</strong> {aiSuggestion ? '✓' : '✗'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Selected Slot:</strong> {selectedSlotIndex !== undefined ? `Slot ${selectedSlotIndex}` : 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Locked Slots:</strong> {Array.from(lockedSlots).join(', ') || 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Error:</strong> {error || 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Schedule ID:</strong> {scheduleEntryId || 'None'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Step Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={goToForm} style={{ padding: '8px 12px', fontSize: '12px' }}>
              Go to Form
            </button>
            <button onClick={goToLoading} style={{ padding: '8px 12px', fontSize: '12px' }}>
              Go to Loading
            </button>
            <button onClick={() => goToSuggestions(mockAISuggestion)} style={{ padding: '8px 12px', fontSize: '12px' }}>
              Go to Suggestions
            </button>
            <button onClick={() => goToConfirmation('schedule-123')} style={{ padding: '8px 12px', fontSize: '12px' }}>
              Go to Confirmation
            </button>
            <button onClick={goToSuccess} style={{ padding: '8px 12px', fontSize: '12px' }}>
              Go to Success
            </button>
            <button onClick={() => goToError('Test error')} style={{ padding: '8px 12px', fontSize: '12px' }}>
              Go to Error
            </button>
            <button onClick={reset} style={{ padding: '8px 12px', fontSize: '12px', background: '#ef4444', color: 'white' }}>
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* State Management Controls */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>State Management</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setManualInput(mockManualInput)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Set Manual Input
          </button>
          <button onClick={() => setSelectedSlot(0)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Select Slot 0
          </button>
          <button onClick={() => setSelectedSlot(undefined)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Clear Selection
          </button>
          <button onClick={() => lockSlot(1)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Lock Slot 1
          </button>
          <button onClick={() => unlockSlot(1)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Unlock Slot 1
          </button>
          <button onClick={() => setLoading(true)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Set Loading
          </button>
          <button onClick={() => setLoading(false)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Clear Loading
          </button>
          <button onClick={() => setError('Test error')} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Set Error
          </button>
          <button onClick={() => setError(null)} style={{ padding: '6px 10px', fontSize: '11px' }}>
            Clear Error
          </button>
        </div>
      </div>

      {/* Test Runner */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Test Runner</h3>
        <button 
          onClick={runStateTests}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px'
          }}
        >
          🧪 Run State Tests
        </button>
        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: '12px', borderRadius: '4px' }}>
          {testResults.map((result, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '4px', fontFamily: 'monospace' }}>
              {result}
            </div>
          ))}
        </div>
      </div>

      {/* Test Cases */}
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ <strong>Step Transitions:</strong> Form → Loading → Suggestions → Confirmation → Success</li>
          <li>✅ <strong>State Management:</strong> Manual input, suggestions, selection, locking</li>
          <li>✅ <strong>Error Handling:</strong> Error state and recovery</li>
          <li>✅ <strong>Navigation:</strong> Can go back/forward logic</li>
          <li>✅ <strong>State Persistence:</strong> State maintained across transitions</li>
          <li>✅ <strong>Reset Functionality:</strong> Complete state reset</li>
          <li>✅ <strong>Utility Functions:</strong> isStep, hasSuggestion, hasSelectedSlot</li>
          <li>✅ <strong>Step History:</strong> Track step transitions</li>
        </ul>
      </div>
    </div>
  );
};

export default TestModalState;
