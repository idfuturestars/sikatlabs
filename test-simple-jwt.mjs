#!/usr/bin/env node

/**
 * Simple JWT Test - Quick authentication verification
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function quickTest() {
  try {
    // 1. Login and get token
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@demo.com', password: 'test123' })
    });
    const { token } = await login.json();
    
    if (!token) {
      console.log('❌ Login failed');
      return false;
    }
    console.log('✅ Login successful');
    
    // 2. Test assessment endpoint
    const assessment = await fetch(`${BASE_URL}/api/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sections: ['core_math'] })
    });
    
    const result = await assessment.json();
    
    if (assessment.status === 200 && result.sessionId) {
      console.log('✅ Assessment endpoint working');
      console.log(`Session: ${result.sessionId}`);
      return true;
    } else {
      console.log('❌ Assessment endpoint failed');
      console.log('Response:', result);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

quickTest().then(success => {
  console.log(success ? '🎉 Authentication system operational' : '💥 Authentication system has issues');
  process.exit(success ? 0 : 1);
});