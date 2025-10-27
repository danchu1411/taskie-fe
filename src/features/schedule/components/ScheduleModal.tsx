import { memo, useMemo } from "react";
import type { TodayItem } from "../hooks/useTodayData";
import { getFocusDurationOptions } from "../constants";
import { useLanguage } from "../../../contexts/LanguageContext";

interface ScheduleModalProps {
  open: boolean;
  selectedItem: TodayItem | null;
  startAt: string;
  minutes: number;
  onStartAtChange: (value: string) => void;
  onMinutesChange: (value: number) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  isEditMode?: boolean;
}

export const ScheduleModal = memo(function ScheduleModal({
  open,
  selectedItem,
  startAt,
  minutes,
  onStartAtChange,
  onMinutesChange,
  onSave,
  onCancel,
  loading,
  isEditMode = false,
}: ScheduleModalProps) {
  const { t } = useLanguage();
  
  // Get current time in local timezone for min attribute
  const minDateTime = useMemo(() => {
    const now = new Date();
    // Format: YYYY-MM-DDThh:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [open]); // Recalculate when modal opens

  // Check if selected time is in the past
  const isPastTime = useMemo(() => {
    if (!startAt) return false;
    const selectedTime = new Date(startAt).getTime();
    const now = Date.now();
    return selectedTime < now;
  }, [startAt]);

  if (!open || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{t('today.modals.schedule.title')}</h3>
          <p className="text-sm text-slate-600">{selectedItem.title}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="schedule-start" className="block text-sm font-medium text-slate-700 mb-1">
              {t('today.modals.schedule.startTime')}
            </label>
            <input
              id="schedule-start"
              type="datetime-local"
              value={startAt}
              min={minDateTime}
              onChange={(e) => onStartAtChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isPastTime 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {isPastTime && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {t('today.modals.schedule.cannotSchedulePast')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="schedule-minutes" className="block text-sm font-medium text-slate-700 mb-1">
              {t('today.modals.schedule.duration')}
            </label>
            <select
              id="schedule-minutes"
              value={minutes}
              onChange={(e) => onMinutesChange(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {getFocusDurationOptions().map((option) => (
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
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading || isPastTime}
            className={`flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 ${
              (loading || isPastTime) ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {loading 
              ? (isEditMode ? t('today.modals.schedule.updating') : t('today.modals.schedule.creating')) 
              : (isEditMode ? t('today.modals.schedule.update') : t('today.modals.schedule.create'))
            }
          </button>
        </div>
      </div>
    </div>
  );
});
