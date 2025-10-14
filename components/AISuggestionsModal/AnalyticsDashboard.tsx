import React, { useState, useEffect } from 'react';
import useAnalytics from '../hooks/useAnalytics';
import './styles/AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const { getAnalytics, clearAnalytics, setService } = useAnalytics();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAnalytics = async () => {
    try {
      await clearAnalytics();
      setAnalytics(null);
    } catch (err) {
      console.error('Clear analytics error:', err);
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const formatDuration = (ms: number) => {
    return `${ms}ms`;
  };

  if (isLoading) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h3>📊 Analytics Dashboard</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        <div className="analytics-loading">
          <div className="loading-spinner">🔄</div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h3>📊 Analytics Dashboard</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        <div className="analytics-error">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h3>📊 Analytics Dashboard</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        <div className="analytics-empty">
          <div className="empty-icon">📊</div>
          <p>No analytics data available</p>
          <button onClick={handleRefresh} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h3>📊 Analytics Dashboard</h3>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-button">
            🔄 Refresh
          </button>
          <button onClick={handleClearAnalytics} className="clear-button">
            🗑️ Clear
          </button>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
      </div>

      <div className="analytics-content">
        {/* Overview Stats */}
        <div className="analytics-section">
          <h4>📈 Overview</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.total_events)}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.suggestion_stats.total_generated)}</div>
              <div className="stat-label">Suggestions Generated</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatPercentage(analytics.suggestion_stats.acceptance_rate)}</div>
              <div className="stat-label">Acceptance Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatPercentage(analytics.suggestion_stats.rejection_rate)}</div>
              <div className="stat-label">Rejection Rate</div>
            </div>
          </div>
        </div>

        {/* Suggestion Stats */}
        <div className="analytics-section">
          <h4>💡 Suggestion Statistics</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.suggestion_stats.total_accepted)}</div>
              <div className="stat-label">Accepted</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.suggestion_stats.total_rejected)}</div>
              <div className="stat-label">Rejected</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.suggestion_stats.total_reopened)}</div>
              <div className="stat-label">Reopened</div>
            </div>
          </div>
        </div>

        {/* User Interactions */}
        <div className="analytics-section">
          <h4>👤 User Interactions</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.user_interactions.history_views)}</div>
              <div className="stat-label">History Views</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.user_interactions.filter_applications)}</div>
              <div className="stat-label">Filter Applications</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.user_interactions.modal_opens)}</div>
              <div className="stat-label">Modal Opens</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(analytics.user_interactions.modal_closes)}</div>
              <div className="stat-label">Modal Closes</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="analytics-section">
          <h4>⚡ Performance Metrics</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{formatDuration(analytics.performance_metrics.average_generation_time)}</div>
              <div className="stat-label">Avg Generation Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatDuration(analytics.performance_metrics.average_acceptance_time)}</div>
              <div className="stat-label">Avg Acceptance Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatPercentage(analytics.performance_metrics.error_rate * 100)}</div>
              <div className="stat-label">Error Rate</div>
            </div>
          </div>
        </div>

        {/* Events by Type */}
        <div className="analytics-section">
          <h4>📊 Events by Type</h4>
          <div className="events-list">
            {Object.entries(analytics.events_by_type).map(([eventType, count]) => (
              <div key={eventType} className="event-item">
                <span className="event-type">{eventType}</span>
                <span className="event-count">{formatNumber(count as number)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div className="analytics-section">
          <h4>⏰ Time Range</h4>
          <div className="time-range">
            <div className="time-item">
              <span className="time-label">Start:</span>
              <span className="time-value">
                {new Date(analytics.time_range.start).toLocaleString()}
              </span>
            </div>
            <div className="time-item">
              <span className="time-label">End:</span>
              <span className="time-value">
                {new Date(analytics.time_range.end).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
