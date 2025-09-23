import { type ReactNode } from 'react';
import { COMPONENT_STYLES, TYPOGRAPHY, SHADOWS, TRANSITIONS } from '../../lib/design-tokens';
import { clsx } from '../../lib/utils';

// ============================================================================
// SYSTEM ERROR TYPES
// ============================================================================

export type SystemErrorVariant = 'error' | 'warning' | 'info' | 'offline';

export interface SystemErrorAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export interface SystemErrorProps {
  /** Error title/heading */
  title?: string;
  /** Error message/description */
  message?: string;
  /** Error variant for styling */
  variant?: SystemErrorVariant;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Action buttons */
  actions?: SystemErrorAction[];
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as full-screen overlay */
  fullScreen?: boolean;
  /** Custom content to render instead of default layout */
  children?: ReactNode;
}

// ============================================================================
// SYSTEM ERROR COMPONENT
// ============================================================================

export default function SystemError({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  variant = 'error',
  icon,
  actions = [],
  className = '',
  fullScreen = false,
  children,
}: SystemErrorProps) {
  // Variant-specific styling
  const variantStyles = {
    error: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      titleColor: 'text-slate-900',
      messageColor: 'text-slate-600',
    },
    warning: {
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      titleColor: 'text-slate-900',
      messageColor: 'text-slate-600',
    },
    info: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      titleColor: 'text-slate-900',
      messageColor: 'text-slate-600',
    },
    offline: {
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600',
      titleColor: 'text-slate-900',
      messageColor: 'text-slate-600',
    },
  };

  // Default icons for each variant
  const defaultIcons = {
    error: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    offline: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
      </svg>
    ),
  };

  const currentVariant = variantStyles[variant];
  const displayIcon = icon || defaultIcons[variant];

  // Button variant mapping
  const buttonVariants = {
    primary: COMPONENT_STYLES.button.primary,
    secondary: COMPONENT_STYLES.button.secondary,
    ghost: COMPONENT_STYLES.button.ghost,
  };

  const containerClasses = clsx(
    fullScreen 
      ? 'min-h-screen flex items-center justify-center bg-slate-50 p-4'
      : 'w-full',
    className
  );

  const cardClasses = clsx(
    COMPONENT_STYLES.card.base,
    SHADOWS.md,
    fullScreen ? 'max-w-md w-full' : 'w-full',
    'p-6'
  );

  // If children are provided, render them instead of default layout
  if (children) {
    return (
      <div className={containerClasses}>
        <div className={cardClasses}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Header with icon and title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            currentVariant.iconBg,
            currentVariant.iconColor
          )}>
            {displayIcon}
          </div>
          <h2 className={clsx(
            TYPOGRAPHY.text.lg,
            TYPOGRAPHY.weight.semibold,
            currentVariant.titleColor
          )}>
            {title}
          </h2>
        </div>

        {/* Message */}
        <p className={clsx(
          TYPOGRAPHY.text.sm,
          currentVariant.messageColor,
          'mb-6'
        )}>
          {message}
        </p>

        {/* Action buttons */}
        {actions.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.loading}
                className={clsx(
                  COMPONENT_STYLES.button.base,
                  buttonVariants[action.variant || 'primary'],
                  'px-4 py-2 text-sm font-medium',
                  TRANSITIONS.colors,
                  action.loading && 'opacity-50 cursor-not-allowed',
                  actions.length === 1 ? 'w-full' : 'flex-1'
                )}
              >
                {action.loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading...
                  </div>
                ) : (
                  action.label
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PRESET ERROR COMPONENTS
// ============================================================================

export function NetworkError({ onRetry, loading }: { onRetry?: () => void; loading?: boolean }) {
  return (
    <SystemError
      variant="offline"
      title="Connection lost"
      message="It looks like you're offline. Please check your internet connection and try again."
      actions={onRetry ? [{ label: 'Try again', onClick: onRetry, loading }] : []}
    />
  );
}

export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <SystemError
      variant="info"
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
      actions={onGoHome ? [{ label: 'Go home', onClick: onGoHome }] : []}
    />
  );
}

export function ServerError({ onRetry, loading }: { onRetry?: () => void; loading?: boolean }) {
  return (
    <SystemError
      variant="error"
      title="Server error"
      message="Something went wrong on our end. We're working to fix it."
      actions={onRetry ? [{ label: 'Try again', onClick: onRetry, loading }] : []}
    />
  );
}

export function GenericError({ onRetry, loading }: { onRetry?: () => void; loading?: boolean }) {
  return (
    <SystemError
      variant="error"
      title="Something went wrong"
      message="We encountered an unexpected error. Please try again."
      actions={onRetry ? [{ label: 'Try again', onClick: onRetry, loading }] : []}
    />
  );
}
