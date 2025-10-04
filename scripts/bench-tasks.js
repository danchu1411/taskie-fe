/**
 * Tasks API Performance Benchmark
 * 
 * Tests POST/PATCH operations for tasks, checklist items, and schedule entries
 * Measures response times and provides performance analysis
 */

import axios from 'axios';

// Configuration from environment variables
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'mock-access-token';
const USER_ID = process.env.USER_ID || 'mock-user-id';

// Test configuration
const CONFIG = {
  iterations: 15, // 10-20 requests as requested
  timeout: 10000, // 10 second timeout
  delay: 100 // 100ms delay between requests
};

// Mock data for testing
const MOCK_TASK = {
  title: 'Benchmark Test Task',
  description: 'Task created for performance testing',
  priority: 'medium',
  status: 'todo',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
};

const MOCK_TASK_UPDATE = {
  status: 'in_progress',
  priority: 'high'
};

const MOCK_CHECKLIST_ITEM = {
  title: 'Benchmark Checklist Item',
  description: 'Checklist item for performance testing',
  order: 1
};

const MOCK_SCHEDULE_ENTRY = {
  title: 'Benchmark Schedule Entry',
  description: 'Schedule entry for performance testing',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
  type: 'focus_session'
};

// Axios configuration
const axiosConfig = {
  baseURL: API_BASE,
  timeout: CONFIG.timeout,
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'x-user-id': USER_ID
  }
};

/**
 * Measure response time for a single request
 */
async function measureRequest(requestFn, requestName) {
  const startTime = Date.now();
  
  try {
    const response = await requestFn();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      error: error.message,
      responseTime,
      status: error.response?.status || 0
    };
  }
}

/**
 * Run benchmark test for a specific endpoint
 */
async function runBenchmark(testName, requestFn) {
  console.log(`\n🧪 Testing ${testName}...`);
  console.log(`🔄 Running ${CONFIG.iterations} iterations...\n`);
  
  const results = [];
  
  for (let i = 0; i < CONFIG.iterations; i++) {
    process.stdout.write(`⏳ Request ${i + 1}/${CONFIG.iterations}... `);
    
    const result = await measureRequest(requestFn, testName);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.responseTime}ms (${result.status})`);
    } else {
      console.log(`❌ ${result.responseTime}ms (${result.error || result.status})`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, CONFIG.delay));
  }
  
  return results;
}

/**
 * Calculate and display statistics
 */
function displayStats(testName, results) {
  const successful = results.filter(r => r.success);
  const responseTimes = successful.map(r => r.responseTime);
  
  if (responseTimes.length === 0) {
    console.log(`\n❌ All requests failed for ${testName}`);
    return { avgTime: 0, successRate: 0 };
  }
  
  const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  const successRate = (successful.length / results.length) * 100;
  
  // Calculate median
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
  
  console.log(`\n📊 ${testName} Results:`);
  console.log(`├─ Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`├─ Total Requests: ${results.length}`);
  console.log(`├─ Successful: ${successful.length}`);
  console.log(`├─ Average Response Time: ${avgTime.toFixed(2)}ms`);
  console.log(`├─ Median Response Time: ${medianTime.toFixed(2)}ms`);
  console.log(`├─ Min Response Time: ${minTime}ms`);
  console.log(`└─ Max Response Time: ${maxTime}ms`);
  
  // Performance assessment
  if (avgTime < 100) {
    console.log(`🚀 Performance: Excellent (< 100ms)`);
  } else if (avgTime < 300) {
    console.log(`✅ Performance: Good (< 300ms)`);
  } else if (avgTime < 1000) {
    console.log(`⚠️  Performance: Acceptable (< 1s)`);
  } else {
    console.log(`🐌 Performance: Slow (> 1s)`);
  }
  
  return { avgTime, successRate, minTime, maxTime };
}

/**
 * Main benchmark runner
 */
async function runAllBenchmarks() {
  console.log('🚀 Tasks API Performance Benchmark');
  console.log(`🌐 API Base: ${API_BASE}`);
  console.log(`🔑 Access Token: ${ACCESS_TOKEN.substring(0, 10)}...`);
  console.log(`👤 User ID: ${USER_ID}`);
  console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);
  console.log(`🔄 Iterations: ${CONFIG.iterations}`);
  
  const allResults = {};
  
  try {
    // Test 1: POST /tasks/create
    const createTaskResults = await runBenchmark(
      'Create Task',
      () => axios.post('/tasks/create', MOCK_TASK, axiosConfig)
    );
    allResults.createTask = displayStats('Create Task', createTaskResults);
    
    // Test 2: PATCH /tasks/:id (update status)
    // First create a task to update
    let taskId = null;
    try {
      const createResponse = await axios.post('/tasks/create', MOCK_TASK, axiosConfig);
      taskId = createResponse.data.id;
    } catch (error) {
      console.log('⚠️  Could not create task for update test, using mock ID');
      taskId = 'mock-task-id';
    }
    
    const updateTaskResults = await runBenchmark(
      'Update Task',
      () => axios.patch(`/tasks/${taskId}`, MOCK_TASK_UPDATE, axiosConfig)
    );
    allResults.updateTask = displayStats('Update Task', updateTaskResults);
    
    // Test 3: POST /checklist-items/create
    const createChecklistResults = await runBenchmark(
      'Create Checklist Item',
      () => axios.post('/checklist-items/create', {
        ...MOCK_CHECKLIST_ITEM,
        taskId: taskId
      }, axiosConfig)
    );
    allResults.createChecklist = displayStats('Create Checklist Item', createChecklistResults);
    
    // Test 4: POST /schedule-entries
    const createScheduleResults = await runBenchmark(
      'Create Schedule Entry',
      () => axios.post('/schedule-entries', MOCK_SCHEDULE_ENTRY, axiosConfig)
    );
    allResults.createSchedule = displayStats('Create Schedule Entry', createScheduleResults);
    
    // Overall assessment
    console.log('\n📈 Overall Assessment:');
    const results = Object.values(allResults);
    const overallAvg = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
    const overallSuccess = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
    
    console.log(`├─ Overall Average Response Time: ${overallAvg.toFixed(2)}ms`);
    console.log(`├─ Overall Success Rate: ${overallSuccess.toFixed(1)}%`);
    console.log(`└─ Test Environment: ${API_BASE}`);
    
    // Performance summary
    console.log('\n📊 Performance Summary:');
    Object.entries(allResults).forEach(([test, stats]) => {
      console.log(`├─ ${test}: ${stats.avgTime.toFixed(2)}ms (${stats.successRate.toFixed(1)}%)`);
    });
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (overallAvg > 500) {
      console.log('├─ Consider optimizing database queries');
      console.log('├─ Implement caching for frequently accessed data');
      console.log('└─ Review server resource allocation');
    } else if (overallAvg > 200) {
      console.log('├─ Performance is acceptable but could be improved');
      console.log('└─ Consider adding database indexes');
    } else {
      console.log('└─ Performance is excellent! 🎉');
    }
    
    console.log('\n✅ Benchmark completed successfully!');
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    process.exit(1);
  }
}

// Run the benchmark
runAllBenchmarks();
