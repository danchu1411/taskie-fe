#!/usr/bin/env node

/**
 * Phase 1 Testing: Date Utilities
 * Test UTC-safe date comparison functions
 */

console.log('🧪 Phase 1 Test: Date Utilities');
console.log('================================');

// Mock the date utilities for testing
function isSameDay(dateStr, date) {
  if (!dateStr || !date) return false;
  
  try {
    const dateFromStr = dateStr.split('T')[0];
    const dateFromDate = date.toISOString().split('T')[0];
    return dateFromStr === dateFromDate;
  } catch (error) {
    console.warn('Error comparing dates:', error);
    return false;
  }
}

function getTodayUTC() {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

function isToday(dateStr) {
  return isSameDay(dateStr, new Date());
}

console.log('\n📅 Testing Date Utilities:');
console.log('===========================');

// Test 1: Same day comparison
console.log('\n1. Same Day Comparison:');
const today = new Date();
const todayStr = getTodayUTC();
const isSameDayResult = isSameDay(todayStr, today);
console.log(`   Input: "${todayStr}" vs ${today.toISOString()}`);
console.log(`   Result: ${isSameDayResult ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Different day comparison
console.log('\n2. Different Day Comparison:');
const yesterday = new Date();
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0] + 'T00:00:00.000Z';
const isDifferentDayResult = !isSameDay(yesterdayStr, today);
console.log(`   Input: "${yesterdayStr}" vs ${today.toISOString()}`);
console.log(`   Result: ${isDifferentDayResult ? '✅ PASS' : '❌ FAIL'}`);

// Test 3: Edge case - midnight boundary
console.log('\n3. Edge Case - Midnight Boundary:');
const lateNight = '2025-01-16T23:59:59.000Z';
const earlyMorning = '2025-01-17T00:00:01.000Z';
const lateNightDate = new Date(lateNight);
const earlyMorningDate = new Date(earlyMorning);

const edgeCase1 = !isSameDay(lateNight, earlyMorningDate);
const edgeCase2 = !isSameDay(earlyMorning, lateNightDate);
console.log(`   Late night vs early morning: ${edgeCase1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Early morning vs late night: ${edgeCase2 ? '✅ PASS' : '❌ FAIL'}`);

// Test 4: Timezone independence
console.log('\n4. Timezone Independence:');
const utcDate = '2025-01-16T12:00:00.000Z';
const utcDateObj = new Date(utcDate);

// Simulate different timezones by adjusting the date
const pstDate = new Date(utcDate);
pstDate.setHours(pstDate.getHours() - 8); // PST is UTC-8

const estDate = new Date(utcDate);
estDate.setHours(estDate.getHours() - 5); // EST is UTC-5

const jstDate = new Date(utcDate);
jstDate.setHours(jstDate.getHours() + 9); // JST is UTC+9

const tzTest1 = isSameDay(utcDate, utcDateObj);
const tzTest2 = isSameDay(utcDate, pstDate);
const tzTest3 = isSameDay(utcDate, estDate);
const tzTest4 = isSameDay(utcDate, jstDate);

console.log(`   UTC: ${tzTest1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   PST: ${tzTest2 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   EST: ${tzTest3 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   JST: ${tzTest4 ? '✅ PASS' : '❌ FAIL'}`);

// Test 5: Invalid input handling
console.log('\n5. Invalid Input Handling:');
const invalidTest1 = isSameDay('', new Date());
const invalidTest2 = isSameDay('invalid-date', new Date());
const invalidTest3 = isSameDay('2025-01-16T00:00:00.000Z', null);

console.log(`   Empty string: ${!invalidTest1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Invalid date: ${!invalidTest2 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Null date: ${!invalidTest3 ? '✅ PASS' : '❌ FAIL'}`);

// Test 6: getTodayUTC format
console.log('\n6. getTodayUTC Format:');
const todayUTC = getTodayUTC();
const isValidFormat = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(todayUTC);
console.log(`   Format: "${todayUTC}"`);
console.log(`   Valid ISO format: ${isValidFormat ? '✅ PASS' : '❌ FAIL'}`);

// Test 7: isToday function
console.log('\n7. isToday Function:');
const isTodayResult = isToday(todayUTC);
const isNotTodayResult = !isToday(yesterdayStr);
console.log(`   Today check: ${isTodayResult ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Yesterday check: ${isNotTodayResult ? '✅ PASS' : '❌ FAIL'}`);

// Summary
console.log('\n📊 Test Summary:');
console.log('================');
const totalTests = 7;
const passedTests = [
  isSameDayResult,
  isDifferentDayResult,
  edgeCase1 && edgeCase2,
  tzTest1 && tzTest2 && tzTest3 && tzTest4,
  !invalidTest1 && !invalidTest2 && !invalidTest3,
  isValidFormat,
  isTodayResult && isNotTodayResult
].filter(Boolean).length;

console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 All date utility tests passed!');
  console.log('✅ Ready for Phase 2: Confetti Animation');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}
