import type { FC } from 'react';
import type { AISuggestion } from './types';
import './styles/FallbackUI.css';

interface FallbackUIProps {
  aiSuggestion: AISuggestion;
  onSwitchToAutoMode: () => void;
  onEditInput: () => void;
  onClose: () => void;
}

const FallbackUI: FC<FallbackUIProps> = ({
  aiSuggestion,
  onSwitchToAutoMode,
  onEditInput,
  onClose
}) => {
  // Get fallback reason from AI suggestion
  const getFallbackReason = () => {
    if (aiSuggestion.fallback_auto_mode?.reason) {
      return aiSuggestion.fallback_auto_mode.reason;
    }
    return aiSuggestion.reason || 'Không tìm được khung giờ phù hợp';
  };

  // Get common reasons for empty suggestions
  const getCommonReasons = () => {
    const reasons = [];
    
    // Check if deadline is too close
    const deadline = new Date(aiSuggestion.manual_input.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline < aiSuggestion.manual_input.duration_minutes / 60) {
      reasons.push('Deadline quá gần so với thời lượng cần thiết');
    }
    
    // Check if duration is too long
    if (aiSuggestion.manual_input.duration_minutes > 180) {
      reasons.push('Thời lượng quá dài (hơn 3 giờ)');
    }
    
    // Check if preferred window is too narrow
    if (aiSuggestion.manual_input.preferred_window) {
      const [start, end] = aiSuggestion.manual_input.preferred_window;
      const windowDuration = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60);
      
      if (windowDuration < aiSuggestion.manual_input.duration_minutes) {
        reasons.push('Khung giờ ưu tiên quá hẹp');
      }
    }
    
    // Default reasons if none match
    if (reasons.length === 0) {
      reasons.push('Lịch của bạn quá đầy trong khoảng thời gian yêu cầu');
      reasons.push('Không có khung giờ trống phù hợp với thói quen học');
    }
    
    return reasons;
  };

  // Get suggestions for improvement
  const getImprovementSuggestions = () => {
    const suggestions = [];
    
    // Suggest shorter duration
    if (aiSuggestion.manual_input.duration_minutes > 120) {
      suggestions.push('Thử giảm thời lượng xuống 1-2 giờ');
    }
    
    // Suggest extending deadline
    const deadline = new Date(aiSuggestion.manual_input.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline < 24) {
      suggestions.push('Thử gia hạn deadline thêm 1-2 ngày');
    }
    
    // Suggest removing preferred window
    if (aiSuggestion.manual_input.preferred_window) {
      suggestions.push('Thử bỏ khung giờ ưu tiên để có nhiều lựa chọn hơn');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Thử điều chỉnh thời lượng hoặc deadline');
      suggestions.push('Kiểm tra lại lịch trình hiện tại');
    }
    
    return suggestions;
  };

  const fallbackReason = getFallbackReason();
  const commonReasons = getCommonReasons();
  const improvementSuggestions = getImprovementSuggestions();

  return (
    <div className="fallback-ui">
      {/* Main Message */}
      <div className="fallback-header">
        <div className="fallback-icon">😔</div>
        <h2 className="fallback-title">
          Không tìm được khung giờ phù hợp
        </h2>
        <p className="fallback-subtitle">
          AI không thể tìm được khung giờ phù hợp cho yêu cầu của bạn
        </p>
      </div>

      {/* AI Reason */}
      <div className="ai-reason-section">
        <div className="ai-reason-header">
          <span className="ai-icon">🤖</span>
          <span className="ai-reason-title">Lý do từ AI:</span>
        </div>
        <p className="ai-reason-text">{fallbackReason}</p>
      </div>

      {/* Common Reasons */}
      <div className="common-reasons-section">
        <h3 className="section-title">Các nguyên nhân có thể:</h3>
        <ul className="reasons-list">
          {commonReasons.map((reason, index) => (
            <li key={index} className="reason-item">
              <span className="reason-bullet">•</span>
              <span className="reason-text">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Improvement Suggestions */}
      <div className="suggestions-section">
        <h3 className="section-title">Gợi ý cải thiện:</h3>
        <ul className="suggestions-list">
          {improvementSuggestions.map((suggestion, index) => (
            <li key={index} className="suggestion-item">
              <span className="suggestion-icon">💡</span>
              <span className="suggestion-text">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="fallback-actions">
        <button 
          onClick={onSwitchToAutoMode}
          className="primary-button auto-mode-button"
        >
          <span className="button-icon">🔄</span>
          <span className="button-text">Chuyển về chế độ tự động</span>
        </button>
        
        <button 
          onClick={onEditInput}
          className="secondary-button edit-button"
        >
          <span className="button-icon">✏️</span>
          <span className="button-text">Chỉnh lại thông tin</span>
        </button>
        
        <button 
          onClick={onClose}
          className="tertiary-button close-button"
        >
          <span className="button-icon">✕</span>
          <span className="button-text">Đóng</span>
        </button>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <div className="help-header">
          <span className="help-icon">❓</span>
          <span className="help-title">Cần hỗ trợ?</span>
        </div>
        <p className="help-text">
          Nếu vẫn gặp khó khăn, bạn có thể thử chế độ tự động hoặc liên hệ hỗ trợ.
        </p>
      </div>
    </div>
  );
};

export default FallbackUI;
