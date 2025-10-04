/**
 * Tasks API Fetch Performance Benchmark
 * 
 * Tests GET operations for tasks, checklist items, and schedule entries
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
      dataSize: JSON.stringify(response.data).length,
      recordCount: Array.isArray(response.data) ? response.data.length : 1
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      error: error.message,
      responseTime,
      status: error.response?.status || 0,
      dataSize: 0,
      recordCount: 0
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
      console.log(`✅ ${result.responseTime}ms (${result.status}) - ${result.recordCount} records, ${result.dataSize} bytes`);
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
  const dataSizes = successful.map(r => r.dataSize);
  const recordCounts = successful.map(r => r.recordCount);
  
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
  
  // Data statistics
  const avgDataSize = dataSizes.reduce((sum, size) => sum + size, 0) / dataSizes.length;
  const avgRecordCount = recordCounts.reduce((sum, count) => sum + count, 0) / recordCounts.length;
  
  console.log(`\n📊 ${testName} Results:`);
  console.log(`├─ Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`├─ Total Requests: ${results.length}`);
  console.log(`├─ Successful: ${successful.length}`);
  console.log(`├─ Average Response Time: ${avgTime.toFixed(2)}ms`);
  console.log(`├─ Median Response Time: ${medianTime.toFixed(2)}ms`);
  console.log(`├─ Min Response Time: ${minTime}ms`);
  console.log(`├─ Max Response Time: ${maxTime}ms`);
  console.log(`├─ Average Data Size: ${avgDataSize.toFixed(0)} bytes`);
  console.log(`└─ Average Records: ${avgRecordCount.toFixed(1)}`);
  
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
  
  // Data efficiency assessment
  const bytesPerMs = avgDataSize / avgTime;
  if (bytesPerMs > 1000) {
    console.log(`📈 Data Efficiency: High throughput (${bytesPerMs.toFixed(0)} bytes/ms)`);
  } else if (bytesPerMs > 100) {
    console.log(`📊 Data Efficiency: Good throughput (${bytesPerMs.toFixed(0)} bytes/ms)`);
  } else {
    console.log(`📉 Data Efficiency: Low throughput (${bytesPerMs.toFixed(0)} bytes/ms)`);
  }
  
  return { avgTime, successRate, minTime, maxTime, avgDataSize, avgRecordCount };
}

/**
 * Main benchmark runner
 */
async function runAllBenchmarks() {
  console.log('🚀 Tasks API Fetch Performance Benchmark');
  console.log(`🌐 API Base: ${API_BASE}`);
  console.log(`🔑 Access Token: ${ACCESS_TOKEN.substring(0, 10)}...`);
  console.log(`👤 User ID: ${USER_ID}`);
  console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);
  console.log(`🔄 Iterations: ${CONFIG.iterations}`);
  
  const allResults = {};
  
  try {
    // Test 1: GET /tasks
    const getTasksResults = await runBenchmark(
      'Get Tasks',
      () => axios.get('/tasks', axiosConfig)
    );
    allResults.getTasks = displayStats('Get Tasks', getTasksResults);
    
    // Test 2: GET /tasks/:id/checklist
    // First get a task ID, or use a mock one
    let taskId = null;
    try {
      const tasksResponse = await axios.get('/tasks', axiosConfig);
      if (tasksResponse.data && tasksResponse.data.length > 0) {
        taskId = tasksResponse.data[0].id;
      }
    } catch (error) {
      console.log('⚠️  Could not get task ID, using mock ID');
      taskId = 'mock-task-id';
    }
    
    const getChecklistResults = await runBenchmark(
      'Get Task Checklist',
      () => axios.get(`/tasks/${taskId}/checklist`, axiosConfig)
    );
    allResults.getChecklist = displayStats('Get Task Checklist', getChecklistResults);
    
    // Test 3: GET /schedule-entries/upcoming
    const getUpcomingResults = await runBenchmark(
      'Get Upcoming Schedule',
      () => axios.get('/schedule-entries/upcoming', axiosConfig)
    );
    allResults.getUpcoming = displayStats('Get Upcoming Schedule', getUpcomingResults);
    
    // Test 4: GET /tasks with filters (bonus test)
    const getFilteredTasksResults = await runBenchmark(
      'Get Filtered Tasks',
      () => axios.get('/tasks?status=todo&priority=high', axiosConfig)
    );
    allResults.getFilteredTasks = displayStats('Get Filtered Tasks', getFilteredTasksResults);
    
    // Test 5: GET /schedule-entries with date range (bonus test)
    const getScheduleRangeResults = await runBenchmark(
      'Get Schedule Range',
      () => axios.get('/schedule-entries?start=2024-01-01&end=2024-12-31', axiosConfig)
    );
    allResults.getScheduleRange = displayStats('Get Schedule Range', getScheduleRangeResults);
    
    // Overall assessment
    console.log('\n📈 Overall Assessment:');
    const results = Object.values(allResults);
    const overallAvg = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
    const overallSuccess = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
    const overallDataSize = results.reduce((sum, r) => sum + r.avgDataSize, 0) / results.length;
    
    console.log(`├─ Overall Average Response Time: ${overallAvg.toFixed(2)}ms`);
    console.log(`├─ Overall Success Rate: ${overallSuccess.toFixed(1)}%`);
    console.log(`├─ Overall Average Data Size: ${overallDataSize.toFixed(0)} bytes`);
    console.log(`└─ Test Environment: ${API_BASE}`);
    
    // Performance summary
    console.log('\n📊 Performance Summary:');
    Object.entries(allResults).forEach(([test, stats]) => {
      console.log(`├─ ${test}: ${stats.avgTime.toFixed(2)}ms (${stats.successRate.toFixed(1)}%) - ${stats.avgDataSize.toFixed(0)} bytes`);
    });
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (overallAvg > 500) {
      console.log('├─ Consider optimizing database queries');
      console.log('├─ Implement caching for frequently accessed data');
      console.log('├─ Add database indexes for common filters');
      console.log('└─ Review server resource allocation');
    } else if (overallAvg > 200) {
      console.log('├─ Performance is acceptable but could be improved');
      console.log('├─ Consider adding database indexes');
      console.log('└─ Implement response caching');
    } else {
      console.log('└─ Performance is excellent! 🎉');
    }
    
    // Data efficiency recommendations
    if (overallDataSize > 100000) {
      console.log('\n📦 Data Size Recommendations:');
      console.log('├─ Consider pagination for large datasets');
      console.log('├─ Implement field selection (only return needed fields)');
      console.log('└─ Use compression for large responses');
    }
    
    console.log('\n✅ Fetch benchmark completed successfully!');
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    process.exit(1);
  }
}

// Run the benchmark
runAllBenchmarks();
