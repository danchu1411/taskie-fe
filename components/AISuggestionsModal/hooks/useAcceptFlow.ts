import { useState, useCallback, useRef } from 'react';
import type { AcceptRequest, AcceptResponse } from '../services/acceptService';
import { getAcceptService } from '../services/acceptService';

export interface UseAcceptFlowReturn {
  // State
  isAccepting: boolean;
  error: string | null;
  lastResponse: AcceptResponse | null;
  
  // Actions
  acceptSuggestion: (suggestionId: string, selectedSlotIndex: number) => Promise<AcceptResponse>;
  retryAccept: () => Promise<AcceptResponse | null>;
  clearError: () => void;
  reset: () => void;
  
  // State getters
  getState: () => {
    isAccepting: boolean;
    error: string | null;
    lastResponse: AcceptResponse | null;
    hasLastRequest: boolean;
    lastRequest: { suggestionId: string; selectedSlotIndex: number } | null;
  };
}

export const useAcceptFlow = (): UseAcceptFlowReturn => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AcceptResponse | null>(null);
  
  const lastRequest = useRef<{ suggestionId: string; selectedSlotIndex: number } | null>(null);

  const acceptSuggestion = useCallback(async (
    suggestionId: string, 
    selectedSlotIndex: number,
    suggestedStartAt?: string // Add this parameter
  ): Promise<AcceptResponse> => {
    setIsAccepting(true);
    setError(null);
    lastRequest.current = { suggestionId, selectedSlotIndex };

    try {
      const request: AcceptRequest = {
        status: 1, // Accepted
        selected_slot_index: selectedSlotIndex,
        suggested_start_at: suggestedStartAt // Add this field
      };

      console.log('Accepting suggestion:', { suggestionId, request });
      const response = await getAcceptService().acceptSuggestion(suggestionId, request);
      
      setLastResponse(response);
      console.log('Accept successful:', response);
      
      return response;
    } catch (err: any) {
      console.error('Accept failed:', err);
      
      let errorMessage = 'Có lỗi xảy ra khi chấp nhận gợi ý.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code) {
        switch (err.code) {
          case 'INVALID_SLOT_INDEX':
            errorMessage = 'Slot được chọn không hợp lệ.';
            break;
          case 'SLOT_INDEX_OUT_OF_RANGE':
            errorMessage = 'Slot được chọn nằm ngoài phạm vi cho phép.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Lỗi kết nối mạng. Vui lòng thử lại.';
            break;
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng đợi một chút.';
            break;
          default:
            errorMessage = `Lỗi: ${err.code}`;
        }
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsAccepting(false);
    }
  }, []);

  const retryAccept = useCallback(async (): Promise<AcceptResponse | null> => {
    if (!lastRequest.current) {
      setError('Không có yêu cầu trước đó để thử lại.');
      return null;
    }

    try {
      const { suggestionId, selectedSlotIndex } = lastRequest.current;
      return await acceptSuggestion(suggestionId, selectedSlotIndex);
    } catch (err) {
      // Error is already handled by acceptSuggestion
      return null;
    }
  }, [acceptSuggestion]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsAccepting(false);
    setError(null);
    setLastResponse(null);
    lastRequest.current = null;
  }, []);

  const getState = useCallback(() => ({
    isAccepting,
    error,
    lastResponse,
    hasLastRequest: lastRequest.current !== null,
    lastRequest: lastRequest.current,
  }), [isAccepting, error, lastResponse]);

  return {
    // State
    isAccepting,
    error,
    lastResponse,
    
    // Actions
    acceptSuggestion,
    retryAccept,
    clearError,
    reset,
    
    // State getters
    getState,
  };
};

export default useAcceptFlow;
