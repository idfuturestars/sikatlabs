#!/usr/bin/env node

/**
 * Comprehensive Login Integration Test
 * Tests all authentication flows and session management
 */

import http from 'http';

const makeRequest = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

class LoginTestSuite {
  constructor() {
    this.results = [];
    this.authTokens = [];
    this.issues = [];
  }

  async test(name, testFn) {
    console.log(`Testing ${name}...`);
    const start = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - start;
      
      this.results.push({
        name,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`✅ ${name} - PASS (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      this.results.push({
        name,
        status: 'FAIL',
        duration,
        error: error.message
      });
      
      this.issues.push(`${name}: ${error.message}`);
      console.log(`❌ ${name} - FAIL (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  async testDemoLogin() {
    return await this.test('Demo Login', async () => {
      const response = await makeRequest('POST', '/api/auth/demo', {
        username: 'test_user_demo'
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Demo login failed with status ${response.statusCode}`);
      }
      
      if (!response.body?.token) {
        throw new Error('No token returned from demo login');
      }
      
      this.authTokens.push(response.body.token);
      
      return {
        token: response.body.token,
        user: response.body.user
      };
    });
  }

  async testTokenValidation() {
    return await this.test('Token Validation', async () => {
      if (this.authTokens.length === 0) {
        throw new Error('No auth tokens available for validation test');
      }
      
      const token = this.authTokens[0];
      const response = await makeRequest('GET', '/api/user/profile', null, {
        'Authorization': `Bearer ${token}`
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Token validation failed with status ${response.statusCode}`);
      }
      
      return response.body;
    });
  }

  async testInvalidToken() {
    return await this.test('Invalid Token Handling', async () => {
      const response = await makeRequest('GET', '/api/user/profile', null, {
        'Authorization': 'Bearer invalid_token_123'
      });
      
      if (response.statusCode !== 401) {
        throw new Error(`Invalid token should return 401, got ${response.statusCode}`);
      }
      
      return 'Invalid token correctly rejected';
    });
  }

  async testNoToken() {
    return await this.test('No Token Handling', async () => {
      const response = await makeRequest('GET', '/api/user/profile');
      
      if (response.statusCode !== 401) {
        throw new Error(`No token should return 401, got ${response.statusCode}`);
      }
      
      return 'No token correctly rejected';
    });
  }

  async testSessionPersistence() {
    return await this.test('Session Persistence', async () => {
      // Create a new session
      const loginResp = await makeRequest('POST', '/api/auth/demo', {
        username: 'persistence_test_user'
      });
      
      if (!loginResp.body?.token) {
        throw new Error('Failed to create session for persistence test');
      }
      
      const token = loginResp.body.token;
      
      // Use the session multiple times
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest('GET', '/api/user/profile', null, {
          'Authorization': `Bearer ${token}`
        });
        
        if (response.statusCode !== 200) {
          throw new Error(`Session persistence failed on request ${i + 1}`);
        }
      }
      
      return 'Session persisted through multiple requests';
    });
  }

  async testConcurrentSessions() {
    return await this.test('Concurrent Sessions', async () => {
      const sessions = [];
      
      // Create multiple concurrent sessions
      for (let i = 0; i < 5; i++) {
        const loginResp = await makeRequest('POST', '/api/auth/demo', {
          username: `concurrent_user_${i}`
        });
        
        if (!loginResp.body?.token) {
          throw new Error(`Failed to create concurrent session ${i}`);
        }
        
        sessions.push(loginResp.body.token);
      }
      
      // Test all sessions work
      const promises = sessions.map(async (token, index) => {
        const response = await makeRequest('GET', '/api/user/profile', null, {
          'Authorization': `Bearer ${token}`
        });
        
        if (response.statusCode !== 200) {
          throw new Error(`Concurrent session ${index} failed`);
        }
        
        return response.body;
      });
      
      await Promise.all(promises);
      
      return `${sessions.length} concurrent sessions working`;
    });
  }

  async testAuthenticatedEndpoints() {
    return await this.test('Authenticated Endpoints', async () => {
      if (this.authTokens.length === 0) {
        throw new Error('No auth tokens available for endpoint test');
      }
      
      const token = this.authTokens[0];
      const endpoints = [
        '/api/user/profile',
        '/api/assessments',
        '/api/ai/conversations',
        '/api/learning-paths',
        '/api/documents',
        '/api/study-groups'
      ];
      
      const results = [];
      
      for (const endpoint of endpoints) {
        const response = await makeRequest('GET', endpoint, null, {
          'Authorization': `Bearer ${token}`
        });
        
        if (response.statusCode === 401) {
          throw new Error(`Authenticated endpoint ${endpoint} rejected valid token`);
        }
        
        results.push({
          endpoint,
          status: response.statusCode,
          working: response.statusCode === 200 || response.statusCode === 304
        });
      }
      
      const working = results.filter(r => r.working).length;
      return `${working}/${endpoints.length} authenticated endpoints working`;
    });
  }

  async testLoginLoop() {
    return await this.test('Login Loop Prevention', async () => {
      // Test that we don't get stuck in authentication loops
      const response = await makeRequest('POST', '/api/auth/demo', {
        username: 'loop_test_user'
      });
      
      if (response.statusCode !== 200 || !response.body?.token) {
        throw new Error('Initial login failed in loop test');
      }
      
      // Immediately use the token - should not cause loops
      const profileResp = await makeRequest('GET', '/api/user/profile', null, {
        'Authorization': `Bearer ${response.body.token}`
      });
      
      if (profileResp.statusCode !== 200) {
        throw new Error('Token usage failed - possible authentication loop');
      }
      
      return 'No authentication loops detected';
    });
  }

  async run() {
    console.log('🔐 EiQ™ Login Integration Test Suite');
    console.log('=' .repeat(50));
    
    try {
      await this.testDemoLogin();
      await this.testTokenValidation();
      await this.testInvalidToken();
      await this.testNoToken();
      await this.testSessionPersistence();
      await this.testConcurrentSessions();
      await this.testAuthenticatedEndpoints();
      await this.testLoginLoop();
      
      const passed = this.results.filter(r => r.status === 'PASS').length;
      const failed = this.results.filter(r => r.status === 'FAIL').length;
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 LOGIN TEST RESULTS');
      console.log('='.repeat(50));
      console.log(`Tests Run: ${this.results.length}`);
      console.log(`Passed: ${passed}`);
      console.log(`Failed: ${failed}`);
      
      if (this.issues.length > 0) {
        console.log('\n❌ ISSUES FOUND:');
        this.issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      const allPassed = failed === 0;
      console.log(`\n🎯 LOGIN SYSTEM: ${allPassed ? '✅ FULLY FUNCTIONAL' : '❌ HAS ISSUES'}`);
      
      return {
        passed: allPassed,
        issues: this.issues,
        summary: { total: this.results.length, passed, failed }
      };
      
    } catch (error) {
      console.log(`\n💥 Critical login failure: ${error.message}`);
      return {
        passed: false,
        critical: error.message,
        issues: this.issues
      };
    }
  }
}

// Execute login tests
async function main() {
  const loginTest = new LoginTestSuite();
  return await loginTest.run();
}

main().catch(error => {
  console.error('💥 Login test suite failed:', error);
  process.exit(1);
});