import { memo, useCallback } from 'react';
import type { TodayItem } from '../../lib';
import { STATUS } from '../../lib';
import { StatusBadge, PriorityBadge, DueDateBadge } from '../ui';

interface TodayTaskCardProps {
  item: TodayItem;
  onStart?: (item: TodayItem) => void;
  onSchedule?: (item: TodayItem) => void;
  onEdit?: (item: TodayItem) => void;
  onStatusModal?: (item: TodayItem) => void;
  isUpdating?: boolean;
}

const TodayTaskCard = memo(function TodayTaskCard({
  item,
  onStart,
  onSchedule,
  onEdit,
  onStatusModal: _onStatusModal,
  isUpdating = false,
}: TodayTaskCardProps) {
  const handleStart = useCallback(() => {
    onStart?.(item);
  }, [onStart, item]);

  const handleSchedule = useCallback(() => {
    onSchedule?.(item);
  }, [onSchedule, item]);

  const handleEdit = useCallback(() => {
    onEdit?.(item);
  }, [onEdit, item]);

  // const _handleStatusModal = useCallback(() => {
  //   onStatusModal?.(item);
  // }, [onStatusModal, item]);

  return (
    <div className={`group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md ${
      isUpdating ? 'opacity-60' : ''
    }`}>
      <div className="mb-3 flex items-start justify-between">
        <StatusBadge
          status={item.status}
          disabled={isUpdating}
        />
        <div className="flex items-center gap-2">
          {item.priority && <PriorityBadge priority={item.priority} />}
          {item.deadline && <DueDateBadge deadline={item.deadline} />}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-medium text-slate-900">{item.title}</h3>
        {item.parentTitle && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            {item.parentTitle}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {item.status === STATUS.PLANNED && onStart && (
          <button
            type="button"
            onClick={handleStart}
            disabled={isUpdating}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            Start
          </button>
        )}
        
        {onSchedule && (
          <button
            type="button"
            onClick={handleSchedule}
            disabled={isUpdating}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Schedule
          </button>
        )}
        
        {onEdit && (
          <button
            type="button"
            onClick={handleEdit}
            disabled={isUpdating}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
});

export { TodayTaskCard };
export default TodayTaskCard;
