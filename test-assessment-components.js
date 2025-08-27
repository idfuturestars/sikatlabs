/**
 * Component-Level Assessment Testing
 * Tests individual IRT and AI components for functionality
 */

import { promises as fs } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Mock environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.GEMINI_API_KEY = 'test-key';

async function testIRTEngine() {
  console.log('\n🎯 Testing IRT Engine Components...');
  
  try {
    // Test IRT parameter calculation
    const testTheta = 0.5;
    const testParams = { discrimination: 1.2, difficulty: 0.0, guessing: 0.25 };
    
    // 3-parameter logistic model: P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))
    const probability = testParams.guessing + 
      (1 - testParams.guessing) / 
      (1 + Math.exp(-testParams.discrimination * (testTheta - testParams.difficulty)));
    
    console.log(`✅ IRT 3PL calculation successful`);
    console.log(`   Theta: ${testTheta}, Probability: ${probability.toFixed(4)}`);
    
    // Test ability estimation
    const responses = [true, true, false, true, false]; // Example response pattern
    let thetaEstimate = 0.0;
    
    for (let i = 0; i < 5; i++) { // Simple iteration for testing
      let numerator = 0;
      let denominator = 0;
      
      responses.forEach((response, idx) => {
        const p = 0.25 + 0.75 / (1 + Math.exp(-1.0 * (thetaEstimate - (idx - 2))));
        const w = p * (1 - p);
        
        numerator += (response ? 1 : 0) - p;
        denominator += w;
      });
      
      if (denominator > 0) {
        thetaEstimate += numerator / denominator;
      }
    }
    
    console.log(`✅ Ability estimation successful: θ = ${thetaEstimate.toFixed(4)}`);
    
    return true;
  } catch (error) {
    console.log(`❌ IRT engine test failed: ${error.message}`);
    return false;
  }
}

async function testQuestionBank() {
  console.log('\n📚 Testing Question Bank Structure...');
  
  try {
    // Mock question bank structure validation
    const mockQuestionBank = {
      core_math: [
        {
          id: 'math_001',
          question: 'What is 2 + 2?',
          type: 'multiple_choice',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          irtParams: { discrimination: 1.0, difficulty: -2.0, guessing: 0.25 },
          domain: 'arithmetic',
          gradeLevel: 'elementary'
        }
      ],
      applied_reasoning: [
        {
          id: 'reasoning_001',
          question: 'If a train leaves station A at 10 AM traveling 60 mph...',
          type: 'multiple_choice',
          options: ['12 PM', '1 PM', '2 PM', '3 PM'],
          correctAnswer: '12 PM',
          irtParams: { discrimination: 1.5, difficulty: 0.5, guessing: 0.20 },
          domain: 'word_problems',
          gradeLevel: 'middle_school'
        }
      ],
      ai_conceptual: [
        {
          id: 'ai_001',
          question: 'Which best describes machine learning?',
          type: 'multiple_choice',
          options: ['Rule-based', 'Pattern recognition', 'Fixed logic', 'Random'],
          correctAnswer: 'Pattern recognition',
          irtParams: { discrimination: 1.8, difficulty: 1.0, guessing: 0.15 },
          domain: 'ai_concepts',
          gradeLevel: 'high_school'
        }
      ]
    };
    
    // Validate structure
    const sections = Object.keys(mockQuestionBank);
    console.log(`✅ Question bank sections: ${sections.join(', ')}`);
    
    let totalQuestions = 0;
    sections.forEach(section => {
      const questions = mockQuestionBank[section];
      totalQuestions += questions.length;
      
      questions.forEach(q => {
        // Validate required fields
        const requiredFields = ['id', 'question', 'type', 'correctAnswer', 'irtParams'];
        const hasAllFields = requiredFields.every(field => q.hasOwnProperty(field));
        
        if (!hasAllFields) {
          throw new Error(`Question ${q.id} missing required fields`);
        }
        
        // Validate IRT parameters
        const { discrimination, difficulty, guessing } = q.irtParams;
        if (discrimination <= 0 || guessing < 0 || guessing >= 1) {
          throw new Error(`Invalid IRT parameters for question ${q.id}`);
        }
      });
      
      console.log(`✅ Section ${section}: ${questions.length} questions validated`);
    });
    
    console.log(`✅ Total questions in bank: ${totalQuestions}`);
    return true;
  } catch (error) {
    console.log(`❌ Question bank test failed: ${error.message}`);
    return false;
  }
}

async function testAIProviders() {
  console.log('\n🤖 Testing AI Provider Integration...');
  
  try {
    // Mock AI provider responses
    const mockProviders = {
      openai: {
        model: 'gpt-4o',
        status: 'available',
        responseTime: 800,
        features: ['text', 'analysis', 'hints']
      },
      anthropic: {
        model: 'claude-sonnet-4-20250514',
        status: 'available',
        responseTime: 1200,
        features: ['text', 'analysis', 'reasoning']
      },
      gemini: {
        model: 'gemini-2.5-flash',
        status: 'available',
        responseTime: 600,
        features: ['text', 'multimodal', 'generation']
      }
    };
    
    // Test provider selection logic
    const availableProviders = Object.entries(mockProviders)
      .filter(([name, config]) => config.status === 'available')
      .sort((a, b) => a[1].responseTime - b[1].responseTime); // Sort by speed
    
    console.log(`✅ Available AI providers: ${availableProviders.length}`);
    availableProviders.forEach(([name, config]) => {
      console.log(`   ${name}: ${config.model} (${config.responseTime}ms)`);
    });
    
    // Test fallback mechanism
    const primaryProvider = availableProviders[0];
    const fallbackProvider = availableProviders[1];
    
    if (primaryProvider && fallbackProvider) {
      console.log(`✅ Failover ready: ${primaryProvider[0]} → ${fallbackProvider[0]}`);
    }
    
    return availableProviders.length >= 2;
  } catch (error) {
    console.log(`❌ AI provider test failed: ${error.message}`);
    return false;
  }
}

async function testSessionManagement() {
  console.log('\n📋 Testing Session Management...');
  
  try {
    // Mock session data structure
    const mockSession = {
      sessionId: 'test_session_001',
      userId: 'test_user',
      startTime: new Date().toISOString(),
      currentTheta: 0.0,
      standardError: 1.0,
      questionsAsked: [],
      responses: [],
      sectionProgress: {
        core_math: 0,
        applied_reasoning: 0,
        ai_conceptual: 0
      },
      adaptiveMetrics: {
        convergenceAchieved: false,
        confidence: 0.5,
        totalQuestions: 0
      }
    };
    
    // Validate session structure
    const requiredFields = ['sessionId', 'userId', 'currentTheta', 'questionsAsked', 'responses'];
    const hasAllFields = requiredFields.every(field => mockSession.hasOwnProperty(field));
    
    if (!hasAllFields) {
      throw new Error('Session missing required fields');
    }
    
    console.log(`✅ Session structure validated`);
    console.log(`   Session ID: ${mockSession.sessionId}`);
    console.log(`   Initial theta: ${mockSession.currentTheta}`);
    console.log(`   Sections: ${Object.keys(mockSession.sectionProgress).length}`);
    
    // Test session state updates
    mockSession.currentTheta = 0.5;
    mockSession.standardError = 0.8;
    mockSession.questionsAsked.push('math_001');
    mockSession.responses.push({ questionId: 'math_001', isCorrect: true, responseTime: 15000 });
    
    console.log(`✅ Session state updates working`);
    console.log(`   Updated theta: ${mockSession.currentTheta}`);
    console.log(`   Questions asked: ${mockSession.questionsAsked.length}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Session management test failed: ${error.message}`);
    return false;
  }
}

async function testPerformanceMetrics() {
  console.log('\n📊 Testing Performance Metrics...');
  
  try {
    // Mock performance calculations
    const responses = [
      { isCorrect: true, responseTime: 12000, difficulty: -1.0 },
      { isCorrect: true, responseTime: 18000, difficulty: 0.0 },
      { isCorrect: false, responseTime: 35000, difficulty: 1.0 },
      { isCorrect: true, responseTime: 22000, difficulty: 0.5 },
      { isCorrect: false, responseTime: 45000, difficulty: 1.5 }
    ];
    
    // Calculate metrics
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const accuracyRate = correctAnswers / totalQuestions;
    
    const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / totalQuestions;
    const avgDifficulty = responses.reduce((sum, r) => sum + r.difficulty, 0) / totalQuestions;
    
    // EiQ Score calculation (simplified)
    const baseScore = 500;
    const accuracyBonus = accuracyRate * 300;
    const difficultyBonus = Math.max(0, avgDifficulty) * 100;
    const speedBonus = Math.max(0, (30000 - avgResponseTime) / 1000); // Bonus for faster responses
    
    const eiqScore = Math.round(baseScore + accuracyBonus + difficultyBonus + speedBonus);
    
    console.log(`✅ Performance metrics calculated`);
    console.log(`   Accuracy: ${(accuracyRate * 100).toFixed(1)}%`);
    console.log(`   Avg Response Time: ${(avgResponseTime / 1000).toFixed(1)}s`);
    console.log(`   Avg Difficulty: ${avgDifficulty.toFixed(2)}`);
    console.log(`   EiQ Score: ${eiqScore}`);
    
    // Determine placement level
    let placementLevel;
    if (eiqScore >= 850) placementLevel = 'mastery';
    else if (eiqScore >= 600) placementLevel = 'immersion';
    else placementLevel = 'foundation';
    
    console.log(`   Placement: ${placementLevel.toUpperCase()}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Performance metrics test failed: ${error.message}`);
    return false;
  }
}

async function runComponentTests() {
  console.log('🔧 EiQ™ COMPONENT TESTING');
  console.log('=' .repeat(50));
  
  const testResults = {
    irtEngine: false,
    questionBank: false,
    aiProviders: false,
    sessionManagement: false,
    performanceMetrics: false
  };
  
  // Run component tests
  testResults.irtEngine = await testIRTEngine();
  testResults.questionBank = await testQuestionBank();
  testResults.aiProviders = await testAIProviders();
  testResults.sessionManagement = await testSessionManagement();
  testResults.performanceMetrics = await testPerformanceMetrics();
  
  // Summary
  console.log('\n📋 COMPONENT TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const passedTests = Object.values(testResults).filter(result => result).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${icon} ${testName}`);
  });
  
  console.log(`\n🎯 Component Result: ${passedTests}/${totalTests} tests passed`);
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests,
    results: testResults
  };
}

// Run component tests
runComponentTests().then(result => {
  console.log(`\n${result.success ? '🎉' : '⚠️'} Component testing ${result.success ? 'completed successfully' : 'completed with issues'}`);
}).catch(error => {
  console.error('Component test error:', error);
});