/**
 * Validation utilities for AI suggestions
 */

/**
 * Validates suggested_start_at format
 * @param suggestedStartAt - The suggested start time string
 * @returns Validation result with error message if invalid
 */
export function validateSuggestedStartAt(suggestedStartAt: string): { isValid: boolean; error?: string } {
  // Check if empty
  if (!suggestedStartAt || suggestedStartAt.trim() === '') {
    return { isValid: false, error: 'Suggested start time is required' };
  }

  try {
    // Check if it's a valid date
    const date = new Date(suggestedStartAt);
    
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format. Expected ISO 8601 format' };
    }

    // Check if it has timezone info
    if (!suggestedStartAt.includes('+') && !suggestedStartAt.includes('-') && !suggestedStartAt.includes('Z')) {
      return { isValid: false, error: 'Missing timezone information. Expected format: YYYY-MM-DDTHH:mm:ss.sss±HH:mm' };
    }

    // Check if it's in the future
    const now = new Date();
    if (date <= now) {
      return { isValid: false, error: 'Suggested start time must be in the future' };
    }

    // Check if it's not too far in the future (optional business rule)
    const maxFuture = new Date();
    maxFuture.setFullYear(maxFuture.getFullYear() + 1);
    if (date > maxFuture) {
      return { isValid: false, error: 'Suggested start time must be within 1 year from now' };
    }

    // Check if it's a reasonable time (not too early or too late)
    const hour = date.getHours();
    if (hour < 0 || hour > 23) {
      return { isValid: false, error: 'Invalid hour in suggested start time' };
    }

    return { isValid: true };

  } catch (error) {
    return { isValid: false, error: 'Invalid suggested start time format' };
  }
}

/**
 * Validates AI suggestion response
 * @param suggestion - The AI suggestion object
 * @returns Validation result with error messages if invalid
 */
export function validateAISuggestion(suggestion: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if suggestion exists
  if (!suggestion) {
    errors.push('Suggestion is required');
    return { isValid: false, errors };
  }

  // Check if suggested_slots exists
  if (!suggestion.suggested_slots || !Array.isArray(suggestion.suggested_slots)) {
    errors.push('Suggested slots are required');
    return { isValid: false, errors };
  }

  // Check if suggested_slots is not empty
  if (suggestion.suggested_slots.length === 0) {
    errors.push('At least one suggested slot is required');
    return { isValid: false, errors };
  }

  // Validate each suggested slot
  suggestion.suggested_slots.forEach((slot: any, index: number) => {
    if (!slot.suggested_start_at) {
      errors.push(`Slot ${index + 1}: suggested_start_at is required`);
    } else {
      const validation = validateSuggestedStartAt(slot.suggested_start_at);
      if (!validation.isValid) {
        errors.push(`Slot ${index + 1}: ${validation.error}`);
      }
    }

    if (!slot.planned_minutes || slot.planned_minutes < 15 || slot.planned_minutes > 180) {
      errors.push(`Slot ${index + 1}: planned_minutes must be between 15 and 180`);
    }

    if (typeof slot.confidence !== 'number' || slot.confidence < 0 || slot.confidence > 1) {
      errors.push(`Slot ${index + 1}: confidence must be between 0 and 1`);
    }

    if (!slot.reason || slot.reason.trim() === '') {
      errors.push(`Slot ${index + 1}: reason is required`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

/**
 * Test function to validate different formats
 */
export function testSuggestedStartAtValidation() {
  const testCases = [
    '2024-01-15T09:00:00.000+07:00',  // ✅ Valid local timezone
    '2024-01-15T09:00:00.000Z',       // ✅ Valid UTC
    '2024-01-15T09:00:00+07:00',       // ✅ Valid without milliseconds
    '2024-01-15T09:00:00.000-05:00',   // ✅ Valid negative timezone
    '2024-01-15T09:00:00',             // ❌ No timezone
    'invalid-date',                    // ❌ Invalid format
    '',                                // ❌ Empty string
    '2023-01-15T09:00:00.000+07:00',   // ❌ Past date
  ];

  console.log('🧪 Testing suggested_start_at Validation');
  console.log('=========================================\n');

  testCases.forEach((testCase, index) => {
    const result = validateSuggestedStartAt(testCase);
    console.log(`Test ${index + 1}: ${testCase}`);
    console.log(`Result: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
    if (!result.isValid) {
      console.log(`Error: ${result.error}`);
    }
    console.log('');
  });
}
