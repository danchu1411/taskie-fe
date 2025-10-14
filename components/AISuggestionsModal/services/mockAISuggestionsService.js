// Simple Mock AI Suggestions Service for Testing
const mockAISuggestionsService = {
  async generateSuggestions(input) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { duration_minutes, deadline } = input;
    const deadlineTime = new Date(deadline).getTime();
    const now = Date.now();
    const timeUntilDeadline = deadlineTime - now;
    
    // Determine scenario based on input
    if (timeUntilDeadline < 2 * 60 * 60 * 1000) { // Less than 2 hours
      return {
        id: 'mock-tight-deadline',
        suggestion_type: 1,
        status: 1,
        confidence: 0,
        reason: 'Deadline quá gần, không tìm được khung giờ phù hợp',
        manual_input: input,
        suggested_slots: [],
        fallback_auto_mode: {
          enabled: true,
          reason: 'Không có khung giờ trống phù hợp với deadline'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    // Normal scenario - return 3 suggestions
    const suggestions = [];
    const baseTime = now + 60 * 60 * 1000; // Start from 1 hour from now
    
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(baseTime + i * 2 * 60 * 60 * 1000);
      suggestions.push({
        slot_index: i,
        suggested_start_at: startTime.toISOString(),
        planned_minutes: duration_minutes,
        confidence: i === 0 ? 2 : i === 1 ? 1 : 0,
        reason: i === 0 ? 'Khung giờ tốt nhất, không có conflict' : 
                i === 1 ? 'Khung giờ khả thi, có thể có conflict nhỏ' :
                'Khung giờ cuối cùng, có thể có conflict'
      });
    }
    
    return {
      id: 'mock-normal',
      suggestion_type: 1,
      status: 1,
      confidence: 2,
      reason: 'Tìm được khung giờ phù hợp',
      manual_input: input,
      suggested_slots: suggestions,
      fallback_auto_mode: {
        enabled: false,
        reason: 'Có khung giờ phù hợp'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },
  
  async simulateRateLimit() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const error = new Error('Rate limit exceeded');
    error.status = 429;
    error.headers = {
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + 900,
      'Retry-After': '900'
    };
    throw error;
  },
  
  async simulateValidationError() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const error = new Error('Validation failed');
    error.status = 400;
    error.details = {
      duration_minutes: 'Must be a multiple of 15',
      deadline: 'Must be a valid ISO 8601 date'
    };
    throw error;
  },
  
  async simulateNetworkError() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const error = new Error('Network error');
    error.status = 503;
    throw error;
  }
};

module.exports = { mockAISuggestionsService };
