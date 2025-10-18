import React from 'react';
import type { SlotFilter, SlotSortOption } from './types';
import './styles/SlotFilters.css';

interface SlotFiltersProps {
  filters: SlotFilter;
  sortBy: SlotSortOption;
  onFiltersChange: (filters: Partial<SlotFilter>) => void;
  onSortChange: (sortOption: SlotSortOption) => void;
  onReset: () => void;
}

const SlotFilters: React.FC<SlotFiltersProps> = ({
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
  onReset
}) => {
  const sortOptions: SlotSortOption[] = [
    { field: 'confidence', direction: 'desc', label: 'Confidence (High to Low)' },
    { field: 'confidence', direction: 'asc', label: 'Confidence (Low to High)' },
    { field: 'time', direction: 'asc', label: 'Time (Earliest First)' },
    { field: 'time', direction: 'desc', label: 'Time (Latest First)' },
    { field: 'duration', direction: 'asc', label: 'Duration (Shortest First)' },
    { field: 'duration', direction: 'desc', label: 'Duration (Longest First)' }
  ];

  const handleConfidenceRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onFiltersChange({
      [type === 'min' ? 'minConfidence' : 'maxConfidence']: numValue
    });
  };

  const handleTimeRangeChange = (type: 'start' | 'end', value: string) => {
    onFiltersChange({
      timeRange: {
        start: filters.timeRange?.start || '',
        end: filters.timeRange?.end || '',
        [type]: value || ''
      }
    });
  };

  const handleDurationRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    onFiltersChange({
      durationRange: {
        min: filters.durationRange?.min || 0,
        max: filters.durationRange?.max || 0,
        [type]: numValue
      }
    });
  };

  const handleToggleFilter = (filterKey: keyof SlotFilter, value: boolean) => {
    onFiltersChange({
      [filterKey]: value
    });
  };

  return (
    <div className="slot-filters">
      <div className="filters-header">
        <h3>Filter & Sort Options</h3>
        <button 
          className="reset-button"
          onClick={onReset}
          type="button"
        >
          Reset All
        </button>
      </div>

      <div className="filters-content">
        {/* Confidence Range Filter */}
        <div className="filter-group">
          <label className="filter-label">Confidence Range</label>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              placeholder="Min"
              value={filters.minConfidence || ''}
              onChange={(e) => handleConfidenceRangeChange('min', e.target.value)}
              className="range-input"
            />
            <span className="range-separator">to</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              placeholder="Max"
              value={filters.maxConfidence || ''}
              onChange={(e) => handleConfidenceRangeChange('max', e.target.value)}
              className="range-input"
            />
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="filter-group">
          <label className="filter-label">Time Range</label>
          <div className="time-inputs">
            <input
              type="datetime-local"
              value={filters.timeRange?.start || ''}
              onChange={(e) => handleTimeRangeChange('start', e.target.value)}
              className="time-input"
            />
            <span className="time-separator">to</span>
            <input
              type="datetime-local"
              value={filters.timeRange?.end || ''}
              onChange={(e) => handleTimeRangeChange('end', e.target.value)}
              className="time-input"
            />
          </div>
        </div>

        {/* Duration Range Filter */}
        <div className="filter-group">
          <label className="filter-label">Duration Range (minutes)</label>
          <div className="range-inputs">
            <input
              type="number"
              min="15"
              max="180"
              step="15"
              placeholder="Min"
              value={filters.durationRange?.min || ''}
              onChange={(e) => handleDurationRangeChange('min', e.target.value)}
              className="range-input"
            />
            <span className="range-separator">to</span>
            <input
              type="number"
              min="15"
              max="180"
              step="15"
              placeholder="Max"
              value={filters.durationRange?.max || ''}
              onChange={(e) => handleDurationRangeChange('max', e.target.value)}
              className="range-input"
            />
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="filter-group">
          <label className="filter-label">Quick Filters</label>
          <div className="toggle-filters">
            <label className="toggle-filter">
              <input
                type="checkbox"
                checked={filters.showAdjustedOnly || false}
                onChange={(e) => handleToggleFilter('showAdjustedOnly', e.target.checked)}
              />
              <span className="toggle-label">Show Adjusted Only</span>
            </label>
            <label className="toggle-filter">
              <input
                type="checkbox"
                checked={filters.showHighConfidenceOnly || false}
                onChange={(e) => handleToggleFilter('showHighConfidenceOnly', e.target.checked)}
              />
              <span className="toggle-label">High Confidence Only (≥0.7)</span>
            </label>
          </div>
        </div>

        {/* Sort Options */}
        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <select
            value={`${sortBy.field}-${sortBy.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [SlotSortOption['field'], SlotSortOption['direction']];
              const option = sortOptions.find(opt => opt.field === field && opt.direction === direction);
              if (option) onSortChange(option);
            }}
            className="sort-select"
          >
            {sortOptions.map((option, index) => (
              <option key={index} value={`${option.field}-${option.direction}`}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SlotFilters;
