import { useState, useCallback, useRef } from 'react';
import type { ManualInput, AISuggestion } from '../types';

export type ModalStep = 'form' | 'loading' | 'suggestions' | 'confirmation' | 'success' | 'error' | 'history' | 'analytics';

export interface ModalState {
  currentStep: ModalStep;
  manualInput: ManualInput | null;
  aiSuggestion: AISuggestion | null;
  selectedSlotIndex: number | undefined;
  lockedSlots: Set<number>;
  error: string | null;
  isLoading: boolean;
  scheduleEntryId: string | null;
}

export interface ModalActions {
  // Step navigation
  goToForm: () => void;
  goToLoading: () => void;
  goToSuggestions: (suggestion: AISuggestion) => void;
  goToConfirmation: (scheduleEntryId: string) => void;
  goToSuccess: () => void;
  goToError: (error: string) => void;
  goToHistory: () => void;
  goToAnalytics: () => void;
  
  // State management
  setManualInput: (input: ManualInput) => void;
  setSelectedSlot: (slotIndex: number | undefined) => void;
  lockSlot: (slotIndex: number) => void;
  unlockSlot: (slotIndex: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Utility functions
  reset: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  getStepHistory: () => ModalStep[];
  
  // State getters
  getState: () => ModalState;
  isStep: (step: ModalStep) => boolean;
  hasSuggestion: () => boolean;
  hasSelectedSlot: () => boolean;
}

const initialState: ModalState = {
  currentStep: 'form',
  manualInput: null,
  aiSuggestion: null,
  selectedSlotIndex: undefined,
  lockedSlots: new Set(),
  error: null,
  isLoading: false,
  scheduleEntryId: null,
};

export const useModalState = (): ModalActions => {
  const [state, setState] = useState<ModalState>(initialState);
  const stepHistory = useRef<ModalStep[]>(['form']);

  // Step navigation functions
  const goToForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'form',
      error: null,
      isLoading: false,
    }));
    stepHistory.current.push('form');
  }, []);

  const goToLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'loading',
      isLoading: true,
      error: null,
    }));
    stepHistory.current.push('loading');
  }, []);

  const goToSuggestions = useCallback((suggestion: AISuggestion) => {
    setState(prev => ({
      ...prev,
      currentStep: 'suggestions',
      aiSuggestion: suggestion,
      isLoading: false,
      error: null,
      selectedSlotIndex: undefined,
      lockedSlots: new Set(),
    }));
    stepHistory.current.push('suggestions');
  }, []);

  const goToConfirmation = useCallback((scheduleEntryId: string) => {
    setState(prev => ({
      ...prev,
      currentStep: 'confirmation',
      scheduleEntryId,
      isLoading: false,
      error: null,
    }));
    stepHistory.current.push('confirmation');
  }, []);

  const goToSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'success',
      isLoading: false,
      error: null,
    }));
    stepHistory.current.push('success');
  }, []);

  const goToError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      currentStep: 'error',
      error,
      isLoading: false,
    }));
    stepHistory.current.push('error');
  }, []);

  const goToHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'history',
      error: null,
      isLoading: false,
    }));
    stepHistory.current.push('history');
  }, []);

  const goToAnalytics = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'analytics',
      error: null,
      isLoading: false,
    }));
    stepHistory.current.push('analytics');
  }, []);

  // State management functions
  const setManualInput = useCallback((input: ManualInput) => {
    setState(prev => ({
      ...prev,
      manualInput: input,
    }));
  }, []);

  const setSelectedSlot = useCallback((slotIndex: number | undefined) => {
    setState(prev => ({
      ...prev,
      selectedSlotIndex: slotIndex,
    }));
  }, []);

  const lockSlot = useCallback((slotIndex: number) => {
    setState(prev => {
      const newLockedSlots = new Set(prev.lockedSlots);
      newLockedSlots.add(slotIndex);
      
      // If the locked slot was selected, deselect it
      const newSelectedSlot = prev.selectedSlotIndex === slotIndex 
        ? undefined 
        : prev.selectedSlotIndex;
      
      return {
        ...prev,
        lockedSlots: newLockedSlots,
        selectedSlotIndex: newSelectedSlot,
      };
    });
  }, []);

  const unlockSlot = useCallback((slotIndex: number) => {
    setState(prev => {
      const newLockedSlots = new Set(prev.lockedSlots);
      newLockedSlots.delete(slotIndex);
      
      return {
        ...prev,
        lockedSlots: newLockedSlots,
      };
    });
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  // Utility functions
  const reset = useCallback(() => {
    setState(initialState);
    stepHistory.current = ['form'];
  }, []);

  const canGoBack = useCallback(() => {
    return stepHistory.current.length > 1 && state.currentStep !== 'form' && state.currentStep !== 'history';
  }, [state.currentStep]);

  const canGoForward = useCallback(() => {
    switch (state.currentStep) {
      case 'form':
        return state.manualInput !== null;
      case 'suggestions':
        return state.selectedSlotIndex !== undefined;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  }, [state.currentStep, state.manualInput, state.selectedSlotIndex]);

  const getStepHistory = useCallback(() => {
    return [...stepHistory.current];
  }, []);

  // State getters
  const getState = useCallback(() => {
    return { ...state };
  }, [state]);

  const isStep = useCallback((step: ModalStep) => {
    return state.currentStep === step;
  }, [state.currentStep]);

  const hasSuggestion = useCallback(() => {
    return state.aiSuggestion !== null;
  }, [state.aiSuggestion]);

  const hasSelectedSlot = useCallback(() => {
    return state.selectedSlotIndex !== undefined;
  }, [state.selectedSlotIndex]);

  return {
    // Step navigation
    goToForm,
    goToLoading,
    goToSuggestions,
    goToConfirmation,
    goToSuccess,
    goToError,
    goToHistory,
    goToAnalytics,
    
    // State management
    setManualInput,
    setSelectedSlot,
    lockSlot,
    unlockSlot,
    setError,
    setLoading,
    
    // Utility functions
    reset,
    canGoBack,
    canGoForward,
    getStepHistory,
    
    // State getters
    getState,
    isStep,
    hasSuggestion,
    hasSelectedSlot,
  };
};

export default useModalState;
