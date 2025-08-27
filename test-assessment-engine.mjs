#!/usr/bin/env node

/**
 * Test script to verify the adaptive assessment engine is properly loading 
 * questions from database instead of using hardcoded fallback
 */

import { AdaptiveAssessmentEngine } from './server/ai/adaptiveAssessmentEngine.js';

console.log('🔍 Testing Adaptive Assessment Engine Question Loading...\n');

async function testAssessmentEngine() {
  try {
    // Initialize the engine (should trigger database loading)
    console.log('1. Initializing Adaptive Assessment Engine...');
    const engine = new AdaptiveAssessmentEngine();
    
    // Allow time for database loading to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2. Starting assessment session...');
    const sessionId = await engine.startAssessment('test_user', ['core_math', 'applied_reasoning', 'ai_conceptual']);
    
    console.log('3. Testing question selection across multiple attempts...');
    const questions = new Set();
    
    for (let i = 0; i < 15; i++) {
      const question = engine.selectNextQuestion(sessionId, 'core_math');
      if (question) {
        questions.add(question.id);
        console.log(`   Question ${i+1}: ${question.id.substring(0, 8)}... "${question.question.substring(0, 50)}..."`);
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   - Total unique questions found: ${questions.size}/15 attempts`);
    console.log(`   - Question diversity: ${questions.size === 15 ? '✅ EXCELLENT' : questions.size >= 10 ? '✅ GOOD' : '❌ POOR (still using hardcoded questions)'}`);
    
    if (questions.size >= 10) {
      console.log('   - ✅ Assessment engine successfully loading from database');
      console.log('   - ✅ Question randomization working properly');
    } else {
      console.log('   - ❌ Assessment engine may still be using hardcoded fallback');
    }
    
    return questions.size >= 10;
    
  } catch (error) {
    console.error('❌ Error testing assessment engine:', error.message);
    return false;
  }
}

testAssessmentEngine().then(success => {
  process.exit(success ? 0 : 1);
});