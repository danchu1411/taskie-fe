import { useEffect } from "react";
import { STATUS, type StatusValue, type TodayItem } from "../../../lib/types";

type UseTodayKeyboardShortcutsOptions = {
  quickOpen: boolean;
  setQuickOpen: (value: boolean) => void;
  scheduleModalOpen: boolean;
  setScheduleModalOpen: (value: boolean) => void;
  checklistModalOpen: boolean;
  setChecklistModalOpen: (value: boolean) => void;
  editModalOpen: boolean;
  setEditModalOpen: (value: boolean) => void;
  statusModalOpen: boolean;
  setStatusModalOpen: (value: boolean) => void;
  timerOpen: boolean;
  isFullscreen: boolean;
  isFloating: boolean;
  setTimerRunning: (updater: (prev: boolean) => boolean) => void;
  closeTimer: () => void;
  enterFloatingMode: () => void;
  exitFloatingMode: () => void;
  statusModalItem: TodayItem | null;
  selectStatus: (status: StatusValue) => void;
};

export function useTodayKeyboardShortcuts({
  quickOpen,
  setQuickOpen,
  scheduleModalOpen,
  setScheduleModalOpen,
  checklistModalOpen,
  setChecklistModalOpen,
  editModalOpen,
  setEditModalOpen,
  statusModalOpen,
  setStatusModalOpen,
  timerOpen,
  isFullscreen,
  isFloating,
  setTimerRunning,
  closeTimer,
  enterFloatingMode,
  exitFloatingMode,
  statusModalItem,
  selectStatus,
}: UseTodayKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setQuickOpen(true);
        return;
      }

      if (event.key === "Escape") {
        if (quickOpen) setQuickOpen(false);
        if (scheduleModalOpen) setScheduleModalOpen(false);
        if (checklistModalOpen) setChecklistModalOpen(false);
        if (editModalOpen) setEditModalOpen(false);
        if (statusModalOpen) setStatusModalOpen(false);
        if (isFullscreen) enterFloatingMode();
        else if (isFloating) closeTimer();
        else if (timerOpen) closeTimer();
      }

      if (event.key === "f" || event.key === "F") {
        if (isFullscreen) {
          enterFloatingMode();
        } else if (isFloating) {
          exitFloatingMode();
        }
      }

      if (event.key === " ") {
        if (isFullscreen || isFloating) {
          event.preventDefault();
          setTimerRunning((prev) => !prev);
        }
      }

      if (statusModalOpen && statusModalItem) {
        const statusMap: Record<string, StatusValue> = {
          "1": STATUS.PLANNED,
          "2": STATUS.IN_PROGRESS,
          "3": STATUS.DONE,
          "4": STATUS.SKIPPED,
        };

        const nextStatus = statusMap[event.key];
        if (nextStatus !== undefined) {
          event.preventDefault();
          selectStatus(nextStatus);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    checklistModalOpen,
    closeTimer,
    editModalOpen,
    enterFloatingMode,
    exitFloatingMode,
    isFloating,
    isFullscreen,
    quickOpen,
    scheduleModalOpen,
    selectStatus,
    setChecklistModalOpen,
    setEditModalOpen,
    setQuickOpen,
    setScheduleModalOpen,
    setStatusModalOpen,
    setTimerRunning,
    statusModalItem,
    statusModalOpen,
    timerOpen,
  ]);
}