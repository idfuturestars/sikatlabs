#!/usr/bin/env node

/**
 * MATCHING SERVICE VERIFICATION SCRIPT
 * Comprehensive test suite for role model matching system
 * Tests all endpoints, authentication, and database integration
 */

import https from 'https';
import http from 'http';

const BASE_URL = 'http://localhost:5000';

class MatchingSystemVerifier {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
    this.authToken = null;
  }

  async makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, BASE_URL);
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsedData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: parsedData,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  async test(description, testFn) {
    this.results.total++;
    console.log(`🧪 Testing: ${description}`);
    
    try {
      const result = await testFn();
      if (result.success) {
        this.results.passed++;
        console.log(`✅ PASS: ${description}`);
        if (result.data) {
          console.log(`   📊 Result: ${JSON.stringify(result.data).substring(0, 100)}...`);
        }
      } else {
        this.results.failed++;
        console.log(`❌ FAIL: ${description}`);
        console.log(`   💥 Error: ${result.error}`);
      }
      
      this.results.tests.push({
        description,
        passed: result.success,
        error: result.error,
        data: result.data
      });
    } catch (error) {
      this.results.failed++;
      console.log(`❌ FAIL: ${description}`);
      console.log(`   💥 Exception: ${error.message}`);
      
      this.results.tests.push({
        description,
        passed: false,
        error: error.message
      });
    }
  }

  async authenticateUser() {
    const response = await this.makeRequest('/api/auth/login', 'POST', {
      username: 'demo123',
      password: 'demo123'
    });

    if (response.status === 200 && response.data.token) {
      this.authToken = response.data.token;
      return { success: true, data: { token: this.authToken.substring(0, 50) + '...', user: response.data.user } };
    } else {
      return { success: false, error: `Auth failed: ${response.status}, Response: ${JSON.stringify(response.data)}` };
    }
  }

  getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  async runVerification() {
    console.log('🚀 MATCHING SERVICE VERIFICATION STARTING...\n');

    // Test 1: Authentication
    await this.test('User Authentication (Login)', async () => {
      return await this.authenticateUser();
    });

    // Test 2: Role Model Matches Endpoint
    await this.test('Role Model Matches Endpoint (/api/role-models/matches)', async () => {
      const response = await this.makeRequest('/api/role-models/matches', 'GET', null, this.getAuthHeaders());
      
      if (response.status === 200 && response.data.matches) {
        return { 
          success: true, 
          data: { 
            matchCount: response.data.matches.length,
            firstMatch: response.data.matches[0]?.name 
          } 
        };
      } else {
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
      }
    });

    // Test 3: Individual Role Model Lookup
    await this.test('Individual Role Model Lookup (/api/role-models/satya-nadella)', async () => {
      const response = await this.makeRequest('/api/role-models/satya-nadella', 'GET', null, this.getAuthHeaders());
      
      if (response.status === 200 && response.data.roleModel) {
        return { 
          success: true, 
          data: { 
            name: response.data.roleModel.name,
            milestones: response.data.milestones?.length || 0
          } 
        };
      } else {
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
      }
    });

    // Test 4: Role Model Path Analysis
    await this.test('Role Model Path Analysis (/api/role-models/satya-nadella/path)', async () => {
      const response = await this.makeRequest('/api/role-models/satya-nadella/path', 'GET', null, this.getAuthHeaders());
      
      if (response.status === 200) {
        return { 
          success: true, 
          data: { 
            hasPath: !!response.data.path,
            hasAnalysis: !!response.data.analysis
          } 
        };
      } else {
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
      }
    });

    // Test 5: Match Analytics
    await this.test('Match Analytics (/api/match-analytics)', async () => {
      const response = await this.makeRequest('/api/match-analytics');
      
      if (response.status === 200) {
        return { 
          success: true, 
          data: response.data
        };
      } else {
        return { success: false, error: `Status: ${response.status}` };
      }
    });

    // Test 6: Admin Match Mode GET
    await this.test('Admin Match Mode GET (/api/admin/match-mode)', async () => {
      const response = await this.makeRequest('/api/admin/match-mode', 'GET', null, this.getAuthHeaders());
      
      if (response.status === 200) {
        return { 
          success: true, 
          data: response.data
        };
      } else {
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
      }
    });

    // Test 7: Admin Match Mode SET (Rules)
    await this.test('Admin Match Mode SET to Rules (/api/admin/match-mode)', async () => {
      const response = await this.makeRequest('/api/admin/match-mode', 'POST', { mode: 'rules' }, this.getAuthHeaders());
      
      if (response.status === 200) {
        return { 
          success: true, 
          data: response.data
        };
      } else {
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
      }
    });

    // Test 8: Admin Match Mode SET (ML)
    await this.test('Admin Match Mode SET to ML (/api/admin/match-mode)', async () => {
      const response = await this.makeRequest('/api/admin/match-mode', 'POST', { mode: 'ml' }, this.getAuthHeaders());
      
      if (response.status === 200) {
        return { 
          success: true, 
          data: response.data
        };
      } else {
        return { success: false, error: `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` };
      }
    });

    // Test 9: Database Integration Check
    await this.test('Database Integration Check', async () => {
      // Test that we can fetch matches without errors
      const response = await this.makeRequest('/api/role-models/matches', 'GET', null, this.getAuthHeaders());
      
      if (response.status === 200 && response.data.matches && response.data.matches.length > 0) {
        return { 
          success: true, 
          data: { 
            databaseConnected: true,
            roleModelsFound: response.data.matches.length
          } 
        };
      } else {
        return { success: false, error: 'No role models found or database error' };
      }
    });

    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('🏆 MATCHING SERVICE VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.description}: ${test.error}`);
        });
    }

    if (this.results.passed === this.results.total) {
      console.log('\n🎉 ALL TESTS PASSED! MATCHING SERVICE IS FULLY OPERATIONAL');
      console.log('✅ Database integration: COMPLETE');
      console.log('✅ Authentication: WORKING');  
      console.log('✅ Role model matching: OPERATIONAL');
      console.log('✅ Admin controls: FUNCTIONAL');
      console.log('✅ Analytics tracking: ACTIVE');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - REVIEW ISSUES ABOVE');
    }
    
    console.log('='.repeat(80));
  }
}

// Run verification
const verifier = new MatchingSystemVerifier();
verifier.runVerification().catch(console.error);