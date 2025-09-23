import { memo } from "react";
import type { TodayItem } from "../hooks/useTodayData";

interface ChecklistItem {
  title: string;
  deadline?: string;
  priority?: number;
}

interface ChecklistAssignModalProps {
  open: boolean;
  selectedTask: TodayItem | null;
  checklistItems: ChecklistItem[];
  onItemChange: (index: number, field: keyof ChecklistItem, value: string | number | undefined) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const ChecklistAssignModal = memo(function ChecklistAssignModal({
  open,
  selectedTask,
  checklistItems,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSave,
  onCancel,
  loading,
}: ChecklistAssignModalProps) {
  if (!open || !selectedTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Add Checklist</h3>
          <p className="text-sm text-slate-600">{selectedTask.title}</p>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Checklist item title"
                  value={item.title}
                  onChange={(e) => onItemChange(index, "title", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    placeholder="Deadline (optional)"
                    value={item.deadline || ""}
                    onChange={(e) => onItemChange(index, "deadline", e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <select
                    value={item.priority || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      onItemChange(index, "priority", value ? Number(value) : undefined);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Priority</option>
                    <option value={1}>High</option>
                    <option value={2}>Medium</option>
                    <option value={3}>Low</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem(index)}
                className="mt-2 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <button
            type="button"
            onClick={onAddItem}
            className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
          >
            + Add another item
          </button>
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
            {loading ? "Creating..." : "Create Checklist"}
          </button>
        </div>
      </div>
    </div>
  );
});
