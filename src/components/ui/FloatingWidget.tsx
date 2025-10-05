import { useDraggable } from "@dnd-kit/core";
import { useEffect, useRef } from "react";

interface FloatingWidgetProps {
  isDarkTheme: boolean;
  timerRemain: number;
  currentSession: number;
  sessionPlan: Array<{ type: "focus" | "short-break" | "long-break"; duration: number }>;
  timerRunning: boolean;
  widgetPosition: { x: number; y: number };
  onExitFloatingMode: () => void;
  onCloseTimer: () => void;
  onToggleTimer: () => void;
  onDragEnd: (delta: { x: number; y: number }) => void;
}

export function FloatingWidget({
  isDarkTheme,
  timerRemain,
  currentSession,
  sessionPlan,
  timerRunning,
  widgetPosition,
  onExitFloatingMode,
  onCloseTimer,
  onToggleTimer,
  onDragEnd,
}: FloatingWidgetProps) {
  // Calculate focus session info (same logic as FocusTimerFullscreen)
  const totalFocusSessions = sessionPlan.filter(s => s.type === 'focus').length;
  const currentSessionType = sessionPlan[currentSession - 1]?.type || 'focus';
  
  // Calculate current focus session number (only count focus sessions)
  const focusSessionNumber = sessionPlan
    .slice(0, currentSession)
    .filter(s => s.type === 'focus')
    .length;
  
  // Determine session label
  const getSessionLabel = () => {
    if (sessionPlan.length === 0) return 'Session';
    
    if (currentSessionType === 'focus') {
      return `Focus ${focusSessionNumber}/${totalFocusSessions}`;
    } else if (currentSessionType === 'long-break') {
      return 'Long break';
    } else {
      return 'Break';
    }
  };
  
  const widgetId = 'floating-widget';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: widgetId, 
    data: { type: 'floating-widget' } 
  });

  // Track the initial position when drag starts
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);

  // Handle drag end - only update position when drag completes
  useEffect(() => {
    if (!isDragging && dragStartPosition.current && transform) {
      // Calculate the delta from start to end
      const delta = {
        x: transform.x,
        y: transform.y
      };
      
      // Call the drag end handler with the delta
      onDragEnd(delta);
      
      // Reset drag start position
      dragStartPosition.current = null;
    } else if (isDragging && !dragStartPosition.current) {
      // Store initial position when drag starts
      dragStartPosition.current = { x: widgetPosition.x, y: widgetPosition.y };
    }
  }, [isDragging, transform, onDragEnd, widgetPosition.x, widgetPosition.y]);
  
  return (
    <div
      ref={setNodeRef}
      style={{ 
        left: widgetPosition.x, 
        top: widgetPosition.y, 
        position: 'fixed', 
        zIndex: 50, 
        transform: isDragging && transform
          ? `translate(${transform.x}px, ${transform.y}px) scale(1.05) rotate(1deg)`
          : 'scale(1) rotate(0deg)', 
        transition: isDragging ? 'none' : 'all 200ms ease-out' 
      }}
      className="floating-widget select-none shadow-lg"
    >
      <div className={`rounded-lg p-3 min-w-[200px] border ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div 
          className={`widget-header flex items-center justify-between mb-2 cursor-move p-1 -m-1 rounded ${isDragging ? (isDarkTheme ? 'bg-gray-700' : 'bg-gray-100') : ''}`} 
          {...listeners} 
          {...attributes}
        >
          <div className="flex items-center gap-2">
            <div className={`drag-handle flex flex-col gap-0.5 p-1 rounded ${isDragging ? (isDarkTheme ? 'bg-gray-600' : 'bg-gray-200') : ''}`}>
              <div className={`w-1 h-1 rounded-full ${isDarkTheme ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
              <div className={`w-1 h-1 rounded-full ${isDarkTheme ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
              <div className={`w-1 h-1 rounded-full ${isDarkTheme ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
            </div>
            <div className={`text-xs font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Focus Timer
            </div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onExitFloatingMode(); 
              }} 
              className={`p-1 rounded ${isDarkTheme ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} 
              title="Fullscreen"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onCloseTimer(); 
              }} 
              className={`p-1 rounded ${isDarkTheme ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} 
              title="Close"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-center mb-2">
          <div className={`${isDarkTheme ? 'text-white' : 'text-gray-900'} text-lg font-semibold`}>
            {Math.floor(timerRemain / (60 * 1000))} min
          </div>
          <div className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
            {getSessionLabel()}
          </div>
        </div>
        <div className="flex justify-center">
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onToggleTimer(); 
            }} 
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-blue-500 text-white text-xs hover:bg-blue-600"
          >
            {timerRunning ? (
              <>
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Resume
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
