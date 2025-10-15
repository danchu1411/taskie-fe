import { useState, useCallback, useMemo } from 'react';
import type { 
  SuggestedSlot, 
  SlotSelectionState, 
  SlotFilter, 
  SlotSortOption, 
  SlotComparison 
} from '../types';

export interface UseSlotSelectionReturn {
  // State
  selectedSlotIndex: number | null;
  comparisonMode: boolean;
  comparingSlots: number[];
  filters: SlotFilter;
  sortBy: SlotSortOption;
  viewMode: 'grid' | 'list' | 'comparison';
  
  // Computed
  filteredSlots: SuggestedSlot[];
  sortedSlots: SuggestedSlot[];
  slotComparison: SlotComparison | null;
  
  // Actions
  selectSlot: (index: number) => void;
  toggleComparisonMode: () => void;
  addToComparison: (index: number) => void;
  removeFromComparison: (index: number) => void;
  clearComparison: () => void;
  updateFilters: (filters: Partial<SlotFilter>) => void;
  setSortBy: (sortOption: SlotSortOption) => void;
  setViewMode: (mode: 'grid' | 'list' | 'comparison') => void;
  resetSelection: () => void;
  
  // Utilities
  getSlotComparison: (slot1: SuggestedSlot, slot2: SuggestedSlot) => SlotComparison;
  isSlotFiltered: (slot: SuggestedSlot) => boolean;
  getSlotRanking: (slot: SuggestedSlot) => number;
}

const useSlotSelection = (slots: SuggestedSlot[]): UseSlotSelectionReturn => {
  const [state, setState] = useState<SlotSelectionState>({
    selectedSlotIndex: null,
    comparisonMode: false,
    comparingSlots: [],
    filters: {},
    sortBy: { field: 'confidence', direction: 'desc', label: 'Confidence (High to Low)' },
    viewMode: 'grid'
  });

  // Filter slots based on current filters
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      const { filters } = state;
      
      // Confidence filter
      if (filters.minConfidence !== undefined && slot.confidence < filters.minConfidence) {
        return false;
      }
      if (filters.maxConfidence !== undefined && slot.confidence > filters.maxConfidence) {
        return false;
      }
      
      // Time range filter
      if (filters.timeRange) {
        const slotTime = new Date(slot.suggested_start_at);
        const startTime = new Date(filters.timeRange.start);
        const endTime = new Date(filters.timeRange.end);
        
        if (slotTime < startTime || slotTime > endTime) {
          return false;
        }
      }
      
      // Duration range filter
      if (filters.durationRange) {
        if (slot.planned_minutes < filters.durationRange.min || 
            slot.planned_minutes > filters.durationRange.max) {
          return false;
        }
      }
      
      // Show adjusted only filter
      if (filters.showAdjustedOnly && !slot.metadata?.adjusted_duration && !slot.metadata?.adjusted_deadline) {
        return false;
      }
      
      // Show high confidence only filter
      if (filters.showHighConfidenceOnly && slot.confidence < 0.7) {
        return false;
      }
      
      return true;
    });
  }, [slots, state.filters]);

  // Sort filtered slots
  const sortedSlots = useMemo(() => {
    const { sortBy } = state;
    
    return [...filteredSlots].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy.field) {
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'time':
          comparison = new Date(a.suggested_start_at).getTime() - new Date(b.suggested_start_at).getTime();
          break;
        case 'duration':
          comparison = a.planned_minutes - b.planned_minutes;
          break;
        case 'deadline_proximity':
          // This would need deadline information from the original input
          // For now, we'll use a placeholder calculation
          comparison = 0;
          break;
      }
      
      return sortBy.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredSlots, state.sortBy]);

  // Get slot comparison if comparing two slots
  const slotComparison = useMemo(() => {
    if (state.comparingSlots.length !== 2) return null;
    
    const [index1, index2] = state.comparingSlots;
    const slot1 = slots[index1];
    const slot2 = slots[index2];
    
    if (!slot1 || !slot2) return null;
    
    return getSlotComparison(slot1, slot2);
  }, [state.comparingSlots, slots]);

  // Actions
  const selectSlot = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      selectedSlotIndex: index
    }));
  }, []);

  const toggleComparisonMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      comparisonMode: !prev.comparisonMode,
      comparingSlots: !prev.comparisonMode ? [] : prev.comparingSlots
    }));
  }, []);

  const addToComparison = useCallback((index: number) => {
    setState(prev => {
      if (prev.comparingSlots.includes(index)) return prev;
      if (prev.comparingSlots.length >= 2) return prev;
      
      return {
        ...prev,
        comparingSlots: [...prev.comparingSlots, index]
      };
    });
  }, []);

  const removeFromComparison = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      comparingSlots: prev.comparingSlots.filter(i => i !== index)
    }));
  }, []);

  const clearComparison = useCallback(() => {
    setState(prev => ({
      ...prev,
      comparingSlots: []
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SlotFilter>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  const setSortBy = useCallback((sortOption: SlotSortOption) => {
    setState(prev => ({
      ...prev,
      sortBy: sortOption
    }));
  }, []);

  const setViewMode = useCallback((mode: 'grid' | 'list' | 'comparison') => {
    setState(prev => ({
      ...prev,
      viewMode: mode
    }));
  }, []);

  const resetSelection = useCallback(() => {
    setState({
      selectedSlotIndex: null,
      comparisonMode: false,
      comparingSlots: [],
      filters: {},
      sortBy: { field: 'confidence', direction: 'desc', label: 'Confidence (High to Low)' },
      viewMode: 'grid'
    });
  }, []);

  // Utilities
  const getSlotComparison = useCallback((slot1: SuggestedSlot, slot2: SuggestedSlot): SlotComparison => {
    const time1 = new Date(slot1.suggested_start_at);
    const time2 = new Date(slot2.suggested_start_at);
    const timeDifference = Math.abs(time2.getTime() - time1.getTime()) / (1000 * 60); // minutes
    
    const confidenceDifference = Math.abs(slot2.confidence - slot1.confidence);
    const durationMatch = slot1.planned_minutes === slot2.planned_minutes;
    
    // Placeholder for deadline proximity calculation
    const deadlineProximity = 0;
    
    return {
      slot1,
      slot2,
      comparison: {
        timeDifference,
        confidenceDifference,
        durationMatch,
        deadlineProximity
      }
    };
  }, []);

  const isSlotFiltered = useCallback((slot: SuggestedSlot): boolean => {
    return filteredSlots.includes(slot);
  }, [filteredSlots]);

  const getSlotRanking = useCallback((slot: SuggestedSlot): number => {
    const index = sortedSlots.findIndex(s => s.slot_index === slot.slot_index);
    return index >= 0 ? index + 1 : -1;
  }, [sortedSlots]);

  return {
    // State
    selectedSlotIndex: state.selectedSlotIndex,
    comparisonMode: state.comparisonMode,
    comparingSlots: state.comparingSlots,
    filters: state.filters,
    sortBy: state.sortBy,
    viewMode: state.viewMode,
    
    // Computed
    filteredSlots,
    sortedSlots,
    slotComparison,
    
    // Actions
    selectSlot,
    toggleComparisonMode,
    addToComparison,
    removeFromComparison,
    clearComparison,
    updateFilters,
    setSortBy,
    setViewMode,
    resetSelection,
    
    // Utilities
    getSlotComparison,
    isSlotFiltered,
    getSlotRanking
  };
};

export default useSlotSelection;
