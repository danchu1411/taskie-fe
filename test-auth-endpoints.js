/**
 * Authentication Endpoints Performance Test
 * 
 * Tests /auth/login and /auth/google endpoints with mock credentials
 * Measures response times and provides performance analysis
 */

const BASE_URL = 'http://localhost:3000'; // Adjust if different
const API_BASE = `${BASE_URL}/api`;

// Mock credentials for testing
const MOCK_LOGIN_CREDS = {
  email: 'test@example.com',
  password: 'testpassword123',
  remember: true
};

const MOCK_GOOGLE_PAYLOAD = {
  mock: {
    sub: `mock-${Date.now()}`,
    email: 'mockuser@example.com',
    name: 'Mock User'
  },
  remember: true
};

// Test configuration
const TEST_CONFIG = {
  iterations: 10, // Number of requests to send
  timeout: 10000, // 10 second timeout
  endpoints: {
    login: '/auth/login',
    google: '/auth/google'
  }
};

/**
 * Measure response time for a single request
 */
async function measureRequest(url, options = {}) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(options.body),
      signal: AbortSignal.timeout(options.timeout || TEST_CONFIG.timeout)
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      success: response.ok,
      status: response.status,
      responseTime,
      data: await response.json().catch(() => null)
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      error: error.message,
      responseTime,
      status: 0
    };
  }
}

/**
 * Run multiple iterations of a test
 */
async function runTest(testName, url, options) {
  console.log(`\n🧪 Testing ${testName}...`);
  console.log(`📍 URL: ${url}`);
  console.log(`🔄 Running ${TEST_CONFIG.iterations} iterations...\n`);
  
  const results = [];
  
  for (let i = 0; i < TEST_CONFIG.iterations; i++) {
    process.stdout.write(`⏳ Request ${i + 1}/${TEST_CONFIG.iterations}... `);
    
    const result = await measureRequest(url, options);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.responseTime.toFixed(2)}ms (${result.status})`);
    } else {
      console.log(`❌ ${result.responseTime.toFixed(2)}ms (${result.error || result.status})`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Calculate statistics from results
 */
function calculateStats(results) {
  const successfulResults = results.filter(r => r.success);
  const responseTimes = successfulResults.map(r => r.responseTime);
  
  if (responseTimes.length === 0) {
    return {
      successRate: 0,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      medianResponseTime: 0
    };
  }
  
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
  
  return {
    successRate: (successfulResults.length / results.length) * 100,
    avgResponseTime: avgResponseTime,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    medianResponseTime: medianResponseTime,
    totalRequests: results.length,
    successfulRequests: successfulResults.length
  };
}

/**
 * Display test results
 */
function displayResults(testName, stats) {
  console.log(`\n📊 ${testName} Results:`);
  console.log(`├─ Success Rate: ${stats.successRate.toFixed(1)}%`);
  console.log(`├─ Total Requests: ${stats.totalRequests}`);
  console.log(`├─ Successful: ${stats.successfulRequests}`);
  console.log(`├─ Average Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);
  console.log(`├─ Median Response Time: ${stats.medianResponseTime.toFixed(2)}ms`);
  console.log(`├─ Min Response Time: ${stats.minResponseTime.toFixed(2)}ms`);
  console.log(`└─ Max Response Time: ${stats.maxResponseTime.toFixed(2)}ms`);
  
  // Performance assessment
  if (stats.avgResponseTime < 100) {
    console.log(`🚀 Performance: Excellent (< 100ms)`);
  } else if (stats.avgResponseTime < 300) {
    console.log(`✅ Performance: Good (< 300ms)`);
  } else if (stats.avgResponseTime < 1000) {
    console.log(`⚠️  Performance: Acceptable (< 1s)`);
  } else {
    console.log(`🐌 Performance: Slow (> 1s)`);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Authentication Endpoints Performance Test');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`🔄 Iterations: ${TEST_CONFIG.iterations}`);
  
  // Test 1: /auth/login endpoint
  const loginResults = await runTest(
    'Login Endpoint',
    `${API_BASE}${TEST_CONFIG.endpoints.login}`,
    { body: MOCK_LOGIN_CREDS }
  );
  
  // Test 2: /auth/google endpoint
  const googleResults = await runTest(
    'Google Auth Endpoint',
    `${API_BASE}${TEST_CONFIG.endpoints.google}`,
    { body: MOCK_GOOGLE_PAYLOAD }
  );
  
  // Calculate and display results
  const loginStats = calculateStats(loginResults);
  const googleStats = calculateStats(googleResults);
  
  displayResults('Login Endpoint', loginStats);
  displayResults('Google Auth Endpoint', googleStats);
  
  // Overall assessment
  console.log('\n📈 Overall Assessment:');
  const overallAvg = (loginStats.avgResponseTime + googleStats.avgResponseTime) / 2;
  const overallSuccess = (loginStats.successRate + googleStats.successRate) / 2;
  
  console.log(`├─ Overall Average Response Time: ${overallAvg.toFixed(2)}ms`);
  console.log(`├─ Overall Success Rate: ${overallSuccess.toFixed(1)}%`);
  console.log(`└─ Test Environment: ${BASE_URL.includes('localhost') ? 'Local Development' : 'Production'}`);
  
  // Local development limitations
  if (BASE_URL.includes('localhost')) {
    console.log('\n⚠️  Local Development Limitations:');
    console.log('├─ Results may not reflect production performance');
    console.log('├─ Network latency is minimal (localhost)');
    console.log('├─ Database queries may be faster (local DB)');
    console.log('├─ No CDN or load balancing effects');
    console.log('└─ Consider testing with production-like data volumes');
  }
  
  console.log('\n✅ Performance test completed!');
}

// Run the tests
runAllTests().catch(console.error);
