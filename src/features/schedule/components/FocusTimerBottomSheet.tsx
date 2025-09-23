import { memo } from "react";

interface FocusTimerBottomSheetProps {
  timerAnimating: boolean;
  timerItem: { title: string } | null;
  timerRunning: boolean;
  timerRemain: number;
  customDuration: number;
  onClose: () => void;
  onSetCustomDuration: (duration: number) => void;
  onStartCustomDuration: (minutes: number) => void;
  onSetTimerRunning: (running: boolean) => void;
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
  onClose,
  onSetCustomDuration,
  onStartCustomDuration,
  onSetTimerRunning,
}: FocusTimerBottomSheetProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          timerAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Windows 11 Style Modal */}
      <div 
        className={`relative rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          timerAnimating 
            ? 'translate-y-0' 
            : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-md px-8 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900">Focus Session</h3>
            <p className="mt-1 text-sm text-gray-600">
              {timerItem ? timerItem.title : "Select a task to focus on"}
            </p>
          </div>

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
                <label className="text-sm font-medium text-gray-700">Total Duration</label>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => onSetCustomDuration(Math.max(30, customDuration - 30))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <div className="text-center">
                    <div className="text-2xl font-medium text-gray-900">{customDuration}</div>
                    <div className="text-sm text-gray-600">minutes</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetCustomDuration(Math.min(480, customDuration + 30))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onStartCustomDuration(customDuration)}
                  className="flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="font-medium">Start {customDuration}min Session</span>
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
                <span className="font-medium">Pause</span>
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
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
