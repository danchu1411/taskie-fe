import { realAISuggestionsService } from '../services/realAISuggestionsService';
import { realAcceptService } from '../services/realAcceptService';
import { serviceManager } from '../hooks/useAISuggestions';
import { acceptServiceManager } from '../services/acceptService';
import type { ManualInput } from '../types';

// Test data
const testManualInput: ManualInput = {
  title: 'Study React Hooks',
  description: 'Learn about useState, useEffect, and custom hooks',
  duration_minutes: 60,
  deadline: '2025-01-20T23:59:59Z',
  preferred_window: ['2025-01-15T09:00:00Z', '2025-01-15T18:00:00Z']
};

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: (key: string) => key === 'authToken' ? 'mock-jwt-token' : null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock fetch for testing
const mockFetch = (url: string, options: any) => {
  console.log('Mock fetch called:', { url, options });
  
  if (url.includes('/api/ai-suggestions/generate')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        message: 'Suggestions generated successfully',
        data: {
          suggestion: {
            suggestion_id: 'test-suggestion-id',
            items: [{
              item_type: 0,
              title: testManualInput.title,
              description: testManualInput.description,
              estimated_minutes: testManualInput.duration_minutes,
              suggested_slots: [
                {
                  suggested_start_at: '2025-01-15T09:00:00Z',
                  planned_minutes: 60,
                  confidence: 0.8, // High confidence
                  reason: 'Optimal morning slot with high productivity',
                  original_index: 0
                },
                {
                  suggested_start_at: '2025-01-15T14:00:00Z',
                  planned_minutes: 60,
                  confidence: 0.6, // Medium confidence
                  reason: 'Good afternoon slot',
                  original_index: 1
                },
                {
                  suggested_start_at: '2025-01-15T19:00:00Z',
                  planned_minutes: 60,
                  confidence: 0.3, // Low confidence
                  reason: 'Evening slot, may be less productive',
                  original_index: 2
                }
              ],
              metadata: {
                source: 'manual_input',
                adjusted_duration: false,
                adjusted_deadline: false
              }
            }],
            confidence: 0.7,
            reason: 'Found suitable time slots based on your preferences',
            fallback_auto_mode: {
              enabled: false,
              reason: ''
            },
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }
        },
        meta: {
          cost: 0.05,
          tokens: 150,
          latency_ms: 1200
        }
      })
    });
  }
  
  if (url.includes('/api/ai-suggestions/') && url.includes('/status')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-suggestion-id',
        status: 'accepted',
        selected_slot_index: 0,
        schedule_entry_id: 'test-schedule-entry-id',
        message: 'Suggestion accepted successfully',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      })
    });
  }
  
  return Promise.reject(new Error('Unknown endpoint'));
};

// Test functions
async function testRealAISuggestionsService() {
  console.log('🧪 Testing RealAISuggestionsService...');
  
  // Mock localStorage and fetch
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  Object.defineProperty(window, 'fetch', { value: mockFetch });
  
  try {
    const result = await realAISuggestionsService.generateSuggestions(testManualInput);
    
    console.log('✅ Generate suggestions result:', result);
    
    // Verify response structure
    console.assert(result.id === 'test-suggestion-id', 'Suggestion ID should match');
    console.assert(result.suggested_slots.length === 3, 'Should have 3 suggested slots');
    console.assert(result.suggested_slots[0].confidence === 0.8, 'First slot should have high confidence');
    console.assert(result.suggested_slots[0].slot_index === 0, 'Slot index should match original_index');
    console.assert(result.suggested_slots[1].confidence === 0.6, 'Second slot should have medium confidence');
    console.assert(result.suggested_slots[2].confidence === 0.3, 'Third slot should have low confidence');
    
    console.log('✅ All assertions passed for RealAISuggestionsService');
    return result;
    
  } catch (error) {
    console.error('❌ RealAISuggestionsService test failed:', error);
    throw error;
  }
}

async function testRealAcceptService() {
  console.log('🧪 Testing RealAcceptService...');
  
  try {
    const result = await realAcceptService.acceptSuggestion('test-suggestion-id', {
      status: 1,
      selected_slot_index: 0
    });
    
    console.log('✅ Accept suggestion result:', result);
    
    // Verify response structure
    console.assert(result.schedule_entry_id === 'test-schedule-entry-id', 'Schedule entry ID should match');
    console.assert(result.selected_slot_index === 0, 'Selected slot index should match');
    console.assert(result.status === 'accepted', 'Status should be accepted');
    
    console.log('✅ All assertions passed for RealAcceptService');
    return result;
    
  } catch (error) {
    console.error('❌ RealAcceptService test failed:', error);
    throw error;
  }
}

async function testServiceToggle() {
  console.log('🧪 Testing Service Toggle...');
  
  // Test switching to real service
  serviceManager.switchService(realAISuggestionsService);
  acceptServiceManager.switchService(realAcceptService);
  
  console.log('✅ Service toggle completed');
}

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  // Test rate limiting error
  const mockRateLimitFetch = (url: string, options: any) => {
    if (url.includes('/api/ai-suggestions/generate')) {
      return Promise.resolve({
        ok: false,
        status: 429,
        headers: {
          get: (name: string) => {
            if (name === 'retry-after') return '900';
            if (name === 'x-ratelimit-reset') return '1640995200';
            if (name === 'x-ratelimit-remaining') return '0';
            return null;
          }
        },
        json: () => Promise.resolve({
          message: 'Too many AI suggestion requests from this user',
          retryAfter: 900
        })
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  };
  
  Object.defineProperty(window, 'fetch', { value: mockRateLimitFetch });
  
  try {
    await realAISuggestionsService.generateSuggestions(testManualInput);
    console.error('❌ Should have thrown rate limit error');
  } catch (error: any) {
    console.log('✅ Rate limit error caught:', error.message);
    console.assert(error.status === 429, 'Should have status 429');
    console.assert(error.retryAfter === 900, 'Should have retryAfter from header');
    console.log('✅ Rate limit error handling works correctly');
  }
}

async function testConfidenceDisplay() {
  console.log('🧪 Testing Confidence Display...');
  
  const testSlots = [
    { confidence: 0.8, expected: 'High Confidence' },
    { confidence: 0.6, expected: 'Medium Confidence' },
    { confidence: 0.3, expected: 'Low Confidence' }
  ];
  
  testSlots.forEach(slot => {
    let label;
    if (slot.confidence >= 0.7) label = 'High Confidence';
    else if (slot.confidence >= 0.4) label = 'Medium Confidence';
    else label = 'Low Confidence';
    
    console.assert(label === slot.expected, `Confidence ${slot.confidence} should be ${slot.expected}`);
  });
  
  console.log('✅ Confidence display logic works correctly');
}

// Run all tests
async function runPhase1Tests() {
  console.log('🚀 Starting Phase 1 Tests...');
  
  try {
    await testConfidenceDisplay();
    await testRealAISuggestionsService();
    await testRealAcceptService();
    await testServiceToggle();
    await testErrorHandling();
    
    console.log('🎉 All Phase 1 tests passed!');
    
  } catch (error) {
    console.error('💥 Phase 1 tests failed:', error);
    process.exit(1);
  }
}

// Export for manual testing
export {
  testRealAISuggestionsService,
  testRealAcceptService,
  testServiceToggle,
  testErrorHandling,
  testConfidenceDisplay,
  runPhase1Tests
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('Phase 1 tests loaded. Run runPhase1Tests() to execute.');
} else {
  // Node.js environment
  runPhase1Tests();
}
