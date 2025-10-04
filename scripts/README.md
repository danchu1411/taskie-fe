# 🚀 API Performance Benchmarking Scripts

## 📋 Overview

This directory contains comprehensive benchmarking scripts for testing Taskie API performance across different operations:

- **`bench-tasks.js`**: Tests POST/PATCH operations (create, update)
- **`bench-fetch.js`**: Tests GET operations (fetch, retrieve)

## 🛠️ Setup

### **Prerequisites:**
```bash
# Install axios if not already installed
npm install axios
```

### **Environment Variables:**
```bash
# Required
export API_BASE="http://localhost:3000/api"
export ACCESS_TOKEN="your-access-token-here"
export USER_ID="your-user-id-here"

# Optional (with defaults)
export ITERATIONS="15"  # Number of requests (default: 15)
export TIMEOUT="10000"  # Request timeout in ms (default: 10000)
```

## 🚀 Usage

### **Quick Start:**
```bash
# Test POST/PATCH operations
npm run bench:tasks

# Test GET operations
npm run bench:fetch

# Run all benchmarks
npm run bench:all
```

### **Manual Execution:**
```bash
# With environment variables
API_BASE="http://localhost:3000/api" ACCESS_TOKEN="token123" node scripts/bench-tasks.js

# With all options
API_BASE="http://localhost:3000/api" ACCESS_TOKEN="token123" USER_ID="user123" ITERATIONS="20" node scripts/bench-tasks.js
```

## 📊 Test Coverage

### **bench-tasks.js (POST/PATCH Operations):**

| Endpoint | Method | Purpose | Mock Data |
|----------|--------|---------|-----------|
| `/tasks/create` | POST | Create new task | Title, description, priority, status, due date |
| `/tasks/:id` | PATCH | Update task status | Status change, priority update |
| `/checklist-items/create` | POST | Create checklist item | Title, description, order |
| `/schedule-entries` | POST | Create schedule entry | Title, start/end time, type |

### **bench-fetch.js (GET Operations):**

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/tasks` | GET | Get all tasks | None |
| `/tasks/:id/checklist` | GET | Get task checklist | Task ID |
| `/schedule-entries/upcoming` | GET | Get upcoming schedule | None |
| `/tasks?status=todo&priority=high` | GET | Get filtered tasks | Status, priority filters |
| `/schedule-entries?start=2024-01-01&end=2024-12-31` | GET | Get schedule range | Date range |

## 📈 Performance Metrics

### **Response Time Analysis:**
- **Average**: Overall performance indicator
- **Median**: Typical user experience
- **Min/Max**: Performance consistency
- **Success Rate**: Reliability indicator

### **Data Efficiency:**
- **Data Size**: Response payload size
- **Record Count**: Number of records returned
- **Throughput**: Bytes per millisecond

### **Performance Benchmarks:**

| Response Time | Performance Level | Description |
|---------------|-------------------|-------------|
| < 100ms | 🚀 Excellent | Production-ready performance |
| 100-300ms | ✅ Good | Acceptable for most use cases |
| 300ms-1s | ⚠️ Acceptable | May need optimization |
| > 1s | 🐌 Slow | Requires immediate attention |

## 🔧 Configuration

### **Test Parameters:**
```javascript
const CONFIG = {
  iterations: 15,        // Number of requests per endpoint
  timeout: 10000,        // Request timeout (ms)
  delay: 100            // Delay between requests (ms)
};
```

### **Mock Data:**
```javascript
// Task creation
const MOCK_TASK = {
  title: 'Benchmark Test Task',
  description: 'Task created for performance testing',
  priority: 'medium',
  status: 'todo',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

// Task update
const MOCK_TASK_UPDATE = {
  status: 'in_progress',
  priority: 'high'
};

// Checklist item
const MOCK_CHECKLIST_ITEM = {
  title: 'Benchmark Checklist Item',
  description: 'Checklist item for performance testing',
  order: 1
};

// Schedule entry
const MOCK_SCHEDULE_ENTRY = {
  title: 'Benchmark Schedule Entry',
  description: 'Schedule entry for performance testing',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
  type: 'focus_session'
};
```

## 📊 Sample Output

### **bench-tasks.js Output:**
```
🚀 Tasks API Performance Benchmark
🌐 API Base: http://localhost:3000/api
🔑 Access Token: mock-acces...
👤 User ID: mock-user-id
⏱️  Timeout: 10000ms
🔄 Iterations: 15

🧪 Testing Create Task...
🔄 Running 15 iterations...

⏳ Request 1/15... ✅ 45ms (201)
⏳ Request 2/15... ✅ 52ms (201)
...

📊 Create Task Results:
├─ Success Rate: 100.0%
├─ Total Requests: 15
├─ Successful: 15
├─ Average Response Time: 48.5ms
├─ Median Response Time: 47.0ms
├─ Min Response Time: 42ms
└─ Max Response Time: 58ms
🚀 Performance: Excellent (< 100ms)
```

### **bench-fetch.js Output:**
```
🚀 Tasks API Fetch Performance Benchmark
🌐 API Base: http://localhost:3000/api
🔑 Access Token: mock-acces...
👤 User ID: mock-user-id
⏱️  Timeout: 10000ms
🔄 Iterations: 15

🧪 Testing Get Tasks...
🔄 Running 15 iterations...

⏳ Request 1/15... ✅ 35ms (200) - 5 records, 1024 bytes
⏳ Request 2/15... ✅ 38ms (200) - 5 records, 1024 bytes
...

📊 Get Tasks Results:
├─ Success Rate: 100.0%
├─ Total Requests: 15
├─ Successful: 15
├─ Average Response Time: 36.2ms
├─ Median Response Time: 35.0ms
├─ Min Response Time: 32ms
├─ Max Response Time: 45ms
├─ Average Data Size: 1024 bytes
└─ Average Records: 5.0
🚀 Performance: Excellent (< 100ms)
📈 Data Efficiency: High throughput (28 bytes/ms)
```

## 🎯 Expected Results

### **Local Development:**
- **Create Operations**: 20-100ms average
- **Update Operations**: 15-80ms average
- **Fetch Operations**: 10-50ms average
- **Success Rate**: 100%

### **Production Environment:**
- **Create Operations**: 50-300ms average
- **Update Operations**: 30-200ms average
- **Fetch Operations**: 20-150ms average
- **Success Rate**: > 99%

## ⚠️ Limitations & Considerations

### **Local Development Limitations:**
1. **Network Latency**: Minimal (localhost)
2. **Database Performance**: Fast local DB
3. **Resource Constraints**: Full system resources
4. **Data Volume**: Minimal test data
5. **Infrastructure**: Single process, no load balancing

### **Production Considerations:**
1. **Network Latency**: 50-200ms depending on location
2. **Database Performance**: Network overhead, shared resources
3. **Resource Constraints**: Limited CPU/memory per instance
4. **Data Volume**: Large datasets, complex queries
5. **Infrastructure**: Multiple instances, load balancers, CDN

## 🔍 Troubleshooting

### **Common Issues:**

1. **Connection Refused**
   ```bash
   # Check if backend is running
   curl http://localhost:3000/api/health
   ```

2. **Authentication Errors**
   ```bash
   # Verify token format
   echo $ACCESS_TOKEN
   ```

3. **Timeout Errors**
   ```bash
   # Increase timeout
   export TIMEOUT="30000"
   ```

4. **Rate Limiting**
   ```bash
   # Reduce iterations
   export ITERATIONS="5"
   ```

### **Debug Mode:**
```bash
# Enable debug logging
DEBUG=1 node scripts/bench-tasks.js
```

## 📈 Optimization Recommendations

### **Backend Optimizations:**
```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_schedule_entries_user_id ON schedule_entries(user_id);
CREATE INDEX idx_schedule_entries_start_time ON schedule_entries(start_time);
```

```javascript
// Implement caching
const cache = new Map();

// Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### **Frontend Optimizations:**
```javascript
// Implement request batching
const batchRequests = async (requests) => {
  return Promise.all(requests);
};

// Use response caching
const responseCache = new Map();
```

## 🎯 Success Criteria

### **Performance Targets:**
- **Response Time**: < 200ms average
- **Success Rate**: > 99%
- **Consistency**: < 50ms variance
- **Availability**: 99.9% uptime

### **Monitoring:**
- Set up continuous monitoring
- Implement alerting for performance degradation
- Regular performance testing
- Load testing with realistic data volumes

## 📝 Reporting

### **Test Report Template:**
```
# API Performance Benchmark Report

## Test Configuration
- Environment: [Local/Staging/Production]
- API Base: [URL]
- Iterations: [Number]
- Date: [Current Date]

## Results Summary
- Create Operations: [Average Time]ms ([Success Rate]%)
- Update Operations: [Average Time]ms ([Success Rate]%)
- Fetch Operations: [Average Time]ms ([Success Rate]%)
- Overall Performance: [Excellent/Good/Acceptable/Slow]

## Recommendations
- [List optimization recommendations]
- [Identify performance bottlenecks]
- [Suggest monitoring improvements]
```

---

**Happy Benchmarking! 🚀**
