// Analytics Service JavaScript Implementation
class MockAnalyticsService {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.userId = this.generateUserId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async track(event) {
    // Add session and user context
    const enrichedEvent = {
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

  async trackBatch(events) {
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

  async getAnalytics() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter events from the last week
    const recentEvents = this.events.filter(event => 
      new Date(event.properties.timestamp) >= oneWeekAgo
    );

    // Calculate events by type
    const eventsByType = {};
    recentEvents.forEach(event => {
      eventsByType[event.event] = (eventsByType[event.event] || 0) + 1;
    });

    // Calculate suggestion stats
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

  async clearAnalytics() {
    this.events = [];
    console.log('📊 Analytics cleared');
  }

  // Helper methods for common events
  async trackSuggestionGenerated(suggestion) {
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

  async trackSuggestionAccepted(suggestion, slotIndex) {
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

  async trackSuggestionRejected(suggestion, reason) {
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

  async trackSuggestionReopened(suggestion) {
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

  async trackHistoryViewed(filters) {
    await this.track({
      event: 'history_viewed',
      properties: {
        additional_data: {
          filters_applied: filters,
        },
      },
    });
  }

  async trackFilterApplied(filterType, filterValue) {
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

  async trackModalOpened() {
    await this.track({
      event: 'modal_opened',
      properties: {},
    });
  }

  async trackModalClosed() {
    await this.track({
      event: 'modal_closed',
      properties: {},
    });
  }

  async trackError(error, context) {
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

// Service Manager
class AnalyticsServiceManager {
  constructor() {
    this.mockService = new MockAnalyticsService();
    this.currentService = this.mockService;
  }

  setService(serviceType) {
    if (serviceType === 'mock') {
      this.currentService = this.mockService;
    }
    console.log(`Switched Analytics service to: ${serviceType === 'mock' ? 'MockAnalyticsService' : 'RealAnalyticsService'}`);
  }

  getService() {
    return this.currentService;
  }

  getMockService() {
    return this.mockService;
  }
}

// Export singleton instance
const analyticsServiceManager = new AnalyticsServiceManager();
const analyticsService = analyticsServiceManager.getService();

module.exports = {
  MockAnalyticsService,
  AnalyticsServiceManager,
  analyticsServiceManager,
  analyticsService,
};
