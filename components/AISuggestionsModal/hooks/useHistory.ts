import { useState, useCallback, useRef } from 'react';
import { HistoryRequest, HistoryResponse, HistoryError, historyService } from '../services/historyService';
import { AISuggestion } from '../types';

export interface HistoryFilters {
  status?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UseHistoryReturn {
  // State
  suggestions: AISuggestion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
  filters: HistoryFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadHistory: (request?: HistoryRequest) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: HistoryFilters) => void;
  clearFilters: () => void;
  refreshHistory: () => Promise<void>;
  getSuggestionById: (id: string) => Promise<AISuggestion>;
  reopenSuggestion: (id: string) => Promise<AISuggestion>;
  clearError: () => void;
  reset: () => void;
  
  // State getters
  getState: () => {
    suggestions: AISuggestion[];
    pagination: any;
    filters: HistoryFilters;
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    isEmpty: boolean;
  };
}

export const useHistory = (): UseHistoryReturn => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentRequest = useRef<HistoryRequest>({ page: 1, limit: 10 });

  const loadHistory = useCallback(async (request?: HistoryRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const requestData = request || currentRequest.current;
      currentRequest.current = requestData;

      console.log('Loading history:', requestData);
      const response = await historyService.getHistory(requestData);
      
      setSuggestions(response.suggestions);
      setPagination(response.pagination);
      console.log('History loaded:', response);
      
    } catch (err: any) {
      console.error('Load history failed:', err);
      
      let errorMessage = 'Có lỗi xảy ra khi tải lịch sử.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code) {
        switch (err.code) {
          case 'SUGGESTION_NOT_FOUND':
            errorMessage = 'Không tìm thấy gợi ý.';
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
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!pagination || pagination.page >= pagination.total_pages) {
      return;
    }

    try {
      const nextPage = pagination.page + 1;
      const requestData = {
        ...currentRequest.current,
        page: nextPage
      };

      console.log('Loading more history:', requestData);
      const response = await historyService.getHistory(requestData);
      
      setSuggestions(prev => [...prev, ...response.suggestions]);
      setPagination(response.pagination);
      console.log('More history loaded:', response);
      
    } catch (err) {
      console.error('Load more failed:', err);
      // Don't throw error for load more, just log it
    }
  }, [pagination]);

  const updateFilters = useCallback((newFilters: HistoryFilters) => {
    setFilters(newFilters);
    // Reload history with new filters
    const requestData = {
      ...currentRequest.current,
      page: 1, // Reset to first page
      ...newFilters
    };
    loadHistory(requestData);
  }, [loadHistory]);

  const clearFilters = useCallback(() => {
    setFilters({});
    // Reload history without filters
    const requestData = {
      page: 1,
      limit: currentRequest.current.limit
    };
    loadHistory(requestData);
  }, [loadHistory]);

  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      await loadHistory(currentRequest.current);
    } catch (err) {
      console.error('Refresh history failed:', err);
    }
  }, [loadHistory]);

  const getSuggestionById = useCallback(async (id: string): Promise<AISuggestion> => {
    try {
      console.log('Getting suggestion by ID:', id);
      const suggestion = await historyService.getSuggestionById(id);
      console.log('Suggestion retrieved:', suggestion);
      return suggestion;
    } catch (err: any) {
      console.error('Get suggestion by ID failed:', err);
      
      let errorMessage = 'Có lỗi xảy ra khi tải gợi ý.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'SUGGESTION_NOT_FOUND') {
        errorMessage = 'Không tìm thấy gợi ý.';
      }
      
      setError(errorMessage);
      throw err;
    }
  }, []);

  const reopenSuggestion = useCallback(async (id: string): Promise<AISuggestion> => {
    try {
      console.log('Reopening suggestion:', id);
      const suggestion = await historyService.reopenSuggestion(id);
      
      // Update the suggestion in the list
      setSuggestions(prev => 
        prev.map(s => s.id === id ? suggestion : s)
      );
      
      console.log('Suggestion reopened:', suggestion);
      return suggestion;
    } catch (err: any) {
      console.error('Reopen suggestion failed:', err);
      
      let errorMessage = 'Có lỗi xảy ra khi mở lại gợi ý.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'SUGGESTION_NOT_FOUND') {
        errorMessage = 'Không tìm thấy gợi ý để mở lại.';
      }
      
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSuggestions([]);
    setPagination(null);
    setFilters({});
    setIsLoading(false);
    setError(null);
    currentRequest.current = { page: 1, limit: 10 };
  }, []);

  const getState = useCallback(() => ({
    suggestions,
    pagination,
    filters,
    isLoading,
    error,
    hasMore: pagination ? pagination.page < pagination.total_pages : false,
    isEmpty: suggestions.length === 0 && !isLoading
  }), [suggestions, pagination, filters, isLoading, error]);

  return {
    // State
    suggestions,
    pagination,
    filters,
    isLoading,
    error,
    
    // Actions
    loadHistory,
    loadMore,
    setFilters: updateFilters,
    clearFilters,
    refreshHistory,
    getSuggestionById,
    reopenSuggestion,
    clearError,
    reset,
    
    // State getters
    getState,
  };
};

export default useHistory;
