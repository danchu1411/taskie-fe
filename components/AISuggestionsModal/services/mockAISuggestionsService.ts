import { ManualInput, AISuggestion, SuggestedSlot } from '../types';

// Mock AI Suggestions Service
class MockAISuggestionsService {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate realistic suggestions based on input
  private generateSuggestions(input: ManualInput): SuggestedSlot[] {
    const suggestions: SuggestedSlot[] = [];
    const deadline = new Date(input.deadline);
    const now = new Date();
    
    // Calculate available time slots
    const timeSlots = this.calculateTimeSlots(deadline, input.duration_minutes);
    
    // Generate 1-3 suggestions based on available slots
    const numSuggestions = Math.min(timeSlots.length, 3);
    
    for (let i = 0; i < numSuggestions; i++) {
      const slot = timeSlots[i];
      const confidence = this.calculateConfidence(slot, input, i);
      const reason = this.generateReason(slot, input, confidence);
      
      suggestions.push({
        slot_index: i,
        suggested_start_at: slot.start.toISOString(),
        planned_minutes: input.duration_minutes,
        confidence,
        reason
      });
    }
    
    return suggestions;
  }

  // Calculate available time slots
  private calculateTimeSlots(deadline: Date, durationMinutes: number): Array<{start: Date, end: Date}> {
    const slots: Array<{start: Date, end: Date}> = [];
    const now = new Date();
    
    // Generate slots for the next 7 days
    for (let day = 0; day < 7; day++) {
      const currentDay = new Date(now);
      currentDay.setDate(currentDay.getDate() + day);
      
      // Generate slots for different times of day
      const timeSlots = [
        { hour: 9, minute: 0 },   // Morning
        { hour: 14, minute: 0 },  // Afternoon
        { hour: 19, minute: 0 },  // Evening
        { hour: 20, minute: 30 }  // Late evening
      ];
      
      for (const timeSlot of timeSlots) {
        const slotStart = new Date(currentDay);
        slotStart.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
        
        // Check if slot is valid (not in past, before deadline)
        if (slotStart > now && slotEnd <= deadline) {
          slots.push({ start: slotStart, end: slotEnd });
        }
      }
    }
    
    return slots.slice(0, 3); // Return max 3 slots
  }

  // Calculate confidence based on slot characteristics
  private calculateConfidence(slot: {start: Date, end: Date}, input: ManualInput, index: number): number {
    const hour = slot.start.getHours();
    
    // High confidence for evening slots (Night Owl preference)
    if (hour >= 19 && hour <= 22) {
      return 2;
    }
    
    // Medium confidence for afternoon slots
    if (hour >= 14 && hour <= 18) {
      return 1;
    }
    
    // Low confidence for morning slots
    return 0;
  }

  // Generate reason for suggestion
  private generateReason(slot: {start: Date, end: Date}, input: ManualInput, confidence: number): string {
    const hour = slot.start.getHours();
    const dateStr = slot.start.toLocaleDateString('vi-VN');
    const timeStr = slot.start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    switch (confidence) {
      case 2:
        return `Khung giờ tối ưu vào ${timeStr} ngày ${dateStr} - phù hợp với thói quen học tập buổi tối`;
      case 1:
        return `Khung giờ ${timeStr} ngày ${dateStr} - thời gian học tập hiệu quả`;
      case 0:
        return `Khung giờ ${timeStr} ngày ${dateStr} - sáng sớm, có thể không phù hợp`;
      default:
        return `Gợi ý khung giờ ${timeStr} ngày ${dateStr}`;
    }
  }

  // Check if should return empty suggestions
  private shouldReturnEmptySuggestions(input: ManualInput): boolean {
    const deadline = new Date(input.deadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Return empty if deadline is too close (less than 2 hours)
    return hoursDiff < 2;
  }

  // Generate fallback auto mode
  private generateFallbackAutoMode(input: ManualInput): {enabled: boolean, reason: string} {
    if (this.shouldReturnEmptySuggestions(input)) {
      return {
        enabled: true,
        reason: 'Deadline quá gần, đề xuất chuyển sang chế độ tự động'
      };
    }
    
    return {
      enabled: false,
      reason: 'Tìm được khung giờ phù hợp'
    };
  }

  // Main API method
  async generateSuggestions(input: ManualInput): Promise<AISuggestion> {
    // Simulate API delay
    await this.delay(2000 + Math.random() * 1000); // 2-3 seconds
    
    // Simulate occasional errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('AI service temporarily unavailable');
    }
    
    const shouldReturnEmpty = this.shouldReturnEmptySuggestions(input);
    const suggestions = shouldReturnEmpty ? [] : this.generateSuggestions(input);
    const fallbackAutoMode = this.generateFallbackAutoMode(input);
    
    const response: AISuggestion = {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      suggestion_type: 0,
      status: 0,
      confidence: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.confidence)) : 0,
      reason: suggestions.length > 0 
        ? `Tìm được ${suggestions.length} khung giờ phù hợp`
        : 'Không tìm được khung giờ phù hợp',
      manual_input: input,
      suggested_slots: suggestions,
      fallback_auto_mode: fallbackAutoMode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return response;
  }

  // Simulate rate limit error
  async simulateRateLimit(): Promise<never> {
    await this.delay(500);
    const error = new Error('Rate limit exceeded') as any;
    error.status = 429;
    error.headers = {
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + 900, // 15 minutes
      'Retry-After': '900'
    };
    throw error;
  }

  // Simulate validation error
  async simulateValidationError(): Promise<never> {
    await this.delay(500);
    const error = new Error('Validation failed') as any;
    error.status = 400;
    error.details = {
      duration_minutes: 'Duration must be a multiple of 15 minutes'
    };
    throw error;
  }

  // Simulate network error
  async simulateNetworkError(): Promise<never> {
    await this.delay(1000);
    const error = new Error('Network error') as any;
    error.status = 503;
    throw error;
  }
}

// Export singleton instance
export const mockAISuggestionsService = new MockAISuggestionsService();

// Export class for testing
export { MockAISuggestionsService };
