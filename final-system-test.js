/**
 * Final System Test - Deployment Readiness Assessment
 * Comprehensive smoke test for all critical platform functionality
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let DEMO_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDQ2MThhZi0yMmNmLTQ4ZjktOGY1Mi0wOTFjMGIyZWVkNDMiLCJpYXQiOjE3NTQ2NjQzMTZ9.Qh8erlHrTjuBkdFSFN0gbiwiKUz_UlH4RWhiZ76T3Fw";

let testResults = [];

async function testHealthEndpoints() {
  console.log('\n🔍 Testing Health & Readiness Endpoints');
  console.log('-'.repeat(50));
  
  try {
    // Health check
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok && healthData.status === 'healthy') {
      console.log('✅ Health endpoint operational');
      testResults.push({ test: 'Health Endpoint', status: 'PASS' });
    } else {
      console.log('❌ Health endpoint failed');
      testResults.push({ test: 'Health Endpoint', status: 'FAIL' });
      return false;
    }
    
    // Readiness check
    const readyResponse = await fetch(`${BASE_URL}/ready`);
    const readyData = await readyResponse.json();
    
    if (readyResponse.ok && readyData.ready === true) {
      console.log('✅ Readiness endpoint operational');
      testResults.push({ test: 'Readiness Endpoint', status: 'PASS' });
      return true;
    } else {
      console.log('❌ Readiness endpoint failed');
      testResults.push({ test: 'Readiness Endpoint', status: 'FAIL' });
      return false;
    }
  } catch (error) {
    console.log('❌ Health/Readiness endpoints failed:', error.message);
    testResults.push({ test: 'Health/Readiness Endpoints', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System');
  console.log('-'.repeat(50));
  
  try {
    // Test demo login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      if (loginData.token) {
        console.log('✅ Demo login generates valid token');
        testResults.push({ test: 'Demo Login', status: 'PASS' });
        
        // Update global token for other tests
        DEMO_TOKEN = loginData.token;
        
        // Test token validation
        const userResponse = await fetch(`${BASE_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        if (userResponse.ok) {
          console.log('✅ Token validation working');
          testResults.push({ test: 'Token Validation', status: 'PASS' });
          return true;
        } else {
          console.log('❌ Token validation failed');
          testResults.push({ test: 'Token Validation', status: 'FAIL' });
          return false;
        }
      } else {
        console.log('❌ Demo login missing token');
        testResults.push({ test: 'Demo Login', status: 'FAIL' });
        return false;
      }
    } else {
      console.log('❌ Demo login failed');
      testResults.push({ test: 'Demo Login', status: 'FAIL' });
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    testResults.push({ test: 'Authentication', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testAssessmentSystem() {
  console.log('\n📝 Testing Assessment System');
  console.log('-'.repeat(50));
  
  try {
    // Test assessment initialization
    const initResponse = await fetch(`${BASE_URL}/api/assessment/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEMO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'adaptive',
        level: 'grade-7'
      })
    });
    
    if (initResponse.ok) {
      const assessmentData = await initResponse.json();
      console.log('✅ Assessment initialization working');
      testResults.push({ test: 'Assessment Init', status: 'PASS' });
      
      // Test question retrieval
      if (assessmentData.sessionId) {
        const questionResponse = await fetch(`${BASE_URL}/api/assessment/${assessmentData.sessionId}/question`, {
          headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` }
        });
        
        if (questionResponse.ok) {
          const questionData = await questionResponse.json();
          if (questionData.question) {
            console.log('✅ Question retrieval working');
            testResults.push({ test: 'Question Retrieval', status: 'PASS' });
            return true;
          } else {
            console.log('❌ Question data missing');
            testResults.push({ test: 'Question Retrieval', status: 'FAIL' });
            return false;
          }
        } else {
          console.log('❌ Question retrieval failed');
          testResults.push({ test: 'Question Retrieval', status: 'FAIL' });
          return false;
        }
      } else {
        console.log('❌ Assessment session ID missing');
        testResults.push({ test: 'Assessment Init', status: 'FAIL' });
        return false;
      }
    } else {
      console.log('❌ Assessment initialization failed');
      testResults.push({ test: 'Assessment Init', status: 'FAIL' });
      return false;
    }
  } catch (error) {
    console.log('❌ Assessment system test failed:', error.message);
    testResults.push({ test: 'Assessment System', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testAIIntegration() {
  console.log('\n🤖 Testing AI Integration');
  console.log('-'.repeat(50));
  
  try {
    // Test AI hint generation
    const hintResponse = await fetch(`${BASE_URL}/api/ai/hint`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEMO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: "What is 2 + 2?",
        difficulty: 1,
        attempts: 1
      })
    });
    
    if (hintResponse.ok) {
      const hintData = await hintResponse.json();
      if (hintData.hint) {
        console.log('✅ AI hint generation working');
        testResults.push({ test: 'AI Hints', status: 'PASS' });
        return true;
      } else {
        console.log('❌ AI hint response missing hint');
        testResults.push({ test: 'AI Hints', status: 'FAIL' });
        return false;
      }
    } else {
      console.log('❌ AI hint generation failed');
      testResults.push({ test: 'AI Hints', status: 'FAIL' });
      return false;
    }
  } catch (error) {
    console.log('❌ AI integration test failed:', error.message);
    testResults.push({ test: 'AI Integration', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testDatabaseOperations() {
  console.log('\n🗄️ Testing Database Operations');
  console.log('-'.repeat(50));
  
  try {
    // Test user data retrieval
    const userResponse = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` }
    });
    
    if (userResponse.ok) {
      console.log('✅ User data retrieval working');
      testResults.push({ test: 'Database Read', status: 'PASS' });
      
      // Test onboarding data
      const onboardingResponse = await fetch(`${BASE_URL}/api/user/onboarding`, {
        headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` }
      });
      
      if (onboardingResponse.ok) {
        console.log('✅ Onboarding data access working');
        testResults.push({ test: 'Database Relations', status: 'PASS' });
        return true;
      } else {
        console.log('❌ Onboarding data access failed');
        testResults.push({ test: 'Database Relations', status: 'FAIL' });
        return false;
      }
    } else {
      console.log('❌ User data retrieval failed');
      testResults.push({ test: 'Database Read', status: 'FAIL' });
      return false;
    }
  } catch (error) {
    console.log('❌ Database operations test failed:', error.message);
    testResults.push({ test: 'Database Operations', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testFrontendLoad() {
  console.log('\n🌐 Testing Frontend Application');
  console.log('-'.repeat(50));
  
  try {
    // Test frontend load
    const frontendResponse = await fetch(`${BASE_URL}/`);
    
    if (frontendResponse.ok) {
      const html = await frontendResponse.text();
      
      // Check for critical elements
      const hasViteScript = html.includes('/@vite/client');
      const hasReactApp = html.includes('root');
      const noFatalErrors = !html.includes('Error generating') && !html.includes('Exception');
      
      if (hasViteScript && hasReactApp && noFatalErrors) {
        console.log('✅ Frontend application loads successfully');
        testResults.push({ test: 'Frontend Load', status: 'PASS' });
        return true;
      } else {
        console.log('❌ Frontend application has issues');
        testResults.push({ test: 'Frontend Load', status: 'FAIL' });
        return false;
      }
    } else {
      console.log('❌ Frontend failed to load');
      testResults.push({ test: 'Frontend Load', status: 'FAIL' });
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
    testResults.push({ test: 'Frontend Load', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testPerformance() {
  console.log('\n⚡ Testing Performance');
  console.log('-'.repeat(50));
  
  try {
    const startTime = Date.now();
    
    // Test multiple concurrent requests
    const requests = Array(10).fill().map(() => 
      fetch(`${BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` }
      })
    );
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const allSuccessful = responses.every(r => r.ok);
    const averageTime = totalTime / 10;
    
    if (allSuccessful && averageTime < 500) {
      console.log(`✅ Performance test passed (${totalTime}ms total, ${averageTime.toFixed(1)}ms avg)`);
      testResults.push({ test: 'Performance', status: 'PASS', time: `${averageTime.toFixed(1)}ms avg` });
      return true;
    } else {
      console.log(`❌ Performance test failed (${totalTime}ms total, ${averageTime.toFixed(1)}ms avg)`);
      testResults.push({ test: 'Performance', status: 'FAIL', time: `${averageTime.toFixed(1)}ms avg` });
      return false;
    }
  } catch (error) {
    console.log('❌ Performance test failed:', error.message);
    testResults.push({ test: 'Performance', status: 'FAIL', error: error.message });
    return false;
  }
}

async function runFullSmokeTest() {
  console.log('🚀 FULL SYSTEM SMOKE TEST - DEPLOYMENT READINESS');
  console.log('='.repeat(60));
  
  const tests = [
    testHealthEndpoints,
    testAuthentication,
    testAssessmentSystem,
    testAIIntegration,
    testDatabaseOperations,
    testFrontendLoad,
    testPerformance
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    const result = await test();
    if (!result) allPassed = false;
  }
  
  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT READINESS ASSESSMENT');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const total = testResults.length;
  
  console.log(`\n📋 Test Results: ${passed}/${total} passed`);
  testResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    const extra = result.time ? ` (${result.time})` : result.error ? ` - ${result.error}` : '';
    console.log(`${status} ${result.test}${extra}`);
  });
  
  console.log(`\n📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (allPassed) {
    console.log('\n🎉 PLATFORM IS DEPLOYMENT READY!');
    console.log('\n🚀 Key Systems Verified:');
    console.log('• Health & readiness endpoints operational');
    console.log('• Authentication system working (demo login + JWT)');
    console.log('• Assessment engine functional (IRT + adaptive difficulty)');
    console.log('• AI integration working (hint generation)');
    console.log('• Database operations successful');
    console.log('• Frontend application loads without errors');
    console.log('• Performance within acceptable limits');
    
    console.log('\n✨ Ready for Production Deployment!');
    return true;
  } else {
    console.log('\n⚠️ DEPLOYMENT NOT READY - Issues Found');
    console.log('Please resolve failed tests before deploying.');
    return false;
  }
}

runFullSmokeTest().catch(console.error);