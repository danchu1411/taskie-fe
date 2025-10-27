import { memo, useMemo } from "react";
import type { TodayItem } from "../hooks/useTodayData";
import { useLanguage } from "../../../contexts/LanguageContext";

interface EditTaskModalProps {
  open: boolean;
  editingItem: TodayItem | null;
  title: string;
  description: string;
  deadline: string;
  priority: 1 | 2 | 3 | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onPriorityChange: (value: 1 | 2 | 3 | null) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const EditTaskModal = memo(function EditTaskModal({
  open,
  editingItem,
  title,
  description,
  deadline,
  priority,
  onTitleChange,
  onDescriptionChange,
  onDeadlineChange,
  onPriorityChange,
  onSave,
  onCancel,
  loading,
}: EditTaskModalProps) {
  const { t } = useLanguage();
  
  // Get current time in local timezone for min attribute
  const minDateTime = useMemo(() => {
    const now = new Date();
    // Format: YYYY-MM-DDThh:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [open]); // Recalculate when modal opens

  // Check if deadline is in the past
  const isPastDeadline = useMemo(() => {
    if (!deadline) return false;
    const deadlineTime = new Date(deadline).getTime();
    const now = Date.now();
    return deadlineTime < now;
  }, [deadline]);

  if (!open || !editingItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{t('today.modals.edit.title')}</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 mb-1">
              {t('today.modals.edit.taskTitle')}
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 mb-1">
              {t('today.modals.edit.description')}
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div>
            <label htmlFor="edit-deadline" className="block text-sm font-medium text-slate-700 mb-1">
              {t('today.modals.edit.deadline')}
            </label>
            <input
              id="edit-deadline"
              type="datetime-local"
              value={deadline}
              min={minDateTime}
              onChange={(e) => onDeadlineChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isPastDeadline 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {isPastDeadline && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {t('today.modals.edit.cannotSetPastDeadline')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="edit-priority" className="block text-sm font-medium text-slate-700 mb-1">
              {t('today.modals.edit.priority')}
            </label>
            <select
              id="edit-priority"
              value={priority || ""}
              onChange={(e) => {
                const value = e.target.value;
                onPriorityChange(value ? (Number(value) as 1 | 2 | 3) : null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">{t('today.modals.edit.noPriority')}</option>
              <option value={1}>{t('today.modals.edit.highPriority')}</option>
              <option value={2}>{t('today.modals.edit.mediumPriority')}</option>
              <option value={3}>{t('today.modals.edit.lowPriority')}</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading || isPastDeadline}
            className={`flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 ${
              (loading || isPastDeadline) ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {loading ? t('today.modals.edit.saving') : t('today.modals.edit.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
});
