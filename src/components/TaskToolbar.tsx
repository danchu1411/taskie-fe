import React from "react";
import type { TaskFilters, StatusValue, PriorityValue } from "../lib";
import { Button, Input } from "./ui";
import { clsx } from "../lib";

export interface TaskToolbarProps {
  filters: TaskFilters;
  onFilterChange: (filters: TaskFilters) => void;
  onCreate: () => void;
  currentView: 'list' | 'board' | 'calendar';
  onViewChange: (view: 'list' | 'board' | 'calendar') => void;
  taskStats?: {
    total: number;
    planned: number;
    inProgress: number;
    done: number;
    skipped: number;
  } | null;
}

export const TaskToolbar = React.memo(function TaskToolbar({
  filters,
  onFilterChange,
  onCreate,
  currentView,
  onViewChange,
  taskStats,
}: TaskToolbarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value as StatusValue | 'all' });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, priority: e.target.value as PriorityValue | 'all' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600">
            {taskStats ? `${taskStats.total} tasks` : "Manage your tasks"}
          </p>
        </div>
        <Button
          onClick={onCreate}
          variant="primary"
          size="md"
          className="w-full sm:w-auto"
        >
          New Task
        </Button>
      </div>

      {/* Task Statistics */}
      {taskStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{taskStats.total}</div>
            <div className="text-xs sm:text-sm text-slate-600">Total</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
            <div className="text-xl sm:text-2xl font-bold text-blue-500">{taskStats.planned}</div>
            <div className="text-xs sm:text-sm text-slate-600">Planned</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{taskStats.inProgress}</div>
            <div className="text-xs sm:text-sm text-slate-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{taskStats.done}</div>
            <div className="text-xs sm:text-sm text-slate-600">Done</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
            <div className="text-xl sm:text-2xl font-bold text-slate-600">{taskStats.skipped}</div>
            <div className="text-xs sm:text-sm text-slate-600">Skipped</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search tasks..."
                value={filters.search || ""}
                onChange={handleSearchChange}
                size="md"
                className="pl-10"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select 
              value={filters.status || 'all'} 
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="0">Planned</option>
              <option value="1">In Progress</option>
              <option value="2">Done</option>
              <option value="3">Skipped</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
            <select 
              value={filters.priority || 'all'} 
              onChange={handlePriorityChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Any priority</option>
              <option value="1">Must</option>
              <option value="2">Should</option>
              <option value="3">Want</option>
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">View</label>
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => onViewChange('list')}
                className={clsx(
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  currentView === 'list' 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                List
              </button>
              <button
                onClick={() => onViewChange('board')}
                className={clsx(
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  currentView === 'board' 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Board
              </button>
              <button
                onClick={() => onViewChange('calendar')}
                className={clsx(
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  currentView === 'calendar' 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
