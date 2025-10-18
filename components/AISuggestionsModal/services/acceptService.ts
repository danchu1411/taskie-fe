export interface AcceptRequest {
  status: 1;
  selected_slot_index: number;
  suggested_start_at?: string;
  rejection_reason?: string;
}

export interface AcceptResponse {
  id: string;
  status: number;
  selected_slot_index: number;
  schedule_entry_id: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface AcceptError {
  message: string;
  code?: string;
  details?: any;
}

export interface AISuggestionsAcceptService {
  acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse>;
}

// Mock implementation for development
export class MockAISuggestionsAcceptService implements AISuggestionsAcceptService {
  async acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate different scenarios based on request
    if (request.selected_slot_index < 0) {
      throw {
        message: 'Invalid slot index',
        code: 'INVALID_SLOT_INDEX',
        details: { selected_slot_index: request.selected_slot_index }
      } as AcceptError;
    }

    if (request.selected_slot_index > 2) {
      throw {
        message: 'Slot index out of range',
        code: 'SLOT_INDEX_OUT_OF_RANGE',
        details: { selected_slot_index: request.selected_slot_index }
      } as AcceptError;
    }

    // Simulate network error occasionally
    if (Math.random() < 0.1) {
      throw {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: { suggestionId, request }
      } as AcceptError;
    }

    // Simulate rate limit error occasionally
    if (Math.random() < 0.05) {
      throw {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: { suggestionId, request }
      } as AcceptError;
    }

    // Success response
    const response: AcceptResponse = {
      id: suggestionId,
      status: 1, // Accepted
      selected_slot_index: request.selected_slot_index,
      schedule_entry_id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: 'Suggestion accepted successfully',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Mock Accept API Response:', response);
    return response;
  }
}

// Real implementation (to be used when backend is ready)
export class RealAISuggestionsAcceptService implements AISuggestionsAcceptService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse> {
    const url = `${this.baseUrl}/ai-suggestions/${suggestionId}/status`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        code: errorData.code || `HTTP_${response.status}`,
        details: errorData.details || { status: response.status, statusText: response.statusText }
      } as AcceptError;
    }

    const data = await response.json();
    return data as AcceptResponse;
  }

  private getAuthToken(): string {
    // Get auth token from localStorage, cookies, or auth context
    return localStorage.getItem('authToken') || '';
  }
}

// Service Manager for easy switching
export class AISuggestionsAcceptServiceManager {
  private currentService: AISuggestionsAcceptService;

  constructor(initialService: AISuggestionsAcceptService) {
    this.currentService = initialService;
  }

  public switchService(newService: AISuggestionsAcceptService) {
    this.currentService = newService;
    console.log(`Switched AI Suggestions Accept service to: ${newService.constructor.name}`);
  }

  public getService(): AISuggestionsAcceptService {
    return this.currentService;
  }
}

// Initialize with mock service
export const mockAcceptService = new MockAISuggestionsAcceptService();
export const realAcceptService = new RealAISuggestionsAcceptService();
export const acceptServiceManager = new AISuggestionsAcceptServiceManager(mockAcceptService);

// Export getter function to get current service (supports switching)
export const getAcceptService = () => acceptServiceManager.getService();

// Export default service for backward compatibility (will be deprecated)
export const acceptService = acceptServiceManager.getService();
