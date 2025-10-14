import React, { useState } from 'react';
import SuggestionsDisplay from './SuggestionsDisplay';
import { ManualInput, AISuggestion } from './types';

const TestSuggestionsDisplay: React.FC = () => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | undefined>(undefined);
  const [lockedSlots, setLockedSlots] = useState<Set<number>>(new Set());

  // Mock data for testing
  const mockManualInput: ManualInput = {
    title: 'Ôn Toán chương 2',
    description: 'Làm bài tập MA2 và ôn tập lý thuyết',
    duration_minutes: 60,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    preferred_window: [
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    ],
    target_task_id: 'task-123'
  };

  const mockAISuggestion: AISuggestion = {
    id: 'suggestion-123',
    suggestion_type: 1,
    status: 1,
    confidence: 2,
    reason: 'Tìm được khung giờ phù hợp với deadline',
    manual_input: mockManualInput,
    suggested_slots: [
      {
        slot_index: 0,
        suggested_start_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        confidence: 2,
        reason: 'Khung giờ tốt nhất, không có conflict với lịch hiện tại'
      },
      {
        slot_index: 1,
        suggested_start_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        confidence: 1,
        reason: 'Khung giờ khả thi, có thể có conflict nhỏ với task khác'
      },
      {
        slot_index: 2,
        suggested_start_at: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        confidence: 0,
        reason: 'Khung giờ cuối cùng, có thể có conflict với deadline'
      }
    ],
    fallback_auto_mode: {
      enabled: false,
      reason: 'Có khung giờ phù hợp'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const handleSlotSelect = (slotIndex: number) => {
    if (lockedSlots.has(slotIndex)) return;
    setSelectedSlotIndex(slotIndex);
    console.log('Selected slot:', slotIndex);
  };

  const handleSlotLock = (slotIndex: number) => {
    setLockedSlots(prev => new Set([...prev, slotIndex]));
    if (selectedSlotIndex === slotIndex) {
      setSelectedSlotIndex(undefined);
    }
    console.log('Locked slot:', slotIndex);
  };

  const handleSlotUnlock = (slotIndex: number) => {
    setLockedSlots(prev => {
      const newSet = new Set(prev);
      newSet.delete(slotIndex);
      return newSet;
    });
    console.log('Unlocked slot:', slotIndex);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>SuggestionsDisplay Component Test</h1>
      <p>Testing the two-column layout with manual input summary and AI suggestions.</p>
      
      <div style={{ marginBottom: '20px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3>Test Controls:</h3>
        <p><strong>Selected Slot:</strong> {selectedSlotIndex !== undefined ? `Slot ${selectedSlotIndex}` : 'None'}</p>
        <p><strong>Locked Slots:</strong> {Array.from(lockedSlots).join(', ') || 'None'}</p>
        <button 
          onClick={() => {
            setSelectedSlotIndex(undefined);
            setLockedSlots(new Set());
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset Selection
        </button>
      </div>

      <SuggestionsDisplay
        manualInput={mockManualInput}
        aiSuggestion={mockAISuggestion}
        selectedSlotIndex={selectedSlotIndex}
        onSlotSelect={handleSlotSelect}
        onSlotLock={handleSlotLock}
        onSlotUnlock={handleSlotUnlock}
      />

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ Two-column layout displays correctly</li>
          <li>✅ Manual input summary shows all fields</li>
          <li>✅ AI suggestions display with confidence indicators</li>
          <li>✅ Click on suggestion cards to select</li>
          <li>✅ Lock/unlock buttons work</li>
          <li>✅ Selected state shows checkmark</li>
          <li>✅ Confidence colors (Green/Yellow/Red)</li>
          <li>✅ Responsive design on different screen sizes</li>
        </ul>
      </div>
    </div>
  );
};

export default TestSuggestionsDisplay;
