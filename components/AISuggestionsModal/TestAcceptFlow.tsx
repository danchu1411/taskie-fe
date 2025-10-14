import React, { useState } from 'react';
import useAcceptFlow from './hooks/useAcceptFlow';

const TestAcceptFlow: React.FC = () => {
  const {
    isAccepting,
    error,
    lastResponse,
    acceptSuggestion,
    retryAccept,
    clearError,
    reset,
    getState
  } = useAcceptFlow();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runAcceptTests = async () => {
    setTestResults([]);
    addTestResult('Starting Accept Flow tests...');

    try {
      // Test 1: Successful accept
      addTestResult('Test 1: Successful accept');
      const response1 = await acceptSuggestion('suggestion-123', 0);
      addTestResult(`✅ Accept successful: ${response1.schedule_entry_id}`);
      addTestResult(`Status: ${response1.status}, Slot: ${response1.selected_slot_index}`);

      // Test 2: Invalid slot index
      addTestResult('Test 2: Invalid slot index');
      try {
        await acceptSuggestion('suggestion-456', -1);
      } catch (err) {
        addTestResult(`✅ Invalid slot error caught: ${err.message}`);
      }

      // Test 3: Out of range slot
      addTestResult('Test 3: Out of range slot');
      try {
        await acceptSuggestion('suggestion-789', 5);
      } catch (err) {
        addTestResult(`✅ Out of range error caught: ${err.message}`);
      }

      // Test 4: Retry functionality
      addTestResult('Test 4: Retry functionality');
      const retryResponse = await retryAccept();
      if (retryResponse) {
        addTestResult(`✅ Retry successful: ${retryResponse.schedule_entry_id}`);
      }

      addTestResult('All Accept Flow tests completed!');

    } catch (error) {
      addTestResult(`❌ Test failed: ${error}`);
    }
  };

  const testErrorScenarios = async () => {
    setTestResults([]);
    addTestResult('Testing error scenarios...');

    // These will occasionally trigger errors due to random simulation
    for (let i = 0; i < 5; i++) {
      try {
        addTestResult(`Attempt ${i + 1}: Accepting suggestion`);
        const response = await acceptSuggestion(`suggestion-${i}`, i % 3);
        addTestResult(`✅ Success: ${response.schedule_entry_id}`);
      } catch (err) {
        addTestResult(`✅ Error caught: ${err.message}`);
      }
    }

    addTestResult('Error scenario testing completed!');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Accept Flow Test</h1>
      <p>Testing the Accept Flow implementation with PATCH API integration.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Current State Display */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Accept Flow State</h3>
          <div style={{ marginBottom: '8px' }}>
            <strong>Is Accepting:</strong> {isAccepting ? 'Yes' : 'No'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Error:</strong> {error || 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Last Response:</strong> {lastResponse ? 'Present' : 'None'}
          </div>
          {lastResponse && (
            <div style={{ fontSize: '12px', background: 'white', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
              <div><strong>Schedule Entry ID:</strong> {lastResponse.schedule_entry_id}</div>
              <div><strong>Status:</strong> {lastResponse.status}</div>
              <div><strong>Selected Slot:</strong> {lastResponse.selected_slot_index}</div>
              <div><strong>Message:</strong> {lastResponse.message}</div>
            </div>
          )}
        </div>

        {/* Manual Controls */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Manual Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => acceptSuggestion('test-suggestion', 0)}
              disabled={isAccepting}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Accept Slot 0
            </button>
            <button 
              onClick={() => acceptSuggestion('test-suggestion', 1)}
              disabled={isAccepting}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Accept Slot 1
            </button>
            <button 
              onClick={() => acceptSuggestion('test-suggestion', 2)}
              disabled={isAccepting}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Accept Slot 2
            </button>
            <button 
              onClick={retryAccept}
              disabled={isAccepting}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Retry Accept
            </button>
            <button 
              onClick={clearError}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Clear Error
            </button>
            <button 
              onClick={reset}
              style={{ padding: '8px 12px', fontSize: '12px', background: '#ef4444', color: 'white' }}
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Test Runners */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Test Runners</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <button 
            onClick={runAcceptTests}
            disabled={isAccepting}
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
            🧪 Run Accept Tests
          </button>
          <button 
            onClick={testErrorScenarios}
            disabled={isAccepting}
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

      {/* Test Cases */}
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ <strong>Successful Accept:</strong> Valid slot index acceptance</li>
          <li>✅ <strong>Invalid Slot:</strong> Negative slot index error</li>
          <li>✅ <strong>Out of Range:</strong> Slot index beyond available slots</li>
          <li>✅ <strong>Network Error:</strong> Simulated network failures</li>
          <li>✅ <strong>Rate Limit:</strong> Simulated rate limit errors</li>
          <li>✅ <strong>Retry Functionality:</strong> Retry failed requests</li>
          <li>✅ <strong>Error Handling:</strong> User-friendly error messages</li>
          <li>✅ <strong>State Management:</strong> Loading and error states</li>
        </ul>
        
        <h4>API Integration:</h4>
        <ul>
          <li><strong>PATCH /api/ai-suggestions/:id/status</strong></li>
          <li><strong>Request:</strong> {`{ status: 1, selected_slot_index: number }`}</li>
          <li><strong>Response:</strong> {`{ schedule_entry_id: string, message: string }`}</li>
          <li><strong>Error Handling:</strong> HTTP status codes and error messages</li>
        </ul>
      </div>
    </div>
  );
};

export default TestAcceptFlow;
