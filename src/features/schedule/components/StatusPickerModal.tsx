import { memo } from "react";
import type { TodayItem, StatusValue } from "../hooks/useTodayData";
import { STATUS } from "../hooks/useTodayData";

interface StatusPickerModalProps {
  open: boolean;
  selectedItem: TodayItem | null;
  onStatusSelect: (status: StatusValue) => void;
  onCancel: () => void;
  loading: boolean;
}

const statusOptions = [
  { 
    value: STATUS.PLANNED, 
    label: "Planned", 
    description: "Task is planned but not started",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverColor: "hover:bg-blue-100",
    textColor: "text-blue-700"
  },
  { 
    value: STATUS.IN_PROGRESS, 
    label: "In Progress", 
    description: "Currently working on this task",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    hoverColor: "hover:bg-amber-100",
    textColor: "text-amber-700"
  },
  { 
    value: STATUS.DONE, 
    label: "Done", 
    description: "Task has been completed",
    dotColor: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    hoverColor: "hover:bg-green-100",
    textColor: "text-green-700"
  },
  { 
    value: STATUS.SKIPPED, 
    label: "Skipped", 
    description: "Task was skipped or cancelled",
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    hoverColor: "hover:bg-slate-100",
    textColor: "text-slate-600"
  },
];

export const StatusPickerModal = memo(function StatusPickerModal({
  open,
  selectedItem,
  onStatusSelect,
  onCancel,
  loading,
}: StatusPickerModalProps) {
  if (!open || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Change Status</h3>
          <p className="text-sm text-slate-600">{selectedItem.title}</p>
        </div>
        
        <div className="space-y-2">
          {statusOptions.map((statusOption) => (
            <button
              key={statusOption.value}
              type="button"
              onClick={() => onStatusSelect(statusOption.value)}
              disabled={loading}
              className={`w-full rounded-lg border p-3 text-left transition ${
                statusOption.bgColor
              } ${
                statusOption.borderColor
              } ${
                statusOption.hoverColor
              } ${
                selectedItem.status === statusOption.value
                  ? "ring-2 ring-offset-1 " + statusOption.dotColor.replace('bg-', 'ring-')
                  : ""
              } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${statusOption.dotColor}`} />
                <div className="flex-1">
                  <div className={`font-semibold ${statusOption.textColor}`}>
                    {statusOption.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {statusOption.description}
                  </div>
                </div>
                {selectedItem.status === statusOption.value && (
                  <div className={`ml-auto ${statusOption.textColor}`}>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
