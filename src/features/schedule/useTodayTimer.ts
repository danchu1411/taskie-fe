import { useCallback, useEffect, useMemo, useRef, useState, createElement, type Dispatch, type SetStateAction, type JSX } from "react";
import type { TodayItem } from "../../lib";
import { FloatingWidget } from "../../components/ui/FloatingWidget";
import { DEFAULT_VALUES, TIMER_INTERVALS } from "./constants/cacheConfig";
import { timerSounds } from "./utils/timerSounds";

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

  // REMOVED: Old countdown effect - now handled by unified effect below (line ~307)

  const timerItem = useMemo(
    () => items.find((item) => item.id === timerItemId) ?? null,
    [items, timerItemId]
  );

  const generateSessionPlan = useCallback((totalMinutes: number) => {
    const plan: Array<{ type: SessionType; duration: number }> = [];
    
    // Debug mode: 20 seconds total → 10s focus, 5s break, 10s focus
    if (totalMinutes <= 0.5) { // Less than 30 seconds
      const focusSeconds = DEFAULT_VALUES.DEBUG_FOCUS_SECONDS / 60; // 10s → ~0.167 min
      const breakSeconds = DEFAULT_VALUES.DEBUG_BREAK_SECONDS / 60; // 5s → ~0.083 min
      
      plan.push({ type: "focus", duration: focusSeconds });
      plan.push({ type: "short-break", duration: breakSeconds });
      plan.push({ type: "focus", duration: focusSeconds });
      
      console.log('🐛 DEBUG MODE: 10s focus → 5s break → 10s focus');
      return plan;
    }
    
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
    
    console.log('🚀 startCustomDuration:', {
      minutes,
      shouldSkipBreaks,
      plan,
      planLength: plan.length
    });
    
    setSessionPlan(plan);
    setCurrentSession(1);
    setIsCustomMode(true);
    setTimerMode("focus");
    setSkipBreaks(shouldSkipBreaks);

    const firstSession = plan[0];
    const duration = firstSession.duration * 60 * 1000;
    
    console.log('⏰ Starting first session:', {
      type: firstSession.type,
      durationMinutes: firstSession.duration,
      durationMs: duration,
      durationSeconds: duration / 1000
    });
    
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
    console.log('🔄 startNextCustomSession called:', {
      skipBreaks,
      currentSession,
      sessionPlanLength: sessionPlan.length
    });
    
    if (skipBreaks) {
      console.log('⏭️ Skip breaks enabled, not transitioning');
      return;
    }
    
    const nextSessionIndex = currentSession;
    if (nextSessionIndex < sessionPlan.length) {
      const nextSession = sessionPlan[nextSessionIndex];
      const duration = nextSession.duration * 60 * 1000;
      
      console.log('▶️ Starting next session:', {
        session: nextSessionIndex + 1,
        type: nextSession.type,
        duration: nextSession.duration + ' min'
      });
      
      // Play notification sound based on session type
      if (nextSession.type === 'focus') {
        timerSounds.playFocusSound(); // Starting focus session
      } else {
        timerSounds.playBreakSound(); // Starting break session
      }
      
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

  // Store latest values in refs to avoid re-creating interval
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

  // Countdown with custom session transitions
  useEffect(() => {
    console.log('🔄 Countdown effect re-run:', { timerRunning });
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (timerRunning) {
      console.log('✅ Starting countdown interval (only once per timer start)');
      interval = setInterval(() => {
        setTimerRemain((time) => {
          const newTime = time - TIMER_INTERVALS.COUNTDOWN_TICK_MS;
          
          console.log('⏰ Tick:', { time, newTime, timeSeconds: (time/1000).toFixed(1), newTimeSeconds: (newTime/1000).toFixed(1) });
          
          if (newTime <= 0) {
            const currentIsCustomMode = isCustomModeRef.current;
            const currentSessionNum = currentSessionRef.current;
            const currentPlan = sessionPlanRef.current;
            
            console.log('⏱️ Session ended at 0!', {
              isCustomMode: currentIsCustomMode,
              currentSession: currentSessionNum,
              sessionPlanLength: currentPlan.length,
              willAutoTransition: currentIsCustomMode && currentSessionNum < currentPlan.length
            });
            
            // Handle session transition
            if (currentIsCustomMode && currentSessionNum < currentPlan.length) {
              const shouldSkipBreaks = skipBreaksRef.current;
              
              if (shouldSkipBreaks) {
                console.log('⏭️ Skip breaks enabled, stopping timer');
                setTimerRunning(false);
                return 0;
              }
              
              console.log('🔄 Auto-transitioning to next session...');
              
              // currentSession starts from 1, sessionPlan is 0-indexed
              // When currentSession=1 (first session, index 0) ends, next is index 1
              const nextSessionIndex = currentSessionNum; // This is correct: session 1 → index 1 (next)
              const plan = currentPlan;
              
              console.log('📊 Session transition debug:', {
                currentSessionNum,
                nextSessionIndex,
                planLength: plan.length,
                nextSessionType: plan[nextSessionIndex]?.type
              });
              
              if (nextSessionIndex < plan.length) {
                const nextSession = plan[nextSessionIndex];
                const duration = nextSession.duration * 60 * 1000;
                
                console.log('▶️ Starting next session:', {
                  sessionNumber: currentSessionNum + 1,
                  sessionIndex: nextSessionIndex,
                  type: nextSession.type,
                  duration: nextSession.duration + ' min'
                });
                
                // Play notification sound based on session type
                if (nextSession.type === 'focus') {
                  timerSounds.playFocusSound();
                } else {
                  timerSounds.playBreakSound();
                }
                
                // Update duration and session BEFORE returning new time
                setTimerDuration(duration);
                setCurrentSession(currentSessionNum + 1); // Use captured value, not prev
                
                if (nextSession.type === "focus" && timerItemRef.current) {
                  onStartFocusRef.current(timerItemRef.current);
                }
                
                // Return new duration to continue countdown
                return duration;
              }
            } else if (currentIsCustomMode && currentSessionNum >= currentPlan.length) {
              // All sessions complete!
              console.log('🎊 All sessions complete!');
              timerSounds.playCompleteSound();
              setTimerRunning(false);
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
                
                console.log('🔄 Simple mode auto-toggle:', { currentMode, nextMode });
                
                // Play notification sound
                if (nextMode === "break") {
                  timerSounds.playBreakSound(); // Focus ended → Break starts
                } else {
                  timerSounds.playFocusSound(); // Break ended → Focus starts
                }
                
                setTimerMode(nextMode);
                setTimerDuration(nextDuration);
                
                // Return new duration to continue countdown
                return nextDuration;
              } else {
                // Skip breaks enabled - stop after focus
                console.log('⏭️ Simple mode: Skip breaks enabled, stopping');
            setTimerRunning(false);
              }
            }
            
            return 0;
          }
          
          return newTime;
        });
      }, TIMER_INTERVALS.COUNTDOWN_TICK_MS);
    } else {
      console.log('⏸️ Timer not running, interval not started');
    }
    
    return () => {
      if (interval) {
        console.log('🧹 Cleaning up countdown interval');
        clearInterval(interval);
      }
    };
  }, [timerRunning]);

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
