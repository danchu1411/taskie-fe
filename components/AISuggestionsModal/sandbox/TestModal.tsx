import React, { useState } from 'react';
import AISuggestionsModal from './index';
import { runAllAPITests } from './hooks/testAPIIntegration';

const TestModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (scheduleEntryId: string) => {
    console.log('Schedule entry created:', scheduleEntryId);
    setIsModalOpen(false);
  };

  const handleRunAPITests = () => {
    runAllAPITests();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>AI Suggestions Modal Test</h1>
      <p>Test the modal with form validation, API integration, and responsive design.</p>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={handleOpenModal}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          🤖 Mở AI Suggestions Modal
        </button>
        
        <button 
          onClick={handleRunAPITests}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          🧪 Chạy API Tests
        </button>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ Modal opens and closes properly</li>
          <li>✅ Form validation works (try empty title, invalid deadline)</li>
          <li>✅ Character counters work (title: 120 chars, description: 500 chars)</li>
          <li>✅ Duration dropdown has 15-minute increments</li>
          <li>✅ Deadline must be future date</li>
          <li>✅ Preferred window validation</li>
          <li>✅ Responsive design (try different screen sizes)</li>
          <li>✅ Escape key and backdrop click to close</li>
          <li>✅ API integration hook with service abstraction</li>
          <li>✅ Error handling and retry functionality</li>
          <li>✅ Suggestions display with confidence indicators</li>
          <li>✅ Two-column layout (Manual Input vs AI Suggestions)</li>
          <li>✅ Slot selection and locking mechanism</li>
          <li>✅ Accept button appears when slot selected</li>
          <li>✅ End-to-end flow: Form → API → Suggestions</li>
        </ul>
        
        <h4>Test Scenarios:</h4>
        <ul>
          <li><strong>Normal:</strong> Fill form with future deadline → Should get 1-3 suggestions</li>
          <li><strong>Tight deadline:</strong> Set deadline 1 hour from now → Should get empty suggestions</li>
          <li><strong>Long duration:</strong> Set 3 hours duration → Should get fewer suggestions</li>
          <li><strong>Preferred window:</strong> Set specific time range → Should prioritize that range</li>
          <li><strong>Error handling:</strong> Test retry functionality and error states</li>
          <li><strong>Service abstraction:</strong> Ready for backend integration</li>
          <li><strong>SuggestionsDisplay:</strong> Two-column layout with manual input summary</li>
          <li><strong>Slot interaction:</strong> Click to select, lock/unlock functionality</li>
          <li><strong>Confidence indicators:</strong> Green/Yellow/Red color coding</li>
          <li><strong>Accept flow:</strong> Button appears when slot selected</li>
        </ul>
      </div>
      
      <AISuggestionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default TestModal;
