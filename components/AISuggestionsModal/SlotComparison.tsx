import React from 'react';
import type { SlotComparison } from './types';
import './styles/SlotComparison.css';

interface SlotComparisonProps {
  comparison: SlotComparison;
  onClose: () => void;
}

const SlotComparisonView: React.FC<SlotComparisonProps> = ({ comparison, onClose }) => {
  const { slot1, slot2, comparison: comparisonData } = comparison;

  const formatDateTime = (dateString: string) => {
    // Extract date components without timezone conversion
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    // Format as "Sat, Oct 18, 06:05"
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekday = weekdays[date.getUTCDay()];
    const monthName = months[date.getUTCMonth()];
    
    return `${weekday}, ${monthName} ${day}, ${hours}:${minutes}`;
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
    if (confidence >= 0.7) return { label: 'High', color: '#10B981' };
    if (confidence >= 0.4) return { label: 'Medium', color: '#F59E0B' };
    return { label: 'Low', color: '#EF4444' };
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.7) return '🟢';
    if (confidence >= 0.4) return '🟡';
    return '🔴';
  };

  return (
    <div className="slot-comparison">
      <div className="comparison-header">
        <h3>Slot Comparison</h3>
        <button 
          className="close-button"
          onClick={onClose}
          type="button"
          aria-label="Close comparison"
        >
          ✕
        </button>
      </div>

      <div className="comparison-content">
        {/* Slot 1 */}
        <div className="slot-card slot-card-1">
          <div className="slot-header">
            <span className="slot-number">Slot 1</span>
            <div className="confidence-badge" style={{ backgroundColor: getConfidenceLabel(slot1.confidence).color }}>
              {getConfidenceIcon(slot1.confidence)} {getConfidenceLabel(slot1.confidence).label}
            </div>
          </div>
          
          <div className="slot-details">
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <span className="detail-value">{formatDateTime(slot1.suggested_start_at)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">⏱️</span>
              <span className="detail-value">{formatDuration(slot1.planned_minutes)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🎯</span>
              <span className="detail-value">{slot1.reason}</span>
            </div>
          </div>

          {slot1.metadata && (
            <div className="metadata-badges">
              {slot1.metadata.adjusted_duration && (
                <div className="adjustment-badge" title={slot1.metadata.duration_adjustment_reason}>
                  ⚠️ Duration Adjusted
                </div>
              )}
              {slot1.metadata.adjusted_deadline && (
                <div className="adjustment-badge" title={slot1.metadata.deadline_adjustment_reason}>
                  ⚠️ Deadline Adjusted
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison Metrics */}
        <div className="comparison-metrics">
          <div className="metric-item">
            <span className="metric-label">Time Difference</span>
            <span className="metric-value">
              {comparisonData.timeDifference < 60 
                ? `${Math.round(comparisonData.timeDifference)} min`
                : `${Math.round(comparisonData.timeDifference / 60)}h ${Math.round(comparisonData.timeDifference % 60)}min`
              }
            </span>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Confidence Difference</span>
            <span className="metric-value">
              {Math.round(comparisonData.confidenceDifference * 100)}%
            </span>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Duration Match</span>
            <span className={`metric-value ${comparisonData.durationMatch ? 'match' : 'no-match'}`}>
              {comparisonData.durationMatch ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Deadline Proximity</span>
            <span className="metric-value">
              {comparisonData.deadlineProximity > 0 
                ? `${Math.round(comparisonData.deadlineProximity)} min`
                : 'N/A'
              }
            </span>
          </div>
        </div>

        {/* Slot 2 */}
        <div className="slot-card slot-card-2">
          <div className="slot-header">
            <span className="slot-number">Slot 2</span>
            <div className="confidence-badge" style={{ backgroundColor: getConfidenceLabel(slot2.confidence).color }}>
              {getConfidenceIcon(slot2.confidence)} {getConfidenceLabel(slot2.confidence).label}
            </div>
          </div>
          
          <div className="slot-details">
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <span className="detail-value">{formatDateTime(slot2.suggested_start_at)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">⏱️</span>
              <span className="detail-value">{formatDuration(slot2.planned_minutes)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🎯</span>
              <span className="detail-value">{slot2.reason}</span>
            </div>
          </div>

          {slot2.metadata && (
            <div className="metadata-badges">
              {slot2.metadata.adjusted_duration && (
                <div className="adjustment-badge" title={slot2.metadata.duration_adjustment_reason}>
                  ⚠️ Duration Adjusted
                </div>
              )}
              {slot2.metadata.adjusted_deadline && (
                <div className="adjustment-badge" title={slot2.metadata.deadline_adjustment_reason}>
                  ⚠️ Deadline Adjusted
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="comparison-footer">
        <div className="recommendation">
          <span className="recommendation-icon">💡</span>
          <span className="recommendation-text">
            {slot1.confidence > slot2.confidence 
              ? 'Slot 1 has higher confidence and is recommended'
              : slot2.confidence > slot1.confidence
              ? 'Slot 2 has higher confidence and is recommended'
              : 'Both slots have similar confidence levels'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default SlotComparisonView;
