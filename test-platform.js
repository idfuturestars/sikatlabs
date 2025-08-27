#!/usr/bin/env node
/**
 * EiQ™ powered by SikatLabs™ - Comprehensive Platform Test Suite
 * Tests all features with detailed logging and error reporting
 */

const API_BASE = 'http://localhost:5000';
let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

const log = (category, message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] [${category.toUpperCase()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const apiCall = async (method, endpoint, data = null, includeAuth = true) => {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(includeAuth && authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  log('API_CALL', `${method} ${endpoint}`, data);
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.text();
    
    let jsonData;
    try {
      jsonData = JSON.parse(responseData);
    } catch {
      jsonData = { raw: responseData };
    }
    
    log('API_RESPONSE', `${response.status} ${response.statusText}`, {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: jsonData
    });
    
    return { status: response.status, data: jsonData, ok: response.ok };
  } catch (error) {
    log('API_ERROR', `Failed to call ${method} ${endpoint}`, {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const testStep = async (testName, testFunction) => {
  log('TEST_START', `Starting: ${testName}`);
  try {
    await testFunction();
    testResults.passed++;
    log('TEST_PASS', `✓ ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log('TEST_FAIL', `✗ ${testName}`, {
      error: error.message,
      stack: error.stack
    });
  }
};

const runTests = async () => {
  log('SYSTEM', 'Starting EiQ™ Platform Comprehensive Test Suite');
  
  // Test 1: Health Check
  await testStep('Platform Health Check', async () => {
    const response = await apiCall('GET', '/api/health', null, false);
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }
  });

  // Test 2: User Registration
  await testStep('User Registration', async () => {
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const response = await apiCall('POST', '/api/auth/register', testUser, false);
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.data.error || response.status}`);
    }
    
    if (!response.data.token) {
      throw new Error('No token returned from registration');
    }
    
    authToken = response.data.token;
    log('AUTH', 'Registration successful, token obtained');
  });

  // Test 3: Authentication Check
  await testStep('Authentication Check', async () => {
    const response = await apiCall('GET', '/api/auth/me');
    if (!response.ok) {
      throw new Error(`Auth check failed: ${response.data.error || response.status}`);
    }
    
    if (!response.data.id) {
      throw new Error('No user data returned from auth check');
    }
    
    log('AUTH', 'Authentication verified', { userId: response.data.id });
  });

  // Test 4: Multi-Provider AI System
  await testStep('AI Provider - Anthropic', async () => {
    const response = await apiCall('POST', '/api/ai/test', {
      message: 'Test multi-provider AI system',
      provider: 'anthropic'
    }, false);
    
    if (!response.ok) {
      throw new Error(`Anthropic AI test failed: ${response.data.error || response.status}`);
    }
  });

  await testStep('AI Provider - Gemini', async () => {
    const response = await apiCall('POST', '/api/ai/test', {
      message: 'Test Gemini AI capabilities',
      provider: 'gemini'
    }, false);
    
    if (!response.ok) {
      throw new Error(`Gemini AI test failed: ${response.data.error || response.status}`);
    }
  });

  // Test 5: Skill Recommendations Engine
  await testStep('Skill Recommendations Engine', async () => {
    const response = await apiCall('GET', '/api/skill-recommendations/demo', null, false);
    if (!response.ok) {
      throw new Error(`Skill recommendations failed: ${response.data.error || response.status}`);
    }
    
    if (!response.data.recommendations || response.data.recommendations.length === 0) {
      throw new Error('No skill recommendations returned');
    }
    
    log('SKILL_REC', 'Skill recommendations generated', {
      count: response.data.recommendations.length
    });
  });

  // Test 6: User Onboarding
  await testStep('User Onboarding', async () => {
    const onboardingData = {
      educationLevel: 'high_school',
      learningStyle: 'visual',
      timeCommitment: 30,
      interests: ['technology', 'science'],
      isK12: true
    };
    
    const response = await apiCall('POST', '/api/user/onboarding', onboardingData);
    if (!response.ok) {
      throw new Error(`Onboarding failed: ${response.data.error || response.status}`);
    }
    
    log('ONBOARDING', 'User onboarding completed', onboardingData);
  });

  // Test 7: Assessment System
  await testStep('Assessment Creation', async () => {
    const assessmentData = {
      type: 'adaptive',
      title: 'Test Assessment',
      description: 'Automated test assessment',
      difficulty: 'intermediate',
      estimatedDuration: 30
    };
    
    const response = await apiCall('POST', '/api/assessments', assessmentData);
    if (!response.ok) {
      throw new Error(`Assessment creation failed: ${response.data.error || response.status}`);
    }
    
    log('ASSESSMENT', 'Assessment created successfully', { id: response.data.id });
  });

  // Test 8: AI Chat System
  await testStep('AI Chat System', async () => {
    const chatData = {
      message: 'Hello, I need help with learning programming',
      provider: 'gemini'
    };
    
    const response = await apiCall('POST', '/api/ai/chat', chatData);
    if (!response.ok) {
      throw new Error(`AI chat failed: ${response.data.error || response.status}`);
    }
    
    if (!response.data.response) {
      throw new Error('No AI response received');
    }
    
    log('AI_CHAT', 'AI chat response received', {
      responseLength: response.data.response.length
    });
  });

  // Test 9: Learning Pathways
  await testStep('Learning Pathways', async () => {
    const pathwayData = {
      title: 'Test Programming Pathway',
      description: 'Learn programming fundamentals',
      difficulty: 'beginner',
      estimatedDuration: 60,
      prerequisites: []
    };
    
    const response = await apiCall('POST', '/api/learning-pathways', pathwayData);
    if (!response.ok) {
      throw new Error(`Learning pathway creation failed: ${response.data.error || response.status}`);
    }
    
    log('PATHWAY', 'Learning pathway created', { id: response.data.id });
  });

  // Test 10: OAuth Configuration (Admin)
  await testStep('OAuth Configuration Check', async () => {
    const response = await apiCall('GET', '/api/admin/oauth/status');
    // This might fail if user isn't admin, which is fine
    log('OAUTH', 'OAuth status checked', {
      status: response.status,
      hasGoogleConfig: response.data?.google || false
    });
  });

  // Test Results Summary
  log('TEST_SUMMARY', 'All tests completed', {
    passed: testResults.passed,
    failed: testResults.failed,
    total: testResults.passed + testResults.failed,
    errors: testResults.errors
  });

  if (testResults.failed > 0) {
    log('ERROR_SUMMARY', 'Failed tests details');
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.test}`);
      console.log(`   Error: ${error.error}`);
    });
  }

  return testResults;
};

// Run the tests
runTests().catch(error => {
  log('FATAL_ERROR', 'Test suite crashed', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});