#!/usr/bin/env node
/**
 * Advanced AI/ML Behavioral Learning System Integration Test
 * Tests creative AI assessment approaches to improve human IQ scores
 * 
 * Features tested:
 * 1. Behavioral learning from user responses
 * 2. Behavior-adapted question generation
 * 3. EIQ growth predictions
 * 4. Personalized hint generation
 * 5. Progressive improvement tracking
 */

import fs from 'fs';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_USER = {
  username: 'behavioral_test_user_' + Date.now(),
  password: 'SecurePassword123!',
  email: `behavioral_test_${Date.now()}@test.com`,
  firstName: 'Behavioral',
  lastName: 'Tester'
};

const testResults = {
  timestamp: new Date().toISOString(),
  testsRun: 0,
  testsPassed: 0,
  testsFailed: 0,
  errors: [],
  details: []
};

// Utility functions
async function makeRequest(url, method = 'GET', body = null, headers = {}) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

function logTest(name, status, details = '') {
  testResults.testsRun++;
  if (status === 'PASS') {
    testResults.testsPassed++;
    console.log(`✅ ${name}: PASSED ${details}`);
  } else {
    testResults.testsFailed++;
    console.log(`❌ ${name}: FAILED ${details}`);
    testResults.errors.push(`${name}: ${details}`);
  }
  testResults.details.push({ name, status, details });
}

// Test functions
async function testBehavioralLearningFromResponse(authToken) {
  console.log('\n🧠 Testing Behavioral Learning from User Response...');
  
  const testData = {
    questionId: 'test_q_001',
    domain: 'mathematical_reasoning',
    difficulty: 3,
    isCorrect: true,
    responseTime: 45000,
    confidenceLevel: 0.8,
    hintUsed: false,
    hintEffectiveness: null,
    sessionContext: {
      assessmentType: 'baseline',
      section: 'cognitive_math',
      currentScore: 750
    }
  };

  const response = await makeRequest(
    `${BASE_URL}/api/behavioral-learning/learn-response`,
    'POST',
    testData,
    { Authorization: `Bearer ${authToken}` }
  );

  if (response.success && response.data.success) {
    logTest('Behavioral Learning - Learn from Response', 'PASS', `Response processed: ${response.data.message}`);
    return true;
  } else {
    logTest('Behavioral Learning - Learn from Response', 'FAIL', `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

async function testBehaviorAdaptedQuestionGeneration(authToken) {
  console.log('\n🎯 Testing Behavior-Adapted Question Generation...');
  
  const testData = {
    targetDomain: 'verbal_comprehension'
  };

  const response = await makeRequest(
    `${BASE_URL}/api/behavioral-learning/adaptive-question`,
    'POST',
    testData,
    { Authorization: `Bearer ${authToken}` }
  );

  if (response.success && response.data.success && response.data.question) {
    logTest('Behavioral Learning - Adaptive Question Generation', 'PASS', `Generated question type: ${response.data.question.type || 'custom'}`);
    return true;
  } else {
    logTest('Behavioral Learning - Adaptive Question Generation', 'FAIL', `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

async function testEIQGrowthPrediction(authToken) {
  console.log('\n📈 Testing EIQ Growth Prediction...');
  
  const response = await makeRequest(
    `${BASE_URL}/api/behavioral-learning/eiq-prediction`,
    'GET',
    null,
    { Authorization: `Bearer ${authToken}` }
  );

  if (response.success && response.data.success && response.data.prediction) {
    logTest('Behavioral Learning - EIQ Growth Prediction', 'PASS', `Prediction generated with accuracy: ${response.data.prediction.confidenceLevel || 'N/A'}`);
    return true;
  } else {
    logTest('Behavioral Learning - EIQ Growth Prediction', 'FAIL', `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

async function testPersonalizedHints(authToken) {
  console.log('\n💡 Testing Personalized Hints Generation...');
  
  const testData = {
    questionId: 'test_q_002',
    context: {
      currentDifficulty: 4,
      domain: 'spatial_reasoning',
      previousAttempts: 1,
      strugglingConcepts: ['rotation', '3d_visualization']
    }
  };

  const response = await makeRequest(
    `${BASE_URL}/api/behavioral-learning/personalized-hints`,
    'POST',
    testData,
    { Authorization: `Bearer ${authToken}` }
  );

  if (response.success && response.data.success && response.data.hints) {
    logTest('Behavioral Learning - Personalized Hints', 'PASS', `Generated ${Array.isArray(response.data.hints) ? response.data.hints.length : 1} personalized hints`);
    return true;
  } else {
    logTest('Behavioral Learning - Personalized Hints', 'FAIL', `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

async function testBehavioralInsights(authToken) {
  console.log('\n🔍 Testing Behavioral Insights...');
  
  const response = await makeRequest(
    `${BASE_URL}/api/behavioral-learning/behavioral-insights`,
    'GET',
    null,
    { Authorization: `Bearer ${authToken}` }
  );

  if (response.success && response.data.success && response.data.insights) {
    const insights = response.data.insights;
    logTest('Behavioral Learning - Behavioral Insights', 'PASS', 
      `Learning style: ${insights.learningStyle}, Progress rate: ${insights.progressionRate}`);
    return true;
  } else {
    logTest('Behavioral Learning - Behavioral Insights', 'FAIL', `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Main test execution
async function runAdvancedAIBehavioralTests() {
  console.log('🚀 Starting Advanced AI/ML Behavioral Learning System Tests...\n');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.username}`);
  console.log(`Test Started: ${new Date().toISOString()}\n`);

  let authToken = null;

  try {
    // Step 1: Register test user
    console.log('👤 Registering test user...');
    const registerResponse = await makeRequest(`${BASE_URL}/api/register`, 'POST', TEST_USER);
    
    if (!registerResponse.success) {
      console.log('⚠️ User registration failed, trying to login with existing user...');
      const loginResponse = await makeRequest(`${BASE_URL}/api/login`, 'POST', {
        username: TEST_USER.username,
        password: TEST_USER.password
      });
      
      if (loginResponse.success && loginResponse.data.token) {
        authToken = loginResponse.data.token;
        logTest('User Authentication - Login', 'PASS', 'Logged in with existing user');
      } else {
        logTest('User Authentication - Login', 'FAIL', 'Failed to authenticate user');
        return;
      }
    } else {
      authToken = registerResponse.data.token;
      logTest('User Authentication - Registration', 'PASS', 'New user registered successfully');
    }

    // Step 2: Test behavioral learning features
    if (authToken) {
      await testBehavioralLearningFromResponse(authToken);
      await testBehaviorAdaptedQuestionGeneration(authToken);
      await testEIQGrowthPrediction(authToken);
      await testPersonalizedHints(authToken);
      await testBehavioralInsights(authToken);
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.errors.push(`Test execution error: ${error.message}`);
  }

  // Generate test report
  console.log('\n' + '='.repeat(60));
  console.log('🎯 ADVANCED AI/ML BEHAVIORAL LEARNING TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Tests Run: ${testResults.testsRun}`);
  console.log(`Tests Passed: ${testResults.testsPassed} ✅`);
  console.log(`Tests Failed: ${testResults.testsFailed} ❌`);
  console.log(`Success Rate: ${((testResults.testsPassed / testResults.testsRun) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach(error => console.log(`  • ${error}`));
  }

  // Save detailed results
  const reportFile = `behavioral-learning-test-results-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportFile}`);

  // Overall status
  const overallStatus = testResults.testsFailed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS';
  console.log(`\n🏁 OVERALL STATUS: ${overallStatus}`);
  
  return overallStatus === 'SUCCESS';
}

// Execute tests
runAdvancedAIBehavioralTests()
  .then(success => {
    console.log(`\n🔚 Test execution completed. Success: ${success}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Fatal test error:', error);
    process.exit(1);
  });