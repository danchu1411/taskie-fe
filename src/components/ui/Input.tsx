import { forwardRef, type InputHTMLAttributes } from 'react';
import { COMPONENT_STYLES } from '../../lib/design-tokens';
import { clsx } from '../../lib/utils';

export type InputSize = 'sm' | 'md' | 'lg';

type InputBaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

interface InputProps extends InputBaseProps {
  size?: InputSize;
  error?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
}

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

  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 11)}`;

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
        aria-invalid={error || undefined}
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
