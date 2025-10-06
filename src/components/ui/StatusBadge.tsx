import { clsx } from '../../lib/utils';
import { STATUS } from '../../lib';
import type { StatusValue } from '../../lib';

interface StatusBadgeProps {
  status: StatusValue;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function StatusBadge({ 
  status, 
  onClick, 
  disabled = false,
  className 
}: StatusBadgeProps) {
  const getStatusConfig = (status: StatusValue) => {
    switch (status) {
      case STATUS.PLANNED:
        return {
          label: 'Planned',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          hoverColor: 'hover:bg-blue-200'
        };
      case STATUS.IN_PROGRESS:
        return {
          label: 'In Progress',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
          hoverColor: 'hover:bg-amber-200'
        };
      case STATUS.DONE:
        return {
          label: 'Done',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          hoverColor: 'hover:bg-green-200'
        };
      case STATUS.SKIPPED:
        return {
          label: 'Skipped',
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          borderColor: 'border-slate-200',
          hoverColor: 'hover:bg-slate-200'
        };
      default:
        return {
          label: 'Unknown',
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          borderColor: 'border-slate-200',
          hoverColor: 'hover:bg-slate-200'
        };
    }
  };

  const config = getStatusConfig(status);

  const baseClasses = clsx(
    'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border transition-colors',
    config.bgColor,
    config.textColor,
    config.borderColor,
    !disabled && onClick && config.hoverColor,
    disabled && 'opacity-50 cursor-not-allowed',
    onClick && !disabled && 'cursor-pointer',
    className
  );

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={baseClasses}
        disabled={disabled}
      >
        {config.label}
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      {config.label}
    </span>
  );
}
