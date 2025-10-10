import { useCallback, useEffect, useMemo, useState, useRef, createElement } from "react";
import type { Dispatch, SetStateAction, JSX } from "react";
import { DEFAULT_VALUES, TIMER_INTERVALS } from "../features/schedule/constants/cacheConfig";
import { timerSounds } from "../features/schedule/utils/timerSounds";
import { FloatingWidget } from "../components/ui/FloatingWidget";
import type { TimerItem } from "../contexts/TimerContext";

type SessionType = "focus" | "short-break" | "long-break";

export type TimerHookParams = {
  items: TimerItem[];
  onStartFocus: (item: TimerItem) => void;
  onComplete?: (item: TimerItem | null) => void;
};

export type TimerHook = {
  // state
  timerOpen: boolean;
  setTimerOpen: (open: boolean) => void;
  timerAnimating: boolean;
  setTimerAnimating: (v: boolean) => void;
  timerMode: "focus" | "break";
  setTimerMode: (m: "focus" | "break") => void;
  timerDuration: number; // ms
  setTimerDuration: (ms: number) => void;
  timerRemain: number; // ms
  setTimerRemain: (ms: number) => void;
  timerRunning: boolean;
  setTimerRunning: Dispatch<SetStateAction<boolean>>;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  isFloating: boolean;
  setIsFloating: (v: boolean) => void;
  currentSession: number;
  setCurrentSession: (n: number | ((n: number) => number)) => void;
  sessionPlan: Array<{ type: SessionType; duration: number }>; // minutes
  setSessionPlan: (p: Array<{ type: SessionType; duration: number }>) => void;
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

  // actions
  openTimer: (item?: TimerItem) => void;
  closeTimer: () => void;
  enterFloatingMode: () => void;
  exitFloatingMode: () => void;
  startCustomDuration: (minutes: number, options?: { skipBreaks?: boolean }) => void;
  applyFloatingDelta: (delta: { x: number; y: number }) => void;

  // Floating widget component
  FloatingWidget: (props?: { onRequestClose?: () => void }) => JSX.Element;
};

export function useTimer(params: TimerHookParams): TimerHook {
  const { items, onStartFocus, onComplete } = params;

  const [timerOpen, setTimerOpen] = useState(false);
  const [timerAnimating, setTimerAnimating] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timerDuration, setTimerDuration] = useState(DEFAULT_VALUES.FOCUS_DURATION_MINUTES * 60 * 1000);
  const [timerRemain, setTimerRemain] = useState(timerDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerItemId, setTimerItemId] = useState<string | null>(null);

  const [currentSession, setCurrentSession] = useState(1);
  const [sessionPlan, setSessionPlan] = useState<Array<{ type: SessionType; duration: number }>>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<{ x: number; y: number }>({ 
    x: DEFAULT_VALUES.WIDGET_EDGE_MARGIN, 
    y: DEFAULT_VALUES.WIDGET_EDGE_MARGIN 
  });
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [skipBreaks, setSkipBreaks] = useState(false);

  // Mirror remain when duration changes
  useEffect(() => {
    setTimerRemain(timerDuration);
  }, [timerDuration]);

  const timerItem = useMemo(
    () => items.find((item) => item.id === timerItemId) ?? null,
    [items, timerItemId]
  );

  // Ref to access timerItem in useEffect
  const timerItemRef = useRef(timerItem);
  useEffect(() => {
    timerItemRef.current = timerItem;
  }, [timerItem]);

  const generateSessionPlan = useCallback((totalMinutes: number) => {
    const plan: Array<{ type: SessionType; duration: number }> = [];
    
    // Debug mode: 20 seconds total → 10s focus, 5s break, 10s focus
    if (totalMinutes <= 0.5) { // Less than 30 seconds
      plan.push({ type: "focus", duration: Math.max(1, Math.floor(totalMinutes * 0.5)) });
      plan.push({ type: "short-break", duration: Math.max(1, Math.floor(totalMinutes * 0.25)) });
      plan.push({ type: "focus", duration: Math.max(1, Math.floor(totalMinutes * 0.25)) });
    } else {
      // Normal mode: 25min focus, 5min break, 25min focus, 15min break, 25min focus
      const focusDuration = 25;
      const shortBreakDuration = 5;
      const longBreakDuration = 15;
      
      plan.push({ type: "focus", duration: focusDuration });
      plan.push({ type: "short-break", duration: shortBreakDuration });
      plan.push({ type: "focus", duration: focusDuration });
      plan.push({ type: "long-break", duration: longBreakDuration });
      plan.push({ type: "focus", duration: focusDuration });
    }
    
    return plan;
  }, []);

  const startCustomDuration = useCallback((minutes: number, options?: { skipBreaks?: boolean }) => {
    const plan = generateSessionPlan(minutes);
    setSessionPlan(plan);
    setIsCustomMode(true);
    setCurrentSession(1);
    setSkipBreaks(options?.skipBreaks ?? false);
    
    const firstSession = plan[0];
    if (firstSession) {
      const duration = firstSession.duration * 60 * 1000;
      setTimerDuration(duration);
      setTimerRemain(duration);
      setTimerMode(firstSession.type === "focus" ? "focus" : "break");
      setTimerRunning(true);
      
      if (firstSession.type === "focus" && timerItem) {
        onStartFocus(timerItem);
      }
    }
  }, [generateSessionPlan, timerItem, onStartFocus]);

  // Refs for stable values in useEffect
  const isCustomModeRef = useRef(isCustomMode);
  const currentSessionRef = useRef(currentSession);
  const sessionPlanRef = useRef(sessionPlan);
  const skipBreaksRef = useRef(skipBreaks);
  const timerItemRef = useRef(timerItem);
  const onStartFocusRef = useRef(onStartFocus);
  const timerModeRef = useRef(timerMode);
  
  useEffect(() => {
    isCustomModeRef.current = isCustomMode;
    currentSessionRef.current = currentSession;
    sessionPlanRef.current = sessionPlan;
    skipBreaksRef.current = skipBreaks;
    timerItemRef.current = timerItem;
    onStartFocusRef.current = onStartFocus;
    timerModeRef.current = timerMode;
  }, [isCustomMode, currentSession, sessionPlan, skipBreaks, timerItem, onStartFocus, timerMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerRemain((time) => {
          const newTime = time - TIMER_INTERVALS.COUNTDOWN_TICK_MS;
          
          if (newTime <= 0) {
            // Timer finished
            const currentIsCustomMode = isCustomModeRef.current;
            const currentSessionNum = currentSessionRef.current;
            const currentPlan = sessionPlanRef.current;
            
            if (currentIsCustomMode && currentSessionNum < currentPlan.length) {
              // Move to next session in custom mode
              const nextSession = currentPlan[currentSessionNum];
              const duration = nextSession.duration * 60 * 1000;
              
              setTimerMode(nextSession.type === "focus" ? "focus" : "break");
              setTimerDuration(duration);
              setCurrentSession(currentSessionNum + 1);
              
              if (nextSession.type === "focus" && timerItemRef.current) {
                onStartFocusRef.current(timerItemRef.current);
              }
              
              // Return new duration to continue countdown
              return duration;
            } else if (currentIsCustomMode && currentSessionNum >= currentPlan.length) {
              // All sessions complete!
              timerSounds.playCompleteSound();
              setTimerRunning(false);
              // Auto-complete the focused item
              if (onComplete && timerItemRef.current) {
                onComplete(timerItemRef.current);
              }
            } else {
              // Simple mode (not custom)
              const shouldSkipBreaks = skipBreaksRef.current;
              
              if (!shouldSkipBreaks) {
                // Auto-toggle between focus and break in simple mode
                const currentMode = timerModeRef.current;
                const nextMode = currentMode === "focus" ? "break" : "focus";
                const nextDuration = nextMode === "focus" 
                  ? DEFAULT_VALUES.FOCUS_DURATION_MINUTES * 60 * 1000 
                  : DEFAULT_VALUES.SHORT_BREAK_MINUTES * 60 * 1000;
                
                // Play notification sound
                if (nextMode === "break") {
                  timerSounds.playBreakSound();
                } else {
                  timerSounds.playFocusSound();
                }
                
                setTimerMode(nextMode);
                setTimerDuration(nextDuration);
                
                // Return new duration to continue countdown
                return nextDuration;
              } else {
                // Skip breaks enabled - stop after focus
                setTimerRunning(false);
                // Auto-complete the focused item
                if (onComplete && timerItemRef.current) {
                  onComplete(timerItemRef.current);
                }
              }
            }
            
            return 0;
          }
          
          return newTime;
        });
      }, TIMER_INTERVALS.COUNTDOWN_TICK_MS);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerRunning, onComplete]);

  const openTimer = useCallback((item?: TimerItem) => {
    const planned = item?.plannedMinutes && item.plannedMinutes > 0 ? item.plannedMinutes : DEFAULT_VALUES.FOCUS_DURATION_MINUTES;
    const duration = planned * 60 * 1000;
    
    setTimerMode("focus");
    setTimerRunning(false);
    setIsCustomMode(false);
    setSessionPlan([]);
    setCurrentSession(1);
    setIsFullscreen(false);
    setIsFloating(false);
    setSkipBreaks(false);
    setTimerDuration(duration);
    setTimerRemain(duration);
    setTimerItemId(item?.id ?? null);
    setTimerOpen(true);
  }, []);

  const closeTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerAnimating(false);
    setIsFullscreen(false);
    setIsFloating(false);
    setIsCustomMode(false);
    setCurrentSession(1);
    setSessionPlan([]);
    setSkipBreaks(false);
    setTimerRemain(timerDuration);
    setTimeout(() => setTimerOpen(false), TIMER_INTERVALS.CLOSE_TIMER_DELAY_MS);
  }, [timerDuration]);

  const enterFloatingMode = useCallback(() => {
    setIsFullscreen(false);
    setIsFloating(true);
  }, []);

  const exitFloatingMode = useCallback(() => {
    setIsFloating(false);
    setIsFullscreen(true);
  }, []);

  const applyFloatingDelta = useCallback((delta: { x: number; y: number }) => {
    setWidgetPosition(prev => {
      const newX = prev.x + delta.x;
      const newY = prev.y + delta.y;
      
      // Clamp within viewport bounds
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - DEFAULT_VALUES.WIDGET_WIDTH));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - DEFAULT_VALUES.WIDGET_HEIGHT));
      
      return { x: clampedX, y: clampedY };
    });
  }, []);

  const FloatingWidgetComponent = useCallback(({ onRequestClose }: { onRequestClose?: () => void } = {}) => {
    const handleClose = onRequestClose ?? closeTimer;
    return createElement(FloatingWidget, {
      isDarkTheme: isDarkTheme,
      timerRemain: timerRemain,
      currentSession: currentSession,
      sessionPlan: sessionPlan,
      timerRunning: timerRunning,
      widgetPosition: widgetPosition,
      onExitFloatingMode: exitFloatingMode,
      onCloseTimer: handleClose,
      onToggleTimer: () => setTimerRunning(!timerRunning),
      onDragEnd: applyFloatingDelta
    });
  }, [isDarkTheme, timerRemain, currentSession, sessionPlan, timerRunning, widgetPosition, exitFloatingMode, closeTimer, applyFloatingDelta]);

  return {
    // state
    timerOpen,
    setTimerOpen,
    timerAnimating,
    setTimerAnimating,
    timerMode,
    setTimerMode,
    timerDuration,
    setTimerDuration,
    timerRemain,
    setTimerRemain,
    timerRunning,
    setTimerRunning,
    isFullscreen,
    setIsFullscreen,
    isFloating,
    setIsFloating,
    currentSession,
    setCurrentSession,
    sessionPlan,
    setSessionPlan,
    isCustomMode,
    setIsCustomMode,
    timerItem,
    setTimerItemId,
    widgetPosition,
    setWidgetPosition,
    isDarkTheme,
    setIsDarkTheme,
    skipBreaks,
    setSkipBreaks,
    // actions
    openTimer,
    closeTimer,
    enterFloatingMode,
    exitFloatingMode,
    startCustomDuration,
    applyFloatingDelta,
    // components
    FloatingWidget: FloatingWidgetComponent,
  };
}

export default useTimer;
