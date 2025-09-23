import { forwardRef } from "react";
import { Button, Input } from "../../../components/ui";

interface QuickAddPanelProps {
  open: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onAdd: (title: string) => void;
  onCancel: () => void;
  error: string | null;
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const QuickAddPanel = forwardRef<HTMLDivElement, QuickAddPanelProps>(
  ({ open, title, onTitleChange, onAdd, onCancel, error, loading, inputRef }, ref) => {
    if (!open) return null;

    return (
      <div ref={ref} className="mb-4 w-80 rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <span className="text-sm font-bold">+</span>
          </div>
          <h3 className="font-semibold text-slate-800">Quick Add Task</h3>
        </div>
        <div className="space-y-3">
          <Input
            ref={inputRef}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAdd(title);
              }
            }}
            placeholder="What needs to be done?"
            size="lg"
            className="bg-slate-50 focus:bg-white"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              size="md"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => onAdd(title)}
              disabled={loading}
              variant="primary"
              size="md"
              loading={loading}
              className="flex-1"
            >
              Add Task
            </Button>
          </div>
          {error && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
);

QuickAddPanel.displayName = "QuickAddPanel";
