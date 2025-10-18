// Backend API Response Types
export interface BackendSuggestionResponse {
  message: string;
  data: {
    suggestion: {
      suggestion_id: string;
      items: BackendSuggestionItem[];
      confidence: number;
      reason: string;
      fallback_auto_mode?: {
        enabled: boolean;
        reason: string;
      };
      created_at: string;
      updated_at: string;
    };
  };
  meta: {
    cost: number;
    tokens: number;
    latency_ms: number;
  };
}

export interface BackendSuggestionItem {
  item_type: 0 | 1; // 0: task, 1: checklist
  title: string;
  description: string;
  estimated_minutes: number;
  deadline?: string;
  suggested_slots?: BackendSuggestedSlot[];
  metadata: {
    source?: 'manual_input' | 'auto_suggestion';
    adjusted_duration?: boolean;
    adjusted_deadline?: boolean;
    duration_adjustment_reason?: string;
    deadline_adjustment_reason?: string;
  };
}

export interface BackendSuggestedSlot {
  suggested_start_at: string; // ISO 8601 UTC
  planned_minutes: number;
  confidence: number; // 0.0-1.0 (NOT 0-2)
  reason: string;
  original_index: number; // Transform thành slot_index
}

// Backend Validation Error Types
export interface BackendValidationError {
  message: string;
  errors: {
    title?: string;
    description?: string;
    duration_minutes?: string;
    deadline?: string;
    preferred_window?: string;
    target_task_id?: string;
  };
}

// Backend Rate Limit Error Types
export interface BackendRateLimitError {
  message: string;
  retryAfter?: number; // From response body (if any)
  // Headers will be parsed separately
}

// Slot Selection Enhancement Types
export interface SlotComparison {
  slot1: SuggestedSlot;
  slot2: SuggestedSlot;
  comparison: {
    timeDifference: number; // minutes
    confidenceDifference: number;
    durationMatch: boolean;
    deadlineProximity: number; // minutes to deadline
  };
}

export interface SlotFilter {
  minConfidence?: number;
  maxConfidence?: number;
  timeRange?: {
    start: string;
    end: string;
  };
  durationRange?: {
    min: number;
    max: number;
  };
  showAdjustedOnly?: boolean;
  showHighConfidenceOnly?: boolean;
}

export interface SlotSortOption {
  field: 'confidence' | 'time' | 'duration' | 'deadline_proximity';
  direction: 'asc' | 'desc';
  label: string;
}

export interface SlotSelectionState {
  selectedSlotIndex: number | null;
  comparisonMode: boolean;
  comparingSlots: number[];
  filters: SlotFilter;
  sortBy: SlotSortOption;
  viewMode: 'grid' | 'list' | 'comparison';
}

// Frontend Types

export interface ManualInput {
  title: string;                    // ≤120 chars, required
  description?: string;             // ≤500 chars, optional
  duration_minutes: number;        // 15-180, multiple of 15
  deadline: string;                 // ISO 8601, required
  preferred_window?: [string, string]; // Optional [startISO, endISO]
  target_task_id?: string;         // Optional
}

export interface SuggestedSlot {
  slot_index: number;
  suggested_start_at: string;      // UTC ISO format
  planned_minutes: number;
  confidence: number;              // 0.0-1.0 scale (NOT 0-2)
  reason: string;
  metadata?: {
    adjusted_duration?: boolean;
    adjusted_deadline?: boolean;
    duration_adjustment_reason?: string;
    deadline_adjustment_reason?: string;
    source?: 'manual_input' | 'auto_suggestion';
  };
}

export interface HistorySuggestion extends AISuggestion {
  // Additional fields for history display
}

export interface AISuggestion {
  id: string;
  suggestion_type: number;
  status: number;
  confidence: number;
  reason: string;
  manual_input: ManualInput;
  suggested_slots: SuggestedSlot[];
  fallback_auto_mode: {
    enabled: boolean;
    reason: string;
  };
  created_at: string;
  updated_at: string;
}

export interface FormErrors {
  title?: string;
  description?: string;
  duration_minutes?: string;
  deadline?: string;
  preferred_window?: string;
  target_task_id?: string;
}

export interface UseFormValidationReturn {
  formData: ManualInput;
  errors: FormErrors;
  isValid: boolean;
  updateField: (field: keyof ManualInput, value: any) => void;
  validateForm: () => boolean;
  submitForm: () => Promise<void>;
  resetForm: () => void;
  getFormSummary: () => {
    formData: ManualInput;
    errors: FormErrors;
    isValid: boolean;
    isSubmitting: boolean;
    hasErrors: boolean;
  };
  setBackendErrors: (backendErrors: Record<string, string>) => void;
  clearAllErrors: () => void;
}

export interface UseAISuggestionsReturn {
  generateSuggestions: (input: ManualInput) => Promise<AISuggestion>;
  isLoading: boolean;
  error: string | null;
  retry: () => Promise<AISuggestion | null>;
  clearError: () => void;
  reset: () => void;
  getState: () => {
    isLoading: boolean;
    error: string | null;
    hasLastRequest: boolean;
    lastRequest: ManualInput | null;
  };
}

export interface AISuggestionsService {
  generateSuggestions(input: ManualInput): Promise<AISuggestion>;
}

export interface AcceptRequest {
  status: number;
  selected_slot_index: number;
  suggested_start_at?: string; // Add this field
  rejection_reason?: string;
}

export interface AcceptResponse {
  id: string;
  status: number;
  selected_slot_index: number;
  schedule_entry_id: string;
  message: string;
}

export interface ModalState {
  currentStep: 'form' | 'loading' | 'suggestions' | 'confirmation' | 'success';
  formData: ManualInput;
  suggestions: AISuggestion | null;
  selectedSlotIndex: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseModalStateReturn {
  state: ModalState;
  updateStep: (step: ModalState['currentStep']) => void;
  updateFormData: (data: Partial<ManualInput>) => void;
  setSuggestions: (suggestions: AISuggestion) => void;
  selectSlot: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
