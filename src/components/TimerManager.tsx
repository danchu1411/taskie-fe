import React from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useTimerContext } from '../contexts/TimerContext';
import { FocusTimerFullscreen } from '../features/schedule/components/FocusTimerFullscreen';
import { FocusTimerBottomSheet } from '../features/schedule/components/FocusTimerBottomSheet';

export function TimerManager() {
  const {
    isFloating,
    isFullscreen,
    timerOpen,
    timerAnimating,
    timerItem,
    timerRemain,
    timerDuration,
    skipBreaks,
    currentSession,
    sessionPlan,
    timerRunning,
    isDarkTheme,
    closeTimer,
    enterFloatingMode,
    exitFloatingMode,
    setTimerRunning,
    setSkipBreaks,
    setTimerDuration,
    startCustomDuration,
    FloatingWidget,
  } = useTimerContext();

  // Drag and drop sensors for floating widget
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle floating widget drag end
  const handleFloatingDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Only handle floating widget drags
    if (active.id === 'floating-widget' && over?.id === 'floating-widget') {
      // This is handled by the FloatingWidget component itself
      return;
    }
  }, []);

  // Mock function for task selection (will be overridden by pages)
  const handleTaskSelectMock = React.useCallback((item: any) => {
    console.log('Task selected for timer:', item);
  }, []);

  // Mock function for custom duration
  const setCustomDuration = React.useCallback((duration: number) => {
    setTimerDuration(duration * 60 * 1000);
  }, [setTimerDuration]);

  return (
    <>
      {/* Floating Widget */}
      {isFloating && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleFloatingDragEnd}
        >
          <FloatingWidget onRequestClose={closeTimer} />
        </DndContext>
      )}

      {/* Fullscreen Timer */}
      {isFullscreen && (
        <FocusTimerFullscreen
          isDarkTheme={isDarkTheme}
          currentSession={currentSession}
          sessionPlan={sessionPlan}
          timerRemain={timerRemain}
          timerDuration={timerDuration}
          timerRunning={timerRunning}
          skipBreaks={skipBreaks}
          onToggleRunning={() => setTimerRunning(!timerRunning)}
          onEnterFloatingMode={enterFloatingMode}
          onClose={closeTimer}
          onToggleTheme={() => {}} // Will be implemented in context
        />
      )}

      {/* Bottom Sheet Timer */}
      {timerOpen && !isFullscreen && !isFloating && (
        <FocusTimerBottomSheet
          timerAnimating={timerAnimating}
          timerItem={timerItem}
          timerRunning={timerRunning}
          timerRemain={timerRemain}
          customDuration={Math.floor(timerDuration / (60 * 1000))}
          skipBreaks={skipBreaks}
          availableTasks={[]} // Will be provided by pages
          onClose={closeTimer}
          onSetCustomDuration={setCustomDuration}
          onStartCustomDuration={startCustomDuration}
          onSetTimerRunning={setTimerRunning}
          onSkipBreaksChange={setSkipBreaks}
          onTaskSelect={handleTaskSelectMock}
        />
      )}
    </>
  );
}
