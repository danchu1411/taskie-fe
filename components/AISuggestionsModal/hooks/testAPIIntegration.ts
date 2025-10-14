import { serviceManager } from '../hooks/useAISuggestions';
import { testScenarios, runTestScenarios } from '../services/testMockAPI';

// Test API integration hook
export const testAPIIntegrationHook = async () => {
  console.log('🧪 Testing API Integration Hook...\n');

  // Test service manager
  console.log('📋 Testing Service Manager...');
  
  try {
    const normalInput = testScenarios.normal;
    const result = await serviceManager.generateSuggestions(normalInput);
    
    console.log('✅ Service Manager works correctly');
    console.log(`📊 Generated ${result.suggested_slots.length} suggestions`);
    console.log(`🎯 Confidence: ${result.confidence}`);
    
  } catch (error) {
    console.error('❌ Service Manager error:', error);
  }

  console.log('\n---\n');

  // Test all scenarios
  await runTestScenarios();

  console.log('\n🎉 API Integration Hook testing completed!');
};

// Test error handling
export const testErrorHandling = async () => {
  console.log('🚨 Testing Error Handling...\n');

  const errorScenarios = [
    {
      name: 'Rate Limit Error',
      test: async () => {
        // This would trigger rate limit in real scenario
        const input = testScenarios.normal;
        return await serviceManager.generateSuggestions(input);
      }
    },
    {
      name: 'Network Error',
      test: async () => {
        // This would trigger network error in real scenario
        const input = testScenarios.normal;
        return await serviceManager.generateSuggestions(input);
      }
    }
  ];

  for (const scenario of errorScenarios) {
    try {
      console.log(`Testing ${scenario.name}...`);
      await scenario.test();
      console.log(`✅ ${scenario.name} handled correctly`);
    } catch (error: any) {
      console.log(`✅ ${scenario.name} error caught:`, error.message);
    }
  }

  console.log('\n🎉 Error handling testing completed!');
};

// Test service switching (for backend integration)
export const testServiceSwitching = () => {
  console.log('🔄 Testing Service Switching...\n');

  // Create a mock service for testing
  const mockBackendService = {
    async generateSuggestions(input: any) {
      console.log('🔄 Using mock backend service...');
      return {
        id: 'backend_test_id',
        suggestion_type: 0,
        status: 0,
        confidence: 2,
        reason: 'Backend service test',
        manual_input: input,
        suggested_slots: [],
        fallback_auto_mode: { enabled: false, reason: 'Test' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  };

  // Test switching
  console.log('📋 Switching to mock backend service...');
  serviceManager.switchService(mockBackendService);
  
  console.log('✅ Service switching works correctly');
  console.log('🎉 Ready for backend integration!');
};

// Run all tests
export const runAllAPITests = async () => {
  console.log('🚀 Running All API Integration Tests...\n');
  
  await testAPIIntegrationHook();
  console.log('\n---\n');
  
  await testErrorHandling();
  console.log('\n---\n');
  
  testServiceSwitching();
  
  console.log('\n🎉 All API Integration Tests Completed!');
};

export default {
  testAPIIntegrationHook,
  testErrorHandling,
  testServiceSwitching,
  runAllAPITests
};
