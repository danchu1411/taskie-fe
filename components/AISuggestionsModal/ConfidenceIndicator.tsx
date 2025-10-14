import React from 'react';
import './styles/ConfidenceIndicator.css';

interface ConfidenceIndicatorProps {
  confidence: number; // 0, 1, 2
  showLabel?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showPercentage?: boolean;
  className?: string;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showLabel = true,
  animated = true,
  size = 'medium',
  showIcon = true,
  showPercentage = false,
  className = ''
}) => {
  const getConfidenceInfo = (conf: number) => {
    switch (conf) {
      case 2: return { 
        label: 'Cao', 
        color: '#22c55e', 
        icon: '🟢',
        percentage: 100,
        bgColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.2)'
      };
      case 1: return { 
        label: 'Trung bình', 
        color: '#fbbf24', 
        icon: '🟡',
        percentage: 66,
        bgColor: 'rgba(251, 191, 36, 0.1)',
        borderColor: 'rgba(251, 191, 36, 0.2)'
      };
      case 0: return { 
        label: 'Thấp', 
        color: '#ef4444', 
        icon: '🔴',
        percentage: 33,
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)'
      };
      default: return { 
        label: 'Không xác định', 
        color: '#6b7280', 
        icon: '⚪',
        percentage: 0,
        bgColor: 'rgba(107, 114, 128, 0.1)',
        borderColor: 'rgba(107, 114, 128, 0.2)'
      };
    }
  };

  const confidenceInfo = getConfidenceInfo(confidence);

  return (
    <div className={`confidence-indicator ${size} ${animated ? 'animated' : ''} ${className}`}>
      <div 
        className="confidence-container"
        style={{
          backgroundColor: confidenceInfo.bgColor,
          borderColor: confidenceInfo.borderColor
        }}
      >
        <div className="confidence-content">
          {showIcon && (
            <span className="confidence-icon">
              {confidenceInfo.icon}
            </span>
          )}
          
          <div className="confidence-bar-container">
            <div className="confidence-bar">
              <div 
                className={`confidence-fill ${animated ? 'animated' : ''}`}
                style={{ 
                  width: `${confidenceInfo.percentage}%`,
                  backgroundColor: confidenceInfo.color
                }}
              />
            </div>
            {showPercentage && (
              <span className="confidence-percentage">
                {confidenceInfo.percentage}%
              </span>
            )}
          </div>
          
          {showLabel && (
            <span 
              className="confidence-label"
              style={{ color: confidenceInfo.color }}
            >
              {confidenceInfo.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfidenceIndicator;
