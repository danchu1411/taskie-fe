import type { ManualInput, AISuggestion, AISuggestionsService, BackendSuggestionResponse, BackendValidationError } from '../types';
import { httpClient } from './httpClient';
import { apiConfigManager } from '../config/apiConfig';
import { preserveTimeChangeTimezone } from '../utils/timezoneUtils';

// Enhanced Real AI Suggestions Service with HTTP Client
class EnhancedRealAISuggestionsService implements AISuggestionsService {
  private config = apiConfigManager.getConfig();

  constructor() {
    // Configuration is handled by apiConfigManager
  }

  async generateSuggestions(input: ManualInput): Promise<AISuggestion> {
    try {
      const url = apiConfigManager.getEndpoint('generateSuggestions');
      
      // Get local timezone info
      const localDate = new Date();
      const timezoneOffset = localDate.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset <= 0 ? '+' : '-';
      const timezoneOffsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

      const requestBody = {
        suggestionType: 0, // Manual Input Mode
        manual_input: input,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezone_offset: timezoneOffsetString // e.g., "+07:00" for Vietnam
      };
      
      const response = await httpClient.post<BackendSuggestionResponse>(url, requestBody);
      const backendSuggestion = response.data.data.suggestion;

      // Transform ALL items (support future checklist tasks)
      const items = backendSuggestion.items;
      const transformedSlots = items.flatMap(item =>
        item.suggested_slots?.map(slot => ({
          slot_index: slot.original_index,
          suggested_start_at: slot.suggested_start_at,
          planned_minutes: slot.planned_minutes,
          confidence: slot.confidence, // Keep 0.0-1.0 as-is, NO conversion
          reason: slot.reason,
          metadata: item.metadata // adjusted_duration, adjusted_deadline, source
        })) || []
      );

      const transformedSuggestion: AISuggestion = {
        id: backendSuggestion.suggestion_id,
        suggestion_type: 0,
        status: 0,
        confidence: backendSuggestion.confidence,
        reason: backendSuggestion.reason,
        manual_input: input,
        suggested_slots: transformedSlots,
        fallback_auto_mode: backendSuggestion.fallback_auto_mode || {
          enabled: false,
          reason: ''
        },
        created_at: backendSuggestion.created_at,
        updated_at: backendSuggestion.updated_at,
      };

      return transformedSuggestion;

    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      
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
      
      if (error.status === 400 && error.response) {
        // Handle validation errors
        try {
          const errorData = await error.response.json();
          if (errorData.errors) {
            const validationError = new Error(errorData.message || 'Validation failed') as any;
            validationError.status = 400;
            validationError.validationErrors = errorData.errors;
            throw validationError;
          }
        } catch {
          // Ignore JSON parsing errors
        }
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

// Export enhanced service
export const enhancedRealAISuggestionsService = new EnhancedRealAISuggestionsService();

// Keep original service for backward compatibility
export { realAISuggestionsService } from './realAISuggestionsService';
