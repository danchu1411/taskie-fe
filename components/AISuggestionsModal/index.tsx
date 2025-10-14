import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ManualInputForm from './ManualInputForm';
import SuggestionsDisplay from './SuggestionsDisplay';
import ConfirmationState from './ConfirmationState';
import FallbackUI from './FallbackUI';
import HistorySection from './HistorySection';
import AnalyticsDashboard from './AnalyticsDashboard';
import { ManualInput, AISuggestion } from './types';
import useAISuggestions from './hooks/useAISuggestions';
import useModalState from './hooks/useModalState';
import useAcceptFlow from './hooks/useAcceptFlow';
import useAnalytics from './hooks/useAnalytics';
import './styles/AISuggestionsModal.css';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (scheduleEntryId: string) => void;
}

const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    generateSuggestions,
    isLoading: apiLoading,
    error: apiError,
    retry,
    clearError,
    reset: resetAPI
  } = useAISuggestions();

  const {
    // State
    currentStep,
    manualInput,
    aiSuggestion,
    selectedSlotIndex,
    lockedSlots,
    error,
    isLoading,
    scheduleEntryId,
    
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
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, trackModalOpened, trackModalClosed]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
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
      
    } catch (error) {
      console.error('Error submitting form:', error);
      // Track error
      await trackError(apiError || 'Có lỗi xảy ra khi tạo gợi ý', 'form_submission');
      goToError(apiError || 'Có lỗi xảy ra khi tạo gợi ý');
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
      goToError(apiError || 'Có lỗi xảy ra khi thử lại');
    }
  };

  // Handle back to form
  const handleBackToForm = () => {
    goToForm();
    clearError();
  };

  // Handle slot selection
  const handleSlotSelect = (slotIndex: number) => {
    if (lockedSlots.has(slotIndex)) return; // Can't select locked slots
    setSelectedSlot(slotIndex);
  };

  // Handle slot locking
  const handleSlotLock = (slotIndex: number) => {
    lockSlot(slotIndex);
  };

  // Handle slot unlocking
  const handleSlotUnlock = (slotIndex: number) => {
    unlockSlot(slotIndex);
  };

  // Handle accept suggestion
  const handleAcceptSuggestion = async () => {
    if (!hasSelectedSlot() || !aiSuggestion) return;
    
    try {
      console.log('Starting accept flow:', {
        suggestionId: aiSuggestion.id,
        selectedSlotIndex
      });
      
      const response = await acceptSuggestion(aiSuggestion.id, selectedSlotIndex!);
      
      console.log('Accept successful:', response);
      
      // Track suggestion accepted
      await trackSuggestionAccepted(aiSuggestion, selectedSlotIndex!);
      
      goToConfirmation(response.schedule_entry_id);
      
      // Auto-transition to success after 3 seconds
      setTimeout(() => {
        goToSuccess();
        if (onSuccess) {
          onSuccess(response.schedule_entry_id);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Accept failed:', error);
      // Track error
      await trackError(acceptError || 'Có lỗi xảy ra khi chấp nhận gợi ý', 'accept_suggestion');
      goToError(acceptError || 'Có lỗi xảy ra khi chấp nhận gợi ý');
    }
  };

  // Handle retry accept
  const handleRetryAccept = async () => {
    try {
      const response = await retryAccept();
      if (response) {
        goToConfirmation(response.schedule_entry_id);
        
        // Auto-transition to success after 3 seconds
        setTimeout(() => {
          goToSuccess();
          if (onSuccess) {
            onSuccess(response.schedule_entry_id);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Retry accept failed:', error);
      goToError(acceptError || 'Có lỗi xảy ra khi thử lại');
    }
  };

  // Handle open schedule
  const handleOpenSchedule = () => {
    if (onSuccess && scheduleEntryId) {
      onSuccess(scheduleEntryId);
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
    // TODO: Implement view suggestion details
    console.log('Viewing suggestion:', suggestion);
    // Track history viewed
    trackHistoryViewed();
  };

  // Handle reopen suggestion from history
  const handleReopenSuggestion = (suggestion: AISuggestion) => {
    // TODO: Implement reopen suggestion
    console.log('Reopening suggestion:', suggestion);
    // Track suggestion reopened
    trackSuggestionReopened(suggestion as any);
    goToForm();
  };

  // Handle accept suggestion from history
  const handleAcceptSuggestionFromHistory = (suggestion: AISuggestion) => {
    // TODO: Implement accept suggestion from history
    console.log('Accepting suggestion:', suggestion);
    // Track suggestion accepted
    trackSuggestionAccepted(suggestion, 0);
  };

  // Handle reject suggestion from history
  const handleRejectSuggestion = (suggestion: AISuggestion) => {
    // TODO: Implement reject suggestion from history
    console.log('Rejecting suggestion:', suggestion);
    // Track suggestion rejected
    trackSuggestionRejected(suggestion, 'rejected_from_history');
  };

  // Handle switch to auto mode
  const handleSwitchToAutoMode = () => {
    // TODO: Implement auto mode in Phase 2
    console.log('Switching to auto mode...');
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
                    🤖 AI Sắp lịch
                  </h2>
                  <div className="header-actions">
                    {!isStep('history') && !isStep('analytics') && (
                      <button
                        className="history-button"
                        onClick={goToHistory}
                        aria-label="Xem lịch sử"
                      >
                        📚 Lịch sử
                      </button>
                    )}
                    {!isStep('history') && !isStep('analytics') && (
                      <button
                        className="analytics-button"
                        onClick={goToAnalytics}
                        aria-label="Xem analytics"
                      >
                        📊 Analytics
                      </button>
                    )}
                    <button 
                      className="ai-suggestions-modal-close"
                      onClick={onClose}
                      aria-label="Đóng modal"
                    >
                      ✕
                    </button>
                  </div>
                </div>
        
        <div className="ai-suggestions-modal-content">
          {isStep('error') ? (
            <div className="error-state">
              <h3>❌ Lỗi</h3>
              <p>{error || acceptError}</p>
              <div className="error-actions">
                {(error || acceptError) && (
                  <button 
                    onClick={acceptError ? handleRetryAccept : handleRetry}
                    className="retry-button"
                    disabled={isAccepting || isLoading}
                  >
                    {isAccepting || isLoading ? '🔄 Đang thử lại...' : '🔄 Thử lại'}
                  </button>
                )}
                <button 
                  onClick={handleBackToForm}
                  className="back-button"
                >
                  ← Quay lại
                </button>
              </div>
            </div>
          ) : isStep('loading') ? (
            <div className="loading-state">
              <div className="loading-spinner">🔄</div>
              <h3>Đang tạo gợi ý...</h3>
              <p>AI đang phân tích lịch trình và tìm khung giờ phù hợp</p>
            </div>
          ) : isStep('suggestions') && aiSuggestion ? (
            aiSuggestion.suggested_slots.length > 0 ? (
              <div className="suggestions-state">
                <SuggestionsDisplay
                  manualInput={aiSuggestion.manual_input}
                  aiSuggestion={aiSuggestion}
                  selectedSlotIndex={selectedSlotIndex}
                  lockedSlots={lockedSlots}
                  onSlotSelect={handleSlotSelect}
                  onSlotLock={handleSlotLock}
                  onSlotUnlock={handleSlotUnlock}
                />
                <div className="suggestions-actions">
                  <button 
                    onClick={handleBackToForm}
                    className="back-button"
                  >
                    ← Quay lại
                  </button>
                  {hasSelectedSlot() && (
                    <button 
                      className="accept-button"
                      onClick={handleAcceptSuggestion}
                      disabled={isAccepting}
                    >
                      {isAccepting ? '🔄 Đang chấp nhận...' : '✅ Chấp nhận gợi ý'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <FallbackUI
                aiSuggestion={aiSuggestion}
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
          ) : isStep('confirmation') && aiSuggestion && scheduleEntryId ? (
            <ConfirmationState
              aiSuggestion={aiSuggestion}
              selectedSlotIndex={selectedSlotIndex!}
              scheduleEntryId={scheduleEntryId}
              onOpenSchedule={handleOpenSchedule}
              onCreateNew={handleCreateNew}
              onClose={onClose}
              autoCloseDelay={3000}
            />
          ) : isStep('success') ? (
            <div className="success-state">
              <div className="success-icon">🎉</div>
              <h3>Hoàn thành!</h3>
              <p>Lịch trình đã được tạo và lưu thành công</p>
              <div className="success-actions">
                <button 
                  onClick={onClose}
                  className="primary-button"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <ManualInputForm 
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AISuggestionsModal;
