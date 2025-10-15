import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { AISuggestion } from './types';
import useHistory from './hooks/useHistory';
import useAnalytics from './hooks/useAnalytics';
import './styles/HistorySection.css';

interface HistorySectionProps {
  onViewSuggestion: (suggestion: AISuggestion) => void;
  onReopenSuggestion: (suggestion: AISuggestion) => void;
  onAcceptSuggestion: (suggestion: AISuggestion) => void;
  onRejectSuggestion: (suggestion: AISuggestion) => void;
  onClose: () => void;
}

const HistorySection: FC<HistorySectionProps> = ({
  onViewSuggestion,
  onReopenSuggestion,
  onAcceptSuggestion,
  onRejectSuggestion,
  onClose
}) => {
  const {
    suggestions,
    pagination,
    filters,
    isLoading,
    error,
    loadHistory,
    loadMore,
    setFilters,
    clearFilters,
    refreshHistory,
    reopenSuggestion,
    clearError,
    reset
  } = useHistory();

  const {
    trackHistoryViewed,
    trackFilterApplied,
  } = useAnalytics();

  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load initial history
  useEffect(() => {
    loadHistory({ page: 1, limit: 10 });
    // Track history viewed
    trackHistoryViewed();
  }, [loadHistory, trackHistoryViewed]);

  // Handle status filter change
  const handleStatusFilter = (status: number | undefined) => {
    setSelectedStatus(status);
    setFilters({ ...filters, status });
    // Track filter applied
    trackFilterApplied('status', status);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query || undefined });
    // Track search applied
    trackFilterApplied('search', query);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedStatus(undefined);
    setSearchQuery('');
    clearFilters();
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.total_pages) {
      loadMore();
    }
  };

  // Handle suggestion actions
  const handleViewSuggestion = (suggestion: AISuggestion) => {
    onViewSuggestion(suggestion);
  };

  const handleReopenSuggestion = async (suggestion: AISuggestion) => {
    try {
      await reopenSuggestion(suggestion.id);
      onReopenSuggestion(suggestion);
    } catch (error) {
      console.error('Failed to reopen suggestion:', error);
    }
  };

  const handleAcceptSuggestion = (suggestion: AISuggestion) => {
    onAcceptSuggestion(suggestion);
  };

  const handleRejectSuggestion = (suggestion: AISuggestion) => {
    onRejectSuggestion(suggestion);
  };

  // Format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  // Get status info
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { 
          text: 'Pending', 
          icon: (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ), 
          color: 'pending' 
        };
      case 1:
        return { 
          text: 'Accepted', 
          icon: (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ), 
          color: 'accepted' 
        };
      case 2:
        return { 
          text: 'Rejected', 
          icon: (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ), 
          color: 'rejected' 
        };
      default:
        return { 
          text: 'Unknown', 
          icon: (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ), 
          color: 'unknown' 
        };
    }
  };

  // Get confidence info
  const getConfidenceInfo = (confidence: number) => {
    switch (confidence) {
      case 2:
        return { text: 'High', icon: '🟢', color: 'high' };
      case 1:
        return { text: 'Medium', icon: '🟡', color: 'medium' };
      case 0:
        return { text: 'Low', icon: '🔴', color: 'low' };
      default:
        return { text: 'Unknown', icon: '⚪', color: 'unknown' };
    }
  };

  return (
    <div className="history-section">
      {/* Header */}
      <div className="history-header">
        <h2 className="history-title">
          📚 Suggestion History
        </h2>
        <button
          className="history-close"
          onClick={onClose}
          aria-label="Close history"
        >
          ✕
        </button>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search suggestions..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔧 Filters
          </button>
        </div>

        {showFilters && (
          <div className="filter-options">
            <div className="status-filters">
              <button
                className={`status-filter ${selectedStatus === undefined ? 'active' : ''}`}
                onClick={() => handleStatusFilter(undefined)}
              >
                All
              </button>
              <button
                className={`status-filter ${selectedStatus === 0 ? 'active' : ''}`}
                onClick={() => handleStatusFilter(0)}
              >
                ⏳ Pending
              </button>
              <button
                className={`status-filter ${selectedStatus === 1 ? 'active' : ''}`}
                onClick={() => handleStatusFilter(1)}
              >
                ✅ Accepted
              </button>
              <button
                className={`status-filter ${selectedStatus === 2 ? 'active' : ''}`}
                onClick={() => handleStatusFilter(2)}
              >
                ❌ Rejected
              </button>
            </div>
            
            <button
              className="clear-filters"
              onClick={handleClearFilters}
            >
              🗑️ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="history-error">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button
            className="retry-button"
            onClick={() => refreshHistory()}
          >
            🔄 Retry
          </button>
          <button
            className="clear-error-button"
            onClick={clearError}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && suggestions.length === 0 && (
        <div className="history-loading">
          <div className="loading-spinner">🔄</div>
          <p>Loading history...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && !error && (
        <div className="history-empty">
          <div className="empty-icon">📭</div>
          <h3>No suggestions yet</h3>
          <p>You haven't created any suggestions or no suggestions match the current filters.</p>
          <button
            className="create-new-button"
            onClick={() => onClose()}
          >
            🆕 Create New Suggestion
          </button>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          {suggestions.map((suggestion) => {
            const statusInfo = getStatusInfo(suggestion.status);
            const confidenceInfo = getConfidenceInfo(suggestion.confidence);
            const firstSlot = suggestion.suggested_slots[0];

            return (
              <div
                key={suggestion.id}
                className={`suggestion-item ${statusInfo.color}`}
              >
                <div className="suggestion-header">
                  <div className="suggestion-title">
                    <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="title-text">{suggestion.manual_input.title}</span>
                  </div>
                  <div className="suggestion-date">
                    {formatDate(suggestion.created_at)}
                  </div>
                </div>

                <div className="suggestion-content">
                  {firstSlot && (
                    <div className="suggestion-details">
                      <div className="detail-item">
                        <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="detail-text">
                          {formatTime(firstSlot.suggested_start_at)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="detail-text">
                          {formatDuration(firstSlot.planned_minutes)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="detail-text">
                          {confidenceInfo.text}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="suggestion-status">
                    <span className={`status-badge ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.text}
                    </span>
                  </div>
                </div>

                <div className="suggestion-actions">
                  <button
                    className="action-button view-button"
                    onClick={() => handleViewSuggestion(suggestion)}
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  
                  {suggestion.status === 0 && (
                    <>
                      <button
                        className="action-button accept-button"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </button>
                      <button
                        className="action-button reject-button"
                        onClick={() => handleRejectSuggestion(suggestion)}
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </>
                  )}
                  
                  {suggestion.status !== 0 && (
                    <button
                      className="action-button reopen-button"
                      onClick={() => handleReopenSuggestion(suggestion)}
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Recreate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="history-pagination">
          <div className="pagination-info">
            Hiển thị {suggestions.length} trong {pagination.total} gợi ý
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-button"
              disabled={pagination.page === 1}
              onClick={() => loadHistory({ page: pagination.page - 1 })}
            >
              ← Trang trước
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.total_pages) return null;
                
                return (
                  <button
                    key={pageNum}
                    className={`page-button ${pageNum === pagination.page ? 'active' : ''}`}
                    onClick={() => loadHistory({ page: pageNum })}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              className="pagination-button"
              disabled={pagination.page === pagination.total_pages}
              onClick={() => loadHistory({ page: pagination.page + 1 })}
            >
              Trang sau →
            </button>
          </div>
          
          {pagination.page < pagination.total_pages && (
            <button
              className="load-more-button"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? '🔄 Đang tải...' : '📄 Tải thêm'}
            </button>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="history-footer">
        <button
          className="refresh-button"
          onClick={() => refreshHistory()}
          disabled={isLoading}
        >
          🔄 Làm mới
        </button>
      </div>
    </div>
  );
};

export default HistorySection;
