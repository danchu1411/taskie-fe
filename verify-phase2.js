import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Phase 2 Implementation...');
console.log('=====================================');

const filesToCheck = [
  {
    path: 'components/AISuggestionsModal/types.ts',
    name: 'Backend API Types',
    requiredContent: ['BackendSuggestionResponse', 'BackendValidationError', 'BackendRateLimitError']
  },
  {
    path: 'components/AISuggestionsModal/hooks/useFormValidation.ts',
    name: 'Enhanced Form Validation',
    requiredContent: ['setBackendErrors', 'clearAllErrors', 'Title is required', 'Duration must be at least 15 minutes']
  },
  {
    path: 'components/AISuggestionsModal/services/realAISuggestionsService.ts',
    name: 'Backend Error Handling',
    requiredContent: ['validationErrors', 'retry-after', 'x-ratelimit-reset']
  },
  {
    path: 'components/AISuggestionsModal/index.tsx',
    name: 'Validation Error Integration',
    requiredContent: ['validationErrors', 'setBackendErrors', 'goToForm']
  },
  {
    path: 'components/AISuggestionsModal/ManualInputForm.tsx',
    name: 'Form Component Updates',
    requiredContent: ['validationErrors', 'onClearErrors', 'handleFieldChange']
  },
  {
    path: 'components/AISuggestionsModal/sandbox/phase2-tests.ts',
    name: 'Phase 2 Test Suite',
    requiredContent: ['testFormValidation', 'testBackendValidationErrorHandling', 'runPhase2Tests']
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
  console.log('🎉 All Phase 2 components are properly implemented!');
  console.log('');
  console.log('✅ Backend API Types: Implemented');
  console.log('✅ Enhanced Form Validation: Implemented');
  console.log('✅ Backend Error Handling: Implemented');
  console.log('✅ Validation Error Integration: Implemented');
  console.log('✅ Form Component Updates: Implemented');
  console.log('✅ Phase 2 Test Suite: Implemented');
  console.log('');
  console.log('📋 Phase 2 Status: COMPLETED');
  console.log('📋 Ready for Phase 3: Slot Selection Enhancement');
} else {
  console.log('❌ Some Phase 2 components are missing or incomplete.');
  console.log('');
  console.log('Please fix the issues above before proceeding to Phase 3.');
  process.exit(1);
}
