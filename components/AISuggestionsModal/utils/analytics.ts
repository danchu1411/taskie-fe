// Analytics service for AI Suggestions Modal
import type { AISuggestion, HistorySuggestion } from '../types';

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: string;
}

export interface AnalyticsService {
  trackEvent(event: AnalyticsEvent): Promise<void>;
  getAnalytics(): Promise<AnalyticsData>;
}

export interface AnalyticsData {
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  averageConfidence: number;
  popularTimeSlots: Array<{ hour: number; count: number }>;
}

class AnalyticsServiceManager implements AnalyticsService {
  private events: AnalyticsEvent[] = [];

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    this.events.push(event);
    console.log('📊 Analytics Event:', event);
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const suggestions = this.events.filter(e => e.event === 'suggestion_generated');
    const accepted = this.events.filter(e => e.event === 'suggestion_accepted');
    const rejected = this.events.filter(e => e.event === 'suggestion_rejected');

    const totalSuggestions = suggestions.length;
    const acceptedSuggestions = accepted.length;
    const rejectedSuggestions = rejected.length;
    
    const averageConfidence = suggestions.length > 0 
      ? suggestions.reduce((sum, e) => sum + (e.properties.confidence || 0), 0) / suggestions.length
      : 0;

    // Calculate popular time slots
    const timeSlotCounts: Record<number, number> = {};
    suggestions.forEach(e => {
      const slots = e.properties.additional_data?.slots_count || 0;
      const hour = new Date().getHours();
      timeSlotCounts[hour] = (timeSlotCounts[hour] || 0) + 1;
    });

    const popularTimeSlots = Object.entries(timeSlotCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSuggestions,
      acceptedSuggestions,
      rejectedSuggestions,
      averageConfidence,
      popularTimeSlots
    };
  }

  // Event tracking methods
  async trackSuggestionGenerated(suggestion: AISuggestion): Promise<void> {
    await this.trackEvent({
      event: 'suggestion_generated',
      properties: {
        suggestion_id: suggestion.id,
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        timestamp: new Date().toISOString(),
        additional_data: {
          suggestion_type: suggestion.suggestion_type,
          slots_count: suggestion.suggested_slots.length
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackSuggestionAccepted(suggestion: AISuggestion, slotIndex: number): Promise<void> {
    await this.trackEvent({
      event: 'suggestion_accepted',
      properties: {
        suggestion_id: suggestion.id,
        status: 1,
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        timestamp: new Date().toISOString(),
        additional_data: {
          slot_index: slotIndex,
          selected_slot: suggestion.suggested_slots[slotIndex]
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackSuggestionRejected(suggestion: AISuggestion, reason?: string): Promise<void> {
    await this.trackEvent({
      event: 'suggestion_rejected',
      properties: {
        suggestion_id: suggestion.id,
        status: 2,
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        timestamp: new Date().toISOString(),
        additional_data: {
          rejection_reason: reason
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackSuggestionReopened(suggestion: HistorySuggestion): Promise<void> {
    await this.trackEvent({
      event: 'suggestion_reopened',
      properties: {
        suggestion_id: suggestion.id,
        status: suggestion.status,
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        timestamp: new Date().toISOString(),
        additional_data: {
          original_status: suggestion.status,
          time_since_creation: Date.now() - new Date(suggestion.created_at).getTime()
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackHistoryViewed(filters?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event: 'history_viewed',
      properties: {
        timestamp: new Date().toISOString(),
        additional_data: {
          filters_applied: filters
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackFilterApplied(filterType: string, filterValue: any): Promise<void> {
    await this.trackEvent({
      event: 'filter_applied',
      properties: {
        timestamp: new Date().toISOString(),
        additional_data: {
          filter_type: filterType,
          filter_value: filterValue
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackModalOpened(): Promise<void> {
    await this.trackEvent({
      event: 'modal_opened',
      properties: {
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackModalClosed(): Promise<void> {
    await this.trackEvent({
      event: 'modal_closed',
      properties: {
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  async trackError(error: Error, context?: string): Promise<void> {
    await this.trackEvent({
      event: 'error_occurred',
      properties: {
        timestamp: new Date().toISOString(),
        additional_data: {
          error_message: error.message,
          error_context: context
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const analyticsServiceManager = new AnalyticsServiceManager();