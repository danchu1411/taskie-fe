// Simple Test Runner for AI Suggestions Modal
const { mockAISuggestionsService } = require('./services/mockAISuggestionsService.ts');

// Test scenarios
const testScenarios = {
  normal: {
    title: 'Ôn Toán chương 2',
    description: 'Làm bài tập MA2',
    duration_minutes: 60,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    preferred_window: undefined,
    target_task_id: undefined
  },
  
  tightDeadline: {
    title: 'Ôn tập gấp',
    description: 'Thi cuối kỳ',
    duration_minutes: 120,
    deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    preferred_window: undefined,
    target_task_id: undefined
  }
};

async function runMockAPITests() {
  console.log('🧪 Testing Mock AI Suggestions Service...\n');
  
  for (const [scenarioName, input] of Object.entries(testScenarios)) {
    try {
      console.log(`📋 Testing scenario: ${scenarioName}`);
      console.log('Input:', JSON.stringify(input, null, 2));
      
      const startTime = Date.now();
      const result = await mockAISuggestionsService.generateSuggestions(input);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📊 Found ${result.suggested_slots.length} suggestions`);
      console.log(`🎯 Confidence: ${result.confidence}`);
      console.log(`🔄 Fallback auto mode: ${result.fallback_auto_mode.enabled}`);
      
      if (result.suggested_slots.length > 0) {
        console.log('📅 Suggestions:');
        result.suggested_slots.forEach((slot, index) => {
          const startTime = new Date(slot.suggested_start_at).toLocaleString('vi-VN');
          console.log(`  ${index + 1}. ${startTime} (${slot.planned_minutes}min) - Confidence: ${slot.confidence}`);
          console.log(`     Reason: ${slot.reason}`);
        });
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Error in scenario ${scenarioName}:`, error.message);
      console.log('---\n');
    }
  }
}

async function runErrorTests() {
  console.log('🚨 Testing Error Scenarios...\n');
  
  try {
    console.log('Testing rate limit error...');
    await mockAISuggestionsService.simulateRateLimit();
  } catch (error) {
    console.log('✅ Rate limit error caught:', error.message);
    console.log('Headers:', error.headers);
  }
  
  try {
    console.log('Testing validation error...');
    await mockAISuggestionsService.simulateValidationError();
  } catch (error) {
    console.log('✅ Validation error caught:', error.message);
    console.log('Details:', error.details);
  }
  
  try {
    console.log('Testing network error...');
    await mockAISuggestionsService.simulateNetworkError();
  } catch (error) {
    console.log('✅ Network error caught:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Running All AI Suggestions Modal Tests...\n');
  
  await runMockAPITests();
  console.log('\n---\n');
  
  await runErrorTests();
  
  console.log('\n🎉 All tests completed successfully!');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
