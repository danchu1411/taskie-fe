import React, { useState, useEffect, useMemo } from "react";
import { Button, Input } from "./";
import type { TaskRecord, StatusValue, PriorityValue } from "../../lib";
import { STATUS, PRIORITY } from "../../lib";
import { getFocusDurationOptions } from "../../features/schedule/constants";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<TaskRecord>) => void;
  task?: TaskRecord | null;
  isLoading?: boolean;
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  task, 
  isLoading = false 
}: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: STATUS.PLANNED as StatusValue,
    priority: null as PriorityValue | null,
    deadline: "",
    planned_minutes: "",
    start_at: "",
  });

  // Get focus duration options, excluding debug mode
  const plannedMinutesOptions = useMemo(() => {
    return getFocusDurationOptions().filter(opt => opt.value >= 1); // Exclude debug mode (0.33)
  }, []);

  // Get current time in local timezone for min attribute and default value
  const currentDateTime = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [isOpen]); // Recalculate when modal opens

  // Check if start_at is in the past
  const isPastStartTime = useMemo(() => {
    if (!formData.start_at) return false;
    const startTime = new Date(formData.start_at).getTime();
    const now = Date.now();
    return startTime < now;
  }, [formData.start_at]);

  // Check if task has checklist items (non-atomic task)
  const hasChecklist = useMemo(() => {
    return task && task.checklist && task.checklist.length > 0;
  }, [task]);

  useEffect(() => {
    if (task) {
      // EDIT MODE: Load existing task data
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || STATUS.PLANNED,
        priority: task.priority || null,
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
        planned_minutes: task.planned_minutes ? String(task.planned_minutes) : "",
        start_at: task.start_at ? new Date(task.start_at).toISOString().slice(0, 16) : "",
      });
    } else {
      // CREATE MODE: Set defaults including current time for start_at
      setFormData({
        title: "",
        description: "",
        status: STATUS.PLANNED,
        priority: null,
        deadline: "",
        planned_minutes: "",
        start_at: currentDateTime, // Default to current time
      });
    }
  }, [task, isOpen, currentDateTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: Partial<TaskRecord> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority || undefined,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    };

    // Only include these fields for atomic tasks (no checklist)
    if (!hasChecklist) {
      submitData.status = formData.status;
      submitData.planned_minutes = formData.planned_minutes ? parseFloat(formData.planned_minutes) : undefined;
      submitData.start_at = formData.start_at ? new Date(formData.start_at).toISOString() : undefined;
    }

    try {
      await onSubmit(submitData);
    } catch (error: any) {
      // Handle backend rejection of status update for non-atomic tasks
      if (error?.response?.data?.code === 'CANNOT_SET_STATUS_FOR_NON_ATOMIC_TASK') {
        console.error('Cannot update status for task with checklist items');
        // Error is handled by parent component (should show toast/notification)
      }
      throw error;
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {task ? "Edit Task" : "Create New Task"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
              aria-label="Close"
            >
              <span className="text-2xl" aria-hidden>&times;</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title..."
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {/* Status (only show when editing) and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Only show status selector when EDITING an existing task WITHOUT checklist */}
              {task && !hasChecklist && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", parseInt(e.target.value) as StatusValue)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value={STATUS.PLANNED}>Planned</option>
                    <option value={STATUS.IN_PROGRESS}>In Progress</option>
                    <option value={STATUS.DONE}>Done</option>
                    <option value={STATUS.SKIPPED}>Skipped</option>
                  </select>
                </div>
              )}

              <div className={task && !hasChecklist ? "" : "md:col-span-2"}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority || ""}
                  onChange={(e) => handleInputChange("priority", e.target.value ? parseInt(e.target.value) as PriorityValue : null)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">No Priority</option>
                  <option value={PRIORITY.MUST}>Must</option>
                  <option value={PRIORITY.SHOULD}>Should</option>
                  <option value={PRIORITY.WANT}>Want</option>
                </select>
              </div>
            </div>

            {/* Deadline and Planned Minutes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={hasChecklist ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deadline
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange("deadline", e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Only show Planned Minutes for atomic tasks (no checklist) */}
              {!hasChecklist && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Planned Minutes
                  </label>
                  <select
                    value={formData.planned_minutes}
                    onChange={(e) => handleInputChange("planned_minutes", e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">No time planned</option>
                    {plannedMinutesOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Start Time - Only for atomic tasks (no checklist) */}
            {!hasChecklist && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  min={currentDateTime}
                  onChange={(e) => handleInputChange("start_at", e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 disabled:text-slate-500 ${
                    isPastStartTime 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                {isPastStartTime && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Cannot schedule in the past. Please select a future time.
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.title.trim() || isPastStartTime}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isLoading ? "Saving..." : task ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


