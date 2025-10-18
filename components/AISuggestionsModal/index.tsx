import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ManualInputForm from './ManualInputForm';
import SuggestionsDisplay from './SuggestionsDisplay';
// import ConfirmationState from './ConfirmationState'; // Not used in current implementation
import FallbackUI from './FallbackUI';
import HistorySection from './HistorySection';
import AnalyticsDashboard from './AnalyticsDashboard';
import type { FC, MouseEvent } from 'react';
import type { ManualInput, AISuggestion } from './types';
import useAISuggestions from './hooks/useAISuggestions';
import useModalState from './hooks/useModalState';
import useAcceptFlow from './hooks/useAcceptFlow';
import useAnalytics from './hooks/useAnalytics';
import useFormValidation from './hooks/useFormValidation';
import { serviceManager } from './hooks/useAISuggestions';
import { realAISuggestionsService } from './services/realAISuggestionsService';
import { acceptServiceManager } from './services/acceptService';
import { realAcceptService } from './services/realAcceptService';
import { authServiceManager } from './services/authService';
import './styles/AISuggestionsModal.css';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (scheduleEntryId: string) => void;
}

const AISuggestionsModal: FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Service toggle - switch to real API (FORCE ENABLED)
  useEffect(() => {
    console.log('🔄 Switching to Real API Services...');
    serviceManager.switchService(realAISuggestionsService);
    acceptServiceManager.switchService(realAcceptService);
    
    // Auto-sync auth token from existing system
    authServiceManager.getService().syncFromExistingAuth().then(success => {
      if (success) {
        console.log('✅ Auth token synced from existing system');
      } else {
        console.log('ℹ️ No existing auth token found - manual injection needed');
        console.log('💡 Use: injectAuthToken("<YOUR_JWT>") in browser console');
      }
    });
    
    console.log('✅ Real API Services enabled');
  }, []);

  const {
    generateSuggestions,
    isLoading: apiLoading,
    error: apiError,
    retry,
    clearError,
    reset: resetAPI
  } = useAISuggestions();

  const {
    // Actions
    goToForm,
    goToLoading,
    goToSuggestions,
    goToConfirmation,
    goToSuccess,
    goToError,
    goToHistory,
    goToAnalytics,
    setManualInput,
    setSelectedSlot,
    lockSlot,
    unlockSlot,
    setError,
    setLoading,
    reset,
    canGoBack,
    canGoForward,
    getState,
    isStep,
    hasSuggestion,
    hasSelectedSlot
  } = useModalState();

  // Get current state
  const modalState = getState();

  const {
    // Accept Flow State
    isAccepting,
    error: acceptError,
    lastResponse: acceptResponse,
    
    // Accept Flow Actions
    acceptSuggestion,
    retryAccept,
    clearError: clearAcceptError,
    reset: resetAccept
  } = useAcceptFlow();

  const {
    // Analytics tracking functions
    track,
    trackSuggestionGenerated,
    trackSuggestionAccepted,
    trackSuggestionRejected,
    trackSuggestionReopened,
    trackHistoryViewed,
    trackFilterApplied,
    trackModalOpened,
    trackModalClosed,
    trackError,
    getAnalytics,
    clearAnalytics,
    setService: setAnalyticsService
  } = useAnalytics();

  const {
    // Form validation functions
    formData: validationFormData,
    errors: validationErrors,
    isValid: isFormValid,
    updateField: updateValidationField,
    validateForm: validateFormData,
    submitForm: submitFormData,
    resetForm: resetValidationForm,
    getFormSummary: getValidationSummary,
    setBackendErrors,
    clearAllErrors
  } = useFormValidation();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // Track modal closed
        trackModalClosed();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Track modal opened
      trackModalOpened();
      // Reset modal to form step when opened
      goToForm();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, trackModalOpened, trackModalClosed]);

  // Handle backdrop click
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData: ManualInput) => {
    try {
      console.log('Form submitted:', formData);
      setManualInput(formData);
      goToLoading();
      
      const result = await generateSuggestions(formData);
      goToSuggestions(result);
      
      // Track suggestion generated
      await trackSuggestionGenerated(result);
      
      console.log('API call completed:', result);
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle validation errors from backend
      if (error.status === 400 && error.validationErrors) {
        console.log('Backend validation errors:', error.validationErrors);
        setBackendErrors(error.validationErrors);
        goToForm(); // Go back to form to show validation errors
        return;
      }
      
      // Track error
      await trackError(apiError || 'Error occurred while generating suggestions', 'form_submission');
      goToError(apiError || 'Error occurred while generating suggestions');
    }
  };

  // Handle retry
  const handleRetry = async () => {
    try {
      goToLoading();
      const result = await retry();
      if (result) {
        goToSuggestions(result);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      goToError(apiError || 'Error occurred while retrying');
    }
  };

  // Handle back to form
  const handleBackToForm = () => {
    goToForm();
    clearError();
  };

  // Handle slot selection
  const handleSlotSelect = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
  };

  // Handle accept suggestion
  const handleAcceptSuggestion = async () => {
    if (!hasSelectedSlot() || !modalState.aiSuggestion) return;
    
    try {
      const selectedSlot = modalState.aiSuggestion.suggested_slots[modalState.selectedSlotIndex!];
      
      console.log('Starting accept flow:', {
        suggestionId: modalState.aiSuggestion.id,
        selectedSlotIndex: modalState.selectedSlotIndex,
        suggestedStartAt: selectedSlot.suggested_start_at
      });
      
      const response = await acceptSuggestion(
        modalState.aiSuggestion.id, 
        modalState.selectedSlotIndex!,
        selectedSlot.suggested_start_at // Pass suggested_start_at
      );
      
      console.log('Accept successful:', response);
      
      // Track suggestion accepted
      await trackSuggestionAccepted(modalState.aiSuggestion, modalState.selectedSlotIndex!);
      
      // Close modal immediately after successful accept
      if (onSuccess) {
        onSuccess(response.schedule_entry_id);
      }
      onClose();
      
    } catch (error) {
      console.error('Accept failed:', error);
      // Track error
      await trackError(acceptError || 'Error occurred while accepting suggestion', 'accept_suggestion');
      goToError(acceptError || 'Error occurred while accepting suggestion');
    }
  };

  // Handle retry accept
  const handleRetryAccept = async () => {
    try {
      const response = await retryAccept();
      if (response) {
        // Close modal immediately after successful retry accept
        if (onSuccess) {
          onSuccess(response.schedule_entry_id);
        }
        onClose();
      }
    } catch (error) {
      console.error('Retry accept failed:', error);
      goToError(acceptError || 'Error occurred while retrying');
    }
  };

  // Handle open schedule
  const handleOpenSchedule = () => {
    if (onSuccess && modalState.scheduleEntryId) {
      onSuccess(modalState.scheduleEntryId);
    }
    onClose();
  };

  // Handle create new
  const handleCreateNew = () => {
    goToForm();
    clearError();
    clearAcceptError();
    resetAccept();
  };

  // Handle view suggestion from history
  const handleViewSuggestion = (suggestion: AISuggestion) => {
    console.log('Viewing suggestion:', suggestion);
    // Set the suggestion and go to suggestions view
    goToSuggestions(suggestion);
    // Track history viewed
    trackHistoryViewed();
  };

  // Handle reopen suggestion from history
  const handleReopenSuggestion = (suggestion: AISuggestion) => {
    console.log('Reopening suggestion:', suggestion);
    // Set the suggestion data and go to form for editing
    setManualInput(suggestion.manual_input);
    goToForm();
    // Track suggestion reopened
    trackSuggestionReopened(suggestion as any);
  };

  // Handle accept suggestion from history
  const handleAcceptSuggestionFromHistory = (suggestion: AISuggestion) => {
    console.log('Accepting suggestion from history:', suggestion);
    // Set the suggestion and trigger accept flow
    goToSuggestions(suggestion);
    setSelectedSlot(0); // Default to first slot
    handleAcceptSuggestion();
    // Track suggestion accepted
    trackSuggestionAccepted(suggestion, 0);
  };

  // Handle reject suggestion from history
  const handleRejectSuggestion = (suggestion: AISuggestion) => {
    console.log('Rejecting suggestion:', suggestion);
    // Track suggestion rejected
    trackSuggestionRejected(suggestion, 'rejected_from_history');
    // Close modal or go back to history
    goToHistory();
  };

  // Handle switch to auto mode
  const handleSwitchToAutoMode = () => {
    console.log('Switching to auto mode...');
    // Track auto mode switch
    track('auto_mode_enabled', { source: 'fallback_ui' });
    // For now, just close modal - auto mode will be implemented later
    onClose();
  };

  // Handle edit input
  const handleEditInput = () => {
    goToForm();
    clearError();
    clearAcceptError();
    resetAccept();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="ai-suggestions-modal-backdrop" onClick={handleBackdropClick}>
      <div className="ai-suggestions-modal-container">
                <div className="ai-suggestions-modal-header">
                  <h2 className="ai-suggestions-modal-title">
                    🤖 AI Scheduling
                  </h2>
                  <div className="header-actions">
                    <button 
                      className="ai-suggestions-modal-close"
                      onClick={onClose}
                      aria-label="Close modal"
                    >
                      ✕
                    </button>
                  </div>
                </div>
        
        <div className="ai-suggestions-modal-content">
          {isStep('error') ? (
            <div className="error-state">
              <h3>❌ Error</h3>
              <p>{modalState.error || acceptError}</p>
              <div className="error-actions">
                {(modalState.error || acceptError) && (
                  <button 
                    onClick={acceptError ? handleRetryAccept : handleRetry}
                    className="retry-button"
                    disabled={isAccepting || modalState.isLoading}
                  >
                    {isAccepting || modalState.isLoading ? '🔄 Retrying...' : '🔄 Retry'}
                  </button>
                )}
                <button 
                  onClick={handleBackToForm}
                  className="back-button"
                >
                  ← Back
                </button>
              </div>
            </div>
          ) : isStep('loading') ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <h3>Generating suggestions...</h3>
              <p>AI is analyzing your schedule and finding suitable time slots</p>
            </div>
          ) : isStep('suggestions') && modalState.aiSuggestion ? (
            modalState.aiSuggestion.suggested_slots.length > 0 ? (
              <div className="suggestions-state">
                <SuggestionsDisplay
                  manualInput={modalState.aiSuggestion.manual_input}
                  aiSuggestion={modalState.aiSuggestion}
                  selectedSlotIndex={modalState.selectedSlotIndex}
                  onSlotSelect={handleSlotSelect}
                />
                <div className="suggestions-actions">
                  <button 
                    onClick={handleBackToForm}
                    className="back-button"
                  >
                    ← Back
                  </button>
                  {hasSelectedSlot() && (
                    <button 
                      className="accept-button"
                      onClick={handleAcceptSuggestion}
                      disabled={isAccepting}
                    >
                      {isAccepting ? '🔄 Accepting...' : '✅ Accept Suggestion'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <FallbackUI
                aiSuggestion={modalState.aiSuggestion}
                onSwitchToAutoMode={handleSwitchToAutoMode}
                onEditInput={handleEditInput}
                onClose={onClose}
              />
            )
          ) : isStep('history') ? (
            <HistorySection
              onViewSuggestion={handleViewSuggestion}
              onReopenSuggestion={handleReopenSuggestion}
              onAcceptSuggestion={handleAcceptSuggestionFromHistory}
              onRejectSuggestion={handleRejectSuggestion}
              onClose={() => goToForm()}
            />
          ) : isStep('analytics') ? (
            <AnalyticsDashboard
              onClose={() => goToForm()}
            />
          ) : (
            <ManualInputForm 
              onSubmit={handleFormSubmit}
              isLoading={modalState.isLoading}
              validationErrors={validationErrors}
              onClearErrors={clearAllErrors}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AISuggestionsModal;
