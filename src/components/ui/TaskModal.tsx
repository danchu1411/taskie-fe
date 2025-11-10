import React, { useState, useEffect } from "react";
import { Button, Input } from "./";
import { useLanguage } from "../../contexts/LanguageContext";
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
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: STATUS.PLANNED as StatusValue,
    priority: null as PriorityValue | null,
    deadline: "",
  });

  // Check if task has checklist items (non-atomic task)
  const hasChecklist = task && task.checklist && task.checklist.length > 0;

  useEffect(() => {
    if (task) {
      // EDIT MODE: Load existing task data
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || STATUS.PLANNED,
        priority: task.priority || null,
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
      });
    } else {
      // CREATE MODE: Set defaults
      setFormData({
        title: "",
        description: "",
        status: STATUS.PLANNED,
        priority: null,
        deadline: "",
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: Partial<TaskRecord> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority || undefined,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    };

    // Only include status for atomic tasks (no checklist)
    if (!hasChecklist) {
      submitData.status = formData.status;
    }

    try {
      await onSubmit(submitData);
    } catch (error: any) {
      // Handle backend rejection of status update for non-atomic tasks
      if (error?.response?.data?.code === 'CANNOT_SET_STATUS_FOR_NON_ATOMIC_TASK') {
        console.error('Cannot update status for task with checklist items');
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
              {task ? t('tasks.modal.editTitle') : t('tasks.modal.createTitle')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
              aria-label={t('common.close')}
            >
              <span className="text-2xl" aria-hidden>&times;</span>
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
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={t('tasks.modal.titleLabel')}
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('tasks.modal.descriptionLabel')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={t('tasks.modal.descriptionLabel')}
                rows={3}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {/* Status (only show when editing atomic task) and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Only show status selector when EDITING an existing task WITHOUT checklist */}
              {task && !hasChecklist && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('tasks.modal.statusLabel')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", parseInt(e.target.value) as StatusValue)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value={STATUS.PLANNED}>{t('today.status.planned')}</option>
                    <option value={STATUS.IN_PROGRESS}>{t('today.status.inProgress')}</option>
                    <option value={STATUS.DONE}>{t('today.status.done')}</option>
                    <option value={STATUS.SKIPPED}>{t('today.status.skipped')}</option>
                  </select>
                </div>
              )}

              <div className={task && !hasChecklist ? "" : "md:col-span-2"}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('tasks.modal.priorityLabel')}
                </label>
                <select
                  value={formData.priority || ""}
                  onChange={(e) => handleInputChange("priority", e.target.value ? parseInt(e.target.value) as PriorityValue : null)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">{t('today.modals.edit.noPriority')}</option>
                  <option value={PRIORITY.MUST}>{t('today.priority.must')}</option>
                  <option value={PRIORITY.SHOULD}>{t('today.priority.should')}</option>
                  <option value={PRIORITY.WANT}>{t('today.priority.want')}</option>
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('tasks.modal.deadlineLabel')}
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Info message for scheduling */}
            {!hasChecklist && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Use the <strong>"{t('today.buttons.schedule')}"</strong> button on the task card to set start time and duration.
                </p>
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
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.title.trim()}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isLoading ? (task ? t('common.save') : t('common.save')) : task ? t('common.save') : t('common.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

