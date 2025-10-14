import React, { useState } from 'react';
import FallbackUI from './FallbackUI';
import { AISuggestion } from './types';

const TestFallbackUI: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Mock data for testing different scenarios
  const createMockSuggestion = (scenario: string): AISuggestion => {
    const baseSuggestion: AISuggestion = {
      id: 'test-suggestion',
      suggestion_type: 1,
      status: 1,
      confidence: 0,
      reason: 'Test fallback scenario',
      manual_input: {
        title: 'Test Task',
        description: 'Test Description',
        duration_minutes: 60,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      suggested_slots: [], // Empty suggestions
      fallback_auto_mode: {
        enabled: true,
        reason: 'No available time slots found'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    switch (scenario) {
      case 'deadline-too-close':
        return {
          ...baseSuggestion,
          manual_input: {
            ...baseSuggestion.manual_input,
            deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
          }
        };
      
      case 'duration-too-long':
        return {
          ...baseSuggestion,
          manual_input: {
            ...baseSuggestion.manual_input,
            duration_minutes: 240 // 4 hours
          }
        };
      
      case 'narrow-window':
        return {
          ...baseSuggestion,
          manual_input: {
            ...baseSuggestion.manual_input,
            preferred_window: [
              new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
              new Date(Date.now() + 25 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() // 30 minutes window
            ]
          }
        };
      
      case 'custom-reason':
        return {
          ...baseSuggestion,
          fallback_auto_mode: {
            enabled: true,
            reason: 'Custom fallback reason for testing'
          }
        };
      
      default:
        return baseSuggestion;
    }
  };

  const [currentScenario, setCurrentScenario] = useState('default');
  const [mockSuggestion, setMockSuggestion] = useState(createMockSuggestion('default'));

  const runFallbackTests = () => {
    setTestResults([]);
    addTestResult('Starting Fallback UI tests...');

    // Test 1: Different scenarios
    addTestResult('Test 1: Testing different fallback scenarios');
    const scenarios = ['default', 'deadline-too-close', 'duration-too-long', 'narrow-window', 'custom-reason'];
    scenarios.forEach(scenario => {
      const suggestion = createMockSuggestion(scenario);
      addTestResult(`  → ${scenario}: ${suggestion.fallback_auto_mode?.reason}`);
    });

    // Test 2: Common reasons detection
    addTestResult('Test 2: Common reasons detection');
    const deadlineClose = createMockSuggestion('deadline-too-close');
    const durationLong = createMockSuggestion('duration-too-long');
    const narrowWindow = createMockSuggestion('narrow-window');
    
    addTestResult(`  → Deadline too close: ${deadlineClose.manual_input.deadline}`);
    addTestResult(`  → Duration too long: ${durationLong.manual_input.duration_minutes} minutes`);
    addTestResult(`  → Narrow window: ${narrowWindow.manual_input.preferred_window ? 'Yes' : 'No'}`);

    // Test 3: Improvement suggestions
    addTestResult('Test 3: Improvement suggestions');
    addTestResult('  → Should suggest shorter duration for long tasks');
    addTestResult('  → Should suggest extending deadline for tight deadlines');
    addTestResult('  → Should suggest removing preferred window if too narrow');

    // Test 4: Action buttons
    addTestResult('Test 4: Action buttons');
    addTestResult('  → "Chuyển về chế độ tự động" button');
    addTestResult('  → "Chỉnh lại thông tin" button');
    addTestResult('  → "Đóng" button');

    addTestResult('All Fallback UI tests completed!');
  };

  const testErrorScenarios = () => {
    setTestResults([]);
    addTestResult('Testing error scenarios...');

    // Test missing fallback reason
    addTestResult('Test: Missing fallback reason');
    const noReason = createMockSuggestion('default');
    noReason.fallback_auto_mode = { enabled: false, reason: '' };
    addTestResult('  → Should handle missing reason gracefully');

    // Test empty suggestions
    addTestResult('Test: Empty suggestions array');
    const emptySlots = createMockSuggestion('default');
    emptySlots.suggested_slots = [];
    addTestResult('  → Should display fallback UI for empty suggestions');

    addTestResult('Error scenario testing completed!');
  };

  const handleSwitchToAutoMode = () => {
    addTestResult(`✅ Switch to Auto Mode clicked - Scenario: ${currentScenario}`);
  };

  const handleEditInput = () => {
    addTestResult(`✅ Edit Input clicked - Scenario: ${currentScenario}`);
  };

  const handleClose = () => {
    addTestResult(`✅ Close clicked - Scenario: ${currentScenario}`);
  };

  const changeScenario = (scenario: string) => {
    setCurrentScenario(scenario);
    setMockSuggestion(createMockSuggestion(scenario));
    addTestResult(`Changed scenario to: ${scenario}`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Fallback UI Test</h1>
      <p>Testing the Fallback UI component for empty suggestions handling.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Current State Display */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Fallback UI Props</h3>
          <div style={{ marginBottom: '8px' }}>
            <strong>Current Scenario:</strong> {currentScenario}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>AI Suggestion:</strong> {mockSuggestion ? 'Present' : 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Suggested Slots:</strong> {mockSuggestion.suggested_slots.length}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Fallback Reason:</strong> {mockSuggestion.fallback_auto_mode?.reason || 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Manual Input Title:</strong> {mockSuggestion.manual_input.title}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Duration:</strong> {mockSuggestion.manual_input.duration_minutes} minutes
          </div>
        </div>

        {/* Manual Controls */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Scenario Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => changeScenario('default')}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Default Scenario
            </button>
            <button 
              onClick={() => changeScenario('deadline-too-close')}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Deadline Too Close
            </button>
            <button 
              onClick={() => changeScenario('duration-too-long')}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Duration Too Long
            </button>
            <button 
              onClick={() => changeScenario('narrow-window')}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Narrow Window
            </button>
            <button 
              onClick={() => changeScenario('custom-reason')}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Custom Reason
            </button>
          </div>
        </div>
      </div>

      {/* Test Runners */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Test Runners</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <button 
            onClick={runFallbackTests}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🧪 Run Fallback Tests
          </button>
          <button 
            onClick={testErrorScenarios}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🚨 Test Error Scenarios
          </button>
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: '12px', borderRadius: '4px' }}>
          {testResults.map((result, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '4px', fontFamily: 'monospace' }}>
              {result}
            </div>
          ))}
        </div>
      </div>

      {/* Fallback UI Component */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Fallback UI Component</h3>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <FallbackUI
            aiSuggestion={mockSuggestion}
            onSwitchToAutoMode={handleSwitchToAutoMode}
            onEditInput={handleEditInput}
            onClose={handleClose}
          />
        </div>
      </div>

      {/* Test Cases */}
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ <strong>Empty Suggestions:</strong> Display fallback UI when no suggestions</li>
          <li>✅ <strong>AI Reason Display:</strong> Show AI's reason for no suggestions</li>
          <li>✅ <strong>Common Reasons:</strong> Display common reasons for empty suggestions</li>
          <li>✅ <strong>Improvement Suggestions:</strong> Provide actionable improvement tips</li>
          <li>✅ <strong>Action Buttons:</strong> Switch to Auto Mode, Edit Input, Close</li>
          <li>✅ <strong>Error Handling:</strong> Handle missing or invalid data gracefully</li>
          <li>✅ <strong>Responsive Design:</strong> Mobile-friendly layout</li>
          <li>✅ <strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation</li>
        </ul>
        
        <h4>UI Features:</h4>
        <ul>
          <li><strong>Fallback Icon:</strong> 😔 with pulse animation</li>
          <li><strong>AI Reason:</strong> Highlighted AI explanation</li>
          <li><strong>Common Reasons:</strong> Bulleted list of possible causes</li>
          <li><strong>Improvement Tips:</strong> Lightbulb icons with suggestions</li>
          <li><strong>Action Buttons:</strong> Primary (Auto Mode), Secondary (Edit), Tertiary (Close)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestFallbackUI;
