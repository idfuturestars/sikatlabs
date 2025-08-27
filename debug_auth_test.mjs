#!/usr/bin/env node

/**
 * EIQ™ AUTHENTICATION DEBUG UTILITY
 * ==================================
 * 
 * Quick debugging tool for JWT authentication issues
 * Use this when troubleshooting authentication problems
 * 
 * Usage: node debug_auth_test.mjs [endpoint]
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const endpoint = process.argv[2] || '/api/test-jwt-auth';

async function debugAuth() {
  console.log('🔍 EIQ™ Authentication Debug Tool');
  console.log('==================================\n');
  
  // Step 1: Get JWT token
  console.log('1. Getting JWT token...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@demo.com', password: 'test123' })
  });
  
  const loginData = await loginResponse.json();
  
  if (!loginData.token) {
    console.log('❌ Login failed:', loginData);
    process.exit(1);
  }
  
  console.log('✅ Login successful');
  console.log(`   Token: ${loginData.token.substring(0, 50)}...`);
  
  // Step 2: Test authenticated endpoint
  console.log(`\n2. Testing authenticated endpoint: ${endpoint}`);
  const testResponse = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({ debug: true })
  });
  
  const testData = await testResponse.json();
  
  console.log(`   Status: ${testResponse.status}`);
  console.log(`   Response:`, JSON.stringify(testData, null, 2));
  
  if (testResponse.status === 200) {
    console.log('✅ Authentication working correctly');
  } else {
    console.log('❌ Authentication issue detected');
    process.exit(1);
  }
}

debugAuth().catch(console.error);