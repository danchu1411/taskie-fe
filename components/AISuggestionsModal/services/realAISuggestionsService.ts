import type { ManualInput, AISuggestion, AISuggestionsService, BackendSuggestionResponse, BackendValidationError } from '../types';
import { httpClient } from './httpClient';
import { apiConfigManager } from '../config/apiConfig';

// Real AI Suggestions Service implementation with HTTP Client
class RealAISuggestionsService implements AISuggestionsService {
  private config = apiConfigManager.getConfig();

  constructor() {
    // Configuration is handled by apiConfigManager
  }

  async generateSuggestions(input: ManualInput): Promise<AISuggestion> {
    try {
      const url = apiConfigManager.getEndpoint('generateSuggestions');
      
      // Validate and format input according to backend schema
      const formattedInput: any = {
        title: input.title,
        description: input.description || '', // Ensure string, not undefined
        duration_minutes: Math.max(15, Math.min(180, Math.round(input.duration_minutes / 15) * 15)),
        deadline: this.formatToISO8601(input.deadline)
      };

      // Only add optional fields if they have values
      if (input.preferred_window && input.preferred_window[0] && input.preferred_window[1]) {
        formattedInput.preferred_window = [
          this.formatToISO8601(input.preferred_window[0]),
          this.formatToISO8601(input.preferred_window[1])
        ];
      }

      if (input.target_task_id) {
        formattedInput.target_task_id = input.target_task_id;
      }

      const requestBody = {
        suggestionType: 0, // Manual Input Mode (0-2)
        manual_input: formattedInput,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      console.log('📤 Sending request to backend:', JSON.stringify(requestBody, null, 2));
      
      // Validate payload schema before sending
      console.log('🔍 Payload validation:');
      console.log('- suggestionType:', typeof requestBody.suggestionType, requestBody.suggestionType);
      console.log('- manual_input.title:', typeof requestBody.manual_input.title, requestBody.manual_input.title);
      console.log('- manual_input.description:', typeof requestBody.manual_input.description, requestBody.manual_input.description);
      console.log('- manual_input.duration_minutes:', typeof requestBody.manual_input.duration_minutes, requestBody.manual_input.duration_minutes);
      console.log('- manual_input.deadline:', typeof requestBody.manual_input.deadline, requestBody.manual_input.deadline);
      console.log('- timezone:', typeof requestBody.timezone, requestBody.timezone);
      
      const response = await httpClient.post<BackendSuggestionResponse>(url, requestBody, {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
      
      // Debug response structure
      console.log('📥 Backend response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      });
      
      // Check if response has expected structure
      if (!response.data) {
        throw new Error('Backend returned empty response');
      }
      
      // Backend returns suggestion directly in response.data, not response.data.data
      if (!response.data.suggestion) {
        console.error('❌ Response missing suggestion:', response.data);
        throw new Error('Backend response missing suggestion field');
      }
      
      const backendSuggestion = response.data.suggestion;

      // Parse suggestion payload if it's a JSON string
      let suggestionData;
      if (typeof backendSuggestion.payload === 'string') {
        try {
          suggestionData = JSON.parse(backendSuggestion.payload);
        } catch (error) {
          console.error('❌ Failed to parse suggestion payload:', error);
          throw new Error('Invalid suggestion payload format');
        }
      } else {
        suggestionData = backendSuggestion.payload;
      }

      // Transform ALL items (support future checklist tasks)
      const items = suggestionData.items || [];
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
        id: backendSuggestion.id,
        suggestion_type: backendSuggestion.suggestion_type,
        status: backendSuggestion.status,
        confidence: suggestionData.confidence || backendSuggestion.confidence,
        reason: suggestionData.reason || backendSuggestion.reason,
        manual_input: input,
        suggested_slots: transformedSlots,
        fallback_auto_mode: suggestionData.fallback_auto_mode || {
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

  // Helper method to format datetime to ISO 8601 without timezone offset
  private formatToISO8601(dateTimeString: string): string {
    try {
      // Ensure the input has seconds (add :00 if missing)
      let formattedString = dateTimeString;
      
      // Count colons to determine format
      const colonCount = (formattedString.match(/:/g) || []).length;
      
      if (colonCount === 1) {
        // Format like "2025-10-17T15:52" -> "2025-10-17T15:52:00"
        formattedString = formattedString + ':00';
      } else if (colonCount === 0) {
        // Format like "2025-10-17T15" -> "2025-10-17T15:00:00"
        formattedString = formattedString + ':00:00';
      }
      // If colonCount === 2, already has seconds, keep as is

      const date = new Date(formattedString);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateTimeString}`);
      }

      // Format to ISO 8601 WITHOUT timezone offset (YYYY-MM-DDTHH:mm:ss)
      // Backend regex only accepts: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ssZ
      return date.toISOString().slice(0, 19); // Remove .000Z, keep only YYYY-MM-DDTHH:mm:ss
    } catch (error) {
      console.error('Error formatting date:', error);
      // Fallback: try to parse and format manually
      const date = new Date(dateTimeString);
      return date.toISOString().slice(0, 19);
    }
  }
}

// Export service
export const realAISuggestionsService = new RealAISuggestionsService();

export default realAISuggestionsService;