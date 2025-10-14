import React, { useState, useEffect } from 'react';
import { AISuggestion } from './types';
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

const HistorySection: React.FC<HistorySectionProps> = ({
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
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} giờ`;
    return `${hours}h ${remainingMinutes}phút`;
  };

  // Get status info
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { text: 'Đang chờ', icon: '⏳', color: 'pending' };
      case 1:
        return { text: 'Đã chấp nhận', icon: '✅', color: 'accepted' };
      case 2:
        return { text: 'Đã từ chối', icon: '❌', color: 'rejected' };
      default:
        return { text: 'Không xác định', icon: '❓', color: 'unknown' };
    }
  };

  // Get confidence info
  const getConfidenceInfo = (confidence: number) => {
    switch (confidence) {
      case 2:
        return { text: 'Cao', icon: '🟢', color: 'high' };
      case 1:
        return { text: 'Trung bình', icon: '🟡', color: 'medium' };
      case 0:
        return { text: 'Thấp', icon: '🔴', color: 'low' };
      default:
        return { text: 'Không xác định', icon: '⚪', color: 'unknown' };
    }
  };

  return (
    <div className="history-section">
      {/* Header */}
      <div className="history-header">
        <h2 className="history-title">
          📚 Lịch sử gợi ý
        </h2>
        <button
          className="history-close"
          onClick={onClose}
          aria-label="Đóng lịch sử"
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
              placeholder="Tìm kiếm gợi ý..."
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
            🔧 Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="filter-options">
            <div className="status-filters">
              <button
                className={`status-filter ${selectedStatus === undefined ? 'active' : ''}`}
                onClick={() => handleStatusFilter(undefined)}
              >
                Tất cả
              </button>
              <button
                className={`status-filter ${selectedStatus === 0 ? 'active' : ''}`}
                onClick={() => handleStatusFilter(0)}
              >
                ⏳ Đang chờ
              </button>
              <button
                className={`status-filter ${selectedStatus === 1 ? 'active' : ''}`}
                onClick={() => handleStatusFilter(1)}
              >
                ✅ Đã chấp nhận
              </button>
              <button
                className={`status-filter ${selectedStatus === 2 ? 'active' : ''}`}
                onClick={() => handleStatusFilter(2)}
              >
                ❌ Đã từ chối
              </button>
            </div>
            
            <button
              className="clear-filters"
              onClick={handleClearFilters}
            >
              🗑️ Xóa bộ lọc
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
            🔄 Thử lại
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
          <p>Đang tải lịch sử...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && !error && (
        <div className="history-empty">
          <div className="empty-icon">📭</div>
          <h3>Chưa có gợi ý nào</h3>
          <p>Bạn chưa tạo gợi ý nào hoặc không có gợi ý phù hợp với bộ lọc.</p>
          <button
            className="create-new-button"
            onClick={() => onClose()}
          >
            🆕 Tạo gợi ý mới
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
                    <span className="title-icon">📝</span>
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
                        <span className="detail-icon">📅</span>
                        <span className="detail-text">
                          {formatTime(firstSlot.suggested_start_at)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏱️</span>
                        <span className="detail-text">
                          {formatDuration(firstSlot.planned_minutes)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">{confidenceInfo.icon}</span>
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
                    👁️ Xem
                  </button>
                  
                  {suggestion.status === 0 && (
                    <>
                      <button
                        className="action-button accept-button"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                      >
                        ✅ Chấp nhận
                      </button>
                      <button
                        className="action-button reject-button"
                        onClick={() => handleRejectSuggestion(suggestion)}
                      >
                        ❌ Từ chối
                      </button>
                    </>
                  )}
                  
                  {suggestion.status !== 0 && (
                    <button
                      className="action-button reopen-button"
                      onClick={() => handleReopenSuggestion(suggestion)}
                    >
                      🔄 Tạo lại
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
