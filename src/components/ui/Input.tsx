import React, { forwardRef } from 'react';
import { COMPONENT_STYLES } from '../../lib/design-tokens';
import { clsx } from '../../lib/utils';

// ============================================================================
// INPUT TYPES
// ============================================================================

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  error?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
  ref?: React.Ref<HTMLInputElement>;
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  size = 'md', 
  error = false,
  label,
  helperText,
  errorText,
  className = '',
  id,
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          COMPONENT_STYLES.input.base,
          sizeClasses[size],
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      
      {error && errorText && (
        <p className="mt-1 text-sm text-red-600">
          {errorText}
        </p>
      )}
      
      {!error && helperText && (
        <p className="mt-1 text-sm text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
