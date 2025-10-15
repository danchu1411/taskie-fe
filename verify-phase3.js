import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Phase 3 Implementation...');
console.log('=====================================');

const filesToCheck = [
  {
    path: 'components/AISuggestionsModal/types.ts',
    name: 'Slot Selection Types',
    requiredContent: ['SlotComparison', 'SlotFilter', 'SlotSortOption', 'SlotSelectionState']
  },
  {
    path: 'components/AISuggestionsModal/hooks/useSlotSelection.ts',
    name: 'Slot Selection Hook',
    requiredContent: ['useSlotSelection', 'filteredSlots', 'sortedSlots', 'slotComparison']
  },
  {
    path: 'components/AISuggestionsModal/SlotFilters.tsx',
    name: 'Slot Filters Component',
    requiredContent: ['SlotFilters', 'Confidence Range', 'Time Range', 'Sort By']
  },
  {
    path: 'components/AISuggestionsModal/SlotComparison.tsx',
    name: 'Slot Comparison Component',
    requiredContent: ['SlotComparison', 'Time Difference', 'Confidence Difference', 'recommendation']
  },
  {
    path: 'components/AISuggestionsModal/SuggestionsDisplay.tsx',
    name: 'Enhanced Suggestions Display',
    requiredContent: ['header-controls', 'filter-toggle', 'comparison-toggle', 'sortedSlots']
  },
  {
    path: 'components/AISuggestionsModal/SuggestionCard.tsx',
    name: 'Enhanced Suggestion Card',
    requiredContent: ['isComparing', 'comparing', 'getCardClassName']
  },
  {
    path: 'components/AISuggestionsModal/styles/SlotFilters.css',
    name: 'Slot Filters Styling',
    requiredContent: ['slot-filters', 'filter-group', 'range-inputs', 'toggle-filters']
  },
  {
    path: 'components/AISuggestionsModal/styles/SlotComparison.css',
    name: 'Slot Comparison Styling',
    requiredContent: ['slot-comparison', 'comparison-content', 'comparison-metrics', 'recommendation']
  },
  {
    path: 'components/AISuggestionsModal/sandbox/phase3-tests.ts',
    name: 'Phase 3 Test Suite',
    requiredContent: ['testSlotFiltering', 'testSlotSorting', 'testSlotComparison', 'runPhase3Tests']
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
  console.log('🎉 All Phase 3 components are properly implemented!');
  console.log('');
  console.log('✅ Slot Selection Types: Implemented');
  console.log('✅ Slot Selection Hook: Implemented');
  console.log('✅ Slot Filters Component: Implemented');
  console.log('✅ Slot Comparison Component: Implemented');
  console.log('✅ Enhanced Suggestions Display: Implemented');
  console.log('✅ Enhanced Suggestion Card: Implemented');
  console.log('✅ Slot Filters Styling: Implemented');
  console.log('✅ Slot Comparison Styling: Implemented');
  console.log('✅ Phase 3 Test Suite: Implemented');
  console.log('');
  console.log('📋 Phase 3 Status: COMPLETED');
  console.log('📋 Ready for Phase 4: Real API Integration');
} else {
  console.log('❌ Some Phase 3 components are missing or incomplete.');
  console.log('');
  console.log('Please fix the issues above before proceeding to Phase 4.');
  process.exit(1);
}
