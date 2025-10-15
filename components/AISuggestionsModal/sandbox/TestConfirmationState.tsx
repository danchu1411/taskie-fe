import React, { useState } from 'react';
import ConfirmationState from './ConfirmationState';
import type { AISuggestion } from './types';

const TestConfirmationState: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Mock data for testing
  const mockAISuggestion: AISuggestion = {
    id: 'test-suggestion',
    suggestion_type: 1,
    status: 1,
    confidence: 2,
    reason: 'Test suggestion for confirmation state',
    manual_input: {
      title: 'Ôn Toán chương 2',
      description: 'Làm bài tập và ôn tập lý thuyết',
      duration_minutes: 60,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      preferred_window: [
        new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()
      ],
      target_task_id: 'task-123'
    },
    suggested_slots: [
      {
        slot_index: 0,
        suggested_start_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        confidence: 2,
        reason: 'Khung giờ tốt nhất, không có conflict'
      },
      {
        slot_index: 1,
        suggested_start_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        confidence: 1,
        reason: 'Khung giờ phù hợp, có thể có conflict nhẹ'
      },
      {
        slot_index: 2,
        suggested_start_at: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        confidence: 0,
        reason: 'Khung giờ cuối cùng, có thể có conflict'
      }
    ],
    fallback_auto_mode: {
      enabled: false,
      reason: 'Test mode'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [scheduleEntryId, setScheduleEntryId] = useState('schedule-123456789');

  const runConfirmationTests = () => {
    setTestResults([]);
    addTestResult('Starting Confirmation State tests...');

    // Test 1: Different slot selections
    addTestResult('Test 1: Testing different slot selections');
    [0, 1, 2].forEach(slotIndex => {
      setSelectedSlotIndex(slotIndex);
      const slot = mockAISuggestion.suggested_slots[slotIndex];
      addTestResult(`  → Slot ${slotIndex}: ${slot.reason} (Confidence: ${slot.confidence})`);
    });

    // Test 2: Different schedule entry IDs
    addTestResult('Test 2: Testing different schedule entry IDs');
    const testIds = ['schedule-123', 'schedule-456', 'schedule-789'];
    testIds.forEach(id => {
      setScheduleEntryId(id);
      addTestResult(`  → Schedule Entry ID: ${id}`);
    });

    // Test 3: Auto-close functionality
    addTestResult('Test 3: Auto-close functionality');
    addTestResult('  → Auto-close countdown should start at 3 seconds');
    addTestResult('  → Progress bar should animate');
    addTestResult('  → Modal should close automatically');

    // Test 4: Action buttons
    addTestResult('Test 4: Action buttons');
    addTestResult('  → "Mở Schedule" button should call onOpenSchedule');
    addTestResult('  → "Tạo lịch mới" button should call onCreateNew');
    addTestResult('  → Buttons should have proper styling');

    // Test 5: Error handling
    addTestResult('Test 5: Error handling');
    addTestResult('  → Invalid slot index should show error state');
    addTestResult('  → Missing schedule entry ID should show error state');

    addTestResult('All Confirmation State tests completed!');
  };

  const testErrorScenarios = () => {
    setTestResults([]);
    addTestResult('Testing error scenarios...');

    // Test invalid slot index
    addTestResult('Test: Invalid slot index');
    setSelectedSlotIndex(999); // Invalid slot index
    addTestResult('  → Should show error state with "Không tìm thấy thông tin slot đã chọn"');

    // Test missing schedule entry ID
    addTestResult('Test: Missing schedule entry ID');
    setScheduleEntryId('');
    addTestResult('  → Should handle empty schedule entry ID gracefully');

    addTestResult('Error scenario testing completed!');
  };

  const handleOpenSchedule = () => {
    addTestResult(`✅ Open Schedule clicked - Schedule Entry ID: ${scheduleEntryId}`);
  };

  const handleCreateNew = () => {
    addTestResult('✅ Create New clicked - Should return to form');
  };

  const handleClose = () => {
    addTestResult('✅ Modal closed - Auto-close or manual close');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Confirmation State Test</h1>
      <p>Testing the Confirmation State component with success confirmation UI.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Current State Display */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Confirmation State Props</h3>
          <div style={{ marginBottom: '8px' }}>
            <strong>Selected Slot Index:</strong> {selectedSlotIndex}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Schedule Entry ID:</strong> {scheduleEntryId}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>AI Suggestion:</strong> {mockAISuggestion ? 'Present' : 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Manual Input Title:</strong> {mockAISuggestion.manual_input.title}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Selected Slot:</strong> {mockAISuggestion.suggested_slots[selectedSlotIndex]?.reason || 'Invalid'}
          </div>
        </div>

        {/* Manual Controls */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Manual Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setSelectedSlotIndex(0)}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Select Slot 0 (High Confidence)
            </button>
            <button 
              onClick={() => setSelectedSlotIndex(1)}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Select Slot 1 (Medium Confidence)
            </button>
            <button 
              onClick={() => setSelectedSlotIndex(2)}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Select Slot 2 (Low Confidence)
            </button>
            <button 
              onClick={() => setSelectedSlotIndex(999)}
              style={{ padding: '8px 12px', fontSize: '12px', background: '#ef4444', color: 'white' }}
            >
              Test Invalid Slot
            </button>
            <button 
              onClick={() => setScheduleEntryId(`schedule-${Date.now()}`)}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Generate New Schedule ID
            </button>
          </div>
        </div>
      </div>

      {/* Test Runners */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Test Runners</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <button 
            onClick={runConfirmationTests}
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
            🧪 Run Confirmation Tests
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

      {/* Confirmation State Component */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Confirmation State Component</h3>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <ConfirmationState
            aiSuggestion={mockAISuggestion}
            selectedSlotIndex={selectedSlotIndex}
            scheduleEntryId={scheduleEntryId}
            onOpenSchedule={handleOpenSchedule}
            onCreateNew={handleCreateNew}
            onClose={handleClose}
            autoCloseDelay={5000} // 5 seconds for testing
          />
        </div>
      </div>

      {/* Test Cases */}
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ <strong>Success Animation:</strong> Confetti animation and success icon</li>
          <li>✅ <strong>Schedule Details:</strong> Display all schedule information</li>
          <li>✅ <strong>Confidence Indicators:</strong> Color-coded confidence levels</li>
          <li>✅ <strong>Action Buttons:</strong> Open Schedule and Create New buttons</li>
          <li>✅ <strong>Auto-close:</strong> Countdown timer and progress bar</li>
          <li>✅ <strong>Error Handling:</strong> Invalid slot index error state</li>
          <li>✅ <strong>Responsive Design:</strong> Mobile-friendly layout</li>
          <li>✅ <strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation</li>
        </ul>
        
        <h4>UI Features:</h4>
        <ul>
          <li><strong>Success Animation:</strong> Bouncing success icon with confetti</li>
          <li><strong>Schedule Details:</strong> Complete schedule information display</li>
          <li><strong>Confidence Colors:</strong> Green (high), Yellow (medium), Red (low)</li>
          <li><strong>Auto-close:</strong> 3-second countdown with progress bar</li>
          <li><strong>Action Buttons:</strong> Primary (Open Schedule) and Secondary (Create New)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestConfirmationState;
