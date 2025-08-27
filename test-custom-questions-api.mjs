#!/usr/bin/env node

/**
 * Test Suite for Custom Questions API System
 * Validates Phase 2 backend implementation
 * Tests all CRUD operations and AI integration endpoints
 */

import { readFileSync } from 'fs';
import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:5000';

class CustomQuestionsAPITester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      summary: {}
    };
    this.staffToken = null;
    this.studentToken = null;
    this.createdEntities = {
      questions: [],
      assignments: [],
      responses: [],
      sessions: []
    };
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      let data = null;
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      }
      
      return { 
        status: response.status, 
        data, 
        responseTime,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      return {
        status: 0,
        error: error.message,
        responseTime
      };
    }
  }

  async authenticate() {
    await this.log('🔐 Starting authentication tests...');
    
    // Test Google OAuth authentication (simulated)
    const authResponse = await this.makeRequest('/api/auth/user');
    
    if (authResponse.status === 200 || authResponse.status === 401) {
      await this.log('✅ Authentication endpoint accessible', 'success');
      
      // Simulate staff and student tokens for testing
      // In real implementation, these would come from actual OAuth flow
      this.staffToken = 'mock-staff-token';
      this.studentToken = 'mock-student-token';
      
      return true;
    } else {
      await this.log('❌ Authentication endpoint not accessible', 'error');
      this.testResults.errors.push('Authentication endpoint failed');
      return false;
    }
  }

  async testStaffCustomQuestions() {
    await this.log('📋 Testing Staff Custom Questions API...');
    
    // Test: Create custom question
    const questionData = {
      title: 'Test Algebraic Reasoning',
      questionText: 'Solve for x: 2x + 5 = 17',
      questionType: 'multiple_choice',
      options: JSON.stringify(['x = 6', 'x = 7', 'x = 8', 'x = 9']),
      correctAnswer: 'x = 6',
      difficultyLevel: 500,
      domain: 'mathematics',
      explanation: 'Subtract 5 from both sides, then divide by 2',
      estimatedTime: 120,
      tags: JSON.stringify(['algebra', 'equations']),
      status: 'draft'
    };

    const createResponse = await this.makeRequest('/api/staff/custom-questions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.staffToken}` },
      body: JSON.stringify(questionData)
    });

    if (createResponse.status === 201) {
      await this.log('✅ Custom question creation successful', 'success');
      this.testResults.passed++;
      this.createdEntities.questions.push(createResponse.data.id);
    } else {
      await this.log(`❌ Custom question creation failed: ${createResponse.status}`, 'error');
      this.testResults.failed++;
      this.testResults.errors.push('Custom question creation failed');
    }

    // Test: Get staff questions
    const getResponse = await this.makeRequest('/api/staff/custom-questions', {
      headers: { 'Authorization': `Bearer ${this.staffToken}` }
    });

    if (getResponse.status === 200) {
      await this.log('✅ Staff questions retrieval successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Staff questions retrieval failed: ${getResponse.status}`, 'error');
      this.testResults.failed++;
    }

    return this.createdEntities.questions.length > 0;
  }

  async testAIQuestionGeneration() {
    await this.log('🤖 Testing AI Question Generation API...');
    
    // Test: Analyze student weaknesses
    const assessmentData = {
      responses: [
        { domain: 'mathematics', correct: false, difficulty: 400 },
        { domain: 'mathematics', correct: false, difficulty: 350 },
        { domain: 'logical_reasoning', correct: true, difficulty: 500 }
      ],
      overallScore: 425,
      domainScores: {
        mathematics: 300,
        logical_reasoning: 550
      }
    };

    const weaknessResponse = await this.makeRequest('/api/staff/ai-questions/analyze-student', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.staffToken}` },
      body: JSON.stringify({ assessmentData })
    });

    if (weaknessResponse.status === 200) {
      await this.log('✅ Student weakness analysis successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Student weakness analysis failed: ${weaknessResponse.status}`, 'error');
      this.testResults.failed++;
    }

    // Test: Generate AI questions
    const generationData = {
      weaknessAnalysis: {
        primaryWeakness: 'mathematics',
        specificAreas: ['algebra', 'basic_arithmetic'],
        recommendedDifficulty: 350
      },
      questionType: 'multiple_choice',
      difficultyTarget: 350,
      aiProvider: 'anthropic'
    };

    const generateResponse = await this.makeRequest('/api/staff/ai-questions/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.staffToken}` },
      body: JSON.stringify(generationData)
    });

    if (generateResponse.status === 200) {
      await this.log('✅ AI question generation successful', 'success');
      this.testResults.passed++;
      if (generateResponse.data.sessionId) {
        this.createdEntities.sessions.push(generateResponse.data.sessionId);
      }
    } else {
      await this.log(`❌ AI question generation failed: ${generateResponse.status}`, 'error');
      this.testResults.failed++;
    }

    // Test: Question refinement
    const refinementData = {
      originalQuestion: {
        text: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correct: '4'
      },
      staffFeedback: 'Make this more challenging with algebraic concepts',
      aiProvider: 'anthropic'
    };

    const refineResponse = await this.makeRequest('/api/staff/ai-questions/refine', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.staffToken}` },
      body: JSON.stringify(refinementData)
    });

    if (refineResponse.status === 200) {
      await this.log('✅ Question refinement successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Question refinement failed: ${refineResponse.status}`, 'error');
      this.testResults.failed++;
    }

    // Test: Difficulty estimation
    const difficultyData = {
      questionContent: 'Solve the quadratic equation: x² - 5x + 6 = 0'
    };

    const difficultyResponse = await this.makeRequest('/api/staff/ai-questions/estimate-difficulty', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.staffToken}` },
      body: JSON.stringify(difficultyData)
    });

    if (difficultyResponse.status === 200) {
      await this.log('✅ Difficulty estimation successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Difficulty estimation failed: ${difficultyResponse.status}`, 'error');
      this.testResults.failed++;
    }
  }

  async testQuestionAssignments() {
    await this.log('📝 Testing Question Assignment API...');
    
    if (this.createdEntities.questions.length === 0) {
      await this.log('⚠️ No questions available for assignment testing', 'warning');
      return;
    }

    // Test: Create assignment
    const assignmentData = {
      customQuestionId: this.createdEntities.questions[0],
      studentId: 'test-student-123',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      instructions: 'Complete this algebra question carefully',
      priority: 'medium'
    };

    const createAssignmentResponse = await this.makeRequest('/api/staff/question-assignments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.staffToken}` },
      body: JSON.stringify(assignmentData)
    });

    if (createAssignmentResponse.status === 201) {
      await this.log('✅ Question assignment creation successful', 'success');
      this.testResults.passed++;
      this.createdEntities.assignments.push(createAssignmentResponse.data.id);
    } else {
      await this.log(`❌ Question assignment creation failed: ${createAssignmentResponse.status}`, 'error');
      this.testResults.failed++;
    }

    // Test: Get assignments
    const getAssignmentsResponse = await this.makeRequest('/api/staff/question-assignments', {
      headers: { 'Authorization': `Bearer ${this.staffToken}` }
    });

    if (getAssignmentsResponse.status === 200) {
      await this.log('✅ Question assignments retrieval successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Question assignments retrieval failed: ${getAssignmentsResponse.status}`, 'error');
      this.testResults.failed++;
    }
  }

  async testStudentEndpoints() {
    await this.log('🎓 Testing Student Custom Questions API...');
    
    // Test: Get student custom questions
    const getQuestionsResponse = await this.makeRequest('/api/student/custom-questions', {
      headers: { 'Authorization': `Bearer ${this.studentToken}` }
    });

    if (getQuestionsResponse.status === 200) {
      await this.log('✅ Student questions retrieval successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Student questions retrieval failed: ${getQuestionsResponse.status}`, 'error');
      this.testResults.failed++;
    }

    // Test: Get student assignments
    const getAssignmentsResponse = await this.makeRequest('/api/student/question-assignments', {
      headers: { 'Authorization': `Bearer ${this.studentToken}` }
    });

    if (getAssignmentsResponse.status === 200) {
      await this.log('✅ Student assignments retrieval successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Student assignments retrieval failed: ${getAssignmentsResponse.status}`, 'error');
      this.testResults.failed++;
    }

    // Test: Submit question response
    if (this.createdEntities.questions.length > 0) {
      const responseData = {
        customQuestionId: this.createdEntities.questions[0],
        answer: 'x = 6',
        timeSpent: 95,
        confidence: 8,
        workShown: 'Step 1: 2x + 5 = 17\nStep 2: 2x = 12\nStep 3: x = 6'
      };

      const submitResponse = await this.makeRequest('/api/student/custom-question-responses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.studentToken}` },
        body: JSON.stringify(responseData)
      });

      if (submitResponse.status === 201) {
        await this.log('✅ Student response submission successful', 'success');
        this.testResults.passed++;
        this.createdEntities.responses.push(submitResponse.data.id);
      } else {
        await this.log(`❌ Student response submission failed: ${submitResponse.status}`, 'error');
        this.testResults.failed++;
      }
    }

    // Test: Get student responses
    const getResponsesResponse = await this.makeRequest('/api/student/custom-question-responses', {
      headers: { 'Authorization': `Bearer ${this.studentToken}` }
    });

    if (getResponsesResponse.status === 200) {
      await this.log('✅ Student responses retrieval successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Student responses retrieval failed: ${getResponsesResponse.status}`, 'error');
      this.testResults.failed++;
    }
  }

  async testResponseAnalysis() {
    await this.log('📊 Testing Response Analysis API...');
    
    if (this.createdEntities.questions.length === 0) {
      await this.log('⚠️ No questions available for response analysis testing');
      return;
    }

    // Test: Get question responses
    const questionId = this.createdEntities.questions[0];
    const getResponsesResponse = await this.makeRequest(`/api/staff/custom-questions/${questionId}/responses`, {
      headers: { 'Authorization': `Bearer ${this.staffToken}` }
    });

    if (getResponsesResponse.status === 200) {
      await this.log('✅ Question responses analysis successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ Question responses analysis failed: ${getResponsesResponse.status}`, 'error');
      this.testResults.failed++;
    }

    // Test: Get AI sessions
    const getSessionsResponse = await this.makeRequest('/api/staff/ai-sessions', {
      headers: { 'Authorization': `Bearer ${this.staffToken}` }
    });

    if (getSessionsResponse.status === 200) {
      await this.log('✅ AI sessions retrieval successful', 'success');
      this.testResults.passed++;
    } else {
      await this.log(`❌ AI sessions retrieval failed: ${getSessionsResponse.status}`, 'error');
      this.testResults.failed++;
    }
  }

  async runComprehensiveTest() {
    const startTime = performance.now();
    
    await this.log('🚀 Starting Custom Questions API Comprehensive Test Suite');
    await this.log('=' .repeat(60));
    
    try {
      // Step 1: Authentication
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        await this.log('❌ Authentication failed, aborting tests', 'error');
        return this.generateReport();
      }
      
      // Step 2: Staff Custom Questions
      await this.testStaffCustomQuestions();
      
      // Step 3: AI Question Generation
      await this.testAIQuestionGeneration();
      
      // Step 4: Question Assignments  
      await this.testQuestionAssignments();
      
      // Step 5: Student Endpoints
      await this.testStudentEndpoints();
      
      // Step 6: Response Analysis
      await this.testResponseAnalysis();
      
    } catch (error) {
      await this.log(`💥 Critical error during testing: ${error.message}`, 'error');
      this.testResults.errors.push(`Critical error: ${error.message}`);
    }
    
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    await this.log('=' .repeat(60));
    await this.log(`🏁 Custom Questions API Test Suite Complete (${totalTime}ms)`);
    
    return this.generateReport();
  }

  generateReport() {
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    
    this.testResults.summary = {
      totalTests: total,
      passed: this.testResults.passed,
      failed: this.testResults.failed,
      successRate: `${successRate}%`,
      createdEntities: {
        questions: this.createdEntities.questions.length,
        assignments: this.createdEntities.assignments.length,
        responses: this.createdEntities.responses.length,
        sessions: this.createdEntities.sessions.length
      }
    };

    console.log('\n' + '='.repeat(80));
    console.log('📋 CUSTOM QUESTIONS API TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`❌ Tests Failed: ${this.testResults.failed}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🔧 Created Questions: ${this.createdEntities.questions.length}`);
    console.log(`📝 Created Assignments: ${this.createdEntities.assignments.length}`);
    console.log(`💬 Created Responses: ${this.createdEntities.responses.length}`);
    console.log(`🤖 AI Sessions: ${this.createdEntities.sessions.length}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🏆 Phase 2 Backend Implementation Status:');
    if (successRate >= 80) {
      console.log('   ✅ EXCELLENT - Ready for Phase 3 frontend implementation');
    } else if (successRate >= 60) {
      console.log('   ⚠️  GOOD - Minor issues to resolve before Phase 3');
    } else {
      console.log('   ❌ NEEDS WORK - Significant issues to address');
    }
    
    console.log('='.repeat(80));
    
    return this.testResults;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new CustomQuestionsAPITester();
  
  tester.runComprehensiveTest()
    .then((results) => {
      const exitCode = results.failed === 0 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

export default CustomQuestionsAPITester;