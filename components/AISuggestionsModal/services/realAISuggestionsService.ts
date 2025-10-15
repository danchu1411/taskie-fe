import type { ManualInput, AISuggestion, AISuggestionsService, BackendSuggestionResponse, BackendValidationError } from '../types';
import { httpClient } from './httpClient';
import { apiConfigManager } from '../config/apiConfig';

// Real AI Suggestions Service implementation
class RealAISuggestionsService implements AISuggestionsService {
  private config = apiConfigManager.getConfig();

  constructor() {
    // Configuration is handled by apiConfigManager
  }

  async generateSuggestions(input: ManualInput): Promise<AISuggestion> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/ai-suggestions/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suggestionType: 0, // Manual Input Mode
          manual_input: input,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data: BackendSuggestionResponse = await response.json();
      
      // Transform ALL items (hỗ trợ future checklist tasks)
      const items = data.data.suggestion.items;
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

      return {
        id: data.data.suggestion.suggestion_id,
        suggestion_type: 0,
        status: 0,
        confidence: data.data.suggestion.confidence,
        reason: data.data.suggestion.reason,
        manual_input: input,
        suggested_slots: transformedSlots,
        fallback_auto_mode: data.data.suggestion.fallback_auto_mode || {
          enabled: false,
          reason: ''
        },
        created_at: data.data.suggestion.created_at,
        updated_at: data.data.suggestion.updated_at
      };

    } catch (error: any) {
      console.error('RealAISuggestionsService error:', error);
      
      // Handle different error types
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      if (error.message) {
        throw error;
      }
      
      throw new Error('Failed to generate AI suggestions');
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = 'Failed to generate suggestions';
    let validationErrors: Record<string, string> = {};
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      
      // Handle validation errors (400)
      if (response.status === 400 && errorData.errors) {
        validationErrors = errorData.errors;
      }
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.response = response;
    error.validationErrors = validationErrors;
    
    // Handle rate limiting - read from headers
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const resetTime = response.headers.get('x-ratelimit-reset');
      const remaining = response.headers.get('x-ratelimit-remaining');
      
      error.retryAfter = retryAfter ? parseInt(retryAfter) : 900;
      error.resetTime = resetTime ? parseInt(resetTime) : 0;
      error.remaining = remaining ? parseInt(remaining) : 0;
    }
    
    throw error;
  }
}

export const realAISuggestionsService = new RealAISuggestionsService();
