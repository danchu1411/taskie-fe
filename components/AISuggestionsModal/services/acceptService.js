// Accept Service for AI Suggestions Modal
class MockAISuggestionsAcceptService {
  async acceptSuggestion(suggestionId, request) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate different scenarios based on request
    if (request.selected_slot_index < 0) {
      throw {
        message: 'Invalid slot index',
        code: 'INVALID_SLOT_INDEX',
        details: { selected_slot_index: request.selected_slot_index }
      };
    }

    if (request.selected_slot_index > 2) {
      throw {
        message: 'Slot index out of range',
        code: 'SLOT_INDEX_OUT_OF_RANGE',
        details: { selected_slot_index: request.selected_slot_index }
      };
    }

    // Simulate network error occasionally
    if (Math.random() < 0.1) {
      throw {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: { suggestionId, request }
      };
    }

    // Simulate rate limit error occasionally
    if (Math.random() < 0.05) {
      throw {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: { suggestionId, request }
      };
    }

    // Success response
    const response = {
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

class RealAISuggestionsAcceptService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async acceptSuggestion(suggestionId, request) {
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
      };
    }

    const data = await response.json();
    return data;
  }

  getAuthToken() {
    // Get auth token from localStorage, cookies, or auth context
    return localStorage.getItem('authToken') || '';
  }
}

class AISuggestionsAcceptServiceManager {
  constructor(initialService) {
    this.currentService = initialService;
  }

  switchService(newService) {
    this.currentService = newService;
    console.log(`Switched AI Suggestions Accept service to: ${newService.constructor.name}`);
  }

  getService() {
    return this.currentService;
  }
}

// Initialize services
const mockAcceptService = new MockAISuggestionsAcceptService();
const realAcceptService = new RealAISuggestionsAcceptService();
const acceptServiceManager = new AISuggestionsAcceptServiceManager(mockAcceptService);

module.exports = {
  mockAcceptService,
  realAcceptService,
  acceptServiceManager
};
