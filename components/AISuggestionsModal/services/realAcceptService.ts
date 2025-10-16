import type { AcceptRequest, AcceptResponse, AISuggestionsAcceptService } from './acceptService';
import { httpClient } from './httpClient';
import { apiConfigManager } from '../config/apiConfig';

// Real Accept Service implementation with HTTP Client
class RealAISuggestionsAcceptService implements AISuggestionsAcceptService {
  private config = apiConfigManager.getConfig();

  constructor() {
    // Configuration is handled by apiConfigManager
  }

  async acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse> {
    try {
      const url = `${apiConfigManager.getEndpoint('acceptSuggestion')}/${suggestionId}/accept`;
      
      const requestBody = {
        status: 'accepted', // Backend expects string 'accepted'
        selected_slot_index: request.selected_slot_index,
        // schedule_entry_id: request.schedule_entry_id, // If backend supports this in POST
      };
      
      console.log('📤 Accepting suggestion:', {
        suggestionId,
        requestBody,
        url
      });
      
      const response = await httpClient.post<any>(url, requestBody);
      
      // Backend response for POST /accept provides schedule_entry_id
      // in the top level or data object.
      const scheduleEntryId = response.data.data?.schedule_entry_id || 
                              response.data.schedule_entry_id || 
                              `schedule-entry-${Date.now()}`;

      const transformedResponse: AcceptResponse = {
        id: suggestionId,
        status: 1, // Accepted
        selected_slot_index: request.selected_slot_index,
        schedule_entry_id: scheduleEntryId,
        message: response.data.message || 'Suggestion accepted successfully',
        created_at: response.data.created_at || new Date().toISOString(),
        updated_at: response.data.updated_at || new Date().toISOString(),
      };

      return transformedResponse;

    } catch (error: any) {
      console.error('Error accepting suggestion:', error);
      
      // Handle different error types
      if (error.isAuthError) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (error.isNetworkError) {
        throw new Error('Network error. Please check your connection.');
      }
      
      if (error.isTimeoutError) {
        throw new Error('Request timeout. Please try again.');
      }
      
      if (error.status === 400) {
        const validationError = new Error('Invalid suggestion data') as any;
        validationError.status = 400;
        throw validationError;
      }
      
      if (error.status === 404) {
        const notFoundError = new Error('Suggestion not found') as any;
        notFoundError.status = 404;
        throw notFoundError;
      }
      
      if (error.status === 429) {
        const retryAfter = error.response?.headers.get('Retry-After');
        const resetTime = error.response?.headers.get('X-RateLimit-Reset');
        
        const rateLimitError = new Error('Rate limit exceeded. Please try again later.') as any;
        rateLimitError.status = 429;
        rateLimitError.retryAfter = retryAfter ? parseInt(retryAfter) : 900;
        rateLimitError.resetTime = resetTime ? parseInt(resetTime) : 0;
        throw rateLimitError;
      }
      
      throw error;
    }
  }
}

// Export service
export const realAcceptService = new RealAISuggestionsAcceptService();

export default realAcceptService;