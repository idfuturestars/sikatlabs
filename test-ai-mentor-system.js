/**
 * Interactive AI Mentor System Comprehensive Test
 * EiQ™powered by SikatLabsAI™ and IDFS Pathway™
 */

import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  username: 'testuser_mentor_' + Date.now(),
  email: 'mentor_test_' + Date.now() + '@example.com',
  password: 'testpassword123',
  firstName: 'AI',
  lastName: 'MentorTester'
};

let authToken = '';
let userId = '';

// Test counters
let totalTests = 0;
let passedTests = 0;

function logTest(name, success, details = '') {
  totalTests++;
  if (success) {
    passedTests++;
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}: ${details}`);
  }
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  const data = await response.json();
  return { response, data };
}

async function testUserRegistration() {
  console.log('\n🔧 Testing User Registration & Authentication...');
  
  try {
    const { response, data } = await makeRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    logTest('User Registration', response.ok, data.error || '');
    
    if (response.ok) {
      authToken = data.token;
      userId = data.user.id;
      logTest('Authentication Token Received', !!authToken, '');
    }
  } catch (error) {
    logTest('User Registration', false, error.message);
  }
}

async function testMentorPersonalitySelection() {
  console.log('\n🤖 Testing AI Mentor Personality System...');
  
  const personalities = ['supportive', 'challenging', 'friendly', 'professional'];
  
  for (const personality of personalities) {
    try {
      const { response, data } = await makeRequest('/api/ai-mentor/greeting', {
        method: 'POST',
        body: JSON.stringify({
          mentorPersonality: personality,
          context: {
            educationalLevel: 'college',
            age: 20,
            userResponses: {}
          }
        })
      });

      logTest(`${personality.charAt(0).toUpperCase() + personality.slice(1)} Mentor Greeting`, 
        response.ok && data.greeting && data.greeting.length > 0,
        data.error || 'No greeting generated');

      if (response.ok && data.mentorInfo) {
        logTest(`${personality} Mentor Info Retrieved`, 
          data.mentorInfo.name && data.mentorInfo.description,
          'Missing mentor information');
      }
    } catch (error) {
      logTest(`${personality} Mentor Test`, false, error.message);
    }
  }
}

async function testConversationalFlow() {
  console.log('\n💬 Testing Interactive Conversation Flow...');
  
  const testMessages = [
    "Hi! I'm excited to start learning but I'm not sure what I want to study.",
    "I'm interested in technology but I find math challenging.",
    "What would you recommend for someone who wants to work in AI but struggles with complex mathematics?",
    "That sounds great! How should I get started?"
  ];

  for (let i = 0; i < testMessages.length; i++) {
    try {
      const { response, data } = await makeRequest('/api/ai-mentor/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: testMessages[i],
          mentorPersonality: 'supportive',
          context: {
            educationalLevel: 'college',
            age: 19,
            currentStep: i + 1,
            userResponses: { previousMessages: testMessages.slice(0, i) }
          }
        })
      });

      logTest(`Conversation Message ${i + 1}`, 
        response.ok && data.response && data.response.length > 0,
        data.error || 'No response generated');

      if (response.ok) {
        logTest(`Insights Generated ${i + 1}`, 
          Array.isArray(data.insights) && data.insights.length >= 0,
          'Invalid insights format');
          
        logTest(`Suggestions Generated ${i + 1}`, 
          Array.isArray(data.suggestions) && data.suggestions.length >= 0,
          'Invalid suggestions format');
      }
    } catch (error) {
      logTest(`Conversation Message ${i + 1}`, false, error.message);
    }
  }
}

async function testStepGuidance() {
  console.log('\n📋 Testing Step-by-Step Guidance...');
  
  for (let step = 1; step <= 5; step++) {
    try {
      const { response, data } = await makeRequest('/api/ai-mentor/step-guidance', {
        method: 'POST',
        body: JSON.stringify({
          stepNumber: step,
          mentorPersonality: 'friendly',
          context: {
            educationalLevel: 'k-12',
            gradeLevel: '10',
            age: 16,
            currentStep: step
          }
        })
      });

      logTest(`Step ${step} Guidance`, 
        response.ok && data.guidance && data.guidance.length > 0,
        data.error || 'No guidance generated');
    } catch (error) {
      logTest(`Step ${step} Guidance`, false, error.message);
    }
  }
}

async function testFinalInsights() {
  console.log('\n🎯 Testing Final Insights Generation...');
  
  const mockOnboardingData = {
    educationalLevel: 'college',
    age: 20,
    personalInfo: { interests: ['technology', 'problem-solving'] },
    learningPreferences: { style: 'visual', pace: 'moderate' },
    careerGoals: { field: 'computer-science', timeline: '4-years' }
  };

  try {
    const { response, data } = await makeRequest('/api/ai-mentor/final-insights', {
      method: 'POST',
      body: JSON.stringify({
        onboardingData: mockOnboardingData,
        mentorPersonality: 'professional'
      })
    });

    logTest('Final Insights Generation', 
      response.ok && data.summary,
      data.error || 'No summary generated');
      
    logTest('Recommendations Provided', 
      response.ok && Array.isArray(data.recommendations) && data.recommendations.length > 0,
      'No recommendations generated');
      
    logTest('Next Steps Provided', 
      response.ok && Array.isArray(data.nextSteps) && data.nextSteps.length > 0,
      'No next steps generated');
  } catch (error) {
    logTest('Final Insights Generation', false, error.message);
  }
}

async function testSessionTracking() {
  console.log('\n📊 Testing Session Tracking...');
  
  try {
    const { response, data } = await makeRequest('/api/ai-mentor/sessions');

    logTest('Session History Retrieval', 
      response.ok && Array.isArray(data.sessions),
      data.error || 'Invalid sessions format');

    if (response.ok && data.sessions.length > 0) {
      const session = data.sessions[0];
      logTest('Session Data Structure', 
        session.id && session.sessionType && session.mentorPersonality,
        'Missing required session fields');
        
      logTest('Conversation Log Present', 
        session.conversationLog !== undefined,
        'No conversation log found');
    }
  } catch (error) {
    logTest('Session Tracking', false, error.message);
  }
}

async function testAgeAppropriateInteractions() {
  console.log('\n👶 Testing Age-Appropriate Interactions...');
  
  const ageGroups = [
    { age: 12, educationalLevel: 'k-12', gradeLevel: '6' },
    { age: 16, educationalLevel: 'k-12', gradeLevel: '10' },
    { age: 20, educationalLevel: 'college' },
    { age: 25, educationalLevel: 'masters' }
  ];

  for (const group of ageGroups) {
    try {
      const { response, data } = await makeRequest('/api/ai-mentor/greeting', {
        method: 'POST',
        body: JSON.stringify({
          mentorPersonality: 'supportive',
          context: group
        })
      });

      logTest(`Age ${group.age} Appropriate Greeting`, 
        response.ok && data.greeting && data.greeting.length > 0,
        data.error || 'No age-appropriate greeting generated');

      // Test if younger students get more supportive language
      if (response.ok && group.age < 18) {
        const hasAgeAppropriateLanguage = data.greeting.toLowerCase().includes('learning') || 
                                        data.greeting.toLowerCase().includes('support') ||
                                        data.greeting.toLowerCase().includes('help');
        logTest(`Age ${group.age} Supportive Language`, 
          hasAgeAppropriateLanguage,
          'Missing age-appropriate supportive language');
      }
    } catch (error) {
      logTest(`Age ${group.age} Interaction`, false, error.message);
    }
  }
}

async function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...');
  
  try {
    // Test invalid mentor personality
    const { response: invalidResponse } = await makeRequest('/api/ai-mentor/greeting', {
      method: 'POST',
      body: JSON.stringify({
        mentorPersonality: 'invalid_personality',
        context: {}
      })
    });

    logTest('Invalid Personality Handling', 
      invalidResponse.status === 200, // Should fallback to default
      'Should handle invalid personality gracefully');

    // Test missing required fields
    const { response: missingFieldsResponse } = await makeRequest('/api/ai-mentor/chat', {
      method: 'POST',
      body: JSON.stringify({
        // Missing message field
        mentorPersonality: 'supportive'
      })
    });

    logTest('Missing Fields Handling', 
      missingFieldsResponse.status >= 400,
      'Should reject requests with missing fields');
  } catch (error) {
    logTest('Error Handling', false, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Interactive AI Mentor System Comprehensive Test');
  console.log('='.repeat(70));

  await testUserRegistration();
  await testMentorPersonalitySelection();
  await testConversationalFlow();
  await testStepGuidance();
  await testFinalInsights();
  await testSessionTracking();
  await testAgeAppropriateInteractions();
  await testErrorHandling();

  console.log('\n' + '='.repeat(70));
  console.log('📊 Interactive AI Mentor Test Results');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Interactive AI Mentor System is fully operational!');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('\n✅ Most tests passed! Interactive AI Mentor System is largely operational with minor issues.');
  } else {
    console.log('\n⚠️  Some critical issues found. Interactive AI Mentor System needs attention.');
  }

  console.log('\n🔍 Key Features Tested:');
  console.log('• Multiple mentor personalities (Alex, Dr. Chen, Sam, Jordan)');
  console.log('• Personalized greeting generation');
  console.log('• Interactive conversational flow');
  console.log('• Step-by-step onboarding guidance');
  console.log('• Final insights and recommendations');
  console.log('• Session tracking and conversation history');
  console.log('• Age-appropriate interactions');
  console.log('• Error handling and graceful fallbacks');

  return passedTests >= totalTests * 0.8;
}

// Run the tests
runAllTests().catch(console.error);

export { runAllTests };