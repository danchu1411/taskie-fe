import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useTimer } from '../hooks/useTimer';

// Generic timer item interface - can be used with any item type
export interface TimerItem {
  id: string;
  title: string;
  status: number;
  plannedMinutes?: number | null;
  source?: 'task' | 'checklist';
  parentTitle?: string | null;
  taskId?: string | null;
  checklistItemId?: string | null;
}

// Timer context callbacks
export interface TimerCallbacks {
  onStartFocus?: (item: TimerItem) => void;
  onComplete?: (item: TimerItem | null) => void;
}

// Timer context value
interface TimerContextValue {
  // Timer state and actions from useTimer hook
  timerOpen: boolean;
  setTimerOpen: (open: boolean) => void;
  timerAnimating: boolean;
  setTimerAnimating: (v: boolean) => void;
  timerMode: "focus" | "break";
  setTimerMode: (m: "focus" | "break") => void;
  timerDuration: number;
  setTimerDuration: (ms: number) => void;
  timerRemain: number;
  setTimerRemain: (ms: number) => void;
  timerRunning: boolean;
  setTimerRunning: (running: boolean | ((prev: boolean) => boolean)) => void;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  isFloating: boolean;
  setIsFloating: (v: boolean) => void;
  currentSession: number;
  setCurrentSession: (n: number | ((n: number) => number)) => void;
  sessionPlan: Array<{ type: "focus" | "short-break" | "long-break"; duration: number }>;
  setSessionPlan: (p: Array<{ type: "focus" | "short-break" | "long-break"; duration: number }>) => void;
  isCustomMode: boolean;
  setIsCustomMode: (v: boolean) => void;
  timerItem: TimerItem | null;
  setTimerItemId: (id: string | null) => void;
  widgetPosition: { x: number; y: number };
  setWidgetPosition: (pos: { x: number; y: number }) => void;
  isDarkTheme: boolean;
  setIsDarkTheme: (v: boolean) => void;
  skipBreaks: boolean;
  setSkipBreaks: (v: boolean) => void;
  
  // Actions
  openTimer: (item?: TimerItem) => void;
  closeTimer: () => void;
  enterFloatingMode: () => void;
  exitFloatingMode: () => void;
  startCustomDuration: (minutes: number, options?: { skipBreaks?: boolean }) => void;
  applyFloatingDelta: (delta: { x: number; y: number }) => void;
  
  // Components
  FloatingWidget: (props?: { onRequestClose?: () => void }) => JSX.Element;
  
  // Callbacks
  setCallbacks: (callbacks: TimerCallbacks) => void;
  
  // Items management
  setItems: (items: TimerItem[]) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

// Timer provider component
interface TimerProviderProps {
  children: React.ReactNode;
  items: TimerItem[];
}

export function TimerProvider({ children, items: initialItems }: TimerProviderProps) {
  const [callbacks, setCallbacks] = React.useState<TimerCallbacks>({});
  const [items, setItems] = React.useState<TimerItem[]>(initialItems);
  
  // Create memoized callbacks
  const onStartFocus = useCallback((item: TimerItem) => {
    callbacks.onStartFocus?.(item);
  }, [callbacks.onStartFocus]);
  
  const onComplete = useCallback((item: TimerItem | null) => {
    callbacks.onComplete?.(item);
  }, [callbacks.onComplete]);
  
  // Use timer hook with callbacks
  const timer = useTimer({
    items,
    onStartFocus,
    onComplete,
  });
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...timer,
    setCallbacks,
    setItems,
  }), [timer, setCallbacks, setItems]);
  
  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
}

// Hook to use timer context
export function useTimerContext(): TimerContextValue {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}

// Hook to set timer callbacks
export function useTimerCallbacks(callbacks: TimerCallbacks) {
  const { setCallbacks } = useTimerContext();
  
  React.useEffect(() => {
    setCallbacks(callbacks);
  }, [callbacks, setCallbacks]);
}
