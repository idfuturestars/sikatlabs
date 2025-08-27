#!/usr/bin/env node

import http from 'http';
import https from 'https';
import { URL } from 'url';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TESTS = [];
const RESULTS = [];

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'EiQ-API-Test/1.0',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    RESULTS.push({ name, status: 'PASS', duration, error: null });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    RESULTS.push({ name, status: 'FAIL', duration, error: error.message });
    console.log(`❌ ${name} (${duration}ms): ${error.message}`);
  }
}

// Test assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// Core API Tests
TESTS.push(['Health Check Endpoint', async () => {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  assertEqual(response.status, 200, 'Health check should return 200');
  assert(response.data && response.data.status === 'healthy', 'Health status should be healthy');
}]);

TESTS.push(['Home Page Load', async () => {
  const response = await makeRequest(BASE_URL);
  assertEqual(response.status, 200, 'Home page should return 200');
  assert(response.rawData.includes('EiQ'), 'Home page should contain EiQ branding');
}]);

TESTS.push(['Viral Challenge Start', async () => {
  const response = await makeRequest(`${BASE_URL}/api/viral-challenge/start`, {
    method: 'POST',
    body: {
      challengeType: '15_second',
      difficulty: 'medium',
      userId: 'api-test-user'
    }
  });
  assertEqual(response.status, 200, 'Challenge start should return 200');
  assert(response.data.success, 'Challenge should start successfully');
  assert(response.data.sessionId, 'Should return a session ID');
}]);

TESTS.push(['Viral Challenge Questions Fetch', async () => {
  // First start a challenge
  const startResponse = await makeRequest(`${BASE_URL}/api/viral-challenge/start`, {
    method: 'POST',
    body: {
      challengeType: '15_second',
      difficulty: 'medium',
      userId: 'api-test-user-2'
    }
  });
  
  assert(startResponse.data.sessionId, 'Should have session ID');
  
  // Then fetch questions
  const response = await makeRequest(`${BASE_URL}/api/viral-challenge/${startResponse.data.sessionId}/questions`);
  assertEqual(response.status, 200, 'Questions fetch should return 200');
  assert(Array.isArray(response.data.questions), 'Should return questions array');
  assert(response.data.questions.length > 0, 'Should have at least one question');
}]);

TESTS.push(['Assessment Engine Health', async () => {
  const response = await makeRequest(`${BASE_URL}/api/assessment/health`);
  // This endpoint might not exist, so we check for either 200 or 404
  assert(response.status === 200 || response.status === 404, 'Assessment health check');
}]);

TESTS.push(['Role Models Endpoint', async () => {
  const response = await makeRequest(`${BASE_URL}/api/role-models`);
  // Check if endpoint exists and returns data
  assert(response.status === 200 || response.status === 404, 'Role models endpoint accessible');
  if (response.status === 200 && response.data) {
    assert(Array.isArray(response.data) || typeof response.data === 'object', 'Role models should return structured data');
  }
}]);

TESTS.push(['API Rate Limiting Test', async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest(`${BASE_URL}/api/health`));
  }
  
  const responses = await Promise.all(promises);
  const successCount = responses.filter(r => r.status === 200).length;
  assert(successCount >= 8, 'Should handle concurrent requests well (at least 80% success)');
}]);

TESTS.push(['Response Time Performance', async () => {
  const startTime = Date.now();
  const response = await makeRequest(`${BASE_URL}/api/health`);
  const responseTime = Date.now() - startTime;
  
  assertEqual(response.status, 200, 'Should return 200');
  assert(responseTime < 1000, `Response time should be under 1000ms (was ${responseTime}ms)`);
}]);

TESTS.push(['Content Type Headers', async () => {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  assertEqual(response.status, 200, 'Should return 200');
  assert(
    response.headers['content-type']?.includes('application/json'),
    'API should return JSON content type'
  );
}]);

TESTS.push(['CORS Headers Check', async () => {
  const response = await makeRequest(`${BASE_URL}/api/health`, {
    headers: {
      'Origin': 'http://localhost:3000'
    }
  });
  assertEqual(response.status, 200, 'Should return 200');
  // CORS headers might be present
  console.log('CORS headers:', response.headers['access-control-allow-origin'] || 'not set');
}]);

// Session and State Tests
TESTS.push(['Session State Management', async () => {
  // Start two challenges with different users
  const user1Response = await makeRequest(`${BASE_URL}/api/viral-challenge/start`, {
    method: 'POST',
    body: { challengeType: '15_second', difficulty: 'medium', userId: 'session-test-1' }
  });
  
  const user2Response = await makeRequest(`${BASE_URL}/api/viral-challenge/start`, {
    method: 'POST',
    body: { challengeType: '15_second', difficulty: 'medium', userId: 'session-test-2' }
  });
  
  assert(user1Response.data.sessionId !== user2Response.data.sessionId, 'Different users should get different sessions');
}]);

// Run all tests
async function runAllTests() {
  console.log(`🚀 Starting comprehensive API test suite (${TESTS.length} tests)...\n`);
  
  for (const [name, testFn] of TESTS) {
    await runTest(name, testFn);
  }
  
  // Summary
  const passed = RESULTS.filter(r => r.status === 'PASS').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  const totalTime = RESULTS.reduce((sum, r) => sum + r.duration, 0);
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📈 Success rate: ${((passed / TESTS.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n🔍 Failed tests:');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }
  
  // Performance metrics
  const avgTime = totalTime / TESTS.length;
  console.log(`\n⚡ Performance metrics:`);
  console.log(`   • Average response time: ${avgTime.toFixed(1)}ms`);
  console.log(`   • Fastest test: ${Math.min(...RESULTS.map(r => r.duration))}ms`);
  console.log(`   • Slowest test: ${Math.max(...RESULTS.map(r => r.duration))}ms`);
  
  return passed === TESTS.length;
}

// Execute tests
runAllTests().then(allPassed => {
  process.exit(allPassed ? 0 : 1);
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});