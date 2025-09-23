import React from "react";
import type { TaskFilters } from "../lib";
import { Button } from "./ui";

export interface TaskEmptyStateProps {
  filters: TaskFilters;
  onCreateTask: () => void;
}

export const TaskEmptyState = React.memo(function TaskEmptyState({
  filters,
  onCreateTask,
}: TaskEmptyStateProps) {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all';
  
  const title = hasActiveFilters ? "No tasks found" : "No tasks yet";
  const description = hasActiveFilters
    ? "Try adjusting your filters to see more tasks."
    : "Get started by creating your first task to organize your work.";
  const buttonText = hasActiveFilters ? "Clear Filters" : "Create Your First Task";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="w-8 h-8 bg-slate-500 rounded-full"></div>
      </div>
      <h3 className="text-2xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        {description}
      </p>
      <Button
        onClick={onCreateTask}
        variant="primary"
        size="lg"
      >
        {buttonText}
      </Button>
    </div>
  );
});
