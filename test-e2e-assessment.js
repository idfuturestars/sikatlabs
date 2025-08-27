/**
 * Comprehensive End-to-End Assessment Testing
 * Tests the complete IRT-based adaptive assessment flow
 */

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const testUsers = [
  { username: 'admin', password: 'password123' },
  { username: 'testuser', password: 'testpass' }
];

let authToken = null;
let currentSessionId = null;

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok && response.status !== 401) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response;
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test login with first available user
    for (const user of testUsers) {
      try {
        const response = await makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(user)
        });
        
        if (response.ok) {
          const data = await response.json();
          authToken = data.token;
          console.log(`✅ Successfully authenticated as: ${user.username}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Failed to authenticate as ${user.username}: ${error.message}`);
      }
    }
    
    // If no existing users work, try to register a test user
    try {
      const newUser = { username: 'e2etest', password: 'testpass123', email: 'test@example.com' };
      const registerResponse = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      
      if (registerResponse.ok) {
        const loginResponse = await makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: newUser.username, password: newUser.password })
        });
        
        if (loginResponse.ok) {
          const data = await loginResponse.json();
          authToken = data.token;
          console.log(`✅ Created and authenticated new test user: ${newUser.username}`);
          return true;
        }
      }
    } catch (error) {
      console.log(`❌ Failed to create test user: ${error.message}`);
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
    return false;
  }
}

async function testAssessmentStartSession() {
  console.log('\n🎯 Testing Assessment Session Start...');
  
  try {
    const response = await makeRequest('/api/assessment/start-session', {
      method: 'POST',
      body: JSON.stringify({
        sections: ['core_math', 'applied_reasoning', 'ai_conceptual']
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      currentSessionId = data.sessionId;
      console.log(`✅ Assessment session started: ${currentSessionId}`);
      console.log(`   Initial theta: ${data.currentTheta || 'N/A'}`);
      console.log(`   Session type: ${data.sessionType || 'adaptive'}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Failed to start session: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Session start test failed: ${error.message}`);
    return false;
  }
}

async function testAdaptiveQuestioning() {
  console.log('\n❓ Testing Adaptive Question Selection...');
  
  try {
    const sections = ['core_math', 'applied_reasoning', 'ai_conceptual'];
    const responses = [];
    
    for (const section of sections) {
      console.log(`\n  Testing section: ${section}`);
      
      // Get initial question for section
      const questionResponse = await makeRequest(`/api/assessment/next-question/${currentSessionId}/${section}`);
      
      if (questionResponse.ok) {
        const questionData = await questionResponse.json();
        console.log(`  ✅ Retrieved question: ${questionData.question?.id || 'N/A'}`);
        console.log(`     Difficulty: ${questionData.question?.irtParams?.difficulty || 'N/A'}`);
        console.log(`     Type: ${questionData.question?.type || 'N/A'}`);
        
        if (questionData.question) {
          // Simulate answering the question
          const simulatedAnswer = questionData.question.correctAnswer || 'A';
          const responseTime = Math.floor(Math.random() * 30000) + 10000; // 10-40 seconds
          
          const processResponse = await makeRequest('/api/assessment/process-response', {
            method: 'POST',
            body: JSON.stringify({
              sessionId: currentSessionId,
              questionId: questionData.question.id,
              userAnswer: simulatedAnswer,
              responseTime: responseTime,
              hintUsed: false
            })
          });
          
          if (processResponse.ok) {
            const result = await processResponse.json();
            console.log(`  ✅ Response processed - New theta: ${result.newTheta?.toFixed(3) || 'N/A'}`);
            console.log(`     Confidence: ${result.confidence?.toFixed(3) || 'N/A'}`);
            console.log(`     Adaptation signal: ${result.adaptationSignal || 'N/A'}`);
            responses.push(result);
          } else {
            console.log(`  ❌ Failed to process response: ${await processResponse.text()}`);
          }
        }
      } else {
        console.log(`  ❌ Failed to get question: ${await questionResponse.text()}`);
      }
    }
    
    return responses.length > 0;
  } catch (error) {
    console.log(`❌ Adaptive questioning test failed: ${error.message}`);
    return false;
  }
}

async function testAIHintSystem() {
  console.log('\n💡 Testing AI Hint System...');
  
  try {
    // First get a question
    const questionResponse = await makeRequest(`/api/assessment/next-question/${currentSessionId}/core_math`);
    
    if (questionResponse.ok) {
      const questionData = await questionResponse.json();
      
      if (questionData.question) {
        // Request a hint for an incorrect answer
        const hintResponse = await makeRequest('/api/assessment/generate-hint', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: currentSessionId,
            questionId: questionData.question.id,
            userAnswer: 'wrong_answer',
            attemptCount: 2,
            timeSpent: 45000,
            userTheta: 0.5,
            previousIncorrectAnswers: ['another_wrong_answer']
          })
        });
        
        if (hintResponse.ok) {
          const hintData = await hintResponse.json();
          console.log(`✅ AI hint generated successfully`);
          console.log(`   Content: ${hintData.hint?.content || 'N/A'}`);
          console.log(`   Type: ${hintData.hint?.hintType || 'N/A'}`);
          console.log(`   Confidence: ${hintData.hint?.confidence || 'N/A'}`);
          return true;
        } else {
          console.log(`❌ Failed to generate hint: ${await hintResponse.text()}`);
          return false;
        }
      }
    }
    
    console.log(`❌ Could not get question for hint testing`);
    return false;
  } catch (error) {
    console.log(`❌ AI hint test failed: ${error.message}`);
    return false;
  }
}

async function testAssessmentResults() {
  console.log('\n📊 Testing Assessment Results...');
  
  try {
    const response = await makeRequest(`/api/assessment/results/${currentSessionId}`);
    
    if (response.ok) {
      const results = await response.json();
      console.log(`✅ Assessment results retrieved successfully`);
      console.log(`   Overall Score: ${results.overallScore || 'N/A'}%`);
      console.log(`   EiQ Score: ${results.eiqScore || 'N/A'}`);
      console.log(`   Placement Level: ${results.placementLevel || 'N/A'}`);
      console.log(`   Questions Asked: ${results.totalQuestions || 'N/A'}`);
      console.log(`   Current Theta: ${results.currentTheta?.toFixed(3) || 'N/A'}`);
      console.log(`   Confidence Level: ${results.confidenceLevel?.toFixed(3) || 'N/A'}`);
      return true;
    } else {
      console.log(`❌ Failed to get results: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Assessment results test failed: ${error.message}`);
    return false;
  }
}

async function testSimulationFramework() {
  console.log('\n🧪 Testing Simulation Framework...');
  
  try {
    // Check simulation status first
    const statusResponse = await makeRequest('/api/assessment/simulation-status');
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log(`✅ Simulation framework accessible`);
      console.log(`   Status: ${status.status || 'N/A'}`);
      console.log(`   Total Simulations: ${status.totalSimulations || 0}`);
      
      if (status.validationMetrics) {
        console.log(`   Mean Absolute Error: ${status.validationMetrics.meanAbsoluteError?.toFixed(4) || 'N/A'}`);
        console.log(`   Convergence Rate: ${(status.validationMetrics.convergenceRate * 100)?.toFixed(1) || 'N/A'}%`);
        console.log(`   Algorithm Stability: ${(status.validationMetrics.algorithmStability * 100)?.toFixed(1) || 'N/A'}%`);
      }
      
      return true;
    } else {
      console.log(`❌ Failed to check simulation status: ${await statusResponse.text()}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Simulation framework test failed: ${error.message}`);
    return false;
  }
}

async function testAssessmentAPIs() {
  console.log('\n🔌 Testing Additional Assessment APIs...');
  
  try {
    let passed = 0;
    let total = 0;
    
    // Test AI Immersion endpoint
    total++;
    try {
      const immersionResponse = await makeRequest('/api/assessment/ai-immersion/core_math');
      if (immersionResponse.status === 200 || immersionResponse.status === 304) {
        console.log(`✅ AI Immersion endpoint accessible`);
        passed++;
      } else {
        console.log(`❌ AI Immersion endpoint failed: ${immersionResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ AI Immersion endpoint error: ${error.message}`);
    }
    
    // Test competencies endpoint
    total++;
    try {
      const competenciesResponse = await makeRequest('/api/assessment/competencies');
      if (competenciesResponse.status === 200 || competenciesResponse.status === 304) {
        console.log(`✅ Competencies endpoint accessible`);
        passed++;
      } else {
        console.log(`❌ Competencies endpoint failed: ${competenciesResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Competencies endpoint error: ${error.message}`);
    }
    
    return passed === total;
  } catch (error) {
    console.log(`❌ API testing failed: ${error.message}`);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 EiQ™ COMPREHENSIVE ASSESSMENT TESTING');
  console.log('=' .repeat(60));
  
  const testResults = {
    authentication: false,
    sessionStart: false,
    adaptiveQuestioning: false,
    aiHints: false,
    assessmentResults: false,
    simulationFramework: false,
    additionalAPIs: false
  };
  
  // Run all tests
  testResults.authentication = await testAuthentication();
  
  if (testResults.authentication) {
    testResults.sessionStart = await testAssessmentStartSession();
    
    if (testResults.sessionStart) {
      testResults.adaptiveQuestioning = await testAdaptiveQuestioning();
      testResults.aiHints = await testAIHintSystem();
      testResults.assessmentResults = await testAssessmentResults();
    }
    
    testResults.simulationFramework = await testSimulationFramework();
    testResults.additionalAPIs = await testAssessmentAPIs();
  }
  
  // Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passedTests = Object.values(testResults).filter(result => result).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${icon} ${testName}`);
  });
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Assessment system is fully operational!');
  } else if (passedTests >= totalTests * 0.7) {
    console.log('⚠️  Most tests passed - System is functional with minor issues');
  } else {
    console.log('❌ Multiple test failures - System requires attention');
  }
  
  console.log('=' .repeat(60));
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests,
    results: testResults
  };
}

// Run tests
runComprehensiveTest().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});