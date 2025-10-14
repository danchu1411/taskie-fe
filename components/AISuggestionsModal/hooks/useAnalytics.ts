import { useCallback, useRef } from 'react';
import { analyticsServiceManager } from '../utils/analytics';
import { AISuggestion, HistorySuggestion } from '../types';

export interface UseAnalyticsReturn {
  // Core tracking functions
  track: (event: string, properties?: Record<string, any>) => Promise<void>;
  trackBatch: (events: Array<{ event: string; properties?: Record<string, any> }>) => Promise<void>;
  
  // Suggestion tracking
  trackSuggestionGenerated: (suggestion: AISuggestion) => Promise<void>;
  trackSuggestionAccepted: (suggestion: AISuggestion, slotIndex: number) => Promise<void>;
  trackSuggestionRejected: (suggestion: AISuggestion, reason?: string) => Promise<void>;
  trackSuggestionReopened: (suggestion: HistorySuggestion) => Promise<void>;
  
  // User interaction tracking
  trackHistoryViewed: (filters?: Record<string, any>) => Promise<void>;
  trackFilterApplied: (filterType: string, filterValue: any) => Promise<void>;
  trackModalOpened: () => Promise<void>;
  trackModalClosed: () => Promise<void>;
  
  // Error tracking
  trackError: (error: string, context?: string) => Promise<void>;
  
  // Analytics data
  getAnalytics: () => Promise<any>;
  clearAnalytics: () => Promise<void>;
  
  // Service management
  setService: (serviceType: 'mock' | 'real') => void;
}

const useAnalytics = (): UseAnalyticsReturn => {
  const serviceRef = useRef(analyticsServiceManager.getService());

  const setService = useCallback((serviceType: 'mock' | 'real') => {
    analyticsServiceManager.setService(serviceType);
    serviceRef.current = analyticsServiceManager.getService();
  }, []);

  const track = useCallback(async (event: string, properties: Record<string, any> = {}) => {
    try {
      await serviceRef.current.track({
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, []);

  const trackBatch = useCallback(async (events: Array<{ event: string; properties?: Record<string, any> }>) => {
    try {
      const analyticsEvents = events.map(({ event, properties = {} }) => ({
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
      }));
      
      await serviceRef.current.trackBatch(analyticsEvents);
    } catch (error) {
      console.error('Analytics batch tracking error:', error);
    }
  }, []);

  const trackSuggestionGenerated = useCallback(async (suggestion: AISuggestion) => {
    try {
      await serviceRef.current.trackSuggestionGenerated(suggestion);
    } catch (error) {
      console.error('Analytics suggestion generated tracking error:', error);
    }
  }, []);

  const trackSuggestionAccepted = useCallback(async (suggestion: AISuggestion, slotIndex: number) => {
    try {
      await serviceRef.current.trackSuggestionAccepted(suggestion, slotIndex);
    } catch (error) {
      console.error('Analytics suggestion accepted tracking error:', error);
    }
  }, []);

  const trackSuggestionRejected = useCallback(async (suggestion: AISuggestion, reason?: string) => {
    try {
      await serviceRef.current.trackSuggestionRejected(suggestion, reason);
    } catch (error) {
      console.error('Analytics suggestion rejected tracking error:', error);
    }
  }, []);

  const trackSuggestionReopened = useCallback(async (suggestion: HistorySuggestion) => {
    try {
      await serviceRef.current.trackSuggestionReopened(suggestion);
    } catch (error) {
      console.error('Analytics suggestion reopened tracking error:', error);
    }
  }, []);

  const trackHistoryViewed = useCallback(async (filters?: Record<string, any>) => {
    try {
      await serviceRef.current.trackHistoryViewed(filters);
    } catch (error) {
      console.error('Analytics history viewed tracking error:', error);
    }
  }, []);

  const trackFilterApplied = useCallback(async (filterType: string, filterValue: any) => {
    try {
      await serviceRef.current.trackFilterApplied(filterType, filterValue);
    } catch (error) {
      console.error('Analytics filter applied tracking error:', error);
    }
  }, []);

  const trackModalOpened = useCallback(async () => {
    try {
      await serviceRef.current.trackModalOpened();
    } catch (error) {
      console.error('Analytics modal opened tracking error:', error);
    }
  }, []);

  const trackModalClosed = useCallback(async () => {
    try {
      await serviceRef.current.trackModalClosed();
    } catch (error) {
      console.error('Analytics modal closed tracking error:', error);
    }
  }, []);

  const trackError = useCallback(async (error: string, context?: string) => {
    try {
      await serviceRef.current.trackError(error, context);
    } catch (analyticsError) {
      console.error('Analytics error tracking error:', analyticsError);
    }
  }, []);

  const getAnalytics = useCallback(async () => {
    try {
      return await serviceRef.current.getAnalytics();
    } catch (error) {
      console.error('Analytics get analytics error:', error);
      return null;
    }
  }, []);

  const clearAnalytics = useCallback(async () => {
    try {
      await serviceRef.current.clearAnalytics();
    } catch (error) {
      console.error('Analytics clear analytics error:', error);
    }
  }, []);

  return {
    // Core tracking functions
    track,
    trackBatch,
    
    // Suggestion tracking
    trackSuggestionGenerated,
    trackSuggestionAccepted,
    trackSuggestionRejected,
    trackSuggestionReopened,
    
    // User interaction tracking
    trackHistoryViewed,
    trackFilterApplied,
    trackModalOpened,
    trackModalClosed,
    
    // Error tracking
    trackError,
    
    // Analytics data
    getAnalytics,
    clearAnalytics,
    
    // Service management
    setService,
  };
};

export default useAnalytics;
