const fetch = require('node-fetch');

async function debugAuthTest() {
  console.log('🔧 DEBUG JWT AUTHENTICATION FLOW');
  console.log('================================================');
  
  try {
    // Step 1: Login to get token
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@demo.com',
        password: 'test123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.token) {
      console.log('❌ No token received');
      return;
    }
    
    const token = loginData.token;
    console.log('🔑 Token received:', token.substring(0, 50) + '...');
    
    // Step 2: Test the assessment start endpoint with token
    console.log('\n📝 Step 2: Testing assessment start with JWT token...');
    const assessmentResponse = await fetch('http://localhost:5000/api/assessment/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sections: ['core_math', 'applied_reasoning']
      })
    });

    console.log('🔍 Assessment response status:', assessmentResponse.status);
    const assessmentData = await assessmentResponse.json();
    console.log('✅ Assessment response:', JSON.stringify(assessmentData, null, 2));

  } catch (error) {
    console.error('❌ Error in debug test:', error.message);
  }
}

debugAuthTest();
