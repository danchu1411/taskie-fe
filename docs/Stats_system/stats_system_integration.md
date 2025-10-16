# Frontend Integration Guide: User Stats System

## 📋 **Overview**

This guide provides complete documentation for integrating the User Stats system into your frontend application. The system automatically tracks user activities and provides real-time statistics through REST API endpoints.

---

## 🚀 **Quick Start**

### **1. Authentication**
All stats endpoints require JWT authentication:

```javascript
const token = loginResponse.data.tokens.accessToken;
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### **2. Basic Stats Overview**
```javascript
const getStatsOverview = async () => {
  const response = await fetch('/api/user-stats', { headers });
  const { overview } = await response.json();
  
  return {
    totalTasksCompleted: overview.totalTasksCompleted,
    totalChecklistItemsCompleted: overview.totalChecklistItemsCompleted,
    totalFocusMinutes: overview.totalFocusMinutes,
    currentStreak: overview.currentStreak,
    longestStreak: overview.longestStreak,
    lastActivityDate: overview.lastActivityDate,
    lastLoginAt: overview.lastLoginAt,
    totalLoginCount: overview.totalLoginCount
  };
};
```

---

## 📊 **API Endpoints**

### **1. GET /api/user-stats**
**Purpose**: Get complete stats overview for stats page

**Response**:
```json
{
  "overview": {
    "totalTasksCompleted": 150,
    "totalChecklistItemsCompleted": 45,
    "totalFocusMinutes": 3250,
    "currentStreak": 7,
    "longestStreak": 14,
    "lastActivityDate": "2025-10-16",
    "lastLoginAt": "2025-10-16T08:30:00.000Z",
    "totalLoginCount": 89
  }
}
```

**Usage**:
```javascript
const stats = await getStatsOverview();
console.log(`You've completed ${stats.totalTasksCompleted} tasks!`);
console.log(`Current streak: ${stats.currentStreak} days`);
```

---

### **2. GET /api/user-stats/daily**
**Purpose**: Get daily activity logs for charts and analytics

**Query Parameters**:
- `days` (optional, default: 30): Number of days to retrieve (1-365)
- `fromDate` (optional): Start date in YYYY-MM-DD format
- `toDate` (optional): End date in YYYY-MM-DD format

**Response**:
```json
{
  "dailyActivity": [
    {
      "date": "2025-10-16",
      "tasksCompleted": 5,
      "checklistItemsCompleted": 2,
      "focusMinutes": 120,
      "sessionsCount": 4
    },
    {
      "date": "2025-10-15",
      "tasksCompleted": 3,
      "checklistItemsCompleted": 1,
      "focusMinutes": 90,
      "sessionsCount": 3
    }
  ],
  "meta": {
    "fromDate": "2025-09-17",
    "toDate": "2025-10-16",
    "totalDays": 30
  }
}
```

**Usage Examples**:

```javascript
// Get last 30 days
const getLast30Days = async () => {
  const response = await fetch('/api/user-stats/daily', { headers });
  return await response.json();
};

// Get last 7 days
const getLastWeek = async () => {
  const response = await fetch('/api/user-stats/daily?days=7', { headers });
  return await response.json();
};

// Get specific date range
const getDateRange = async (fromDate, toDate) => {
  const response = await fetch(
    `/api/user-stats/daily?fromDate=${fromDate}&toDate=${toDate}`, 
    { headers }
  );
  return await response.json();
};
```

---

### **3. GET /api/user-stats/streak-history**
**Purpose**: Get streak history for achievements and milestones

**Query Parameters**:
- `limit` (optional, default: 10): Number of streak periods to retrieve (1-50)

**Response**:
```json
{
  "streakHistory": [
    {
      "id": "uuid",
      "streakCount": 7,
      "startDate": "2025-10-10",
      "endDate": null,
      "isActive": true
    },
    {
      "id": "uuid",
      "streakCount": 14,
      "startDate": "2025-09-01",
      "endDate": "2025-09-14",
      "isActive": false
    }
  ],
  "meta": {
    "totalCount": 2,
    "limit": 10
  }
}
```

**Usage**:
```javascript
const getStreakHistory = async (limit = 10) => {
  const response = await fetch(
    `/api/user-stats/streak-history?limit=${limit}`, 
    { headers }
  );
  return await response.json();
};

// Display achievements
const achievements = await getStreakHistory(5);
achievements.streakHistory.forEach(streak => {
  console.log(`${streak.streakCount} day streak from ${streak.startDate}`);
});
```

---

### **4. POST /api/user-stats/record-focus-session**
**Purpose**: Record focus session completion (for Pomodoro timer)

**Request Body**:
```json
{
  "plannedMinutes": 25,
  "completedAt": "2025-10-16T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Focus session recorded"
}
```

**Usage**:
```javascript
const recordFocusSession = async (minutes) => {
  try {
    const response = await fetch('/api/user-stats/record-focus-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plannedMinutes: minutes,
        completedAt: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Focus session recorded successfully');
    }
  } catch (error) {
    // Non-critical, just log
    console.error('Failed to record focus session:', error);
  }
};

// Call when Pomodoro timer completes
recordFocusSession(25); // 25-minute session
```

---

## 🎯 **Integration Examples**

### **Stats Dashboard Component**

```javascript
import React, { useState, useEffect } from 'react';

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get overview stats
        const statsResponse = await fetch('/api/user-stats', { headers });
        const statsData = await statsResponse.json();
        setStats(statsData.overview);

        // Get last 7 days activity
        const dailyResponse = await fetch('/api/user-stats/daily?days=7', { headers });
        const dailyData = await dailyResponse.json();
        setDailyActivity(dailyData.dailyActivity);

      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading stats...</div>;

  return (
    <div className="stats-dashboard">
      <div className="stats-overview">
        <h2>Your Progress</h2>
        <div className="stat-card">
          <h3>Tasks Completed</h3>
          <p className="stat-number">{stats.totalTasksCompleted}</p>
        </div>
        <div className="stat-card">
          <h3>Focus Time</h3>
          <p className="stat-number">{Math.round(stats.totalFocusMinutes / 60)}h</p>
        </div>
        <div className="stat-card">
          <h3>Current Streak</h3>
          <p className="stat-number">{stats.currentStreak} days</p>
        </div>
      </div>

      <div className="activity-chart">
        <h3>Last 7 Days Activity</h3>
        <ActivityChart data={dailyActivity} />
      </div>
    </div>
  );
};
```

### **Pomodoro Timer Integration**

```javascript
class PomodoroTimer {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.isRunning = false;
    this.timeLeft = 25 * 60; // 25 minutes in seconds
  }

  start() {
    this.isRunning = true;
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  }

  complete() {
    this.isRunning = false;
    clearInterval(this.timer);
    
    // Record focus session
    this.recordFocusSession(25);
    
    // Call completion callback
    if (this.onComplete) {
      this.onComplete();
    }
  }

  async recordFocusSession(minutes) {
    try {
      await fetch('/api/user-stats/record-focus-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plannedMinutes: minutes,
          completedAt: new Date().toISOString()
        })
      });
      
      console.log('Focus session recorded!');
    } catch (error) {
      console.error('Failed to record focus session:', error);
    }
  }
}

// Usage
const timer = new PomodoroTimer(() => {
  console.log('Pomodoro completed!');
  // Update UI, show notification, etc.
});
timer.start();
```

### **Activity Chart Component**

```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActivityChart = ({ data }) => {
  const chartData = data.map(day => ({
    date: new Date(day.date).toLocaleDateString(),
    tasks: day.tasksCompleted,
    focus: day.focusMinutes,
    sessions: day.sessionsCount
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="tasks" stroke="#8884d8" name="Tasks" />
        <Line type="monotone" dataKey="focus" stroke="#82ca9d" name="Focus (min)" />
        <Line type="monotone" dataKey="sessions" stroke="#ffc658" name="Sessions" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

---

## 🔄 **Real-time Updates**

### **Auto-refresh Stats**
```javascript
const useStats = () => {
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const refreshStats = async () => {
    try {
      const response = await fetch('/api/user-stats', { headers });
      const data = await response.json();
      setStats(data.overview);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, refreshStats, lastUpdate };
};
```

### **Event-driven Updates**
```javascript
// Refresh stats after task completion
const completeTask = async (taskId) => {
  try {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 2 })
    });
    
    // Stats will be auto-updated by backend
    // Refresh frontend stats after a short delay
    setTimeout(() => {
      refreshStats();
    }, 1000);
    
  } catch (error) {
    console.error('Failed to complete task:', error);
  }
};
```

---

## 🎨 **UI/UX Recommendations**

### **Stats Display**
- **Progress Cards**: Show key metrics in card format
- **Charts**: Use line/bar charts for daily activity trends
- **Streak Visualization**: Show current streak with fire emoji 🔥
- **Achievement Badges**: Display streak milestones

### **Color Coding**
```css
.stats-dashboard {
  --primary-color: #4f46e5;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}
```

### **Responsive Design**
```css
@media (max-width: 768px) {
  .stats-dashboard {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
```

---

## ⚠️ **Error Handling**

### **API Error Handling**
```javascript
const handleApiError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Show permission error
    showNotification('You do not have permission to access this data', 'error');
  } else {
    // Show generic error
    showNotification('Failed to load stats. Please try again.', 'error');
  }
};

const fetchStatsSafely = async () => {
  try {
    const response = await fetch('/api/user-stats', { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, 'fetchStats');
    return null;
  }
};
```

### **Network Resilience**
```javascript
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

---

## 🧪 **Testing**

### **Unit Tests**
```javascript
// Mock API responses for testing
const mockStatsResponse = {
  overview: {
    totalTasksCompleted: 10,
    totalFocusMinutes: 300,
    currentStreak: 5
  }
};

describe('Stats Integration', () => {
  test('should fetch stats overview', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatsResponse)
    });

    const stats = await getStatsOverview();
    expect(stats.totalTasksCompleted).toBe(10);
  });

  test('should record focus session', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    await recordFocusSession(25);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user-stats/record-focus-session',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"plannedMinutes":25')
      })
    );
  });
});
```

---

## 📱 **Mobile Considerations**

### **Performance Optimization**
```javascript
// Debounce API calls on mobile
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const debouncedRefreshStats = debounce(refreshStats, 500);
```

### **Offline Support**
```javascript
// Cache stats for offline viewing
const cacheStats = (stats) => {
  localStorage.setItem('cachedStats', JSON.stringify({
    data: stats,
    timestamp: Date.now()
  }));
};

const getCachedStats = () => {
  const cached = localStorage.getItem('cachedStats');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // Use cached data if less than 1 hour old
    if (Date.now() - timestamp < 3600000) {
      return data;
    }
  }
  return null;
};
```

---

## 🔐 **Security Best Practices**

### **Token Management**
```javascript
// Secure token storage
const storeToken = (token) => {
  // Use secure storage (not localStorage for sensitive apps)
  sessionStorage.setItem('authToken', token);
};

const getToken = () => {
  return sessionStorage.getItem('authToken');
};

const clearToken = () => {
  sessionStorage.removeItem('authToken');
};
```

### **Input Validation**
```javascript
const validateFocusSession = (minutes) => {
  if (!minutes || minutes < 1 || minutes > 240) {
    throw new Error('Focus session must be between 1 and 240 minutes');
  }
};

const recordFocusSessionSafely = async (minutes) => {
  try {
    validateFocusSession(minutes);
    await recordFocusSession(minutes);
  } catch (error) {
    console.error('Invalid focus session:', error.message);
  }
};
```

---

## 📚 **Additional Resources**

### **API Documentation**
- **Base URL**: `https://your-api-domain.com/api`
- **Authentication**: JWT Bearer token required
- **Rate Limits**: 100 requests per minute per user
- **Response Format**: JSON

### **Support**
- **Documentation**: [API Docs Link]
- **Issues**: [GitHub Issues Link]
- **Contact**: [Support Email]

---

## 🎉 **Conclusion**

The User Stats system provides comprehensive tracking and analytics for your application. With automatic backend tracking and simple frontend integration, you can easily build engaging stats dashboards and gamification features.

**Key Benefits**:
- ✅ **Automatic tracking** - No manual data entry needed
- ✅ **Real-time updates** - Always current data
- ✅ **Rich analytics** - Daily, weekly, monthly views
- ✅ **Gamification ready** - Streaks, achievements, progress tracking
- ✅ **Mobile optimized** - Responsive design and performance

**Next Steps**:
1. Implement the basic stats overview
2. Add Pomodoro timer integration
3. Create activity charts and visualizations
4. Build achievement and streak features
5. Add real-time updates and notifications

Happy coding! 🚀
