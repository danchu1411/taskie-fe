// History Service for AI Suggestions Modal
class MockHistoryService {
  constructor() {
    this.mockSuggestions = [];
    this.generateMockData();
  }

  generateMockData() {
    const now = new Date();
    const baseTime = now.getTime();

    // Generate 25 mock suggestions
    for (let i = 0; i < 25; i++) {
      const suggestion = {
        id: `history-suggestion-${i + 1}`,
        suggestion_type: 1,
        status: i % 3, // 0: pending, 1: accepted, 2: rejected
        confidence: Math.floor(Math.random() * 3), // 0, 1, 2
        reason: `Mock suggestion ${i + 1} for history testing`,
        manual_input: {
          title: `Task ${i + 1}`,
          description: `Description for task ${i + 1}`,
          duration_minutes: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
          deadline: new Date(baseTime + (i * 24 * 60 * 60 * 1000)).toISOString(),
          preferred_window: i % 2 === 0 ? [
            new Date(baseTime + (i * 24 * 60 * 60 * 1000) + 8 * 60 * 60 * 1000).toISOString(),
            new Date(baseTime + (i * 24 * 60 * 60 * 1000) + 10 * 60 * 60 * 1000).toISOString()
          ] : undefined,
          target_task_id: `task-${i + 1}`
        },
        suggested_slots: [
          {
            slot_index: 0,
            suggested_start_at: new Date(baseTime + (i * 24 * 60 * 60 * 1000) + 9 * 60 * 60 * 1000).toISOString(),
            planned_minutes: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
            confidence: Math.floor(Math.random() * 3),
            reason: `Mock slot reason ${i + 1}`
          }
        ],
        fallback_auto_mode: {
          enabled: false,
          reason: 'Mock fallback'
        },
        created_at: new Date(baseTime - (i * 24 * 60 * 60 * 1000)).toISOString(),
        updated_at: new Date(baseTime - (i * 24 * 60 * 60 * 1000) + 5 * 60 * 1000).toISOString()
      };

      this.mockSuggestions.push(suggestion);
    }
  }

  async getHistory(request) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const page = request.page || 1;
    const limit = request.limit || 10;
    const status = request.status;
    const dateFrom = request.date_from;
    const dateTo = request.date_to;
    const search = request.search;

    // Filter suggestions
    let filteredSuggestions = [...this.mockSuggestions];

    // Filter by status
    if (status !== undefined) {
      filteredSuggestions = filteredSuggestions.filter(s => s.status === status);
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredSuggestions = filteredSuggestions.filter(s => 
        new Date(s.created_at) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredSuggestions = filteredSuggestions.filter(s => 
        new Date(s.created_at) <= toDate
      );
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.manual_input.title.toLowerCase().includes(searchLower) ||
        s.manual_input.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created_at (newest first)
    filteredSuggestions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Pagination
    const total = filteredSuggestions.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSuggestions = filteredSuggestions.slice(startIndex, endIndex);

    const response = {
      suggestions: paginatedSuggestions,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      }
    };

    console.log('Mock History API Response:', response);
    return response;
  }

  async getSuggestionById(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const suggestion = this.mockSuggestions.find(s => s.id === id);
    if (!suggestion) {
      throw {
        message: 'Suggestion not found',
        code: 'SUGGESTION_NOT_FOUND',
        details: { id }
      };
    }

    console.log('Mock Get Suggestion by ID:', suggestion);
    return suggestion;
  }

  async reopenSuggestion(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const suggestion = this.mockSuggestions.find(s => s.id === id);
    if (!suggestion) {
      throw {
        message: 'Suggestion not found',
        code: 'SUGGESTION_NOT_FOUND',
        details: { id }
      };
    }

    // Update status to pending
    suggestion.status = 0; // pending
    suggestion.updated_at = new Date().toISOString();

    console.log('Mock Reopen Suggestion:', suggestion);
    return suggestion;
  }
}

class RealHistoryService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async getHistory(request) {
    const params = new URLSearchParams();
    
    if (request.page) params.append('page', request.page.toString());
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.status !== undefined) params.append('status', request.status.toString());
    if (request.date_from) params.append('date_from', request.date_from);
    if (request.date_to) params.append('date_to', request.date_to);
    if (request.search) params.append('search', request.search);

    const url = `${this.baseUrl}/ai-suggestions?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
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

  async getSuggestionById(id) {
    const url = `${this.baseUrl}/ai-suggestions/${id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
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

  async reopenSuggestion(id) {
    const url = `${this.baseUrl}/ai-suggestions/${id}/reopen`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
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

class HistoryServiceManager {
  constructor(initialService) {
    this.currentService = initialService;
  }

  switchService(newService) {
    this.currentService = newService;
    console.log(`Switched History service to: ${newService.constructor.name}`);
  }

  getService() {
    return this.currentService;
  }
}

// Initialize services
const mockHistoryService = new MockHistoryService();
const realHistoryService = new RealHistoryService();
const historyServiceManager = new HistoryServiceManager(mockHistoryService);

module.exports = {
  mockHistoryService,
  realHistoryService,
  historyServiceManager
};
