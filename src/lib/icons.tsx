// Icon System - Centralized icon components and mappings
// This file contains all reusable icon components

import React from 'react';

// ============================================================================
// ICON TYPES
// ============================================================================

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconVariant = 'outline' | 'solid' | 'mini';

// ============================================================================
// ICON SIZE MAPPING
// ============================================================================

export const ICON_SIZES: Record<IconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4', 
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

// ============================================================================
// ICON COMPONENT BASE
// ============================================================================

interface IconProps {
  size?: IconSize;
  className?: string;
  children: React.ReactNode;
}

function Icon({ size = 'md', className = '', children }: IconProps) {
  return (
    <svg 
      className={`${ICON_SIZES[size]} ${className}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

// ============================================================================
// STATUS ICONS
// ============================================================================

export function StatusIcon({ status, size = 'sm', className = '' }: {
  status: 'planned' | 'inProgress' | 'done' | 'skipped';
  size?: IconSize;
  className?: string;
}) {
  const icons = {
    planned: (
      <Icon size={size} className={className}>
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <path d="M12 6v6l4 2" strokeWidth="2"/>
      </Icon>
    ),
    inProgress: (
      <Icon size={size} className={className}>
        <path d="M21 12a9 9 0 11-6.219-8.56" strokeWidth="2"/>
        <path d="M12 2v10l4 2" strokeWidth="2"/>
      </Icon>
    ),
    done: (
      <Icon size={size} className={className}>
        <path d="M9 12l2 2 4-4" strokeWidth="2"/>
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
      </Icon>
    ),
    skipped: (
      <Icon size={size} className={className}>
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <path d="M15 9l-6 6" strokeWidth="2"/>
        <path d="M9 9l6 6" strokeWidth="2"/>
      </Icon>
    ),
  };
  
  return icons[status];
}

// ============================================================================
// PRIORITY ICONS
// ============================================================================

export function PriorityIcon({ priority, size = 'sm', className = '' }: {
  priority: 'must' | 'should' | 'want';
  size?: IconSize;
  className?: string;
}) {
  const icons = {
    must: (
      <Icon size={size} className={className}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2"/>
      </Icon>
    ),
    should: (
      <Icon size={size} className={className}>
        <path d="M12 2l2.5 5.5L20 8l-4.5 4.5L17 20l-5-2.5L7 20l1.5-7.5L4 8l5.5-.5L12 2z" strokeWidth="2"/>
      </Icon>
    ),
    want: (
      <Icon size={size} className={className}>
        <circle cx="12" cy="12" r="3" strokeWidth="2"/>
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" strokeWidth="2"/>
      </Icon>
    ),
  };
  
  return icons[priority];
}

// ============================================================================
// ACTION ICONS
// ============================================================================

export function EditIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
    </Icon>
  );
}

export function DeleteIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <polyline points="3,6 5,6 21,6" strokeWidth="2"/>
      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" strokeWidth="2"/>
      <line x1="10" y1="11" x2="10" y2="17" strokeWidth="2"/>
      <line x1="14" y1="11" x2="14" y2="17" strokeWidth="2"/>
    </Icon>
  );
}

export function AddIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/>
      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
    </Icon>
  );
}

export function CheckIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <polyline points="20,6 9,17 4,12" strokeWidth="2"/>
    </Icon>
  );
}

export function CloseIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
    </Icon>
  );
}

// ============================================================================
// NAVIGATION ICONS
// ============================================================================

export function HomeIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2"/>
      <polyline points="9,22 9,12 15,12 15,22" strokeWidth="2"/>
    </Icon>
  );
}

export function TasksIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2"/>
      <path d="M9 12l2 2 4-4" strokeWidth="2"/>
    </Icon>
  );
}

export function CalendarIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
    </Icon>
  );
}

export function SettingsIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2"/>
    </Icon>
  );
}

// ============================================================================
// TIME & DATE ICONS
// ============================================================================

export function ClockIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
      <polyline points="12,6 12,12 16,14" strokeWidth="2"/>
    </Icon>
  );
}

export function CalendarDaysIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2"/>
    </Icon>
  );
}

// ============================================================================
// UTILITY ICONS
// ============================================================================

export function SearchIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="11" cy="11" r="8" strokeWidth="2"/>
      <path d="M21 21l-4.35-4.35" strokeWidth="2"/>
    </Icon>
  );
}

export function BellIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2"/>
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeWidth="2"/>
    </Icon>
  );
}

export function UserIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="2"/>
      <circle cx="12" cy="7" r="4" strokeWidth="2"/>
    </Icon>
  );
}

export function ChevronDownIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <polyline points="6,9 12,15 18,9" strokeWidth="2"/>
    </Icon>
  );
}

export function ChevronRightIcon({ size = 'sm', className = '' }: { size?: IconSize; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <polyline points="9,18 15,12 9,6" strokeWidth="2"/>
    </Icon>
  );
}

// ============================================================================
// ICON MAPPINGS
// ============================================================================

export const STATUS_ICONS = {
  planned: StatusIcon,
  inProgress: StatusIcon,
  done: StatusIcon,
  skipped: StatusIcon,
} as const;

export const PRIORITY_ICONS = {
  must: PriorityIcon,
  should: PriorityIcon,
  want: PriorityIcon,
} as const;

export const ACTION_ICONS = {
  edit: EditIcon,
  delete: DeleteIcon,
  add: AddIcon,
  check: CheckIcon,
  close: CloseIcon,
} as const;

export const NAVIGATION_ICONS = {
  home: HomeIcon,
  tasks: TasksIcon,
  calendar: CalendarIcon,
  settings: SettingsIcon,
} as const;

export const TIME_ICONS = {
  clock: ClockIcon,
  calendar: CalendarDaysIcon,
} as const;

export const UTILITY_ICONS = {
  search: SearchIcon,
  bell: BellIcon,
  user: UserIcon,
  chevronDown: ChevronDownIcon,
  chevronRight: ChevronRightIcon,
} as const;

