import React, { useState, useEffect, useMemo } from 'react';
import { STATUS, PRIORITY } from '../../lib';
import type { ChecklistItemRecord, StatusValue, PriorityValue } from '../../lib';
import { Button, Input } from './index';
import { getFocusDurationOptions } from '../../features/schedule/constants';

interface ChecklistItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ChecklistItemRecord>) => void;
  item?: ChecklistItemRecord | null;
  taskDeadline?: string;
  taskPriority?: PriorityValue | null;
  isLoading?: boolean;
}

export default function ChecklistItemModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  taskDeadline,
  taskPriority,
  isLoading = false
}: ChecklistItemModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: null as PriorityValue | null,
    status: STATUS.PLANNED as StatusValue,
    useTaskDeadline: true,
    useTaskPriority: true,
    startAt: '',
    plannedMinutes: '' as any
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Check if startAt is in the past
  const isPastStartTime = useMemo(() => {
    if (!formData.startAt) return false;
    const startTime = new Date(formData.startAt).getTime();
    const now = Date.now();
    return startTime < now;
  }, [formData.startAt]);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: '', // Checklist items don't have description in current schema
        deadline: item.deadline || '',
        priority: item.priority ?? null,
        status: item.status,
        useTaskDeadline: !item.deadline,
        useTaskPriority: !item.priority,
        startAt: item.start_at ? new Date(item.start_at).toISOString().slice(0, 16) : '',
        plannedMinutes: item.planned_minutes ? String(item.planned_minutes) : ''
      });
    } else {
      // CREATE MODE: Set defaults including current time for startAt
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: null,
        status: STATUS.PLANNED,
        useTaskDeadline: true,
        useTaskPriority: true,
        startAt: currentDateTime, // Default to current time
        plannedMinutes: ''
      });
    }
    setErrors({});
  }, [item, isOpen, currentDateTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.deadline && taskDeadline && new Date(formData.deadline) > new Date(taskDeadline)) {
      newErrors.deadline = 'Checklist deadline cannot be later than task deadline';
    }
    
    if (isPastStartTime) {
      newErrors.startAt = 'Cannot schedule in the past';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const submitData = {
      title: formData.title.trim(),
      deadline: formData.useTaskDeadline ? undefined : formData.deadline || undefined,
      priority: formData.useTaskPriority ? null : formData.priority,
      status: formData.status,
      // Optional scheduling fields for checklist item (convert to ISO format)
      start_at: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
      planned_minutes: formData.plannedMinutes ? parseFloat(formData.plannedMinutes) : undefined,
    };
    
    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {item ? "Edit Checklist Item" : "Add New Checklist Item"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
            >
              <span className="text-2xl">×</span>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                placeholder="Enter checklist item title"
                className={errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('status', parseInt(e.target.value) as StatusValue)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
              >
                <option value={STATUS.PLANNED}>Planned</option>
                <option value={STATUS.IN_PROGRESS}>In Progress</option>
                <option value={STATUS.DONE}>Done</option>
                <option value={STATUS.SKIPPED}>Skipped</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Priority
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.useTaskPriority}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('useTaskPriority', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    Use task priority {taskPriority && `(${taskPriority === PRIORITY.MUST ? 'Must' : taskPriority === PRIORITY.SHOULD ? 'Should' : 'Want'})`}
                  </span>
                </label>
                
                {!formData.useTaskPriority && (
                  <select
                    value={formData.priority || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('priority', e.target.value ? parseInt(e.target.value) as PriorityValue : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  >
                    <option value="">No priority</option>
                    <option value={PRIORITY.MUST}>Must (High)</option>
                    <option value={PRIORITY.SHOULD}>Should (Medium)</option>
                    <option value={PRIORITY.WANT}>Want (Low)</option>
                  </select>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deadline
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.useTaskDeadline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('useTaskDeadline', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    Use task deadline {taskDeadline && `(${new Date(taskDeadline).toLocaleDateString()})`}
                  </span>
                </label>
                
                {!formData.useTaskDeadline && (
                  <Input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('deadline', e.target.value)}
                    className={errors.deadline ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                    disabled={isLoading}
                  />
                )}
                
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                )}
              </div>
            </div>

            {/* Scheduling (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  min={currentDateTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('startAt', e.target.value)}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Planned Minutes
                </label>
                <select
                  value={formData.plannedMinutes}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('plannedMinutes', e.target.value)}
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
                disabled={isLoading || !formData.title.trim() || isPastStartTime}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isLoading ? "Saving..." : item ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
