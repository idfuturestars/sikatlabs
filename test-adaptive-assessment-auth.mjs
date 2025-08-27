#!/usr/bin/env node

/**
 * EIQ™ ADAPTIVE ASSESSMENT AUTHENTICATION TEST
 * =============================================
 * 
 * Comprehensive test suite for JWT authentication system
 * Tests the complete authentication flow for assessment system
 * 
 * Author: Chief Technical Architect
 * Date: August 11, 2025
 * Status: Authentication System Validation Ready
 */

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS = [];

// ANSI Colors for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(80)}`);
  console.log(`${title.toUpperCase()}`);
  console.log(`${'='.repeat(80)}${colors.reset}\n`);
}

function logResult(test, success, message, details = null) {
  const status = success ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
  log(`${status} ${test}: ${message}${colors.reset}`);
  if (details) {
    log(`   Details: ${JSON.stringify(details, null, 2)}`, 'yellow');
  }
  
  TEST_RESULTS.push({
    test,
    success,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      data: null
    };
  }
}

async function testRouteRegistration() {
  logSection('TESTING ROUTE REGISTRATION');
  
  // Test that API routes are properly registered (not returning HTML)
  const result = await makeRequest('/api/test-no-auth', {
    method: 'POST',
    body: JSON.stringify({ test: 'route-registration' })
  });
  
  const isHtml = typeof result.data === 'string' && result.data.includes('<!DOCTYPE html>');
  const success = result.status === 200 && !isHtml && result.data?.success === true;
  
  logResult(
    'Route Registration',
    success,
    success ? 'API routes properly registered' : 'API routes returning HTML or failing',
    { status: result.status, isHtml, responseType: typeof result.data }
  );
  
  return success;
}

async function testJWTAuthentication() {
  logSection('TESTING JWT AUTHENTICATION SYSTEM');
  
  // Step 1: Test login endpoint
  log('Step 1: Testing login endpoint...', 'blue');
  const loginResult = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@demo.com',
      password: 'test123'
    })
  });
  
  const loginSuccess = loginResult.status === 200 && loginResult.data?.token;
  logResult(
    'Login Endpoint',
    loginSuccess,
    loginSuccess ? 'Login successful, JWT token generated' : 'Login failed or no token',
    { status: loginResult.status, hasToken: !!loginResult.data?.token }
  );
  
  if (!loginSuccess) return false;
  
  const token = loginResult.data.token;
  log(`Generated Token: ${token.substring(0, 50)}...`, 'yellow');
  
  // Step 2: Test JWT authentication middleware
  log('Step 2: Testing JWT authentication middleware...', 'blue');
  const authResult = await makeRequest('/api/test-jwt-auth', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ test: 'jwt-middleware' })
  });
  
  const authSuccess = authResult.status === 200 && authResult.data?.userId;
  logResult(
    'JWT Middleware',
    authSuccess,
    authSuccess ? 'JWT authentication middleware working' : 'JWT authentication failed',
    { status: authResult.status, userId: authResult.data?.userId }
  );
  
  // Step 3: Test unauthenticated request
  log('Step 3: Testing unauthenticated request rejection...', 'blue');
  const unAuthResult = await makeRequest('/api/test-jwt-auth', {
    method: 'POST',
    body: JSON.stringify({ test: 'no-auth' })
  });
  
  const unAuthSuccess = unAuthResult.status === 401;
  logResult(
    'Authentication Rejection',
    unAuthSuccess,
    unAuthSuccess ? 'Properly rejects unauthenticated requests' : 'Failed to reject unauthenticated requests',
    { status: unAuthResult.status }
  );
  
  return loginSuccess && authSuccess && unAuthSuccess;
}

async function testAssessmentEndpoints() {
  logSection('TESTING ASSESSMENT SYSTEM ENDPOINTS');
  
  // First get authentication token
  const loginResult = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@demo.com',
      password: 'test123'
    })
  });
  
  if (loginResult.status !== 200 || !loginResult.data?.token) {
    logResult('Assessment Setup', false, 'Could not obtain authentication token');
    return false;
  }
  
  const token = loginResult.data.token;
  
  // Test assessment start endpoint
  log('Testing assessment start endpoint...', 'blue');
  const startResult = await makeRequest('/api/assessment/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sections: ['core_math', 'applied_reasoning', 'ai_conceptual']
    })
  });
  
  const startSuccess = startResult.status === 200 && startResult.data?.sessionId;
  logResult(
    'Assessment Start',
    startSuccess,
    startSuccess ? 'Assessment session started successfully' : 'Failed to start assessment session',
    { 
      status: startResult.status, 
      sessionId: startResult.data?.sessionId,
      userId: startResult.data?.userId
    }
  );
  
  return startSuccess;
}

async function generateTestReport() {
  logSection('GENERATING AUTHENTICATION TEST REPORT');
  
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = (passedTests / totalTests * 100).toFixed(2);
  
  const report = {
    testSuite: 'EIQ™ Authentication System Validation',
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${successRate}%`
    },
    results: TEST_RESULTS,
    conclusion: passedTests === totalTests ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
    nextSteps: passedTests === totalTests ? 
      'Authentication system ready for 426K user simulation' : 
      'Fix failed tests before proceeding with simulation'
  };
  
  // Save report to file
  fs.writeFileSync('auth-test-report.json', JSON.stringify(report, null, 2));
  
  log(`\n${colors.bold}AUTHENTICATION TEST REPORT SUMMARY:${colors.reset}`);
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${successRate}%`, successRate === '100.00' ? 'green' : 'yellow');
  log(`Status: ${report.conclusion}`, report.conclusion === 'ALL_TESTS_PASSED' ? 'green' : 'red');
  
  if (report.conclusion === 'ALL_TESTS_PASSED') {
    log(`\n${colors.bold}${colors.green}🎉 AUTHENTICATION SYSTEM FULLY OPERATIONAL!${colors.reset}`);
    log(`${colors.green}✅ Ready for 426K user simulation${colors.reset}`);
    log(`${colors.green}✅ JWT authentication working correctly${colors.reset}`);
    log(`${colors.green}✅ Assessment endpoints operational${colors.reset}`);
  } else {
    log(`\n${colors.bold}${colors.red}⚠️  AUTHENTICATION SYSTEM ISSUES DETECTED${colors.reset}`);
    log(`${colors.red}❌ Fix issues before proceeding with simulation${colors.reset}`);
  }
  
  log(`\nReport saved to: auth-test-report.json`, 'cyan');
  
  return report.conclusion === 'ALL_TESTS_PASSED';
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}`);
  console.log(`
  ███████╗██╗ ██████╗    ██████╗  ██████╗ ██╗    ██╗███████╗██████╗ ███████╗██████╗ 
  ██╔════╝██║██╔═══██╗   ██╔══██╗██╔═══██╗██║    ██║██╔════╝██╔══██╗██╔════╝██╔══██╗
  █████╗  ██║██║   ██║   ██████╔╝██║   ██║██║ █╗ ██║█████╗  ██████╔╝█████╗  ██║  ██║
  ██╔══╝  ██║██║▄▄ ██║   ██╔═══╝ ██║   ██║██║███╗██║██╔══╝  ██╔══██╗██╔══╝  ██║  ██║
  ███████╗██║╚██████╔╝   ██║     ╚██████╔╝╚███╔███╔╝███████╗██║  ██║███████╗██████╔╝
  ╚══════╝╚═╝ ╚══▀▀═╝    ╚═╝      ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝ 
                     BY SIKATLABS™ - AUTHENTICATION SYSTEM TEST
  `);
  console.log(`${colors.reset}`);
  
  log('Starting comprehensive authentication system test...', 'green');
  log(`Target URL: ${BASE_URL}`, 'cyan');
  log(`Test Suite: JWT Authentication & Assessment Endpoints`, 'cyan');
  log(`Date: ${new Date().toLocaleString()}`, 'cyan');
  
  try {
    // Run all tests
    const routeTest = await testRouteRegistration();
    const authTest = await testJWTAuthentication();
    const assessmentTest = await testAssessmentEndpoints();
    
    // Generate report
    const allTestsPassed = await generateTestReport();
    
    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    log(`\n${colors.red}CRITICAL ERROR during testing:${colors.reset}`);
    log(error.message, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Run the test suite
main().catch(console.error);