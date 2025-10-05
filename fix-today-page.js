const fs = require('fs');

// Read the file
const content = fs.readFileSync('src/features/schedule/TodayPage.tsx', 'utf8');

// Fix the issues
let fixed = content
  // Fix line 991 - remove invalid newline characters
  .replace(/icon="PLAN"`r`n\s+iconBg=/g, 'icon="📋"\n            iconBg=')
  // Fix line 1010 - remove invalid newline characters
  .replace(/icon="DOING"`r`n\s+iconBg=/g, 'icon="⚡"\n            iconBg=')
  // Fix any other similar patterns
  .replace(/icon="DONE"`r`n\s+iconBg=/g, 'icon="✓"\n            iconBg=')
  // Remove console.log statements in handleDragEnd
  .replace(/console\.log\('Drag end event:',.*?\);?\n?/g, '')
  .replace(/console\.log\('No drop target found'\);?\n?/g, '')
  .replace(/console\.log\('Drag details:',.*?\);?\n?/g, '')
  .replace(/console\.log\('Dragged item not found:',.*?\);?\n?/g, '')
  .replace(/console\.log\('Dragged item:',.*?\);?\n?/g, '')
  .replace(/console\.log\('Dropped on task:',.*?\);?\n?/g, '')
  .replace(/console\.log\('Invalid drop zone:',.*?\);?\n?/g, '')
  .replace(/console\.log\('Status change:',.*?\);?\n?/g, '')
  .replace(/console\.log\('Updating status\.\.\.'\);?\n?/g, '')
  .replace(/console\.log\('Status unchanged, no update needed'\);?\n?/g, '');

// Write back
fs.writeFileSync('src/features/schedule/TodayPage.tsx', fixed, 'utf8');

console.log('Fixed TodayPage.tsx');

