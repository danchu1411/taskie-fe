import { mockAISuggestionsService } from './mockAISuggestionsService';
import type { ManualInput } from '../types';

// Test scenarios for mock API
export const testScenarios = {
  // Normal case with suggestions
  normal: {
    title: 'Ôn Toán chương 2',
    description: 'Làm bài tập MA2',
    duration_minutes: 60,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    preferred_window: undefined,
    target_task_id: undefined
  } as ManualInput,

  // Case with preferred window
  withPreferredWindow: {
    title: 'Làm bài tập Vật lý',
    description: 'Chương 3: Động lực học',
    duration_minutes: 90,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    preferred_window: [
      new Date(Date.now() + 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(), // Tomorrow 7 PM
      new Date(Date.now() + 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000).toISOString()  // Tomorrow 10 PM
    ] as [string, string],
    target_task_id: 'task_123'
  } as ManualInput,

  // Case with tight deadline (should return empty suggestions)
  tightDeadline: {
    title: 'Ôn tập gấp',
    description: 'Thi cuối kỳ',
    duration_minutes: 120,
    deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
    preferred_window: undefined,
    target_task_id: undefined
  } as ManualInput,

  // Case with long duration
  longDuration: {
    title: 'Học nhóm dài',
    description: 'Chuẩn bị presentation',
    duration_minutes: 180,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    preferred_window: undefined,
    target_task_id: undefined
  } as ManualInput
};

// Test function to run all scenarios
export const runTestScenarios = async () => {
  console.log('🧪 Testing Mock AI Suggestions Service...\n');

  for (const [scenarioName, input] of Object.entries(testScenarios)) {
    try {
      console.log(`📋 Testing scenario: ${scenarioName}`);
      console.log('Input:', input);
      
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
      console.error(`❌ Error in scenario ${scenarioName}:`, error);
      console.log('---\n');
    }
  }
};

// Test error scenarios
export const runErrorScenarios = async () => {
  console.log('🚨 Testing Error Scenarios...\n');

  try {
    console.log('Testing rate limit error...');
    await mockAISuggestionsService.simulateRateLimit();
  } catch (error: any) {
    console.log('✅ Rate limit error caught:', error.message);
    console.log('Headers:', error.headers);
  }

  try {
    console.log('Testing validation error...');
    await mockAISuggestionsService.simulateValidationError();
  } catch (error: any) {
    console.log('✅ Validation error caught:', error.message);
    console.log('Details:', error.details);
  }

  try {
    console.log('Testing network error...');
    await mockAISuggestionsService.simulateNetworkError();
  } catch (error: any) {
    console.log('✅ Network error caught:', error.message);
  }
};

// Export for use in components
export default {
  testScenarios,
  runTestScenarios,
  runErrorScenarios
};
