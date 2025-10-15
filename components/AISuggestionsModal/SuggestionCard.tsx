import type { SuggestedSlot } from './types';
import './styles/SuggestionCard.css';

interface SuggestionCardProps {
  slot: SuggestedSlot;
  index: number;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
  onLock: () => void;
  onUnlock: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  slot,
  index,
  isSelected,
  isLocked,
  onSelect,
  onLock,
  onUnlock
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

  const getCardClassName = () => {
    let className = 'suggestion-card';
    
    if (isLocked) {
      className += ' locked';
    } else if (isSelected) {
      className += ' selected';
    }
    
    return className;
  };

  const handleCardClick = () => {
    if (!isLocked) {
      onSelect();
    }
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) {
      onUnlock();
    } else {
      onLock();
    }
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
      </div>

      {/* Card Actions */}
      <div className="card-actions">
        <button
          className={`action-button ${isLocked ? 'unlock-button' : 'lock-button'}`}
          onClick={handleLockClick}
          disabled={false}
        >
          {isLocked ? (
            <>
              <span className="button-icon">🔓</span>
              <span className="button-text">Mở khóa</span>
            </>
          ) : (
            <>
              <span className="button-icon">🔒</span>
              <span className="button-text">Khóa</span>
            </>
          )}
        </button>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="selection-indicator">
          <span className="checkmark">✓</span>
        </div>
      )}

      {/* Locked Overlay */}
      {isLocked && (
        <div className="locked-overlay">
          <span className="lock-icon">🔒</span>
          <span className="lock-text">Đã khóa</span>
        </div>
      )}
    </div>
  );
};

export default SuggestionCard;
