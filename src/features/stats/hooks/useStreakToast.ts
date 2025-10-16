import { useState, useCallback } from 'react';

interface ToastState {
  id: string;
  message: string;
  streakCount: number;
}

interface UseStreakToastReturn {
  showToast: (message: string, streakCount: number) => void;
  toasts: ToastState[];
  removeToast: (id: string) => void;
}

/**
 * Custom hook for managing streak toast notifications
 * Handles multiple toasts and auto-dismissal
 */
export function useStreakToast(): UseStreakToastReturn {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, streakCount: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    
    const newToast: ToastState = {
      id,
      message,
      streakCount
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    showToast,
    toasts,
    removeToast
  };
}
