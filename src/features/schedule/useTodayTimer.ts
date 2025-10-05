import { useCallback, useEffect, useMemo, useState, createElement, type Dispatch, type SetStateAction, type JSX } from "react";
import type { TodayItem } from "../../lib";
import { FloatingWidget } from "../../components/ui/FloatingWidget";
import { DEFAULT_VALUES, TIMER_INTERVALS } from "./constants/cacheConfig";

type SessionType = "focus" | "short-break" | "long-break";

export type TodayTimerHookParams = {
  items: TodayItem[];
  onStartFocus: (item: TodayItem) => void;
};

export type TodayTimerHook = {
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
  timerItem: TodayItem | null;
  setTimerItemId: (id: string | null) => void;
  widgetPosition: { x: number; y: number };
  setWidgetPosition: (pos: { x: number; y: number }) => void;
  isDarkTheme: boolean;
  setIsDarkTheme: (v: boolean) => void;
  skipBreaks: boolean;
  setSkipBreaks: (v: boolean) => void;

  // actions
  openTimer: (item?: TodayItem) => void;
  closeTimer: () => void;
  enterFloatingMode: () => void;
  exitFloatingMode: () => void;
  startCustomDuration: (minutes: number, options?: { skipBreaks?: boolean }) => void;
  startNextCustomSession: () => void;
  applyFloatingDelta: (delta: { x: number; y: number }) => void;

  // Floating widget component
  FloatingWidget: (props?: { onRequestClose?: () => void }) => JSX.Element;
};

export function useTodayTimer(params: TodayTimerHookParams): TodayTimerHook {
  const { items, onStartFocus } = params;

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

  // Simple toggling fallback (focus/break) when not in custom mode
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerRemain((prev) => {
        if (prev <= TIMER_INTERVALS.COUNTDOWN_TICK_MS) {
          window.clearInterval(id);
          setTimerRunning(false);
          if (!isCustomMode && !skipBreaks) {
            const nextMode = timerMode === "focus" ? "break" : "focus";
            const nextDuration = nextMode === "focus" 
              ? DEFAULT_VALUES.FOCUS_DURATION_MINUTES * 60 * 1000 
              : DEFAULT_VALUES.SHORT_BREAK_MINUTES * 60 * 1000;
            setTimerMode(nextMode);
            setTimerDuration(nextDuration);
            return nextDuration;
          }
          return 0;
        }
        return prev - TIMER_INTERVALS.COUNTDOWN_TICK_MS;
      });
    }, TIMER_INTERVALS.COUNTDOWN_TICK_MS);
    return () => window.clearInterval(id);
  }, [timerRunning, timerMode, isCustomMode, skipBreaks]);

  const timerItem = useMemo(
    () => items.find((item) => item.id === timerItemId) ?? null,
    [items, timerItemId]
  );

  const generateSessionPlan = useCallback((totalMinutes: number) => {
    const plan: Array<{ type: SessionType; duration: number }> = [];
    
    // Configuration
    const MIN_FOCUS = 15; // Minimum focus session duration
    const OPTIMAL_FOCUS = DEFAULT_VALUES.FOCUS_DURATION_MINUTES; // 25 minutes (optimal session length)
    const SHORT_BREAK = DEFAULT_VALUES.SHORT_BREAK_MINUTES; // 5 minutes
    const LONG_BREAK = DEFAULT_VALUES.LONG_BREAK_MINUTES; // 15 minutes
    const SESSIONS_BEFORE_LONG = DEFAULT_VALUES.SESSIONS_BEFORE_LONG_BREAK; // 4
    
    // Edge case: very short duration
    if (totalMinutes <= MIN_FOCUS) {
      plan.push({ type: "focus", duration: totalMinutes });
      return plan;
    }
    
    // Calculate optimal number of focus sessions
    // Start with ideal sessions of OPTIMAL_FOCUS minutes each
    let numFocusSessions = Math.max(1, Math.round(totalMinutes / (OPTIMAL_FOCUS + SHORT_BREAK)));
    
    // Calculate breaks needed
    const numShortBreaks = Math.max(0, numFocusSessions - 1 - Math.floor((numFocusSessions - 1) / SESSIONS_BEFORE_LONG));
    const numLongBreaks = Math.max(0, Math.floor((numFocusSessions - 1) / SESSIONS_BEFORE_LONG));
    const totalBreakTime = numShortBreaks * SHORT_BREAK + numLongBreaks * LONG_BREAK;
    
    // Calculate focus time available
    const totalFocusTime = totalMinutes - totalBreakTime;
    
    // If not enough time for breaks, reduce to single session
    if (totalFocusTime < MIN_FOCUS * numFocusSessions) {
      plan.push({ type: "focus", duration: totalMinutes });
      return plan;
    }
    
    // Distribute focus time evenly across sessions
    const baseFocusTime = Math.floor(totalFocusTime / numFocusSessions);
    const extraMinutes = totalFocusTime % numFocusSessions;
    
    // Build the session plan
    for (let i = 0; i < numFocusSessions; i++) {
      // Add focus session (distribute extra minutes to early sessions)
      const focusDuration = baseFocusTime + (i < extraMinutes ? 1 : 0);
      plan.push({ type: "focus", duration: focusDuration });
      
      // Add break after each focus session except the last one
      if (i < numFocusSessions - 1) {
        const focusCountSoFar = i + 1;
        // Add long break after every SESSIONS_BEFORE_LONG focus sessions
        if (focusCountSoFar % SESSIONS_BEFORE_LONG === 0) {
          plan.push({ type: "long-break", duration: LONG_BREAK });
        } else {
          plan.push({ type: "short-break", duration: SHORT_BREAK });
        }
      }
    }
    
    return plan;
  }, []);

  const startCustomDuration = useCallback((minutes: number, options?: { skipBreaks?: boolean }) => {
    const shouldSkipBreaks = options?.skipBreaks ?? false;
    
    const plan = shouldSkipBreaks 
      ? [{ type: "focus" as SessionType, duration: minutes }]
      : generateSessionPlan(minutes);
    
    setSessionPlan(plan);
    setCurrentSession(1);
    setIsCustomMode(true);
    setTimerMode("focus");

    const firstSession = plan[0];
    const duration = firstSession.duration * 60 * 1000;
    setTimerDuration(duration);
    setTimerRemain(duration);
    setTimerRunning(true);
    setIsFullscreen(true);
    setIsFloating(false);

    if (firstSession.type === "focus" && timerItem) {
      onStartFocus(timerItem);
    }
  }, [generateSessionPlan, timerItem, onStartFocus]);

  const startNextCustomSession = useCallback(() => {
    if (skipBreaks) return;
    
    const nextSessionIndex = currentSession;
    if (nextSessionIndex < sessionPlan.length) {
      const nextSession = sessionPlan[nextSessionIndex];
      const duration = nextSession.duration * 60 * 1000;
      setTimerDuration(duration);
      setTimerRemain(duration);
      setTimerRunning(true);
      setCurrentSession((prev) => prev + 1);
      if (nextSession.type === "focus" && timerItem) {
        onStartFocus(timerItem);
      }
    }
  }, [currentSession, sessionPlan, timerItem, onStartFocus, skipBreaks]);

  // Animation mount effect
  useEffect(() => {
    if (timerOpen) {
      const t = setTimeout(() => setTimerAnimating(true), TIMER_INTERVALS.ANIMATION_DELAY_MS);
      return () => clearTimeout(t);
    } else {
      setTimerAnimating(false);
    }
  }, [timerOpen]);

  // Countdown with custom session transitions
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerRunning && timerRemain > 0) {
      interval = setInterval(() => {
        setTimerRemain((time) => {
          if (time <= TIMER_INTERVALS.COUNTDOWN_TICK_MS) {
            setTimerRunning(false);
            if (isCustomMode && currentSession < sessionPlan.length) {
              setTimeout(() => {
                startNextCustomSession();
              }, TIMER_INTERVALS.SESSION_TRANSITION_DELAY_MS);
            }
            return 0;
          }
          return time - TIMER_INTERVALS.COUNTDOWN_TICK_MS;
        });
      }, TIMER_INTERVALS.COUNTDOWN_TICK_MS);
    } else if (timerRemain === 0) {
      setTimerRunning(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning, timerRemain, isCustomMode, currentSession, sessionPlan.length, startNextCustomSession]);

  const openTimer = useCallback((item?: TodayItem) => {
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
    startNextCustomSession,
    applyFloatingDelta,
    // components
    FloatingWidget: FloatingWidgetComponent,
  };
}

export default useTodayTimer;
