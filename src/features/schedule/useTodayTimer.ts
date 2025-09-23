import { useCallback, useEffect, useMemo, useState, createElement, type Dispatch, type SetStateAction, type JSX } from "react";
import type { TodayItem } from "../../lib";
import { FloatingWidget } from "../../components/ui/FloatingWidget";

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

  // actions
  openTimer: (item?: TodayItem) => void;
  closeTimer: () => void;
  enterFloatingMode: () => void;
  exitFloatingMode: () => void;
  startCustomDuration: (minutes: number) => void;
  startNextCustomSession: () => void;
  handleFloatingDrag: (delta: { x: number; y: number }) => void;

  // Floating widget component
  FloatingWidget: () => JSX.Element;
};

export function useTodayTimer(params: TodayTimerHookParams): TodayTimerHook {
  const { items, onStartFocus } = params;

  const [timerOpen, setTimerOpen] = useState(false);
  const [timerAnimating, setTimerAnimating] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timerDuration, setTimerDuration] = useState(25 * 60 * 1000);
  const [timerRemain, setTimerRemain] = useState(timerDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerItemId, setTimerItemId] = useState<string | null>(null);

  const [currentSession, setCurrentSession] = useState(1);
  const [sessionPlan, setSessionPlan] = useState<Array<{ type: SessionType; duration: number }>>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ x: 20, y: 20 });
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Mirror remain when duration changes
  useEffect(() => {
    setTimerRemain(timerDuration);
  }, [timerDuration]);

  // Simple toggling fallback (focus/break) when not in custom mode
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerRemain((prev) => {
        if (prev <= 1_000) {
          window.clearInterval(id);
          setTimerRunning(false);
          if (!isCustomMode) {
            const nextMode = timerMode === "focus" ? "break" : "focus";
            const nextDuration = nextMode === "focus" ? 25 * 60 * 1000 : 5 * 60 * 1000;
            setTimerMode(nextMode);
            setTimerDuration(nextDuration);
            return nextDuration;
          }
          return 0;
        }
        return prev - 1_000;
      });
    }, 1_000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerMode, isCustomMode]);

  const timerItem = useMemo(
    () => items.find((item) => item.id === timerItemId) ?? null,
    [items, timerItemId]
  );

  const generateSessionPlan = useCallback((totalMinutes: number) => {
    const plan: Array<{ type: SessionType; duration: number }> = [];
    let remainingMinutes = totalMinutes;
    let focusCount = 0;
    while (remainingMinutes > 0) {
      if (remainingMinutes >= 25) {
        plan.push({ type: "focus", duration: 25 });
        remainingMinutes -= 25;
        focusCount++;
        if (remainingMinutes > 0) {
          if (focusCount % 4 === 0 && remainingMinutes >= 15) {
            plan.push({ type: "long-break", duration: 15 });
            remainingMinutes -= 15;
          } else if (remainingMinutes >= 5) {
            plan.push({ type: "short-break", duration: 5 });
            remainingMinutes -= 5;
          }
        }
      } else {
        if (remainingMinutes > 0) {
          plan.push({ type: "focus", duration: remainingMinutes });
          remainingMinutes = 0;
        }
      }
    }
    return plan;
  }, []);

  const startCustomDuration = useCallback((minutes: number) => {
    const plan = generateSessionPlan(minutes);
    setSessionPlan(plan);
    setCurrentSession(1);
    setIsCustomMode(true);

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
  }, [currentSession, sessionPlan, timerItem, onStartFocus]);

  // Animation mount effect
  useEffect(() => {
    if (timerOpen) {
      const t = setTimeout(() => setTimerAnimating(true), 10);
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
          if (time <= 1000) {
            setTimerRunning(false);
            if (isCustomMode && currentSession < sessionPlan.length) {
              setTimeout(() => {
                startNextCustomSession();
              }, 1000);
            }
            return 0;
          }
          return time - 1000;
        });
      }, 1000);
    } else if (timerRemain === 0) {
      setTimerRunning(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning, timerRemain, isCustomMode, currentSession, sessionPlan.length, startNextCustomSession]);

  const openTimer = useCallback((item?: TodayItem) => {
    setCurrentSession(1);
    setIsCustomMode(false);
    setTimerItemId(item?.id ?? null);
    setTimerOpen(true);
  }, []);

  const closeTimer = useCallback(() => {
    setTimerAnimating(false);
    setIsFullscreen(false);
    setIsFloating(false);
    setTimeout(() => setTimerOpen(false), 300);
  }, []);

  const enterFloatingMode = useCallback(() => {
    setIsFullscreen(false);
    setIsFloating(true);
  }, []);

  const exitFloatingMode = useCallback(() => {
    setIsFloating(false);
    setIsFullscreen(true);
  }, []);

  const handleFloatingDrag = useCallback((delta: { x: number; y: number }) => {
    setWidgetPosition(prev => ({ 
      x: prev.x + delta.x, 
      y: prev.y + delta.y 
    }));
  }, []);

  const FloatingWidgetComponent = useCallback(() => {
    return createElement(FloatingWidget, {
      isDarkTheme: isDarkTheme,
      timerRemain: timerRemain,
      currentSession: currentSession,
      sessionPlanLength: sessionPlan.length,
      timerRunning: timerRunning,
      widgetPosition: widgetPosition,
      onExitFloatingMode: exitFloatingMode,
      onCloseTimer: closeTimer,
      onToggleTimer: () => setTimerRunning(!timerRunning),
      onDragMove: handleFloatingDrag
    });
  }, [isDarkTheme, timerRemain, currentSession, sessionPlan.length, timerRunning, widgetPosition, exitFloatingMode, closeTimer, handleFloatingDrag]);

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
    // actions
    openTimer,
    closeTimer,
    enterFloatingMode,
    exitFloatingMode,
    startCustomDuration,
    startNextCustomSession,
    handleFloatingDrag,
    // components
    FloatingWidget: FloatingWidgetComponent,
  };
}

export default useTodayTimer;