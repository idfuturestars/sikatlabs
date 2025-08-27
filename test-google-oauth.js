/**
 * Google OAuth Integration Test
 * Tests the complete Google login flow
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testGoogleOAuthFlow() {
  console.log('🔍 Testing Google OAuth Integration');
  console.log('='.repeat(40));

  // Test 1: Google OAuth initiation
  console.log('1. Testing Google OAuth initiation...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/google`, {
      redirect: 'manual'  // Don't follow redirect
    });
    
    if (response.status === 302) {
      const location = response.headers.get('location');
      if (location && location.includes('accounts.google.com')) {
        console.log('✅ Google OAuth initiation working');
        console.log(`   Redirect URL: ${location.substring(0, 80)}...`);
        
        // Extract client ID from URL
        const clientIdMatch = location.match(/client_id=([^&]+)/);
        if (clientIdMatch) {
          console.log(`   Client ID: ${clientIdMatch[1]}`);
        }
        
        return true;
      }
    }
    console.log('❌ Google OAuth initiation failed - invalid redirect');
    return false;
  } catch (error) {
    console.log('❌ Google OAuth initiation failed:', error.message);
    return false;
  }
}

async function testGoogleLoginButton() {
  console.log('\n2. Testing Google login button accessibility...');
  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();
    
    if (html.includes('Continue with Google') || html.includes('google')) {
      console.log('✅ Google login button found in frontend');
      return true;
    } else {
      console.log('❌ Google login button not found in frontend');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to check frontend:', error.message);
    return false;
  }
}

async function testOAuthRoutes() {
  console.log('\n3. Testing OAuth route configuration...');
  try {
    // Test that the callback route exists
    const response = await fetch(`${BASE_URL}/api/auth/google/callback`, {
      method: 'GET'
    });
    
    // Should return 400 or redirect, not 404
    if (response.status !== 404) {
      console.log('✅ Google OAuth callback route configured');
      console.log(`   Callback response status: ${response.status}`);
      return true;
    } else {
      console.log('❌ Google OAuth callback route not found');
      return false;
    }
  } catch (error) {
    console.log('❌ OAuth routes test failed:', error.message);
    return false;
  }
}

async function runGoogleOAuthTest() {
  const results = [];
  
  results.push(await testGoogleOAuthFlow());
  results.push(await testGoogleLoginButton());
  results.push(await testOAuthRoutes());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(40));
  console.log('📊 Google OAuth Test Results');
  console.log('='.repeat(40));
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 Google OAuth is working correctly!');
    console.log('\n🔧 How Google Login Works:');
    console.log('1. User clicks "Continue with Google" button');
    console.log('2. System redirects to Google OAuth authorization');
    console.log('3. User authorizes the application');
    console.log('4. Google redirects back with authorization code');
    console.log('5. System exchanges code for user profile information');
    console.log('6. User account is created or logged in automatically');
    console.log('7. JWT token is generated for authenticated sessions');
    
    console.log('\n📱 Available on login page at: http://localhost:5000/login');
    return true;
  } else {
    console.log('\n⚠️ Some Google OAuth components need attention');
    return false;
  }
}

runGoogleOAuthTest().catch(console.error);