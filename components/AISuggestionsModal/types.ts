// AI Suggestions Modal - TypeScript Interfaces

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
  confidence: number;              // 0-2 scale
  reason: string;
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
