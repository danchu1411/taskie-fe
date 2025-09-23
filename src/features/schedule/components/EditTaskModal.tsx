import { memo } from "react";
import type { TodayItem } from "../hooks/useTodayData";

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
  if (!open || !editingItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Edit Task</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 mb-1">
              Title
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
              Description (optional)
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
              Deadline (optional)
            </label>
            <input
              id="edit-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => onDeadlineChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div>
            <label htmlFor="edit-priority" className="block text-sm font-medium text-slate-700 mb-1">
              Priority
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
              <option value="">No priority</option>
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Low</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className={`flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 ${
              loading ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
});
