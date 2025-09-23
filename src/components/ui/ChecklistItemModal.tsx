import React, { useState, useEffect } from 'react';
import { STATUS, PRIORITY } from '../../lib';
import type { ChecklistItemRecord, StatusValue, PriorityValue } from '../../lib';
import { Button, Input } from './index';

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
        startAt: '',
        plannedMinutes: ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: null,
        status: STATUS.PLANNED,
        useTaskDeadline: true,
        useTaskPriority: true,
        startAt: '',
        plannedMinutes: ''
      });
    }
    setErrors({});
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.deadline && taskDeadline && new Date(formData.deadline) > new Date(taskDeadline)) {
      newErrors.deadline = 'Checklist deadline cannot be later than task deadline';
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
      // Optional scheduling fields for checklist item
      startAt: formData.startAt || undefined,
      plannedMinutes: formData.plannedMinutes ? Number(formData.plannedMinutes) : undefined,
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
                  Start time (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('startAt', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Planned minutes (optional)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={formData.plannedMinutes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('plannedMinutes', e.target.value)}
                  disabled={isLoading}
                />
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
                disabled={isLoading || !formData.title.trim()}
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
