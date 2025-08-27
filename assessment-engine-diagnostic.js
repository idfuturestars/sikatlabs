#!/usr/bin/env node

/**
 * ASSESSMENT ENGINE DIAGNOSTIC
 * Chief Technical Architect: Adaptive Assessment System Validation
 */

async function testAssessmentEngine() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🎯 ASSESSMENT ENGINE DIAGNOSTIC');
  console.log('==============================');
  
  try {
    // Test user registration for assessment
    console.log('1. Creating test user for assessment...');
    const userResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `assess_test_${Date.now()}`,
        email: `assess@test.local`,
        password: 'TestPass123!',
        firstName: 'Assessment',
        lastName: 'Tester'
      })
    });
    
    if (!userResponse.ok) {
      throw new Error('User registration failed');
    }
    
    const { token } = await userResponse.json();
    console.log('   ✅ Test user created');
    
    // Test assessment initialization
    console.log('\n2. Testing assessment initialization...');
    const initResponse = await fetch(`${baseUrl}/api/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentType: 'adaptive' })
    });
    
    console.log(`   Init Status: ${initResponse.status}`);
    
    if (initResponse.ok) {
      const { sessionId } = await initResponse.json();
      console.log(`   ✅ Assessment session created: ${sessionId}`);
      
      // Test question retrieval
      console.log('\n3. Testing question retrieval...');
      const questionResponse = await fetch(`${baseUrl}/api/assessment/question/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`   Question Status: ${questionResponse.status}`);
      
      if (questionResponse.ok) {
        const question = await questionResponse.json();
        console.log('   ✅ Question retrieved successfully');
        console.log(`   Question Type: ${question.type || 'Unknown'}`);
        console.log(`   Question Text: ${question.text?.substring(0, 50)}...`);
        
        // Test answer submission
        console.log('\n4. Testing answer submission...');
        const answerResponse = await fetch(`${baseUrl}/api/assessment/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId,
            questionId: question.id,
            answer: question.options ? question.options[0] : 'Test Answer',
            timeSpent: 30000
          })
        });
        
        console.log(`   Answer Status: ${answerResponse.status}`);
        
        if (answerResponse.ok) {
          const result = await answerResponse.json();
          console.log('   ✅ Answer submitted successfully');
          console.log(`   Assessment continues: ${result.nextQuestion ? 'Yes' : 'No'}`);
        } else {
          const errorText = await answerResponse.text();
          console.log(`   ❌ Answer submission failed: ${errorText}`);
        }
      } else {
        const errorText = await questionResponse.text();
        console.log(`   ❌ Question retrieval failed: ${errorText}`);
      }
    } else {
      const errorText = await initResponse.text();
      console.log(`   ❌ Assessment initialization failed: ${errorText}`);
    }
    
    // Test AI hint system
    console.log('\n5. Testing AI hint system...');
    const hintResponse = await fetch(`${baseUrl}/api/ai/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the derivative of x²?',
        userAnswer: 'x',
        context: 'Calculus - derivatives'
      })
    });
    
    console.log(`   Hint Status: ${hintResponse.status}`);
    
    if (hintResponse.ok) {
      const hint = await hintResponse.json();
      console.log('   ✅ AI hint system operational');
      console.log(`   Hint provided: ${hint.hint?.substring(0, 100)}...`);
    } else {
      console.log('   ❌ AI hint system failed');
    }
    
  } catch (error) {
    console.error('❌ Assessment diagnostic error:', error.message);
  }
  
  console.log('\n==============================');
}

testAssessmentEngine().catch(console.error);