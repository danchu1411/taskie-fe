import React, { useState } from 'react';
import ConfidenceIndicator from './ConfidenceIndicator';
import Tooltip from './Tooltip';
import EnhancedButton from './EnhancedButton';

const TestUIPolish: React.FC = () => {
  const [selectedConfidence, setSelectedConfidence] = useState<number>(2);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🎨 UI Polish & Micro-interactions Test</h2>
      
      {/* Enhanced Confidence Indicators */}
      <section style={{ marginBottom: '30px' }}>
        <h3>📊 Enhanced Confidence Indicators</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <h4>Size Variations:</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <ConfidenceIndicator confidence={2} size="small" />
              <ConfidenceIndicator confidence={1} size="medium" />
              <ConfidenceIndicator confidence={0} size="large" />
            </div>
          </div>
          
          <div>
            <h4>All Confidence Levels:</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <ConfidenceIndicator confidence={2} showPercentage />
              <ConfidenceIndicator confidence={1} showPercentage />
              <ConfidenceIndicator confidence={0} showPercentage />
            </div>
          </div>
          
          <div>
            <h4>Interactive Demo:</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button 
                onClick={() => setSelectedConfidence(2)}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                High Confidence
              </button>
              <button 
                onClick={() => setSelectedConfidence(1)}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                Medium Confidence
              </button>
              <button 
                onClick={() => setSelectedConfidence(0)}
                style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                Low Confidence
              </button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <ConfidenceIndicator 
                confidence={selectedConfidence} 
                showPercentage 
                size="large"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tooltips */}
      <section style={{ marginBottom: '30px' }}>
        <h3>💬 Enhanced Tooltips</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <Tooltip content="This is a tooltip on top" position="top">
            <button style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}>
              Top Tooltip
            </button>
          </Tooltip>
          
          <Tooltip content="This is a tooltip on the bottom" position="bottom">
            <button style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}>
              Bottom Tooltip
            </button>
          </Tooltip>
          
          <Tooltip content="This is a tooltip on the left" position="left">
            <button style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}>
              Left Tooltip
            </button>
          </Tooltip>
          
          <Tooltip content="This is a tooltip on the right" position="right">
            <button style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}>
              Right Tooltip
            </button>
          </Tooltip>
          
          <Tooltip 
            content="This is a longer tooltip that demonstrates how the tooltip handles longer text content and wraps appropriately."
            maxWidth={300}
          >
            <button style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}>
              Long Tooltip
            </button>
          </Tooltip>
        </div>
      </section>

      {/* Enhanced Buttons */}
      <section style={{ marginBottom: '30px' }}>
        <h3>🔘 Enhanced Buttons</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4>Button Variants:</h4>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <EnhancedButton variant="primary">Primary Button</EnhancedButton>
              <EnhancedButton variant="secondary">Secondary Button</EnhancedButton>
              <EnhancedButton variant="tertiary">Tertiary Button</EnhancedButton>
              <EnhancedButton variant="success">Success Button</EnhancedButton>
              <EnhancedButton variant="warning">Warning Button</EnhancedButton>
              <EnhancedButton variant="danger">Danger Button</EnhancedButton>
            </div>
          </div>
          
          <div>
            <h4>Button Sizes:</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <EnhancedButton size="small">Small Button</EnhancedButton>
              <EnhancedButton size="medium">Medium Button</EnhancedButton>
              <EnhancedButton size="large">Large Button</EnhancedButton>
            </div>
          </div>
          
          <div>
            <h4>Button States:</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <EnhancedButton>Normal</EnhancedButton>
              <EnhancedButton disabled>Disabled</EnhancedButton>
              <EnhancedButton loading={buttonLoading} onClick={handleButtonClick}>
                {buttonLoading ? 'Loading...' : 'Click to Load'}
              </EnhancedButton>
            </div>
          </div>
          
          <div>
            <h4>Buttons with Icons:</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <EnhancedButton icon="📝" iconPosition="left">With Left Icon</EnhancedButton>
              <EnhancedButton icon="✅" iconPosition="right">With Right Icon</EnhancedButton>
              <EnhancedButton icon="🔄" loading={buttonLoading} onClick={handleButtonClick}>
                Icon + Loading
              </EnhancedButton>
            </div>
          </div>
        </div>
      </section>

      {/* Combined Example */}
      <section style={{ marginBottom: '30px' }}>
        <h3>🎯 Combined Example</h3>
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <Tooltip content="Confidence level of this suggestion">
              <ConfidenceIndicator confidence={2} showPercentage />
            </Tooltip>
            <span>AI Suggestion for "Complete project report"</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Tooltip content="Accept this suggestion and add to schedule">
              <EnhancedButton variant="success" icon="✅">
                Accept
              </EnhancedButton>
            </Tooltip>
            
            <Tooltip content="Reject this suggestion">
              <EnhancedButton variant="danger" icon="❌">
                Reject
              </EnhancedButton>
            </Tooltip>
            
            <Tooltip content="View more details about this suggestion">
              <EnhancedButton variant="secondary" icon="👁️">
                View Details
              </EnhancedButton>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* Accessibility Test */}
      <section style={{ marginBottom: '30px' }}>
        <h3>♿ Accessibility Test</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Tooltip content="This tooltip is accessible with keyboard navigation">
            <button 
              style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
              tabIndex={0}
            >
              Focus me (Tab)
            </button>
          </Tooltip>
          
          <EnhancedButton disabled>
            Disabled Button
          </EnhancedButton>
          
          <EnhancedButton aria-label="Accessible button with icon">
            <span aria-hidden="true">🔘</span> Accessible
          </EnhancedButton>
        </div>
      </section>
    </div>
  );
};

export default TestUIPolish;
