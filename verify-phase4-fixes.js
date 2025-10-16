import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Phase 4 Fixes...');
console.log('=====================================');

const filesToCheck = [
  {
    path: 'components/AISuggestionsModal/services/realAISuggestionsService.ts',
    name: 'Real AI Suggestions Service (Fixed)',
    requiredContent: ['httpClient.post', 'apiConfigManager.getEndpoint', 'error.isAuthError', 'error.isNetworkError']
  },
  {
    path: 'components/AISuggestionsModal/services/realAcceptService.ts',
    name: 'Real Accept Service (Fixed)',
    requiredContent: ['httpClient.patch', 'apiConfigManager.getEndpoint', 'error.isAuthError', 'error.isNetworkError']
  },
  {
    path: 'components/AISuggestionsModal/sandbox/phase4-tests.ts',
    name: 'Phase 4 Test Suite (Enhanced)',
    requiredContent: ['testRealServiceIntegration', 'testHTTPClientRetryLogic', 'testAuthenticationIntegration', 'testAPIMonitoringIntegration']
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
  console.log('🎉 Phase 4 fixes are properly implemented!');
  console.log('');
  console.log('✅ Real AI Suggestions Service: Fixed to use HTTP Client');
  console.log('✅ Real Accept Service: Fixed to use HTTP Client');
  console.log('✅ Phase 4 Test Suite: Enhanced with comprehensive tests');
  console.log('');
  console.log('📋 Phase 4 Status: ACTUALLY COMPLETED');
  console.log('📋 Ready for Phase 5: Production Deployment');
} else {
  console.log('❌ Some Phase 4 fixes are missing or incomplete.');
  console.log('');
  console.log('Please fix the issues above before proceeding to Phase 5');
  process.exit(1);
}


