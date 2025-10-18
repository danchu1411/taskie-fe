import React from 'react';
import type { AISuggestion, ManualInput } from './types';
import SuggestionCard from './SuggestionCard';
import SlotComparisonView from './SlotComparison';
import useSlotSelection from './hooks/useSlotSelection';
import './styles/SuggestionsDisplay.css';
import './styles/SlotComparison.css';

interface SuggestionsDisplayProps {
  manualInput: ManualInput;
  aiSuggestion: AISuggestion;
  selectedSlotIndex?: number;
  onSlotSelect: (slotIndex: number) => void;
  showComparison?: boolean;
}

const SuggestionsDisplay: React.FC<SuggestionsDisplayProps> = ({
  manualInput,
  aiSuggestion,
  selectedSlotIndex,
  onSlotSelect,
  showComparison = true
}) => {
  
  const {
    selectedSlotIndex: internalSelectedSlot,
    comparisonMode,
    comparingSlots,
    sortedSlots,
    slotComparison,
    selectSlot,
    toggleComparisonMode,
    addToComparison,
    removeFromComparison,
    clearComparison
  } = useSlotSelection(aiSuggestion.suggested_slots);

  // Use external selectedSlotIndex if provided, otherwise use internal state
  const currentSelectedSlot = selectedSlotIndex !== undefined ? selectedSlotIndex : internalSelectedSlot;

  const handleSlotSelect = (slotIndex: number) => {
    if (comparisonMode) {
      if (comparingSlots.includes(slotIndex)) {
        removeFromComparison(slotIndex);
      } else if (comparingSlots.length < 2) {
        addToComparison(slotIndex);
      }
    } else {
      selectSlot(slotIndex);
      onSlotSelect(slotIndex);
    }
  };
  const formatDateTime = (isoString: string) => {
    // Extract date components without timezone conversion
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };


  const getConfidenceIcon = (confidence: number) => {
    switch (confidence) {
      case 2: return '🟢';
      case 1: return '🟡';
      case 0: return '🔴';
      default: return '⚪';
    }
  };

  const getConfidenceText = (confidence: number) => {
    switch (confidence) {
      case 2: return 'Tin cậy cao';
      case 1: return 'Tin cậy trung bình';
      case 0: return 'Tin cậy thấp';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="suggestions-display">
      <div className="suggestions-layout">
        {/* Manual Input Column */}
        <div className="manual-input-column">
          <div className="column-header">
            <h3>📝 Your Input</h3>
          </div>
          <div className="input-summary">
            <div className="input-field">
              <label>Title:</label>
              <span className="input-value">{manualInput.title}</span>
            </div>
            
            {manualInput.description && (
              <div className="input-field">
                <label>Description:</label>
                <span className="input-value">{manualInput.description}</span>
              </div>
            )}
            
            <div className="input-field">
              <label>Duration:</label>
              <span className="input-value">{formatDuration(manualInput.duration_minutes)}</span>
            </div>
            
            <div className="input-field">
              <label>Deadline:</label>
              <span className="input-value">{formatDateTime(manualInput.deadline)}</span>
            </div>
            
            {manualInput.preferred_window && (
              <div className="input-field">
                <label>Preferred time window:</label>
                <span className="input-value">
                  {formatDateTime(manualInput.preferred_window[0])} - {formatDateTime(manualInput.preferred_window[1])}
                </span>
              </div>
            )}
            
            {manualInput.target_task_id && (
              <div className="input-field">
                <label>Task liên kết:</label>
                <span className="input-value">#{manualInput.target_task_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions Column */}
        <div className="ai-suggestions-column">
          <div className="column-header">
            <h3>🤖 AI Suggestions ({sortedSlots.length} suggestions)</h3>
            <div className="header-controls">
              <div className="overall-confidence">
                <span className="confidence-indicator">
                  {getConfidenceIcon(aiSuggestion.confidence)}
                </span>
                <span className="confidence-text">
                  {getConfidenceText(aiSuggestion.confidence)}
                </span>
              </div>
              
              
              {showComparison && (
                <button 
                  className={`comparison-toggle ${comparisonMode ? 'active' : ''}`}
                  onClick={toggleComparisonMode}
                  type="button"
                >
                  {comparisonMode ? '📊 Exit Compare' : '📊 Compare'}
                </button>
              )}
            </div>
          </div>


          {/* Comparison Mode */}
          {comparisonMode && (
            <div className="comparison-mode-info">
              <p>Select up to 2 slots to compare them side by side</p>
              {comparingSlots.length > 0 && (
                <div className="comparing-slots">
                  Comparing: {comparingSlots.map(index => `Slot ${index + 1}`).join(', ')}
                  <button onClick={clearComparison} className="clear-comparison">Clear</button>
                </div>
              )}
            </div>
          )}

          {/* Slot Comparison */}
          {slotComparison && (
            <SlotComparisonView
              comparison={slotComparison}
              onClose={clearComparison}
            />
          )}
          
          <div className="suggestions-list">
            {sortedSlots.length > 0 ? (
              sortedSlots.map((slot, index) => (
                <SuggestionCard
                  key={slot.slot_index}
                  slot={slot}
                  index={index}
                  isSelected={currentSelectedSlot === slot.slot_index}
                  isComparing={comparisonMode && comparingSlots.includes(slot.slot_index)}
                  onSelect={() => handleSlotSelect(slot.slot_index)}
                />
              ))
            ) : (
              <div className="no-suggestions">
                <div className="no-suggestions-icon">🤔</div>
                <h4>No suitable time slots found</h4>
                <p>{aiSuggestion.reason}</p>
                {aiSuggestion.fallback_auto_mode.enabled && (
                  <div className="fallback-info">
                    <span className="fallback-icon">🔄</span>
                    <span>Auto mode has been activated</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsDisplay;
