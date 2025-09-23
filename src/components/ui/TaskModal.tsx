import React, { useState, useEffect } from "react";
import { Button, Input } from "./";
import type { TaskRecord, StatusValue, PriorityValue } from "../../lib";
import { STATUS, PRIORITY } from "../../lib";

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

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || STATUS.PLANNED,
        priority: task.priority || null,
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
        planned_minutes: task.planned_minutes?.toString() || "",
        start_at: task.start_at ? new Date(task.start_at).toISOString().slice(0, 16) : "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: STATUS.PLANNED,
        priority: null,
        deadline: "",
        planned_minutes: "",
        start_at: "",
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: Partial<TaskRecord> = {
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority || undefined,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      planned_minutes: formData.planned_minutes ? parseInt(formData.planned_minutes) : undefined,
      start_at: formData.start_at ? new Date(formData.start_at).toISOString() : undefined,
    };

    onSubmit(submitData);
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

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
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
              <div>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Planned Minutes
                </label>
                <Input
                  type="number"
                  value={formData.planned_minutes}
                  onChange={(e) => handleInputChange("planned_minutes", e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Time
              </label>
              <Input
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) => handleInputChange("start_at", e.target.value)}
                disabled={isLoading}
              />
            </div>

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
                disabled={isLoading || !formData.title.trim()}
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


