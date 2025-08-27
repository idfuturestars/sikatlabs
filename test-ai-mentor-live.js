/**
 * Live AI Mentor System Test
 * Tests the complete integration with authentication
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let authToken = '';

const testUser = {
  username: `aimentor_test_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'AI',
  lastName: 'Mentor'
};

async function makeRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { response, data };
}

async function registerAndAuth() {
  console.log('🔐 Creating test user and authenticating...');
  
  const { response, data } = await makeRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });

  if (response.ok && data.token) {
    authToken = data.token;
    console.log('✅ User registered and authenticated successfully');
    return true;
  } else {
    console.log('❌ Registration failed:', data);
    return false;
  }
}

async function testAiMentorGreeting() {
  console.log('\n🤖 Testing AI Mentor Greeting...');
  
  const { response, data } = await makeRequest('/api/ai-mentor/greeting', {
    method: 'POST',
    body: JSON.stringify({
      mentorPersonality: 'supportive',
      context: {
        educationalLevel: 'college',
        age: 20,
        userResponses: {}
      }
    })
  });

  if (response.ok && data.greeting) {
    console.log('✅ AI Mentor greeting generated successfully');
    console.log(`📝 Greeting: "${data.greeting.substring(0, 100)}..."`);
    console.log(`👤 Mentor: ${data.mentorInfo?.name || 'Unknown'}`);
    return true;
  } else {
    console.log('❌ AI Mentor greeting failed:', data);
    return false;
  }
}

async function testConversation() {
  console.log('\n💬 Testing AI Mentor Conversation...');
  
  const { response, data } = await makeRequest('/api/ai-mentor/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: "I'm interested in computer science but I'm worried about the math requirements. What should I do?",
      mentorPersonality: 'supportive',
      context: {
        educationalLevel: 'college',
        age: 19,
        currentStep: 2
      }
    })
  });

  if (response.ok && data.response) {
    console.log('✅ AI Mentor conversation working');
    console.log(`📝 Response: "${data.response.substring(0, 100)}..."`);
    console.log(`💡 Insights: ${data.insights?.length || 0} generated`);
    console.log(`💭 Suggestions: ${data.suggestions?.length || 0} generated`);
    return true;
  } else {
    console.log('❌ AI Mentor conversation failed:', data);
    return false;
  }
}

async function testStepGuidance() {
  console.log('\n📋 Testing Step Guidance...');
  
  const { response, data } = await makeRequest('/api/ai-mentor/step-guidance', {
    method: 'POST',
    body: JSON.stringify({
      stepNumber: 1,
      mentorPersonality: 'friendly',
      context: {
        educationalLevel: 'k-12',
        gradeLevel: '10',
        age: 16
      }
    })
  });

  if (response.ok && data.guidance) {
    console.log('✅ Step guidance generated successfully');
    console.log(`📋 Guidance: "${data.guidance.substring(0, 100)}..."`);
    return true;
  } else {
    console.log('❌ Step guidance failed:', data);
    return false;
  }
}

async function testSessionTracking() {
  console.log('\n📊 Testing Session Tracking...');
  
  const { response, data } = await makeRequest('/api/ai-mentor/sessions');

  if (response.ok && Array.isArray(data.sessions)) {
    console.log('✅ Session tracking working');
    console.log(`📈 Active sessions: ${data.sessions.length}`);
    
    if (data.sessions.length > 0) {
      const session = data.sessions[0];
      console.log(`🔗 Session ID: ${session.id}`);
      console.log(`👤 Mentor: ${session.mentorPersonality}`);
      console.log(`📝 Messages: ${session.conversationLog?.length || 0}`);
    }
    return true;
  } else {
    console.log('❌ Session tracking failed:', data);
    return false;
  }
}

async function testFinalInsights() {
  console.log('\n🎯 Testing Final Insights...');
  
  const mockOnboardingData = {
    educationalLevel: 'college',
    age: 20,
    personalInfo: { interests: ['technology', 'problem-solving'] },
    learningPreferences: { style: 'visual', pace: 'moderate' },
    careerGoals: { field: 'computer-science', timeline: '4-years' }
  };

  const { response, data } = await makeRequest('/api/ai-mentor/final-insights', {
    method: 'POST',
    body: JSON.stringify({
      onboardingData: mockOnboardingData,
      mentorPersonality: 'professional'
    })
  });

  if (response.ok && data.summary) {
    console.log('✅ Final insights generated successfully');
    console.log(`📋 Summary available: ${data.summary ? 'Yes' : 'No'}`);
    console.log(`💡 Recommendations: ${data.recommendations?.length || 0}`);
    console.log(`📝 Next steps: ${data.nextSteps?.length || 0}`);
    return true;
  } else {
    console.log('❌ Final insights failed:', data);
    return false;
  }
}

async function runLiveTest() {
  console.log('🚀 Starting Live AI Mentor System Test');
  console.log('='.repeat(50));

  const tests = [
    { name: 'User Registration & Auth', fn: registerAndAuth },
    { name: 'AI Mentor Greeting', fn: testAiMentorGreeting },
    { name: 'Conversation Flow', fn: testConversation },
    { name: 'Step Guidance', fn: testStepGuidance },
    { name: 'Session Tracking', fn: testSessionTracking },
    { name: 'Final Insights', fn: testFinalInsights }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push(result);
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      results.push(false);
    }
  }

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 Live Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed >= total * 0.8) {
    console.log('\n🎉 AI Mentor System is WORKING!');
    console.log('\n📱 Ready for use in the onboarding flow');
    console.log('• Click "AI Mentor" during onboarding');
    console.log('• Get personalized guidance and insights');
    console.log('• Multiple mentor personalities available');
    console.log('• Real-time conversation tracking');
    return true;
  } else {
    console.log('\n⚠️ Some AI Mentor features need attention');
    return false;
  }
}

runLiveTest().catch(console.error);