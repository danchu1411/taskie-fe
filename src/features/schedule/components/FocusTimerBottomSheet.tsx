import { memo } from "react";
import { getNextDuration } from "../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { TodayItem } from "../hooks/useTodayData";

interface FocusTimerBottomSheetProps {
  timerAnimating: boolean;
  timerItem: { title: string; id?: string } | null;
  timerRunning: boolean;
  timerRemain: number;
  customDuration: number;
  skipBreaks: boolean;
  availableTasks: TodayItem[];
  onClose: () => void;
  onSetCustomDuration: (duration: number) => void;
  onStartCustomDuration: (minutes: number, options?: { skipBreaks?: boolean }) => void;
  onSetTimerRunning: (running: boolean) => void;
  onSkipBreaksChange: (value: boolean) => void;
  onTaskSelect: (task: TodayItem) => void;
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export const FocusTimerBottomSheet = memo(function FocusTimerBottomSheet({
  timerAnimating,
  timerItem,
  timerRunning,
  timerRemain,
  customDuration,
  skipBreaks,
  availableTasks,
  onClose,
  onSetCustomDuration,
  onStartCustomDuration,
  onSetTimerRunning,
  onSkipBreaksChange,
  onTaskSelect,
}: FocusTimerBottomSheetProps) {
  const { t } = useLanguage();
  
  // Debug: Log conditions for dropdown visibility
  console.log('FocusTimer Debug:', {
    timerRunning,
    timerItem,
    availableTasksCount: availableTasks.length,
    shouldShowDropdown: !timerRunning && !timerItem && availableTasks.length > 0
  });

  const overlayClasses = timerAnimating
    ? "flex-1 bg-black/20 transition-opacity duration-300 opacity-100"
    : "flex-1 bg-black/20 transition-opacity duration-300 opacity-0 pointer-events-none";

  return (
    <div className="fixed inset-0 z-[110] flex flex-col justify-end">
      <div className={overlayClasses} onClick={onClose} />

      <div
        className={`relative rounded-t-3xl bg-white shadow-[0_-18px_40px_-25px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-out ${
          timerAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-md px-8 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900">{t('today.timer.session')}</h3>
            {timerItem ? (
              <p className="mt-1 text-sm text-gray-600">{timerItem.title}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">{t('today.timer.focus')}</p>
            )}
          </div>

          {/* Task Selector - Only show when not running and no task selected */}
          {!timerRunning && !timerItem && availableTasks.length > 0 && (
            <div className="mb-8">
              <label htmlFor="task-select" className="block text-sm font-medium text-gray-700 mb-2">
                {t('today.timer.focus')}
              </label>
              <select
                id="task-select"
                onChange={(e) => {
                  const selectedTask = availableTasks.find(t => t.id === e.target.value);
                  if (selectedTask) {
                    onTaskSelect(selectedTask);
                  }
                }}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2.5 px-3"
                defaultValue=""
              >
                <option value="" disabled>{t('today.modals.quickAddPlaceholder')}</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.parentTitle ? `${task.parentTitle} › ` : ''}{task.title}
                    {task.plannedMinutes ? ` (${task.plannedMinutes} ${t('common.minutes')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Display - Only show when running */}
          {timerRunning && (
            <div className="mb-8 text-center">
              <div className="text-4xl font-light text-gray-900">
                {formatTime(timerRemain)}
              </div>
            </div>
          )}

          {/* Duration Controls - Only show when not running */}
          {!timerRunning && (
            <div className="mb-8">
              <div className="text-center mb-6">
                <label className="text-sm font-medium text-gray-700">{t('today.timer.customDuration')}</label>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => onSetCustomDuration(getNextDuration(customDuration, 'down'))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <div className="text-center">
                    <div className="text-2xl font-medium text-gray-900">{customDuration}</div>
                    <div className="text-sm text-gray-600">{t('common.minutes') || 'minutes'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetCustomDuration(getNextDuration(customDuration, 'up'))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mb-4 flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  id="skip-breaks-toggle"
                  checked={skipBreaks}
                  onChange={(e) => onSkipBreaksChange(e.target.checked)}
                  disabled={timerRunning}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <label
                  htmlFor="skip-breaks-toggle"
                  className={`text-sm font-medium ${timerRunning ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}
                >
                  {t('today.timer.skipBreaks')}
                </label>
              </div>
              
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onStartCustomDuration(customDuration, { skipBreaks })}
                  className="flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="font-medium">{t('common.start') || 'Start'} {customDuration}min {t('today.timer.session')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show when running */}
          {timerRunning && (
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => onSetTimerRunning(false)}
                className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-6 py-3 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                <span className="font-medium">{t('today.timer.pause')}</span>
              </button>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});