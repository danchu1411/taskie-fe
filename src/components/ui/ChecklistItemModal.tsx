import React, { useState, useEffect } from 'react';
import { STATUS, PRIORITY } from '../../lib';
import type { ChecklistItemRecord, StatusValue, PriorityValue } from '../../lib';
import { Button, Input } from './index';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: null as PriorityValue | null,
    status: STATUS.PLANNED as StatusValue,
    useTaskDeadline: true,
    useTaskPriority: true
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
              {item ? t('tasks.modal.editTitle') : t('today.modals.checklist.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
              aria-label={t('common.close')}
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('tasks.modal.titleLabel')} *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                placeholder={t('today.modals.checklist.itemTitle')}
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
                {t('tasks.modal.statusLabel')}
              </label>
              <select
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('status', parseInt(e.target.value) as StatusValue)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
              >
                <option value={STATUS.PLANNED}>{t('today.status.planned')}</option>
                <option value={STATUS.IN_PROGRESS}>{t('today.status.inProgress')}</option>
                <option value={STATUS.DONE}>{t('today.status.done')}</option>
                <option value={STATUS.SKIPPED}>{t('today.status.skipped')}</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('tasks.modal.priorityLabel')}
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
                    Use task priority {taskPriority && `(${t('today.priority.' + (taskPriority === PRIORITY.MUST ? 'must' : taskPriority === PRIORITY.SHOULD ? 'should' : 'want'))})`}
                  </span>
                </label>
                
                {!formData.useTaskPriority && (
                  <select
                    value={formData.priority || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('priority', e.target.value ? parseInt(e.target.value) as PriorityValue : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                  >
                    <option value="">{t('today.modals.edit.noPriority')}</option>
                    <option value={PRIORITY.MUST}>{t('today.priority.must')}</option>
                    <option value={PRIORITY.SHOULD}>{t('today.priority.should')}</option>
                    <option value={PRIORITY.WANT}>{t('today.priority.want')}</option>
                  </select>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('tasks.modal.deadlineLabel')}
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



            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.title.trim()}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isLoading ? t('common.save') : item ? t('common.save') : t('today.modals.checklist.createChecklist')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
