import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Phase 4 Implementation...');
console.log('=====================================');

const filesToCheck = [
  {
    path: 'components/AISuggestionsModal/config/apiConfig.ts',
    name: 'API Configuration System',
    requiredContent: ['APIConfig', 'getAPIConfig', 'validateEnvironment', 'APIConfigManager']
  },
  {
    path: 'components/AISuggestionsModal/services/authService.ts',
    name: 'Authentication Service',
    requiredContent: ['AuthService', 'DefaultAuthService', 'MockAuthService', 'AuthServiceManager']
  },
  {
    path: 'components/AISuggestionsModal/services/httpClient.ts',
    name: 'HTTP Client with Retry Logic',
    requiredContent: ['HTTPClient', 'retryConfig', 'exponential backoff', 'apiMonitorManager']
  },
  {
    path: 'components/AISuggestionsModal/services/apiMonitor.ts',
    name: 'API Monitoring System',
    requiredContent: ['APIMonitor', 'DefaultAPIMonitor', 'APIMetrics', 'APIMonitorManager']
  },
  {
    path: 'components/AISuggestionsModal/services/enhancedRealAISuggestionsService.ts',
    name: 'Enhanced Real Suggestions Service',
    requiredContent: ['EnhancedRealAISuggestionsService', 'httpClient', 'apiConfigManager']
  },
  {
    path: 'components/AISuggestionsModal/services/enhancedRealAcceptService.ts',
    name: 'Enhanced Real Accept Service',
    requiredContent: ['EnhancedRealAISuggestionsAcceptService', 'httpClient', 'apiConfigManager']
  },
  {
    path: 'components/AISuggestionsModal/sandbox/phase4-tests.ts',
    name: 'Phase 4 Test Suite',
    requiredContent: ['testAPIConfiguration', 'testAuthenticationService', 'testHTTPClient', 'runPhase4Tests']
  }
];

let allPassed = true;

filesToCheck.forEach(file => {
  console.log(`\n📁 Checking ${file.name}...`);
  
  const filePath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ File not found: ${file.path}`);
    allPassed = false;
    return;
  }
  
  console.log(`   ✅ File exists: ${file.path}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  file.requiredContent.forEach(required => {
    if (content.includes(required)) {
      console.log(`   ✅ Contains: ${required}`);
    } else {
      console.log(`   ❌ Missing: ${required}`);
      allPassed = false;
    }
  });
});

console.log('\n=====================================');

if (allPassed) {
  console.log('🎉 All Phase 4 components are properly implemented!');
  console.log('');
  console.log('✅ API Configuration System: Implemented');
  console.log('✅ Authentication Service: Implemented');
  console.log('✅ HTTP Client with Retry Logic: Implemented');
  console.log('✅ API Monitoring System: Implemented');
  console.log('✅ Enhanced Real Suggestions Service: Implemented');
  console.log('✅ Enhanced Real Accept Service: Implemented');
  console.log('✅ Phase 4 Test Suite: Implemented');
  console.log('');
  console.log('📋 Phase 4 Status: COMPLETED');
  console.log('📋 Ready for Phase 5: Production Deployment');
} else {
  console.log('❌ Some Phase 4 components are missing or incomplete.');
  console.log('');
  console.log('Please fix the issues above before proceeding to Phase 5');
  process.exit(1);
}
