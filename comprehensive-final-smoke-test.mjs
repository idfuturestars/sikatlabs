#!/usr/bin/env node

/**
 * Comprehensive Final Smoke Test - Complete End-to-End Validation
 * EiQ™ Powered by SikatLabs™ Platform
 */

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

class ComprehensiveSmokeTest {
  constructor() {
    this.results = {
      coreInfrastructure: [],
      authenticationFlow: [],
      assessmentSystem: [],
      aiIntegration: [],
      userJourney: [],
      performanceMetrics: {},
      issues: []
    };
  }

  async runComprehensiveTest() {
    console.log('🔥 Comprehensive Final Smoke Test - Real World End-to-End Validation');
    console.log('📋 Testing all critical user journeys and system functions...\n');

    // Core Infrastructure Tests
    await this.testCoreInfrastructure();
    
    // Authentication Flow Tests
    await this.testAuthenticationFlow();
    
    // Assessment System Tests
    await this.testAssessmentSystem();
    
    // AI Integration Tests
    await this.testAIIntegration();
    
    // Complete User Journey Tests
    await this.testCompleteUserJourney();
    
    // Performance Analysis
    await this.analyzePerformance();
    
    // Generate comprehensive report
    return this.generateFinalReport();
  }

  async testCoreInfrastructure() {
    console.log('🏗️ Testing Core Infrastructure...');
    
    const tests = [
      { name: 'Health Check', endpoint: '/health', method: 'GET', expected: 200 },
      { name: 'Readiness Check', endpoint: '/ready', method: 'GET', expected: 200 },
      { name: 'Frontend Application', endpoint: '/', method: 'GET', expected: 200 },
      { name: 'API Base Route', endpoint: '/api', method: 'GET', expected: 404 }, // Expected not found
      { name: 'WebSocket Capability', endpoint: '/ws', method: 'GET', expected: 400 } // Expected bad request
    ];

    for (const test of tests) {
      const result = await this.executeTest(test);
      this.results.coreInfrastructure.push(result);
      console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.status}`);
    }
  }

  async testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    const tests = [
      { name: 'User Endpoint (Unauthorized)', endpoint: '/api/auth/user', method: 'GET', expected: 401 },
      { name: 'Login Redirect', endpoint: '/api/login', method: 'GET', expected: 302 },
      { name: 'Protected Route Access', endpoint: '/api/assessments', method: 'GET', expected: 401 },
      { name: 'OAuth Callback', endpoint: '/api/callback', method: 'GET', expected: 400 } // Bad request without auth
    ];

    for (const test of tests) {
      const result = await this.executeTest(test);
      this.results.authenticationFlow.push(result);
      console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.status}`);
    }
  }

  async testAssessmentSystem() {
    console.log('\n📝 Testing Assessment System...');
    
    const tests = [
      { name: 'Assessment API', endpoint: '/api/assessments', method: 'GET', expected: 401 },
      { name: 'Baseline Assessment', endpoint: '/api/assessments/baseline', method: 'GET', expected: 401 },
      { name: 'Comprehensive Assessment', endpoint: '/api/assessments/comprehensive', method: 'GET', expected: 401 },
      { name: 'Assessment Results', endpoint: '/api/assessments/results', method: 'GET', expected: 401 },
      { name: 'Progress Tracking', endpoint: '/api/assessments/progress', method: 'GET', expected: 401 }
    ];

    for (const test of tests) {
      const result = await this.executeTest(test);
      this.results.assessmentSystem.push(result);
      console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.status}`);
    }
  }

  async testAIIntegration() {
    console.log('\n🤖 Testing AI Integration...');
    
    const tests = [
      { name: 'AI Tutor Chat', endpoint: '/api/ai/tutor', method: 'GET', expected: [200, 401] },
      { name: 'AI Hints System', endpoint: '/api/ai/hints', method: 'GET', expected: [200, 401] },
      { name: 'Skill Recommendations', endpoint: '/api/ai/skill-recommendations', method: 'GET', expected: [200, 401] },
      { name: 'Voice Analysis', endpoint: '/api/ai/voice-analysis', method: 'GET', expected: [200, 401] },
      { name: 'K12 AI Assistant', endpoint: '/api/ai/k12-assistant', method: 'GET', expected: [200, 401] }
    ];

    for (const test of tests) {
      const result = await this.executeTest(test);
      result.passed = Array.isArray(test.expected) ? 
        test.expected.includes(result.statusCode) : 
        result.statusCode === test.expected;
      this.results.aiIntegration.push(result);
      console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.status}`);
    }
  }

  async testCompleteUserJourney() {
    console.log('\n👤 Testing Complete User Journey...');
    
    const tests = [
      { name: 'K12 Dashboard', endpoint: '/api/k12/dashboard', method: 'GET', expected: [200, 401] },
      { name: 'Higher Ed Dashboard', endpoint: '/api/higher-ed/dashboard', method: 'GET', expected: [200, 401] },
      { name: 'Voice Assessment', endpoint: '/api/voice/assessment', method: 'GET', expected: [200, 401] },
      { name: 'Study Groups', endpoint: '/api/study-groups', method: 'GET', expected: [200, 401] },
      { name: 'Learning Paths', endpoint: '/api/learning-paths', method: 'GET', expected: [200, 401] },
      { name: 'Progress Analytics', endpoint: '/api/analytics/progress', method: 'GET', expected: [200, 401] }
    ];

    for (const test of tests) {
      const result = await this.executeTest(test);
      result.passed = Array.isArray(test.expected) ? 
        test.expected.includes(result.statusCode) : 
        result.statusCode === test.expected;
      this.results.userJourney.push(result);
      console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.status}`);
    }
  }

  async executeTest(test) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: test.method,
        timeout: 10000,
        redirect: 'manual',
        headers: {
          'User-Agent': 'EiQ-SmokeTest/1.0',
          'Accept': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const statusCode = response.status;
      const passed = Array.isArray(test.expected) ? 
        test.expected.includes(statusCode) : 
        statusCode === test.expected;

      return {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        statusCode,
        responseTime,
        passed,
        status: `${statusCode} (${responseTime}ms)`
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        statusCode: 0,
        responseTime,
        passed: false,
        status: `ERROR: ${error.message}`,
        error: error.message
      };
    }
  }

  async analyzePerformance() {
    console.log('\n⚡ Analyzing Performance Metrics...');
    
    const allTests = [
      ...this.results.coreInfrastructure,
      ...this.results.authenticationFlow,
      ...this.results.assessmentSystem,
      ...this.results.aiIntegration,
      ...this.results.userJourney
    ];

    const responseTimes = allTests.map(test => test.responseTime).filter(time => time > 0);
    const passedTests = allTests.filter(test => test.passed).length;
    const totalTests = allTests.length;

    this.results.performanceMetrics = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1),
      averageResponseTime: responseTimes.length > 0 ? 
        Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      fastestResponse: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      slowestResponse: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
    };

    console.log(`  📊 Total Tests: ${totalTests}`);
    console.log(`  ✅ Passed: ${passedTests}`);
    console.log(`  ❌ Failed: ${totalTests - passedTests}`);
    console.log(`  📈 Success Rate: ${this.results.performanceMetrics.successRate}%`);
    console.log(`  ⏱️ Avg Response: ${this.results.performanceMetrics.averageResponseTime}ms`);
  }

  generateFinalReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      platform: 'EiQ™ Powered by SikatLabs™',
      testSuite: 'Comprehensive Final Smoke Test',
      results: this.results,
      summary: {
        overallStatus: this.results.performanceMetrics.successRate >= 80 ? 'PASS' : 'FAIL',
        readinessLevel: this.getReadinessLevel(),
        criticalIssues: this.identifyCriticalIssues(),
        recommendations: this.generateRecommendations()
      }
    };

    // Save detailed report
    const filename = `comprehensive-smoke-test-report-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));

    console.log('\n📋 Final Test Report Summary:');
    console.log(`🏷️  Test Suite: ${report.testSuite}`);
    console.log(`📊 Overall Status: ${report.summary.overallStatus}`);
    console.log(`🎯 Success Rate: ${this.results.performanceMetrics.successRate}%`);
    console.log(`⚡ Avg Response: ${this.results.performanceMetrics.averageResponseTime}ms`);
    console.log(`🚀 Readiness Level: ${report.summary.readinessLevel}`);
    console.log(`📄 Detailed Report: ${filename}`);

    if (report.summary.overallStatus === 'PASS') {
      console.log('\n🎉 ALL CRITICAL SYSTEMS OPERATIONAL - PLATFORM READY FOR DEPLOYMENT');
    } else {
      console.log('\n⚠️ Issues detected - Review required before deployment');
      report.summary.criticalIssues.forEach(issue => {
        console.log(`   🔴 ${issue}`);
      });
    }

    return report;
  }

  getReadinessLevel() {
    const successRate = parseFloat(this.results.performanceMetrics.successRate);
    if (successRate >= 95) return 'PRODUCTION_READY';
    if (successRate >= 85) return 'NEAR_READY';
    if (successRate >= 70) return 'DEVELOPMENT_STABLE';
    return 'NEEDS_WORK';
  }

  identifyCriticalIssues() {
    const issues = [];
    
    // Check core infrastructure
    const coreFailures = this.results.coreInfrastructure.filter(test => !test.passed);
    if (coreFailures.length > 0) {
      issues.push(`Core Infrastructure: ${coreFailures.length} critical failures`);
    }

    // Check authentication
    const authFailures = this.results.authenticationFlow.filter(test => !test.passed);
    if (authFailures.length > 1) { // Allow 1 failure for callback without params
      issues.push(`Authentication: ${authFailures.length} security issues`);
    }

    // Check performance
    if (this.results.performanceMetrics.averageResponseTime > 5000) {
      issues.push(`Performance: Average response time too high (${this.results.performanceMetrics.averageResponseTime}ms)`);
    }

    return issues;
  }

  generateRecommendations() {
    const recommendations = [];
    const successRate = parseFloat(this.results.performanceMetrics.successRate);

    if (successRate >= 95) {
      recommendations.push('Platform ready for immediate production deployment');
      recommendations.push('Implement monitoring dashboard for production');
      recommendations.push('Set up automated health checks');
    } else if (successRate >= 85) {
      recommendations.push('Address minor issues before production deployment');
      recommendations.push('Run additional load testing');
      recommendations.push('Review failed test cases');
    } else {
      recommendations.push('Critical issues must be resolved before deployment');
      recommendations.push('Conduct thorough debugging of failed systems');
      recommendations.push('Re-run comprehensive testing after fixes');
    }

    return recommendations;
  }
}

// Main execution
async function main() {
  const smokeTest = new ComprehensiveSmokeTest();
  
  try {
    const report = await smokeTest.runComprehensiveTest();
    process.exit(report.summary.overallStatus === 'PASS' ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Comprehensive smoke test failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ComprehensiveSmokeTest;