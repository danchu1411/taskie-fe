import { memo } from "react";
import type { TodayItem } from "../hooks/useTodayData";

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
}: ScheduleModalProps) {
  if (!open || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Schedule Task</h3>
          <p className="text-sm text-slate-600">{selectedItem.title}</p>
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
              onChange={(e) => onStartAtChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
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
              <option value={15}>15 minutes</option>
              <option value={25}>25 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className={`flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 ${
              loading ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {loading ? "Creating..." : "Create Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
});
