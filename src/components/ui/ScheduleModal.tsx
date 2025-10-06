import { useMemo } from "react";
import type { TaskRecord, ChecklistItemRecord } from "../../lib";
import { getFocusDurationOptions } from "../../features/schedule/constants";

export interface ScheduleModalProps {
  open: boolean;
  item: TaskRecord | ChecklistItemRecord | null;
  startAt: string;
  minutes: number;
  onStartAtChange: (value: string) => void;
  onMinutesChange: (value: number) => void;
  onSave: () => void;
  onCancel: () => void;
  loading?: boolean;
  isEditMode?: boolean;
}

export default function ScheduleModal({
  open,
  item,
  startAt,
  minutes,
  onStartAtChange,
  onMinutesChange,
  onSave,
  onCancel,
  loading = false,
  isEditMode = false,
}: ScheduleModalProps) {
  // Get current time in local timezone for min attribute
  const minDateTime = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [open]);

  // Check if selected time is in the past
  const isPastTime = useMemo(() => {
    if (!startAt) return false;
    const selectedTime = new Date(startAt).getTime();
    const now = Date.now();
    return selectedTime < now;
  }, [startAt]);

  // Get deadline from item
  const itemDeadline = useMemo(() => {
    if (!item) return null;
    return item.deadline || null;
  }, [item]);

  // Check if start time is after deadline (warning only)
  const hasDeadlineConflict = useMemo(() => {
    if (!startAt || !itemDeadline) return false;
    const startTime = new Date(startAt).getTime();
    const deadlineTime = new Date(itemDeadline).getTime();
    return startTime > deadlineTime;
  }, [startAt, itemDeadline]);

  if (!open || !item) return null;

  const itemTitle = item.title || "(Untitled)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditMode ? "Reschedule" : "Schedule"} Task
          </h3>
          <p className="text-sm text-slate-600 mt-1">{itemTitle}</p>
          {itemDeadline && (
            <p className="text-xs text-slate-500 mt-1">
              Deadline: {new Date(itemDeadline).toLocaleString([], { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="schedule-start" className="block text-sm font-medium text-slate-700 mb-1">
              Start Time
            </label>
            <input
              id="schedule-start"
              type="datetime-local"
              value={startAt}
              min={minDateTime}
              onChange={(e) => onStartAtChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
                isPastTime 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                  : hasDeadlineConflict
                  ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/20'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {isPastTime && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Cannot schedule in the past. Please select a future time.
              </p>
            )}
            {!isPastTime && hasDeadlineConflict && (
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Warning: Scheduled to start after the deadline
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="schedule-minutes" className="block text-sm font-medium text-slate-700 mb-1">
              Duration (minutes)
            </label>
            <select
              id="schedule-minutes"
              value={minutes}
              onChange={(e) => onMinutesChange(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {getFocusDurationOptions().filter(opt => opt.value >= 1).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading || isPastTime}
            className={`flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 ${
              (loading || isPastTime) ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {loading 
              ? (isEditMode ? "Updating..." : "Scheduling...") 
              : (isEditMode ? "Update Schedule" : "Schedule")
            }
          </button>
        </div>
      </div>
    </div>
  );
}

