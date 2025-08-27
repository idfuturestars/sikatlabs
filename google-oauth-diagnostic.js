#!/usr/bin/env node

/**
 * GOOGLE OAUTH DIAGNOSTIC TOOL
 * Chief Technical Architect: OAuth Integration Resolution
 */

import fetch from 'node-fetch';

async function diagnoseGoogleOAuth() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔍 GOOGLE OAUTH DIAGNOSTIC REPORT');
  console.log('================================');
  
  try {
    // Test OAuth initiation
    console.log('1. Testing OAuth login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(loginResponse.headers))}`);
    
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('location');
      console.log(`   ✅ OAuth redirect working: ${location}`);
    } else {
      console.log('   ❌ OAuth not redirecting properly');
    }
    
    // Test callback endpoint
    console.log('\n2. Testing OAuth callback endpoint...');
    const callbackResponse = await fetch(`${baseUrl}/api/callback`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`   Callback Status: ${callbackResponse.status}`);
    
    // Test logout endpoint
    console.log('\n3. Testing logout endpoint...');
    const logoutResponse = await fetch(`${baseUrl}/api/logout`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`   Logout Status: ${logoutResponse.status}`);
    
  } catch (error) {
    console.error('❌ OAuth diagnostic error:', error.message);
  }
  
  console.log('\n================================');
}

diagnoseGoogleOAuth().catch(console.error);