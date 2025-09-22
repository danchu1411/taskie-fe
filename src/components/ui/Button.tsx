import React from 'react';
import { COMPONENT_STYLES, TRANSITIONS } from '../../lib/design-tokens';
import { clsx } from '../../lib/utils';

// ============================================================================
// BUTTON TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className = '',
  disabled,
  children,
  ...props 
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: COMPONENT_STYLES.button.primary,
    secondary: COMPONENT_STYLES.button.secondary,
    ghost: COMPONENT_STYLES.button.ghost,
    danger: COMPONENT_STYLES.button.danger,
  };

  return (
    <button
      className={clsx(
        COMPONENT_STYLES.button.base,
        variantClasses[variant],
        sizeClasses[size],
        TRANSITIONS.colors,
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

