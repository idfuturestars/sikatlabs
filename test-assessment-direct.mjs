#!/usr/bin/env node

// Direct test of assessment API to debug question generation
const BASE_URL = 'http://localhost:5000';

async function testAssessmentDirect() {
  console.log('Testing EIQ Assessment API directly...\n');
  
  try {
    // Make the assessment request
    const response = await fetch(`${BASE_URL}/api/eiq/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key-validation'
      },
      body: JSON.stringify({
        assessmentType: 'quick',
        questionCount: 5
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    // Check specific fields
    console.log('\n--- Key Fields ---');
    console.log('Session ID:', data.sessionId);
    console.log('Assessment ID:', data.assessmentId);
    console.log('Current Question:', data.currentQuestion ? 'Present' : 'MISSING');
    
    if (data.currentQuestion) {
      console.log('Question Text:', data.currentQuestion.question);
      console.log('Question Options:', data.currentQuestion.options);
    } else {
      console.log('ERROR: No question returned from assessment API!');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAssessmentDirect();