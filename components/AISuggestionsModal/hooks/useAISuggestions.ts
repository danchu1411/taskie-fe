import { useState, useCallback } from 'react';
import { ManualInput, AISuggestion, UseAISuggestionsReturn, AISuggestionsService } from '../types';
import { mockAISuggestionsService } from '../services/mockAISuggestionsService';

// Service abstraction for easy backend switch
class AISuggestionsServiceManager {
  private service: AISuggestionsService;

  constructor(service: AISuggestionsService) {
    this.service = service;
  }

  async generateSuggestions(input: ManualInput): Promise<AISuggestion> {
    return this.service.generateSuggestions(input);
  }

  // Method to switch services (for backend integration)
  switchService(newService: AISuggestionsService) {
    this.service = newService;
  }
}

// Create service manager instance
const serviceManager = new AISuggestionsServiceManager(mockAISuggestionsService);

const useAISuggestions = (): UseAISuggestionsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<ManualInput | null>(null);

  // Generate suggestions with error handling
  const generateSuggestions = useCallback(async (input: ManualInput): Promise<AISuggestion> => {
    setIsLoading(true);
    setError(null);
    setLastRequest(input);

    try {
      console.log('🤖 Generating AI suggestions for:', input);
      
      const result = await serviceManager.generateSuggestions(input);
      
      console.log('✅ AI suggestions generated:', result);
      return result;
      
    } catch (err: any) {
      console.error('❌ Error generating suggestions:', err);
      
      // Handle different error types
      let errorMessage = 'Có lỗi xảy ra khi tạo gợi ý';
      
      if (err.status === 429) {
        errorMessage = 'Bạn đã sử dụng hết lượt gợi ý. Vui lòng thử lại sau.';
      } else if (err.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (err.status === 503) {
        errorMessage = 'AI service đang bận. Vui lòng thử lại sau.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Retry last request
  const retry = useCallback(async (): Promise<AISuggestion | null> => {
    if (!lastRequest) {
      console.warn('No previous request to retry');
      return null;
    }

    try {
      console.log('🔄 Retrying last request...');
      return await generateSuggestions(lastRequest);
    } catch (err) {
      console.error('Retry failed:', err);
      return null;
    }
  }, [lastRequest, generateSuggestions]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setLastRequest(null);
  }, []);

  // Get current state for debugging
  const getState = useCallback(() => {
    return {
      isLoading,
      error,
      hasLastRequest: !!lastRequest,
      lastRequest
    };
  }, [isLoading, error, lastRequest]);

  return {
    generateSuggestions,
    isLoading,
    error,
    retry,
    clearError,
    reset,
    getState
  };
};

// Export service manager for backend integration
export { serviceManager };

// Export hook
export default useAISuggestions;
