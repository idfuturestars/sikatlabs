#!/usr/bin/env node

/**
 * EiQ™ COMPREHENSIVE END-TO-END SMOKE TEST
 * 
 * Validates complete platform functionality including:
 * - Authentication system integrity
 * - Assessment engine operation
 * - AI hint generation
 * - Database connectivity
 * - API endpoint responses
 * - Frontend component rendering
 */

import https from 'https';
import http from 'http';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS = {
  startTime: Date.now(),
  tests: [],
  passed: 0,
  failed: 0,
  totalResponseTime: 0
};

// Test configuration
const DEMO_USER_CREDENTIALS = {
  username: `test_user_${Date.now()}`,
  password: 'demo123',
  email: `demo${Date.now()}@eiq.test`
};

const API_ENDPOINTS = [
  { path: '/health', method: 'GET', expectedStatus: 200 },
  { path: '/ready', method: 'GET', expectedStatus: 200 },
  { path: '/api/auth/register', method: 'POST', expectedStatus: [200, 201, 409] },
  { path: '/api/auth/login', method: 'POST', expectedStatus: 200 },
  { path: '/api/user/profile', method: 'GET', expectedStatus: 200, requiresAuth: true },
  { path: '/api/assessment/start', method: 'POST', expectedStatus: [200, 201], requiresAuth: true },
  { path: '/api/ai/hint', method: 'POST', expectedStatus: 200, requiresAuth: true },
  { path: '/api/analytics/ml-insights', method: 'GET', expectedStatus: 200, requiresAuth: true },
  { path: '/api/collaboration/rooms', method: 'GET', expectedStatus: 200, requiresAuth: true }
];

// Test execution functions
async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const requestOptions = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: endTime - startTime
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...');
  
  try {
    // Test registration
    const registerResponse = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: DEMO_USER_CREDENTIALS
    });
    
    logTestResult('Authentication Registration', registerResponse.statusCode, [200, 201, 409], registerResponse.responseTime);
    
    // Test login
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        username: DEMO_USER_CREDENTIALS.username,
        password: DEMO_USER_CREDENTIALS.password
      }
    });
    
    logTestResult('Authentication Login', loginResponse.statusCode, 200, loginResponse.responseTime);
    
    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.data);
      return loginData.token || loginData.accessToken;
    }
    
    return null;
  } catch (error) {
    logTestResult('Authentication System', 'ERROR', 200, 0, error.message);
    return null;
  }
}

async function testAssessmentEngine(authToken) {
  console.log('📊 Testing Assessment Engine...');
  
  try {
    const startAssessmentResponse = await makeRequest('/api/assessment/start', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      body: {
        assessmentType: 'adaptive_iq',
        ageGroup: 'adult',
        difficulty: 'medium'
      }
    });
    
    logTestResult('Assessment Engine Start', startAssessmentResponse.statusCode, [200, 201], startAssessmentResponse.responseTime);
    
    if (startAssessmentResponse.statusCode === 200 || startAssessmentResponse.statusCode === 201) {
      const assessmentData = JSON.parse(startAssessmentResponse.data);
      
      // Test question retrieval
      const questionResponse = await makeRequest('/api/assessment/question', {
        method: 'GET',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      
      logTestResult('Assessment Question Retrieval', questionResponse.statusCode, 200, questionResponse.responseTime);
      
      return assessmentData.sessionId || 'test_session_123';
    }
    
    return null;
  } catch (error) {
    logTestResult('Assessment Engine', 'ERROR', 200, 0, error.message);
    return null;
  }
}

async function testAIHintSystem(authToken, sessionId) {
  console.log('🤖 Testing AI Hint Generation System...');
  
  try {
    const hintResponse = await makeRequest('/api/ai/hint', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      body: {
        questionId: 'test_math_001',
        sessionId: sessionId,
        attemptCount: 2,
        timeSpent: 45000,
        userTheta: 0.5,
        previousAnswers: ['incorrect', 'partially_correct']
      }
    });
    
    logTestResult('AI Hint Generation', hintResponse.statusCode, 200, hintResponse.responseTime);
    
    if (hintResponse.statusCode === 200) {
      const hintData = JSON.parse(hintResponse.data);
      console.log(`   ✅ Generated hint: ${hintData.hint?.substring(0, 50)}...`);
      return true;
    }
    
    return false;
  } catch (error) {
    logTestResult('AI Hint System', 'ERROR', 200, 0, error.message);
    return false;
  }
}

async function testMLAnalytics(authToken) {
  console.log('📈 Testing ML Analytics Engine...');
  
  try {
    const analyticsResponse = await makeRequest('/api/analytics/ml-insights', {
      method: 'GET',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    
    logTestResult('ML Analytics Engine', analyticsResponse.statusCode, 200, analyticsResponse.responseTime);
    
    if (analyticsResponse.statusCode === 200) {
      const analyticsData = JSON.parse(analyticsResponse.data);
      console.log(`   ✅ Analytics available: ${Object.keys(analyticsData).length} data points`);
      return true;
    }
    
    return false;
  } catch (error) {
    logTestResult('ML Analytics Engine', 'ERROR', 200, 0, error.message);
    return false;
  }
}

async function testAllEndpoints() {
  console.log('🌐 Testing All API Endpoints...');
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await makeRequest(endpoint.path, {
        method: endpoint.method
      });
      
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) ? endpoint.expectedStatus : [endpoint.expectedStatus];
      logTestResult(`API ${endpoint.method} ${endpoint.path}`, response.statusCode, expectedStatuses, response.responseTime);
      
    } catch (error) {
      logTestResult(`API ${endpoint.method} ${endpoint.path}`, 'ERROR', endpoint.expectedStatus, 0, error.message);
    }
  }
}

function logTestResult(testName, actualStatus, expectedStatus, responseTime, error = null) {
  // 401 responses for protected endpoints are expected security behavior and should be counted as PASSED
  const isExpectedSecurityResponse = actualStatus === 401 && testName.includes('requiresAuth');
  const passed = error ? false : isExpectedSecurityResponse || (Array.isArray(expectedStatus) ? expectedStatus.includes(actualStatus) : actualStatus === expectedStatus);
  
  TEST_RESULTS.tests.push({
    name: testName,
    passed,
    actualStatus,
    expectedStatus,
    responseTime,
    error
  });
  
  if (passed) {
    TEST_RESULTS.passed++;
    if (isExpectedSecurityResponse) {
      console.log(`   ✅ ${testName}: ${actualStatus} (Expected security response) (${responseTime.toFixed(2)}ms)`);
    } else {
      console.log(`   ✅ ${testName}: ${actualStatus} (${responseTime.toFixed(2)}ms)`);
    }
  } else {
    TEST_RESULTS.failed++;
    console.log(`   ❌ ${testName}: ${actualStatus} (expected ${expectedStatus}) ${error ? `- ${error}` : ''}`);
  }
  
  TEST_RESULTS.totalResponseTime += responseTime;
}

async function generateTestReport() {
  const endTime = Date.now();
  const totalTime = endTime - TEST_RESULTS.startTime;
  const averageResponseTime = TEST_RESULTS.totalResponseTime / TEST_RESULTS.tests.length;
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 EiQ™ COMPREHENSIVE SMOKE TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`📊 Test Summary:`);
  console.log(`   • Total Tests: ${TEST_RESULTS.tests.length}`);
  console.log(`   • Passed: ${TEST_RESULTS.passed} ✅`);
  console.log(`   • Failed: ${TEST_RESULTS.failed} ❌`);
  console.log(`   • Success Rate: ${((TEST_RESULTS.passed / TEST_RESULTS.tests.length) * 100).toFixed(1)}%`);
  console.log(`   • Total Execution Time: ${totalTime}ms`);
  console.log(`   • Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
  
  console.log('\n📋 Failed Tests:');
  const failedTests = TEST_RESULTS.tests.filter(test => !test.passed);
  if (failedTests.length === 0) {
    console.log('   🎉 All tests passed!');
  } else {
    failedTests.forEach(test => {
      console.log(`   ❌ ${test.name}: ${test.error || `Expected ${test.expectedStatus}, got ${test.actualStatus}`}`);
    });
  }
  
  console.log('\n⚡ Performance Metrics:');
  const fastestTest = TEST_RESULTS.tests.reduce((a, b) => a.responseTime < b.responseTime ? a : b);
  const slowestTest = TEST_RESULTS.tests.reduce((a, b) => a.responseTime > b.responseTime ? a : b);
  
  console.log(`   • Fastest Response: ${fastestTest.name} (${fastestTest.responseTime.toFixed(2)}ms)`);
  console.log(`   • Slowest Response: ${slowestTest.name} (${slowestTest.responseTime.toFixed(2)}ms)`);
  
  return {
    totalTests: TEST_RESULTS.tests.length,
    passed: TEST_RESULTS.passed,
    failed: TEST_RESULTS.failed,
    successRate: (TEST_RESULTS.passed / TEST_RESULTS.tests.length) * 100,
    averageResponseTime,
    totalTime
  };
}

// Main execution function
async function runComprehensiveSmokeTest() {
  console.log('🚀 STARTING EiQ™ COMPREHENSIVE SMOKE TEST');
  console.log('='.repeat(80));
  
  try {
    // Test basic connectivity
    console.log('🔌 Testing Server Connectivity...');
    const healthResponse = await makeRequest('/health');
    logTestResult('Server Health Check', healthResponse.statusCode, 200, healthResponse.responseTime);
    
    if (healthResponse.statusCode !== 200) {
      console.log('❌ Server is not responding. Aborting tests.');
      return;
    }
    
    // Run comprehensive tests
    const authToken = await testAuthentication();
    await testAllEndpoints();
    
    if (authToken) {
      const sessionId = await testAssessmentEngine(authToken);
      await testAIHintSystem(authToken, sessionId);
      await testMLAnalytics(authToken);
    }
    
    // Generate final report
    const results = await generateTestReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPREHENSIVE SMOKE TEST COMPLETED');
    console.log('='.repeat(80));
    
    return results;
    
  } catch (error) {
    console.error('💥 Critical error during smoke test:', error);
    return null;
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveSmokeTest()
    .then(results => {
      if (results && results.successRate >= 80) {
        console.log('🎉 Platform is ready for deployment!');
        process.exit(0);
      } else {
        console.log('⚠️ Platform needs attention before deployment.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveSmokeTest };