/**
 * Quick Authentication Endpoints Test
 * Simple Node.js script to test auth endpoints performance
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  iterations: 5,
  timeout: 5000
};

// Mock data
const LOGIN_DATA = {
  email: 'test@example.com',
  password: 'testpassword123',
  remember: true
};

const GOOGLE_DATA = {
  mock: {
    sub: `mock-${Date.now()}`,
    email: 'mockuser@example.com',
    name: 'Mock User'
  },
  remember: true
};

/**
 * Make HTTP request and measure response time
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: CONFIG.timeout
    };
    
    const req = client.request(options, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          responseTime,
          data: body
        });
      });
    });
    
    req.on('error', (err) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({
        success: false,
        error: err.message,
        responseTime
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({
        success: false,
        error: 'Request timeout',
        responseTime
      });
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Run performance test
 */
async function runTest(testName, endpoint, data) {
  console.log(`\n🧪 Testing ${testName}...`);
  console.log(`📍 URL: ${CONFIG.baseUrl}${endpoint}`);
  console.log(`🔄 Running ${CONFIG.iterations} iterations...\n`);
  
  const results = [];
  
  for (let i = 0; i < CONFIG.iterations; i++) {
    process.stdout.write(`⏳ Request ${i + 1}/${CONFIG.iterations}... `);
    
    try {
      const result = await makeRequest(`${CONFIG.baseUrl}${endpoint}`, data);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${result.responseTime}ms (${result.status})`);
      } else {
        console.log(`❌ ${result.responseTime}ms (${result.status})`);
      }
    } catch (error) {
      results.push(error);
      console.log(`❌ ${error.responseTime}ms (${error.error})`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
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
    return;
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
  
  return { avgTime, successRate };
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Quick Authentication Endpoints Performance Test');
  console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);
  console.log(`🔄 Iterations: ${CONFIG.iterations}`);
  
  try {
    // Test login endpoint
    const loginResults = await runTest('Login Endpoint', '/api/auth/login', LOGIN_DATA);
    const loginStats = displayStats('Login Endpoint', loginResults);
    
    // Test Google auth endpoint
    const googleResults = await runTest('Google Auth Endpoint', '/api/auth/google', GOOGLE_DATA);
    const googleStats = displayStats('Google Auth Endpoint', googleResults);
    
    // Overall assessment
    console.log('\n📈 Overall Assessment:');
    if (loginStats && googleStats) {
      const overallAvg = (loginStats.avgTime + googleStats.avgTime) / 2;
      const overallSuccess = (loginStats.successRate + googleStats.successRate) / 2;
      
      console.log(`├─ Overall Average Response Time: ${overallAvg.toFixed(2)}ms`);
      console.log(`├─ Overall Success Rate: ${overallSuccess.toFixed(1)}%`);
    }
    console.log(`└─ Test Environment: ${CONFIG.baseUrl}`);
    
    // Local development limitations
    if (CONFIG.baseUrl.includes('localhost')) {
      console.log('\n⚠️  Local Development Limitations:');
      console.log('├─ Results may not reflect production performance');
      console.log('├─ Network latency is minimal (localhost)');
      console.log('├─ Database queries may be faster (local DB)');
      console.log('├─ No CDN or load balancing effects');
      console.log('└─ Consider testing with production-like data volumes');
    }
    
    console.log('\n✅ Performance test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();
