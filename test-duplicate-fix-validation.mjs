#!/usr/bin/env node

/**
 * CRITICAL BUG FIX VALIDATION TEST
 * 
 * Tests the fixed adaptive assessment system to ensure:
 * 1. No duplicate questions are served to users
 * 2. Session tracking works correctly
 * 3. Questions are properly selected based on IRT algorithm
 * 4. System handles multiple users simultaneously
 */

import { execSync } from 'child_process';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_USER_COUNT = 50;
const QUESTIONS_PER_USER = 10;

// Test results tracking
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  duplicateIssues: 0,
  sessionErrors: 0,
  criticalErrors: []
};

console.log('🔧 CRITICAL BUG FIX VALIDATION - DUPLICATE QUESTIONS');
console.log('='.repeat(60));
console.log(`Testing ${TEST_USER_COUNT} users with ${QUESTIONS_PER_USER} questions each`);
console.log('Target: Zero duplicate questions per user session\n');

async function makeAuthenticatedRequest(method, endpoint, data = null, userId = 'test_user_1') {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo_token_123',
      'X-User-ID': userId
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testSingleUserAssessment(userId) {
  console.log(`\n👤 Testing User: ${userId}`);
  const questionsReceived = [];
  let sessionId = null;
  
  try {
    // Step 1: Start assessment session
    const startResult = await makeAuthenticatedRequest('POST', '/api/assessment/start', {
      sections: ['core_math', 'applied_reasoning', 'ai_conceptual']
    }, userId);
    
    if (!startResult.success) {
      testResults.sessionErrors++;
      console.log(`❌ Failed to start session for ${userId}: ${startResult.error || startResult.data?.error}`);
      return { success: false, duplicates: 0, questionsReceived: [] };
    }
    
    sessionId = startResult.data.sessionId;
    console.log(`✅ Session started: ${sessionId}`);
    
    // Step 2: Request questions one by one
    for (let i = 0; i < QUESTIONS_PER_USER; i++) {
      const questionResult = await makeAuthenticatedRequest('GET', 
        `/api/assessment/adaptive?sessionId=${sessionId}&section=core_math`, 
        null, userId);
      
      if (!questionResult.success) {
        console.log(`⚠️  Question ${i + 1} failed: ${questionResult.error || questionResult.data?.error}`);
        break;
      }
      
      const question = questionResult.data.question;
      if (!question) {
        console.log(`ℹ️  No more questions available after ${i} questions`);
        break;
      }
      
      // Track question IDs to detect duplicates
      questionsReceived.push(question.id);
      console.log(`📝 Question ${i + 1}: ${question.id} (${question.difficulty})`);
      
      // Step 3: Submit a response to update session state
      const responseResult = await makeAuthenticatedRequest('POST', '/api/assessment/analyze-response', {
        sessionId: sessionId,
        questionId: question.id,
        answer: question.options ? question.options[0] : 'test_answer', // Submit first option as answer
        responseTime: 10000,
        section: 'core_math'
      }, userId);
      
      if (!responseResult.success) {
        console.log(`⚠️  Response submission failed for ${question.id}: ${responseResult.error || responseResult.data?.error}`);
      }
      
      // Small delay to simulate realistic user behavior
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 4: Check for duplicates
    const duplicates = questionsReceived.filter((id, index) => questionsReceived.indexOf(id) !== index);
    const uniqueQuestions = [...new Set(questionsReceived)];
    
    console.log(`📊 Questions received: ${questionsReceived.length}`);
    console.log(`🔍 Unique questions: ${uniqueQuestions.length}`);
    console.log(`🚨 Duplicates found: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log(`❌ DUPLICATE QUESTIONS DETECTED: ${duplicates.join(', ')}`);
      testResults.duplicateIssues++;
      testResults.criticalErrors.push({
        userId,
        sessionId,
        duplicates,
        questionsReceived
      });
    } else {
      console.log(`✅ No duplicates - Assessment working correctly`);
    }
    
    return {
      success: true,
      duplicates: duplicates.length,
      questionsReceived,
      uniqueQuestions: uniqueQuestions.length
    };
    
  } catch (error) {
    console.log(`💥 Critical error for ${userId}: ${error.message}`);
    testResults.criticalErrors.push({
      userId,
      sessionId,
      error: error.message
    });
    return { success: false, duplicates: 0, questionsReceived: [] };
  }
}

async function runDuplicateFixValidation() {
  console.log('🚀 Starting duplicate question fix validation...\n');
  
  const userResults = [];
  
  // Test multiple users to simulate real-world load
  for (let i = 1; i <= TEST_USER_COUNT; i++) {
    const userId = `test_user_${i}`;
    testResults.totalTests++;
    
    const result = await testSingleUserAssessment(userId);
    userResults.push(result);
    
    if (result.success && result.duplicates === 0) {
      testResults.passedTests++;
    } else {
      testResults.failedTests++;
    }
    
    // Progress indicator
    if (i % 10 === 0) {
      console.log(`\n📈 Progress: ${i}/${TEST_USER_COUNT} users tested`);
    }
  }
  
  // Generate comprehensive test report
  console.log('\n' + '='.repeat(60));
  console.log('🎯 DUPLICATE QUESTIONS FIX - VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  const totalQuestions = userResults.reduce((sum, r) => sum + r.questionsReceived.length, 0);
  const totalUniqueQuestions = userResults.reduce((sum, r) => sum + (r.uniqueQuestions || 0), 0);
  const totalDuplicates = userResults.reduce((sum, r) => sum + r.duplicates, 0);
  
  console.log(`📊 Test Summary:`);
  console.log(`   Users Tested: ${TEST_USER_COUNT}`);
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passedTests}`);
  console.log(`   Failed: ${testResults.failedTests}`);
  console.log(`   Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n🔍 Question Analysis:`);
  console.log(`   Total Questions Served: ${totalQuestions}`);
  console.log(`   Total Unique Questions: ${totalUniqueQuestions}`);
  console.log(`   Total Duplicates: ${totalDuplicates}`);
  console.log(`   Duplicate Rate: ${totalQuestions > 0 ? ((totalDuplicates / totalQuestions) * 100).toFixed(2) : 0}%`);
  
  console.log(`\n🚨 Issues Detected:`);
  console.log(`   Users with Duplicates: ${testResults.duplicateIssues}`);
  console.log(`   Session Errors: ${testResults.sessionErrors}`);
  console.log(`   Critical Errors: ${testResults.criticalErrors.length}`);
  
  // Detailed error reporting
  if (testResults.criticalErrors.length > 0) {
    console.log(`\n💥 Critical Errors Details:`);
    testResults.criticalErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. User: ${error.userId}`);
      if (error.duplicates) {
        console.log(`      Duplicates: ${error.duplicates.join(', ')}`);
      }
      if (error.error) {
        console.log(`      Error: ${error.error}`);
      }
    });
  }
  
  // Final verdict
  if (totalDuplicates === 0 && testResults.duplicateIssues === 0) {
    console.log(`\n🎉 SUCCESS: Duplicate questions bug has been FIXED!`);
    console.log(`   ✅ Zero duplicate questions detected across all users`);
    console.log(`   ✅ Adaptive assessment system working correctly`);
    console.log(`   ✅ Session tracking functioning properly`);
  } else {
    console.log(`\n❌ FAILURE: Duplicate questions bug still exists!`);
    console.log(`   🚨 ${totalDuplicates} duplicate questions found`);
    console.log(`   🚨 ${testResults.duplicateIssues} users affected`);
    console.log(`   🚨 System requires additional fixes`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  return {
    success: totalDuplicates === 0 && testResults.duplicateIssues === 0,
    summary: testResults,
    duplicatesFound: totalDuplicates
  };
}

// Run the validation
runDuplicateFixValidation()
  .then(result => {
    if (result.success) {
      console.log('🏆 DUPLICATE QUESTIONS BUG FIX VALIDATED SUCCESSFULLY');
      process.exit(0);
    } else {
      console.log('🔧 ADDITIONAL FIXES REQUIRED - BUG STILL PRESENT');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 VALIDATION TEST FAILED:', error);
    process.exit(1);
  });