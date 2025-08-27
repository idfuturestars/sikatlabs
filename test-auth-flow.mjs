#!/usr/bin/env node

import fetch from 'node-fetch';
import { promises as fs } from 'fs';

const BASE_URL = 'http://localhost:5000';

class AuthFlowTester {
  constructor() {
    this.testResults = [];
  }

  async test(name, testFn) {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASS: ${name}`);
      this.testResults.push({ name, status: 'PASS' });
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ name, status: 'FAIL', error: error.message });
    }
  }

  async testServerHealth() {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'healthy') {
      throw new Error(`Server not healthy: ${JSON.stringify(data)}`);
    }
  }

  async testUsernameValidation() {
    // Test the username validation utility
    const { UsernameValidator } = await import('./server/utils/usernameValidator.ts');
    
    // Test valid username
    const validResult = UsernameValidator.validate('johndoe123');
    if (!validResult.isValid) {
      throw new Error('Valid username rejected');
    }

    // Test invalid username (too short)
    const shortResult = UsernameValidator.validate('ab');
    if (shortResult.isValid) {
      throw new Error('Short username accepted');
    }

    // Test prohibited word
    const prohibitedResult = UsernameValidator.validate('admin123');
    if (prohibitedResult.isValid) {
      throw new Error('Prohibited username accepted');
    }

    // Test suggestion generation
    const suggestions = UsernameValidator.generateSuggestions('John', 'Doe');
    if (suggestions.length === 0) {
      throw new Error('No username suggestions generated');
    }
  }

  async testAuthRoutes() {
    // Test login redirect
    const loginResponse = await fetch(`${BASE_URL}/api/login`, { 
      redirect: 'manual' 
    });
    
    if (loginResponse.status !== 302) {
      throw new Error(`Login should redirect (302), got ${loginResponse.status}`);
    }

    // Test unauthenticated user endpoint
    const userResponse = await fetch(`${BASE_URL}/api/auth/user`);
    if (userResponse.status !== 401) {
      throw new Error(`Unauthenticated user request should return 401, got ${userResponse.status}`);
    }
  }

  async testDatabaseConnection() {
    try {
      const { db } = await import('./server/db.ts');
      const { users } = await import('./shared/schema.ts');
      
      // Try to query the users table to ensure our schema is working
      const userCount = await db.select().from(users).limit(1);
      console.log(`   Database query successful, found ${userCount.length} users`);
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Authentication Flow Test Suite\n');
    console.log('=' .repeat(50));

    await this.test('Server Health Check', () => this.testServerHealth());
    await this.test('Username Validation Logic', () => this.testUsernameValidation());
    await this.test('Authentication Routes', () => this.testAuthRoutes());
    await this.test('Database Connection', () => this.testDatabaseConnection());

    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Results Summary:');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Authentication system is ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above.');
    }

    // Save detailed results
    await fs.writeFile(
      'auth-test-results.json', 
      JSON.stringify(this.testResults, null, 2)
    );
    console.log('\n📝 Detailed results saved to auth-test-results.json');
  }
}

// Run the tests
const tester = new AuthFlowTester();
tester.runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});