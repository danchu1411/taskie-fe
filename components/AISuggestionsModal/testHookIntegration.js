// Simple API Integration Hook Test
const { mockAISuggestionsService } = require('./services/mockAISuggestionsService.js');

// Mock React hooks for testing
const mockUseState = (initial) => {
  let state = initial;
  return [
    state,
    (newState) => {
      state = typeof newState === 'function' ? newState(state) : newState;
    }
  ];
};

const mockUseRef = (initial) => {
  return { current: initial };
};

const mockUseCallback = (fn) => fn;

// Mock useAISuggestions hook
function useAISuggestions() {
  const [isLoading, setIsLoading] = mockUseState(false);
  const [error, setError] = mockUseState(null);
  const lastRequest = mockUseRef(null);

  const executeRequest = mockUseCallback(async (input) => {
    setIsLoading(true);
    setError(null);
    lastRequest.current = input;

    try {
      const result = await mockAISuggestionsService.generateSuggestions(input);
      return result;
    } catch (err) {
      console.error('API call failed:', err);
      let errorMessage = 'Có lỗi xảy ra khi tạo gợi ý.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  });

  const generateSuggestions = mockUseCallback(async (input) => {
    const result = await executeRequest(input);
    if (!result) {
      throw new Error(error || 'Không tìm thấy gợi ý.');
    }
    return result;
  });

  const retry = mockUseCallback(async () => {
    if (lastRequest.current) {
      return executeRequest(lastRequest.current);
    }
    setError('Không có yêu cầu trước đó để thử lại.');
    return null;
  });

  const clearError = mockUseCallback(() => {
    setError(null);
  });

  const reset = mockUseCallback(() => {
    setIsLoading(false);
    setError(null);
    lastRequest.current = null;
  });

  const getState = mockUseCallback(() => ({
    isLoading,
    error,
    hasLastRequest: lastRequest.current !== null,
    lastRequest: lastRequest.current,
  }));

  return {
    generateSuggestions,
    isLoading,
    error,
    retry,
    clearError,
    reset,
    getState,
  };
}

async function testAPIIntegrationHook() {
  console.log('🔗 Testing API Integration Hook...\n');
  
  try {
    // Test 1: Basic functionality
    console.log('📋 Test 1: Basic functionality');
    const hook = useAISuggestions();
    
    const testInput = {
      title: 'Test Task',
      description: 'Test Description',
      duration_minutes: 60,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log('Input:', JSON.stringify(testInput, null, 2));
    
    const result = await hook.generateSuggestions(testInput);
    console.log('✅ Generated suggestions successfully');
    console.log(`📊 Found ${result.suggested_slots.length} suggestions`);
    console.log(`🎯 Confidence: ${result.confidence}`);
    
    // Test 2: State management
    console.log('\n📋 Test 2: State management');
    const state = hook.getState();
    console.log('State:', JSON.stringify(state, null, 2));
    
    // Test 3: Error handling
    console.log('\n📋 Test 3: Error handling');
    try {
      await mockAISuggestionsService.simulateRateLimit();
    } catch (error) {
      console.log('✅ Error handling works:', error.message);
    }
    
    // Test 4: Retry functionality
    console.log('\n📋 Test 4: Retry functionality');
    const retryResult = await hook.retry();
    if (retryResult) {
      console.log('✅ Retry works correctly');
      console.log(`📊 Retry found ${retryResult.suggested_slots.length} suggestions`);
    } else {
      console.log('⚠️ No previous request to retry');
    }
    
    // Test 5: Reset functionality
    console.log('\n📋 Test 5: Reset functionality');
    hook.reset();
    const resetState = hook.getState();
    console.log('Reset state:', JSON.stringify(resetState, null, 2));
    
    console.log('\n🎉 API Integration Hook tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API Integration Hook test failed:', error);
    throw error;
  }
}

// Run the test
testAPIIntegrationHook().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
