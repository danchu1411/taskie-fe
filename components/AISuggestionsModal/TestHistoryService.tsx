import React, { useState } from 'react';
import useHistory from './hooks/useHistory';

const TestHistoryService: React.FC = () => {
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
    getSuggestionById,
    reopenSuggestion,
    clearError,
    reset,
    getState
  } = useHistory();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runHistoryTests = async () => {
    setTestResults([]);
    addTestResult('Starting History Service tests...');

    try {
      // Test 1: Load initial history
      addTestResult('Test 1: Load initial history');
      await loadHistory({ page: 1, limit: 5 });
      addTestResult(`✅ Loaded ${suggestions.length} suggestions`);
      addTestResult(`Pagination: Page ${pagination?.page}/${pagination?.total_pages}`);

      // Test 2: Load more
      addTestResult('Test 2: Load more suggestions');
      await loadMore();
      addTestResult(`✅ Loaded more: ${suggestions.length} total suggestions`);

      // Test 3: Filter by status
      addTestResult('Test 3: Filter by status');
      setFilters({ status: 1 }); // Accepted suggestions
      addTestResult(`✅ Filtered by status: ${suggestions.length} suggestions`);

      // Test 4: Get suggestion by ID
      if (suggestions.length > 0) {
        addTestResult('Test 4: Get suggestion by ID');
        const firstSuggestion = suggestions[0];
        const retrievedSuggestion = await getSuggestionById(firstSuggestion.id);
        addTestResult(`✅ Retrieved suggestion: ${retrievedSuggestion.manual_input.title}`);
      }

      // Test 5: Reopen suggestion
      if (suggestions.length > 0) {
        addTestResult('Test 5: Reopen suggestion');
        const firstSuggestion = suggestions[0];
        const reopenedSuggestion = await reopenSuggestion(firstSuggestion.id);
        addTestResult(`✅ Reopened suggestion: Status ${reopenedSuggestion.status}`);
      }

      addTestResult('All History Service tests completed!');

    } catch (error) {
      addTestResult(`❌ Test failed: ${error}`);
    }
  };

  const testErrorScenarios = async () => {
    setTestResults([]);
    addTestResult('Testing error scenarios...');

    try {
      // Test invalid ID
      addTestResult('Test: Invalid suggestion ID');
      try {
        await getSuggestionById('invalid-id');
      } catch (err) {
        addTestResult(`✅ Invalid ID error caught: ${err.message}`);
      }

      // Test reopen invalid ID
      addTestResult('Test: Reopen invalid suggestion');
      try {
        await reopenSuggestion('invalid-id');
      } catch (err) {
        addTestResult(`✅ Reopen invalid ID error caught: ${err.message}`);
      }

      addTestResult('Error scenario testing completed!');

    } catch (error) {
      addTestResult(`❌ Error test failed: ${error}`);
    }
  };

  const testPagination = async () => {
    setTestResults([]);
    addTestResult('Testing pagination...');

    try {
      // Load first page
      await loadHistory({ page: 1, limit: 3 });
      addTestResult(`Page 1: ${suggestions.length} suggestions`);

      // Load second page
      await loadHistory({ page: 2, limit: 3 });
      addTestResult(`Page 2: ${suggestions.length} suggestions`);

      // Load third page
      await loadHistory({ page: 3, limit: 3 });
      addTestResult(`Page 3: ${suggestions.length} suggestions`);

      addTestResult('Pagination testing completed!');

    } catch (error) {
      addTestResult(`❌ Pagination test failed: ${error}`);
    }
  };

  const testFilters = async () => {
    setTestResults([]);
    addTestResult('Testing filters...');

    try {
      // Test status filter
      await loadHistory({ status: 0 }); // Pending
      addTestResult(`Pending suggestions: ${suggestions.length}`);

      await loadHistory({ status: 1 }); // Accepted
      addTestResult(`Accepted suggestions: ${suggestions.length}`);

      await loadHistory({ status: 2 }); // Rejected
      addTestResult(`Rejected suggestions: ${suggestions.length}`);

      // Test search filter
      await loadHistory({ search: 'Task' });
      addTestResult(`Search "Task": ${suggestions.length} suggestions`);

      // Test date filter
      const today = new Date().toISOString().split('T')[0];
      await loadHistory({ date_from: today });
      addTestResult(`From today: ${suggestions.length} suggestions`);

      addTestResult('Filter testing completed!');

    } catch (error) {
      addTestResult(`❌ Filter test failed: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>History Service Test</h1>
      <p>Testing the History Service implementation with API integration.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Current State Display */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>History State</h3>
          <div style={{ marginBottom: '8px' }}>
            <strong>Suggestions:</strong> {suggestions.length}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Pagination:</strong> {pagination ? `${pagination.page}/${pagination.total_pages}` : 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Filters:</strong> {Object.keys(filters).length > 0 ? JSON.stringify(filters) : 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Error:</strong> {error || 'None'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Has More:</strong> {getState().hasMore ? 'Yes' : 'No'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Is Empty:</strong> {getState().isEmpty ? 'Yes' : 'No'}
          </div>
        </div>

        {/* Manual Controls */}
        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Manual Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => loadHistory({ page: 1, limit: 5 })}
              disabled={isLoading}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Load Page 1 (5 items)
            </button>
            <button 
              onClick={() => loadHistory({ page: 2, limit: 5 })}
              disabled={isLoading}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Load Page 2 (5 items)
            </button>
            <button 
              onClick={loadMore}
              disabled={isLoading || !getState().hasMore}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Load More
            </button>
            <button 
              onClick={() => setFilters({ status: 1 })}
              disabled={isLoading}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Filter: Accepted
            </button>
            <button 
              onClick={() => setFilters({ status: 0 })}
              disabled={isLoading}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Filter: Pending
            </button>
            <button 
              onClick={clearFilters}
              disabled={isLoading}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Clear Filters
            </button>
            <button 
              onClick={refreshHistory}
              disabled={isLoading}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Refresh
            </button>
            <button 
              onClick={reset}
              style={{ padding: '8px 12px', fontSize: '12px', background: '#ef4444', color: 'white' }}
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Test Runners */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Test Runners</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={runHistoryTests}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🧪 Run History Tests
          </button>
          <button 
            onClick={testErrorScenarios}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🚨 Test Error Scenarios
          </button>
          <button 
            onClick={testPagination}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📄 Test Pagination
          </button>
          <button 
            onClick={testFilters}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔍 Test Filters
          </button>
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: '12px', borderRadius: '4px' }}>
          {testResults.map((result, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '4px', fontFamily: 'monospace' }}>
              {result}
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Suggestions List ({suggestions.length})</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'white', padding: '12px', borderRadius: '4px' }}>
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.id} style={{ 
              padding: '12px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px', 
              marginBottom: '8px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {suggestion.manual_input.title}
              </div>
              <div style={{ color: '#6b7280', marginBottom: '4px' }}>
                Status: {suggestion.status === 0 ? '🟡 Pending' : suggestion.status === 1 ? '🟢 Accepted' : '🔴 Rejected'}
              </div>
              <div style={{ color: '#6b7280', marginBottom: '4px' }}>
                Created: {new Date(suggestion.created_at).toLocaleString()}
              </div>
              <div style={{ color: '#6b7280' }}>
                ID: {suggestion.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Cases */}
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        <h3>Test Cases:</h3>
        <ul>
          <li>✅ <strong>Load History:</strong> Load suggestions with pagination</li>
          <li>✅ <strong>Load More:</strong> Load additional pages</li>
          <li>✅ <strong>Filter by Status:</strong> Filter suggestions by status</li>
          <li>✅ <strong>Search:</strong> Search suggestions by title/description</li>
          <li>✅ <strong>Date Filter:</strong> Filter by date range</li>
          <li>✅ <strong>Get by ID:</strong> Retrieve specific suggestion</li>
          <li>✅ <strong>Reopen:</strong> Reopen pending suggestions</li>
          <li>✅ <strong>Error Handling:</strong> Handle API errors gracefully</li>
        </ul>
        
        <h4>API Integration:</h4>
        <ul>
          <li><strong>GET /api/ai-suggestions</strong> - Load history with filters</li>
          <li><strong>GET /api/ai-suggestions/:id</strong> - Get specific suggestion</li>
          <li><strong>POST /api/ai-suggestions/:id/reopen</strong> - Reopen suggestion</li>
          <li><strong>Pagination:</strong> Page-based pagination with metadata</li>
          <li><strong>Filtering:</strong> Status, date range, search filters</li>
        </ul>
      </div>
    </div>
  );
};

export default TestHistoryService;
