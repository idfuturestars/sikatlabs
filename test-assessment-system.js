/**
 * Comprehensive Assessment System Test
 * Tests IRT-based adaptive assessment and AI hint functionality
 */

import { adaptiveEngine } from './server/ai/adaptiveAssessmentEngine.js';
import { aiHintSystem } from './server/ai/aiHintSystem.js';
import { simulationFramework } from './server/ai/simulationTestFramework.js';

async function testAssessmentSystem() {
  console.log('🚀 TESTING ADAPTIVE ASSESSMENT SYSTEM');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Assessment Initialization
    console.log('\n📋 Test 1: Assessment Initialization');
    const userId = 'test_user_1';
    const sessionId = await adaptiveEngine.startAssessment(userId, ['core_math', 'applied_reasoning', 'ai_conceptual']);
    console.log(`✅ Assessment session created: ${sessionId}`);
    
    // Test 2: Question Selection
    console.log('\n❓ Test 2: Question Selection');
    const mathQuestion = adaptiveEngine.selectNextQuestion(sessionId, 'core_math');
    console.log(`✅ Selected math question: ${mathQuestion?.id || 'None'}`);
    console.log(`   Question: ${mathQuestion?.question || 'N/A'}`);
    
    const reasoningQuestion = adaptiveEngine.selectNextQuestion(sessionId, 'applied_reasoning');
    console.log(`✅ Selected reasoning question: ${reasoningQuestion?.id || 'None'}`);
    
    const aiQuestion = adaptiveEngine.selectNextQuestion(sessionId, 'ai_conceptual');
    console.log(`✅ Selected AI question: ${aiQuestion?.id || 'None'}`);
    
    // Test 3: Response Processing
    console.log('\n📝 Test 3: Response Processing');
    if (mathQuestion) {
      const result = await adaptiveEngine.processResponse(
        sessionId,
        mathQuestion.id,
        mathQuestion.correctAnswer, // Correct answer
        15000, // 15 seconds
        false
      );
      console.log(`✅ Processed correct response - New theta: ${result.newTheta.toFixed(3)}`);
      console.log(`   Confidence: ${result.confidence.toFixed(3)}`);
      console.log(`   Adaptation signal: ${result.adaptationSignal}`);
      
      // Test incorrect answer
      const incorrectResult = await adaptiveEngine.processResponse(
        sessionId,
        reasoningQuestion?.id || 'test_q',
        'wrong_answer',
        25000,
        false
      );
      console.log(`✅ Processed incorrect response - New theta: ${incorrectResult.newTheta.toFixed(3)}`);
    }
    
    // Test 4: AI Hint System
    console.log('\n💡 Test 4: AI Hint System');
    if (mathQuestion) {
      const hint = await aiHintSystem.generateHint({
        sessionId,
        questionId: mathQuestion.id,
        userAnswer: 'wrong_answer',
        attemptCount: 2,
        timeSpent: 30000,
        userTheta: 0.5,
        previousIncorrectAnswers: []
      });
      console.log(`✅ Generated hint: ${hint.content}`);
      console.log(`   Type: ${hint.hintType}, Confidence: ${hint.confidence}`);
    }
    
    // Test 5: Assessment Results
    console.log('\n📊 Test 5: Assessment Results');
    const assessmentResults = adaptiveEngine.getAssessmentResults(sessionId);
    if (assessmentResults) {
      console.log(`✅ Final results generated:`);
      console.log(`   Overall Score: ${assessmentResults.overallScore}%`);
      console.log(`   EiQ Score: ${assessmentResults.eiqScore}`);
      console.log(`   Placement Level: ${assessmentResults.placementLevel}`);
      console.log(`   Questions Asked: ${assessmentResults.totalQuestions}`);
      console.log(`   Strengths: ${assessmentResults.strengths.join(', ') || 'None identified'}`);
      console.log(`   Improvement Areas: ${assessmentResults.improvementAreas.join(', ') || 'None identified'}`);
    }
    
    // Test 6: Quick Simulation (1000 iterations)
    console.log('\n🧪 Test 6: Quick Algorithm Validation (1000 simulations)');
    console.log('Running mini-simulation to validate algorithms...');
    
    // Override config for quick test
    simulationFramework.config = {
      iterations: 1000,
      userAbilityRange: [-3, 3],
      questionDifficulties: [-2, -1, 0, 1, 2],
      sectionWeights: { core_math: 0.25, applied_reasoning: 0.40, ai_conceptual: 0.35 },
      convergenceThreshold: 0.3,
      maxQuestions: 15
    };
    
    const quickValidation = await simulationFramework.runMassiveSimulation();
    console.log(`✅ Quick validation completed:`);
    console.log(`   Mean Absolute Error: ${quickValidation.meanAbsoluteError.toFixed(4)}`);
    console.log(`   Convergence Rate: ${(quickValidation.convergenceRate * 100).toFixed(1)}%`);
    console.log(`   Algorithm Stability: ${(quickValidation.algorithmStability * 100).toFixed(1)}%`);
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    
    return {
      success: true,
      sessionId,
      assessmentResults,
      validationMetrics: quickValidation
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('=' .repeat(60));
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAssessmentSystem().then(result => {
    console.log('\nTest Result:', result.success ? 'PASSED' : 'FAILED');
    process.exit(result.success ? 0 : 1);
  });
}

export { testAssessmentSystem };