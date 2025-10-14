// Test Runner for AI Suggestions Modal
import { runTestScenarios, runErrorScenarios } from './services/testMockAPI';
import { runAllAPITests } from './hooks/testAPIIntegration';

async function runAllTests() {
  console.log('🧪 Running All AI Suggestions Modal Tests...\n');
  
  try {
    // Test Mock API Service
    console.log('📋 Testing Mock API Service...');
    await runTestScenarios();
    
    console.log('\n---\n');
    
    // Test Error Scenarios
    console.log('🚨 Testing Error Scenarios...');
    await runErrorScenarios();
    
    console.log('\n---\n');
    
    // Test API Integration Hook
    console.log('🔗 Testing API Integration Hook...');
    await runAllAPITests();
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function runMockAPITests() {
  console.log('📋 Running Mock API Tests Only...\n');
  
  try {
    await runTestScenarios();
    await runErrorScenarios();
    console.log('\n🎉 Mock API tests completed successfully!');
  } catch (error) {
    console.error('❌ Mock API tests failed:', error);
    process.exit(1);
  }
}

async function runHookTests() {
  console.log('🔗 Running API Integration Hook Tests Only...\n');
  
  try {
    await runAllAPITests();
    console.log('\n🎉 API Integration Hook tests completed successfully!');
  } catch (error) {
    console.error('❌ API Integration Hook tests failed:', error);
    process.exit(1);
  }
}

// CLI argument handling
const args = process.argv.slice(2);
const isCI = args.includes('--ci');

if (isCI) {
  console.log('🤖 Running in CI mode...');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const command = args[0];
  
  switch (command) {
    case 'mock':
      runMockAPITests();
      break;
    case 'hook':
      runHookTests();
      break;
    case 'all':
    default:
      runAllTests();
      break;
  }
}

export { runAllTests, runMockAPITests, runHookTests };
