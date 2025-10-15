import type { SuggestedSlot } from './types';
import './styles/SuggestionCard.css';

interface SuggestionCardProps {
  slot: SuggestedSlot;
  index: number;
  isSelected: boolean;
  isComparing?: boolean;
  onSelect: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  slot,
  index,
  isSelected,
  isComparing = false,
  onSelect
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
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return { label: 'High Confidence', color: '#10B981' };
    if (confidence >= 0.4) return { label: 'Medium Confidence', color: '#F59E0B' };
    return { label: 'Low Confidence', color: '#EF4444' };
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.7) return '🟢';
    if (confidence >= 0.4) return '🟡';
    return '🔴';
  };

  const getConfidenceText = (confidence: number) => {
    return getConfidenceLabel(confidence).label;
  };

  const getCardClassName = () => {
    let className = 'suggestion-card';
    
    if (isSelected) {
      className += ' selected';
    }
    
    if (isComparing) {
      className += ' comparing';
    }
    
    return className;
  };

  const handleCardClick = () => {
    onSelect();
  };

  return (
    <div
      className={getCardClassName()}
      style={{
        borderColor: getConfidenceColor(slot.confidence)
      }}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="suggestion-number">
          <span className="confidence-icon">
            {getConfidenceIcon(slot.confidence)}
          </span>
          <span className="suggestion-title">
            Gợi ý {index + 1}
          </span>
        </div>
        <div className="confidence-badge">
          {getConfidenceText(slot.confidence)}
        </div>
      </div>

      {/* Card Content */}
      <div className="card-content">
        <div className="time-info">
          <div className="time-item">
            <span className="time-icon">📅</span>
            <span className="time-value">
              {formatDateTime(slot.suggested_start_at)}
            </span>
          </div>
          <div className="time-item">
            <span className="time-icon">⏱️</span>
            <span className="time-value">
              {formatDuration(slot.planned_minutes)}
            </span>
          </div>
        </div>
        
        <div className="reason-text">
          <span className="reason-icon">🎯</span>
          <span className="reason-value">{slot.reason}</span>
        </div>
        
        {/* Metadata badges */}
        {slot.metadata && (
          <div className="metadata-badges">
            {slot.metadata.adjusted_duration && (
              <div className="adjustment-badge" title={slot.metadata.duration_adjustment_reason}>
                ⚠️ Duration Adjusted
              </div>
            )}
            {slot.metadata.adjusted_deadline && (
              <div className="adjustment-badge" title={slot.metadata.deadline_adjustment_reason}>
                ⚠️ Deadline Adjusted
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="selection-indicator">
          <span className="checkmark">✓</span>
        </div>
      )}
    </div>
  );
};

export default SuggestionCard;
