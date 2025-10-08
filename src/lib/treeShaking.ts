/**
 * Tree shaking optimization utilities
 * Chỉ import những gì cần thiết để giảm bundle size
 */

// Chỉ export những function được sử dụng
export { clsx } from './utils';
export { STATUS } from './types';

// Re-export chỉ những type cần thiết
export type { 
  TaskRecord, 
  ChecklistItemRecord, 
  WorkItemRecord,
  StatusValue,
  PriorityValue,
  TaskFilters
} from './types';

// Lazy import cho các utility functions lớn
export const getDefaultFocusDuration = () => import('../features/schedule/constants').then(m => m.getDefaultFocusDuration);

// Conditional imports
export const loadCalendarComponents = () => {
  if (typeof window !== 'undefined') {
    return import('@fullcalendar/react');
  }
  return Promise.resolve(null);
};

export const loadDndComponents = () => {
  if (typeof window !== 'undefined') {
    return import('@dnd-kit/core');
  }
  return Promise.resolve(null);
};
