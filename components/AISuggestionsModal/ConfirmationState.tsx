import React, { useEffect, useState } from 'react';
import { AISuggestion } from '../types';
import './styles/ConfirmationState.css';

interface ConfirmationStateProps {
  aiSuggestion: AISuggestion;
  selectedSlotIndex: number;
  scheduleEntryId: string;
  onOpenSchedule: () => void;
  onCreateNew: () => void;
  onClose: () => void;
  autoCloseDelay?: number;
}

const ConfirmationState: React.FC<ConfirmationStateProps> = ({
  aiSuggestion,
  selectedSlotIndex,
  scheduleEntryId,
  onOpenSchedule,
  onCreateNew,
  onClose,
  autoCloseDelay = 3000
}) => {
  const [timeRemaining, setTimeRemaining] = useState(autoCloseDelay / 1000);
  const [isAutoClosing, setIsAutoClosing] = useState(false);

  // Auto-close countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsAutoClosing(true);
          setTimeout(() => {
            onClose();
          }, 500); // Small delay for animation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onClose]);

  // Format date/time for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} giờ`;
    return `${hours}h ${remainingMinutes}phút`;
  };

  // Get selected slot details
  const selectedSlot = aiSuggestion.suggested_slots.find(
    slot => slot.slot_index === selectedSlotIndex
  );

  if (!selectedSlot) {
    return (
      <div className="confirmation-state error">
        <div className="error-icon">❌</div>
        <h3>Lỗi hiển thị</h3>
        <p>Không tìm thấy thông tin slot đã chọn.</p>
        <button onClick={onCreateNew} className="primary-button">
          Tạo mới
        </button>
      </div>
    );
  }

  return (
    <div className={`confirmation-state ${isAutoClosing ? 'auto-closing' : ''}`}>
      {/* Success Animation */}
      <div className="confirmation-animation">
        <div className="success-icon">🎉</div>
        <div className="confetti">
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="confirmation-content">
        <h2 className="confirmation-title">
          🎉 Đã tạo lịch thành công!
        </h2>
        
        <div className="schedule-details">
          <div className="detail-item">
            <span className="detail-icon">✅</span>
            <span className="detail-label">Công việc:</span>
            <span className="detail-value">{aiSuggestion.manual_input.title}</span>
          </div>
          
          {aiSuggestion.manual_input.description && (
            <div className="detail-item">
              <span className="detail-icon">📝</span>
              <span className="detail-label">Mô tả:</span>
              <span className="detail-value">{aiSuggestion.manual_input.description}</span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="detail-icon">📅</span>
            <span className="detail-label">Thời gian:</span>
            <span className="detail-value">{formatDateTime(selectedSlot.suggested_start_at)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-icon">⏱️</span>
            <span className="detail-label">Thời lượng:</span>
            <span className="detail-value">{formatDuration(selectedSlot.planned_minutes)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-icon">🎯</span>
            <span className="detail-label">Độ tin cậy:</span>
            <span className={`detail-value confidence-${selectedSlot.confidence}`}>
              {selectedSlot.confidence === 2 ? '🟢 Cao' : 
               selectedSlot.confidence === 1 ? '🟡 Trung bình' : '🔴 Thấp'}
            </span>
          </div>
          
          <div className="detail-item">
            <span className="detail-icon">💡</span>
            <span className="detail-label">Lý do:</span>
            <span className="detail-value">{selectedSlot.reason}</span>
          </div>
        </div>

        <div className="schedule-entry-info">
          <div className="entry-id">
            <span className="entry-label">Schedule Entry ID:</span>
            <span className="entry-value">{scheduleEntryId}</span>
          </div>
          <p className="success-message">
            Lịch đã được thêm vào Schedule của bạn.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="confirmation-actions">
        <button 
          onClick={onOpenSchedule}
          className="primary-button schedule-button"
        >
          📅 Mở Schedule
        </button>
        <button 
          onClick={onCreateNew}
          className="secondary-button new-button"
        >
          🔄 Tạo lịch mới
        </button>
      </div>

      {/* Auto-close indicator */}
      <div className="auto-close-indicator">
        <div className="countdown-bar">
          <div 
            className="countdown-progress"
            style={{ 
              width: `${((autoCloseDelay - timeRemaining * 1000) / autoCloseDelay) * 100}%` 
            }}
          ></div>
        </div>
        <p className="countdown-text">
          Tự động đóng sau {timeRemaining} giây
        </p>
      </div>
    </div>
  );
};

export default ConfirmationState;
