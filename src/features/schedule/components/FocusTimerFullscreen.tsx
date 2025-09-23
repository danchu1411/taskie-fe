import { memo } from "react";

interface FocusTimerFullscreenProps {
  isDarkTheme: boolean;
  currentSession: number;
  sessionPlan: Array<{ type: "focus" | "short-break" | "long-break"; duration: number }>;
  timerRemain: number;
  timerDuration: number;
  timerRunning: boolean;
  onToggleRunning: () => void;
  onEnterFloatingMode: () => void;
  onClose: () => void;
  onToggleTheme: () => void;
}

export const FocusTimerFullscreen = memo(function FocusTimerFullscreen({
  isDarkTheme,
  currentSession,
  sessionPlan,
  timerRemain,
  timerDuration,
  timerRunning,
  onToggleRunning,
  onEnterFloatingMode,
  onClose,
  onToggleTheme,
}: FocusTimerFullscreenProps) {
  return (
    <div className={`fixed inset-0 z-50 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="flex h-full flex-col items-center justify-center">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className={`text-xl font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            Focus period ({currentSession} of {sessionPlan.length})
          </h1>
        </div>

        {/* Circular Timer */}
        <div className="mb-12 relative">
          <div className="relative w-80 h-80">
            {/* Background Circle */}
            <div className={`absolute inset-0 rounded-full border ${
              isDarkTheme 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-100 border-gray-300'
            }`}>
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={isDarkTheme ? 'text-gray-600' : 'text-gray-300'}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - (timerRemain / timerDuration))}`}
                  className="text-blue-500 transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-5xl font-light mb-1 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {Math.floor(timerRemain / (60 * 1000))}
                </div>
                <div className={`text-lg ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  min
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Pause/Resume Button */}
          <button
            onClick={onToggleRunning}
            className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white transition hover:bg-blue-600"
          >
            {timerRunning ? (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          {/* More Options Button */}
          <button
            onClick={onEnterFloatingMode}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
              isDarkTheme 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>

        {/* Next Session Info */}
        <div className="mt-8 text-center">
          <div className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
            Up next: <span className="font-semibold">
              {currentSession < sessionPlan.length ? 
                `${sessionPlan[currentSession]?.duration || 5} min break` : 
                'Session complete'
              }
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition ${
            isDarkTheme 
              ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'bg-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-300'
          }`}
          title={isDarkTheme ? 'Switch to Light' : 'Switch to Dark'}
        >
          {isDarkTheme ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition ${
            isDarkTheme 
              ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'bg-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-300'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});
