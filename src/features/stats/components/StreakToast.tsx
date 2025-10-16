import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface StreakToastProps {
  message: string;
  streakCount: number;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component for streak celebrations
 * Shows slide-in animation with counter animation
 */
export default function StreakToast({ 
  message, 
  streakCount, 
  onClose, 
  duration = 3000 
}: StreakToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Counter animation
    if (streakCount > 0) {
      setIsAnimating(true);
      const duration = 1000; // 1 second
      const steps = 60; // 60fps
      const increment = streakCount / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newValue = Math.min(Math.floor(increment * currentStep), streakCount);
        setDisplayCount(newValue);

        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayCount(streakCount);
          setIsAnimating(false);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [streakCount]);

  useEffect(() => {
    // Auto-dismiss
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for slide-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const toastContent = (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 min-w-[300px] max-w-[400px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🔥</div>
            <div>
              <div className="font-semibold text-slate-900">{message}</div>
              <div className="text-sm text-slate-600">
                Current streak: 
                <span className={`ml-1 font-bold text-orange-600 ${isAnimating ? 'animate-pulse' : ''}`}>
                  {displayCount}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-slate-200 rounded-full h-1">
          <div 
            className="bg-gradient-to-r from-orange-400 to-red-500 h-1 rounded-full transition-all duration-100 ease-linear"
            style={{ 
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
    </div>
  );

  // Render to portal to avoid z-index issues
  return createPortal(toastContent, document.body);
}

// CSS animation for progress bar
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);
