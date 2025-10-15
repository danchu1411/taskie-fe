import type { AISuggestion, ManualInput } from './types';
import SuggestionCard from './SuggestionCard';
import './styles/SuggestionsDisplay.css';

interface SuggestionsDisplayProps {
  manualInput: ManualInput;
  aiSuggestion: AISuggestion;
  selectedSlotIndex?: number;
  lockedSlots?: Set<number>;
  onSlotSelect: (slotIndex: number) => void;
  onSlotLock: (slotIndex: number) => void;
  onSlotUnlock: (slotIndex: number) => void;
}

const SuggestionsDisplay: React.FC<SuggestionsDisplayProps> = ({
  manualInput,
  aiSuggestion,
  selectedSlotIndex,
  lockedSlots = new Set(),
  onSlotSelect,
  onSlotLock,
  onSlotUnlock
}) => {
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}phút`
      : `${hours} giờ`;
  };

  const getConfidenceColor = (confidence: number) => {
    switch (confidence) {
      case 2: return '#10B981'; // Green
      case 1: return '#F59E0B'; // Yellow
      case 0: return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
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
            <h3>📝 Bạn nhập</h3>
          </div>
          <div className="input-summary">
            <div className="input-field">
              <label>Tiêu đề:</label>
              <span className="input-value">{manualInput.title}</span>
            </div>
            
            {manualInput.description && (
              <div className="input-field">
                <label>Mô tả:</label>
                <span className="input-value">{manualInput.description}</span>
              </div>
            )}
            
            <div className="input-field">
              <label>Thời lượng:</label>
              <span className="input-value">{formatDuration(manualInput.duration_minutes)}</span>
            </div>
            
            <div className="input-field">
              <label>Hạn chót:</label>
              <span className="input-value">{formatDateTime(manualInput.deadline)}</span>
            </div>
            
            {manualInput.preferred_window && (
              <div className="input-field">
                <label>Khung giờ ưa thích:</label>
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
            <h3>🤖 AI đề xuất ({aiSuggestion.suggested_slots.length} gợi ý)</h3>
            <div className="overall-confidence">
              <span className="confidence-indicator">
                {getConfidenceIcon(aiSuggestion.confidence)}
              </span>
              <span className="confidence-text">
                {getConfidenceText(aiSuggestion.confidence)}
              </span>
            </div>
          </div>
          
          <div className="suggestions-list">
            {aiSuggestion.suggested_slots.length > 0 ? (
              aiSuggestion.suggested_slots.map((slot, index) => (
                <SuggestionCard
                  key={slot.slot_index}
                  slot={slot}
                  index={index}
                  isSelected={selectedSlotIndex === slot.slot_index}
                  isLocked={lockedSlots.has(slot.slot_index)}
                  onSelect={() => onSlotSelect(slot.slot_index)}
                  onLock={() => onSlotLock(slot.slot_index)}
                  onUnlock={() => onSlotUnlock(slot.slot_index)}
                />
              ))
            ) : (
              <div className="no-suggestions">
                <div className="no-suggestions-icon">🤔</div>
                <h4>Không tìm thấy khung giờ phù hợp</h4>
                <p>{aiSuggestion.reason}</p>
                {aiSuggestion.fallback_auto_mode.enabled && (
                  <div className="fallback-info">
                    <span className="fallback-icon">🔄</span>
                    <span>Chế độ tự động đã được kích hoạt</span>
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
