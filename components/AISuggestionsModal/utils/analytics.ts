import { AISuggestion, HistorySuggestion } from '../types';

// Analytics Event Interface
export interface AnalyticsEvent {
  event: string;
  properties: {
    suggestion_id?: string;
    status?: number;
    duration_minutes?: number;
    confidence?: number;
    timestamp: string;
    user_id?: string;
    session_id?: string;
    additional_data?: Record<string, any>;
  };
}

// Analytics Service Interface
export interface AnalyticsService {
  track(event: AnalyticsEvent): Promise<void>;
  trackBatch(events: AnalyticsEvent[]): Promise<void>;
  getAnalytics(): Promise<AnalyticsData>;
  clearAnalytics(): Promise<void>;
}

// Analytics Data Interface
export interface AnalyticsData {
  total_events: number;
  events_by_type: Record<string, number>;
  suggestion_stats: {
    total_generated: number;
    total_accepted: number;
    total_rejected: number;
    total_reopened: number;
    acceptance_rate: number;
    rejection_rate: number;
  };
  user_interactions: {
    history_views: number;
    filter_applications: number;
    modal_opens: number;
    modal_closes: number;
  };
  performance_metrics: {
    average_generation_time: number;
    average_acceptance_time: number;
    error_rate: number;
  };
  time_range: {
    start: string;
    end: string;
  };
}

// Mock Analytics Service Implementation
class MockAnalyticsService implements AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.generateUserId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async track(event: AnalyticsEvent): Promise<void> {
    // Add session and user context
    const enrichedEvent: AnalyticsEvent = {
      ...event,
      properties: {
        ...event.properties,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: new Date().toISOString(),
      },
    };

    this.events.push(enrichedEvent);
    console.log('📊 Analytics Event Tracked:', enrichedEvent);
  }

  public async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    const enrichedEvents = events.map(event => ({
      ...event,
      properties: {
        ...event.properties,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: new Date().toISOString(),
      },
    }));

    this.events.push(...enrichedEvents);
    console.log('📊 Analytics Batch Tracked:', enrichedEvents.length, 'events');
  }

  public async getAnalytics(): Promise<AnalyticsData> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter events from the last week
    const recentEvents = this.events.filter(event => 
      new Date(event.properties.timestamp) >= oneWeekAgo
    );

    // Calculate events by type
    const eventsByType: Record<string, number> = {};
    recentEvents.forEach(event => {
      eventsByType[event.event] = (eventsByType[event.event] || 0) + 1;
    });

    // Calculate suggestion stats
    const suggestionEvents = recentEvents.filter(event => 
      event.event.startsWith('suggestion_')
    );
    
    const totalGenerated = eventsByType['suggestion_generated'] || 0;
    const totalAccepted = eventsByType['suggestion_accepted'] || 0;
    const totalRejected = eventsByType['suggestion_rejected'] || 0;
    const totalReopened = eventsByType['suggestion_reopened'] || 0;
    
    const acceptanceRate = totalGenerated > 0 ? (totalAccepted / totalGenerated) * 100 : 0;
    const rejectionRate = totalGenerated > 0 ? (totalRejected / totalGenerated) * 100 : 0;

    // Calculate user interactions
    const userInteractions = {
      history_views: eventsByType['history_viewed'] || 0,
      filter_applications: eventsByType['filter_applied'] || 0,
      modal_opens: eventsByType['modal_opened'] || 0,
      modal_closes: eventsByType['modal_closed'] || 0,
    };

    // Calculate performance metrics (mock data for now)
    const performanceMetrics = {
      average_generation_time: 1500, // ms
      average_acceptance_time: 800, // ms
      error_rate: 0.05, // 5%
    };

    return {
      total_events: recentEvents.length,
      events_by_type: eventsByType,
      suggestion_stats: {
        total_generated: totalGenerated,
        total_accepted: totalAccepted,
        total_rejected: totalRejected,
        total_reopened: totalReopened,
        acceptance_rate: acceptanceRate,
        rejection_rate: rejectionRate,
      },
      user_interactions: userInteractions,
      performance_metrics: performanceMetrics,
      time_range: {
        start: oneWeekAgo.toISOString(),
        end: now.toISOString(),
      },
    };
  }

  public async clearAnalytics(): Promise<void> {
    this.events = [];
    console.log('📊 Analytics cleared');
  }

  // Helper methods for common events
  public async trackSuggestionGenerated(suggestion: AISuggestion): Promise<void> {
    await this.track({
      event: 'suggestion_generated',
      properties: {
        suggestion_id: suggestion.id,
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        additional_data: {
          suggestion_type: suggestion.suggestion_type,
          slots_count: suggestion.suggested_slots.length,
        },
      },
    });
  }

  public async trackSuggestionAccepted(suggestion: AISuggestion, slotIndex: number): Promise<void> {
    await this.track({
      event: 'suggestion_accepted',
      properties: {
        suggestion_id: suggestion.id,
        status: 1, // Accepted
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        additional_data: {
          slot_index: slotIndex,
          selected_slot: suggestion.suggested_slots[slotIndex],
        },
      },
    });
  }

  public async trackSuggestionRejected(suggestion: AISuggestion, reason?: string): Promise<void> {
    await this.track({
      event: 'suggestion_rejected',
      properties: {
        suggestion_id: suggestion.id,
        status: 2, // Rejected
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        additional_data: {
          rejection_reason: reason,
        },
      },
    });
  }

  public async trackSuggestionReopened(suggestion: HistorySuggestion): Promise<void> {
    await this.track({
      event: 'suggestion_reopened',
      properties: {
        suggestion_id: suggestion.id,
        status: suggestion.status,
        duration_minutes: suggestion.manual_input.duration_minutes,
        confidence: suggestion.confidence,
        additional_data: {
          original_status: suggestion.status,
          time_since_creation: Date.now() - new Date(suggestion.created_at).getTime(),
        },
      },
    });
  }

  public async trackHistoryViewed(filters?: Record<string, any>): Promise<void> {
    await this.track({
      event: 'history_viewed',
      properties: {
        additional_data: {
          filters_applied: filters,
        },
      },
    });
  }

  public async trackFilterApplied(filterType: string, filterValue: any): Promise<void> {
    await this.track({
      event: 'filter_applied',
      properties: {
        additional_data: {
          filter_type: filterType,
          filter_value: filterValue,
        },
      },
    });
  }

  public async trackModalOpened(): Promise<void> {
    await this.track({
      event: 'modal_opened',
      properties: {},
    });
  }

  public async trackModalClosed(): Promise<void> {
    await this.track({
      event: 'modal_closed',
      properties: {},
    });
  }

  public async trackError(error: string, context?: string): Promise<void> {
    await this.track({
      event: 'error_occurred',
      properties: {
        additional_data: {
          error_message: error,
          error_context: context,
        },
      },
    });
  }
}

// Service Manager for easy switching
class AnalyticsServiceManager {
  private currentService: AnalyticsService;
  private mockService: MockAnalyticsService;
  // private realService: RealAnalyticsService; // Uncomment when real service is available

  constructor() {
    this.mockService = new MockAnalyticsService();
    // this.realService = new RealAnalyticsService(); // Initialize real service
    this.currentService = this.mockService; // Start with mock
  }

  public setService(serviceType: 'mock' | 'real') {
    if (serviceType === 'mock') {
      this.currentService = this.mockService;
    }
    // else if (serviceType === 'real') {
    //   this.currentService = this.realService;
    // }
    console.log(`Switched Analytics service to: ${serviceType === 'mock' ? 'MockAnalyticsService' : 'RealAnalyticsService'}`);
  }

  public getService(): AnalyticsService {
    return this.currentService;
  }

  public getMockService(): MockAnalyticsService {
    return this.mockService;
  }
}

// Export singleton instance
export const analyticsServiceManager = new AnalyticsServiceManager();

// Export the current service
export const analyticsService: AnalyticsService = analyticsServiceManager.getService();

// Export types
export type { AnalyticsEvent, AnalyticsService, AnalyticsData };
