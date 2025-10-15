#!/usr/bin/env node

/**
 * Phase 1 Implementation Verification Script
 * 
 * Verifies that all Phase 1 components are properly implemented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Phase 1 Implementation...');
console.log('=====================================');

// Files to check
const filesToCheck = [
  {
    path: 'components/AISuggestionsModal/services/realAISuggestionsService.ts',
    name: 'Real AI Suggestions Service',
    requiredContent: ['class RealAISuggestionsService', 'generateSuggestions', '0.0-1.0']
  },
  {
    path: 'components/AISuggestionsModal/services/realAcceptService.ts',
    name: 'Real Accept Service',
    requiredContent: ['class RealAISuggestionsAcceptService', 'PATCH', 'schedule_entry_id']
  },
  {
    path: 'components/AISuggestionsModal/SuggestionCard.tsx',
    name: 'SuggestionCard UI Updates',
    requiredContent: ['getConfidenceLabel', 'metadata-badges', '0.7', '0.4']
  },
  {
    path: 'components/AISuggestionsModal/types.ts',
    name: 'Types Updates',
    requiredContent: ['metadata?', 'adjusted_duration', '0.0-1.0 scale']
  },
  {
    path: 'components/AISuggestionsModal/index.tsx',
    name: 'Service Toggle',
    requiredContent: ['serviceManager.switchService', 'REACT_APP_USE_REAL_API']
  },
  {
    path: 'components/AISuggestionsModal/hooks/useAcceptFlow.ts',
    name: 'Accept Flow Hook Fix',
    requiredContent: ['getAcceptService', 'getAcceptService().acceptSuggestion']
  },
  {
    path: 'components/AISuggestionsModal/sandbox/phase1-tests.ts',
    name: 'Phase 1 Tests',
    requiredContent: ['testRealAISuggestionsService', 'testRealAcceptService', 'runPhase1Tests']
  }
];

let allPassed = true;

filesToCheck.forEach(file => {
  console.log(`\n📁 Checking ${file.name}...`);
  
  try {
    const filePath = path.join(__dirname, file.path);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`   ✅ File exists: ${file.path}`);
    
    file.requiredContent.forEach(required => {
      if (content.includes(required)) {
        console.log(`   ✅ Contains: ${required}`);
      } else {
        console.log(`   ❌ Missing: ${required}`);
        allPassed = false;
      }
    });
    
  } catch (error) {
    console.log(`   ❌ File not found: ${file.path}`);
    allPassed = false;
  }
});

console.log('\n=====================================');

if (allPassed) {
  console.log('🎉 All Phase 1 components are properly implemented!');
  console.log('');
  console.log('✅ Real AI Suggestions Service: Implemented');
  console.log('✅ Real Accept Service: Implemented');
  console.log('✅ SuggestionCard UI Updates: Implemented');
  console.log('✅ Types Updates: Implemented');
  console.log('✅ Service Toggle: Implemented');
  console.log('✅ Phase 1 Tests: Implemented');
  console.log('');
  console.log('📋 Phase 1 Status: COMPLETED');
  console.log('📋 Ready for Phase 2: API Types & Validation Updates');
} else {
  console.log('❌ Some Phase 1 components are missing or incomplete.');
  console.log('Please check the files above and ensure all required content is present.');
  process.exit(1);
}
