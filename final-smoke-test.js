#!/usr/bin/env node

/**
 * Final Smoke Test - Real World End-to-End Validation
 * EiQ™ Powered by SikatLabs™ Platform
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function runFinalSmokeTest() {
  console.log('🔥 Running Final Smoke Test - Real World Validation');
  
  const tests = [
    // Core Platform Health
    { name: 'Health Check', endpoint: '/health', expected: 200 },
    { name: 'Ready Check', endpoint: '/ready', expected: 200 },
    { name: 'Frontend Load', endpoint: '/', expected: 200 },
    
    // Authentication Endpoints
    { name: 'Auth User Endpoint', endpoint: '/api/auth/user', expected: 401 }, // Expected unauthorized
    { name: 'Login Endpoint', endpoint: '/api/login', expected: 302 }, // OAuth redirect
    
    // Assessment System
    { name: 'Assessment API', endpoint: '/api/assessments', expected: 401 }, // Requires auth
    { name: 'AI Tutor API', endpoint: '/api/ai/tutor', expected: 401 }, // Requires auth
    
    // Core Features
    { name: 'K12 Dashboard API', endpoint: '/api/k12/dashboard', expected: 401 }, // Requires auth
    { name: 'Higher Ed API', endpoint: '/api/higher-ed/dashboard', expected: 401 }, // Requires auth
    { name: 'Voice Assessment API', endpoint: '/api/voice/assessment', expected: 401 }, // Requires auth
    { name: 'Study Groups API', endpoint: '/api/study-groups', expected: 401 }, // Requires auth
  ];

  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: 'GET',
        timeout: 5000,
        redirect: 'manual' // Don't follow redirects
      });
      
      if (response.status === test.expected) {
        console.log(`✅ ${test.name}: PASS (${response.status})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAIL (got ${response.status}, expected ${test.expected})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR (${error.message})`);
      failed++;
    }
  }
  
  console.log('\n📊 Final Smoke Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - PLATFORM READY FOR DEPLOYMENT');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed - Review required before deployment');
    return false;
  }
}

runFinalSmokeTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Smoke test failed:', error);
  process.exit(1);
});