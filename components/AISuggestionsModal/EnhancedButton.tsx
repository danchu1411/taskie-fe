import React, { useState, useRef } from 'react';
import './styles/EnhancedButton.css';

interface EnhancedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  ripple?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  animated = true,
  ripple = true,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  icon,
  iconPosition = 'left'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = {
        id: rippleIdRef.current++,
        x,
        y
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (disabled || loading) return;
    onClick?.();
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span className={`button-icon ${iconPosition === 'right' ? 'icon-right' : 'icon-left'}`}>
        {icon}
      </span>
    );
  };

  const renderLoadingSpinner = () => {
    if (!loading) return null;
    
    return (
      <span className="button-loading">
        <span className="loading-spinner" />
      </span>
    );
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`
        enhanced-button 
        ${variant} 
        ${size} 
        ${animated ? 'animated' : ''} 
        ${isPressed ? 'pressed' : ''} 
        ${loading ? 'loading' : ''} 
        ${disabled ? 'disabled' : ''} 
        ${className}
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
    >
      <span className="button-content">
        {iconPosition === 'left' && renderIcon()}
        {renderLoadingSpinner()}
        <span className="button-text">
          {children}
        </span>
        {iconPosition === 'right' && renderIcon()}
      </span>
      
      {ripple && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="button-ripple"
          style={{
            left: ripple.x,
            top: ripple.y
          }}
        />
      ))}
    </button>
  );
};

export default EnhancedButton;
