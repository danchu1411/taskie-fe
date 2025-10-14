import React, { useState } from 'react';
import SuggestionCard from './SuggestionCard';
import { SuggestedSlot } from './types';

const TestSuggestionCard: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<number | undefined>(undefined);
  const [lockedSlots, setLockedSlots] = useState<Set<number>>(new Set());

  // Mock suggestion slots for testing
  const mockSlots: SuggestedSlot[] = [
    {
      slot_index: 0,
      suggested_start_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      planned_minutes: 60,
      confidence: 2,
      reason: 'Khung giờ tốt nhất, không có conflict với lịch hiện tại và phù hợp với chronotype của bạn'
    },
    {
      slot_index: 1,
      suggested_start_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      planned_minutes: 90,
      confidence: 1,
      reason: 'Khung giờ khả thi, có thể có conflict nhỏ với task khác nhưng vẫn đảm bảo chất lượng'
    },
    {
      slot_index: 2,
      suggested_start_at: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
      planned_minutes: 120,
      confidence: 0,
      reason: 'Khung giờ cuối cùng, có thể có conflict với deadline nhưng vẫn có thể hoàn thành'
    }
  ];

  const handleSelect = (slotIndex: number) => {
    if (lockedSlots.has(slotIndex)) return;
    setSelectedSlot(slotIndex);
    console.log('Selected slot:', slotIndex);
  };

  const handleLock = (slotIndex: number) => {
    setLockedSlots(prev => new Set([...prev, slotIndex]));
    if (selectedSlot === slotIndex) {
      setSelectedSlot(undefined);
    }
    console.log('Locked slot:', slotIndex);
  };

  const handleUnlock = (slotIndex: number) => {
    setLockedSlots(prev => {
      const newSet = new Set(prev);
      newSet.delete(slotIndex);
      return newSet;
    });
    console.log('Unlocked slot:', slotIndex);
  };

  const resetState = () => {
    setSelectedSlot(undefined);
    setLockedSlots(new Set());
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>SuggestionCard Component Test</h1>
      <p>Testing individual suggestion cards with different states and interactions.</p>
      
      <div style={{ marginBottom: '20px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3>Test Controls:</h3>
        <p><strong>Selected Slot:</strong> {selectedSlot !== undefined ? `Slot ${selectedSlot}` : 'None'}</p>
        <p><strong>Locked Slots:</strong> {Array.from(lockedSlots).join(', ') || 'None'}</p>
        <button 
          onClick={resetState}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          Reset All States
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        {mockSlots.map((slot, index) => (
          <div key={slot.slot_index}>
            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              Test Card {index + 1} - Confidence {slot.confidence}
            </h4>
            <SuggestionCard
              slot={slot}
              index={index}
              isSelected={selectedSlot === slot.slot_index}
              isLocked={lockedSlots.has(slot.slot_index)}
              onSelect={() => handleSelect(slot.slot_index)}
              onLock={() => handleLock(slot.slot_index)}
              onUnlock={() => handleUnlock(slot.slot_index)}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ <strong>Card States:</strong> Default, hover, selected, locked</li>
          <li>✅ <strong>Confidence Indicators:</strong> Green (2), Yellow (1), Red (0)</li>
          <li>✅ <strong>Selection Mechanism:</strong> Click to select, visual feedback</li>
          <li>✅ <strong>Lock/Unlock:</strong> Prevent selection, visual overlay</li>
          <li>✅ <strong>Hover Effects:</strong> Lift animation, shadow</li>
          <li>✅ <strong>Selection Indicator:</strong> Checkmark with animation</li>
          <li>✅ <strong>Locked Overlay:</strong> Grayed out with lock icon</li>
          <li>✅ <strong>Responsive Design:</strong> Mobile-friendly layout</li>
          <li>✅ <strong>Accessibility:</strong> Focus states, keyboard navigation</li>
          <li>✅ <strong>Animations:</strong> Smooth transitions and micro-interactions</li>
        </ul>
        
        <h4>Test Scenarios:</h4>
        <ul>
          <li><strong>High Confidence (Green):</strong> Card 1 - Best time slot</li>
          <li><strong>Medium Confidence (Yellow):</strong> Card 2 - Acceptable time slot</li>
          <li><strong>Low Confidence (Red):</strong> Card 3 - Last resort time slot</li>
          <li><strong>Selection:</strong> Click any card to select it</li>
          <li><strong>Locking:</strong> Click lock button to prevent selection</li>
          <li><strong>Unlocking:</strong> Click unlock button to allow selection</li>
          <li><strong>State Combinations:</strong> Test selected + locked states</li>
        </ul>
      </div>
    </div>
  );
};

export default TestSuggestionCard;
