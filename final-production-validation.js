#!/usr/bin/env node

/**
 * FINAL PRODUCTION VALIDATION TEST
 * EIQ™ Platform - Load Test for New Features
 * 
 * Tests the newly implemented features:
 * - IQ/Personality Assessment Endpoints
 * - Avatar Selection System
 * - Voice-to-Text Integration Routes
 * - AI Architecture (MotherAI/ChildAI)
 * - Audit Logging System
 */

import autocannon from 'autocannon';
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const CONCURRENT_USERS = 100;
const TEST_DURATION = '30s';

class ProductionValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: [],
      healthChecks: [],
      performanceMetrics: {},
      errors: [],
      summary: {}
    };
  }

  async validateHealth() {
    console.log('\n🔍 PERFORMING HEALTH CHECKS...');
    
    const healthEndpoints = [
      '/health',
      '/ready',
      '/api/auth/user',
      '/api/personality-assessment/disc',
      '/api/iq-assessment/traditional',
      '/api/avatars/available',
      '/api/audit/system-status'
    ];

    for (const endpoint of healthEndpoints) {
      try {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer demo-token',
            'Content-Type': 'application/json'
          }
        });
        const duration = Date.now() - start;
        
        this.results.healthChecks.push({
          endpoint,
          status: response.status,
          duration: `${duration}ms`,
          healthy: response.status < 400
        });
        
        console.log(`✅ ${endpoint}: ${response.status} (${duration}ms)`);
      } catch (error) {
        this.results.healthChecks.push({
          endpoint,
          status: 'ERROR',
          error: error.message,
          healthy: false
        });
        console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
      }
    }
  }

  async runPersonalityAssessmentLoadTest() {
    console.log('\n🧠 TESTING PERSONALITY ASSESSMENT LOAD...');
    
    const result = await autocannon({
      url: `${BASE_URL}/api/personality-assessment/disc`,
      connections: CONCURRENT_USERS,
      duration: TEST_DURATION,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify({
        responses: [
          { questionId: 1, response: "I am detail-oriented" },
          { questionId: 2, response: "I prefer working in teams" },
          { questionId: 3, response: "I enjoy challenging tasks" }
        ]
      })
    });

    this.results.testResults.push({
      test: 'Personality Assessment Load Test',
      ...this.formatAutcannonResult(result)
    });

    return result;
  }

  async runIQAssessmentLoadTest() {
    console.log('\n🧮 TESTING IQ ASSESSMENT LOAD...');
    
    const result = await autocannon({
      url: `${BASE_URL}/api/iq-assessment/traditional`,
      connections: CONCURRENT_USERS,
      duration: TEST_DURATION,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify({
        responses: [
          { questionId: 1, answer: "A", timeSpent: 15000 },
          { questionId: 2, answer: "C", timeSpent: 22000 },
          { questionId: 3, answer: "B", timeSpent: 18000 }
        ]
      })
    });

    this.results.testResults.push({
      test: 'IQ Assessment Load Test',
      ...this.formatAutcannonResult(result)
    });

    return result;
  }

  async runAvatarSystemLoadTest() {
    console.log('\n👤 TESTING AVATAR SYSTEM LOAD...');
    
    const result = await autocannon({
      url: `${BASE_URL}/api/avatars/select`,
      connections: CONCURRENT_USERS,
      duration: TEST_DURATION,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify({
        avatarId: 'avatar_professional_001',
        userId: 'demo123'
      })
    });

    this.results.testResults.push({
      test: 'Avatar System Load Test',
      ...this.formatAutcannonResult(result)
    });

    return result;
  }

  async runVoiceToTextLoadTest() {
    console.log('\n🎤 TESTING VOICE-TO-TEXT LOAD...');
    
    const result = await autocannon({
      url: `${BASE_URL}/api/voice/transcribe`,
      connections: Math.min(CONCURRENT_USERS, 50), // Lower for audio processing
      duration: TEST_DURATION,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify({
        audioData: 'base64-mock-audio-data',
        language: 'en-US'
      })
    });

    this.results.testResults.push({
      test: 'Voice-to-Text Load Test',
      ...this.formatAutcannonResult(result)
    });

    return result;
  }

  async runAuditLoggingLoadTest() {
    console.log('\n📋 TESTING AUDIT LOGGING LOAD...');
    
    const result = await autocannon({
      url: `${BASE_URL}/api/audit/log`,
      connections: CONCURRENT_USERS,
      duration: TEST_DURATION,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify({
        action: 'AVATAR_CHANGE',
        userId: 'demo123',
        details: { previousAvatar: 'avatar_001', newAvatar: 'avatar_002' }
      })
    });

    this.results.testResults.push({
      test: 'Audit Logging Load Test',
      ...this.formatAutcannonResult(result)
    });

    return result;
  }

  formatAutcannonResult(result) {
    return {
      requests: {
        total: result.requests.total,
        average: result.requests.average,
        mean: result.requests.mean,
        stddev: result.requests.stddev,
        min: result.requests.min,
        max: result.requests.max
      },
      latency: {
        average: result.latency.average,
        mean: result.latency.mean,
        stddev: result.latency.stddev,
        min: result.latency.min,
        max: result.latency.max
      },
      throughput: {
        average: result.throughput.average,
        mean: result.throughput.mean,
        stddev: result.throughput.stddev,
        min: result.throughput.min,
        max: result.throughput.max
      },
      errors: result.errors,
      timeouts: result.timeouts,
      duration: result.duration,
      start: result.start,
      finish: result.finish
    };
  }

  calculateOverallMetrics() {
    const totalRequests = this.results.testResults.reduce((sum, test) => sum + test.requests.total, 0);
    const avgLatency = this.results.testResults.reduce((sum, test) => sum + test.latency.average, 0) / this.results.testResults.length;
    const avgThroughput = this.results.testResults.reduce((sum, test) => sum + test.throughput.average, 0) / this.results.testResults.length;
    const totalErrors = this.results.testResults.reduce((sum, test) => sum + test.errors, 0);
    const totalTimeouts = this.results.testResults.reduce((sum, test) => sum + test.timeouts, 0);

    this.results.performanceMetrics = {
      totalRequests,
      averageLatency: `${Math.round(avgLatency)}ms`,
      averageThroughput: `${Math.round(avgThroughput)} req/sec`,
      totalErrors,
      totalTimeouts,
      errorRate: `${((totalErrors / totalRequests) * 100).toFixed(2)}%`,
      successRate: `${(((totalRequests - totalErrors) / totalRequests) * 100).toFixed(2)}%`
    };

    // Performance thresholds for production readiness
    const healthyEndpoints = this.results.healthChecks.filter(h => h.healthy).length;
    const totalEndpoints = this.results.healthChecks.length;
    const healthRate = (healthyEndpoints / totalEndpoints) * 100;

    this.results.summary = {
      healthStatus: healthRate >= 90 ? 'EXCELLENT' : healthRate >= 80 ? 'GOOD' : 'NEEDS_ATTENTION',
      performanceStatus: avgLatency < 500 && totalErrors < (totalRequests * 0.01) ? 'EXCELLENT' : 'GOOD',
      productionReady: healthRate >= 90 && avgLatency < 1000 && totalErrors < (totalRequests * 0.05),
      recommendations: this.generateRecommendations(avgLatency, totalErrors, totalRequests, healthRate)
    };
  }

  generateRecommendations(avgLatency, totalErrors, totalRequests, healthRate) {
    const recommendations = [];

    if (avgLatency > 500) {
      recommendations.push('Consider implementing response caching for frequently accessed endpoints');
    }
    if (totalErrors > (totalRequests * 0.01)) {
      recommendations.push('Review error handling and implement circuit breakers for external services');
    }
    if (healthRate < 95) {
      recommendations.push('Investigate failing health checks and implement proper error recovery');
    }
    if (recommendations.length === 0) {
      recommendations.push('System performing excellently - ready for production deployment');
    }

    return recommendations;
  }

  async generateReport() {
    const reportContent = `
# EIQ™ PLATFORM - FINAL PRODUCTION VALIDATION REPORT
## Generated: ${this.results.timestamp}

## EXECUTIVE SUMMARY
**Health Status**: ${this.results.summary.healthStatus}
**Performance Status**: ${this.results.summary.performanceStatus}
**Production Ready**: ${this.results.summary.productionReady ? '✅ YES' : '❌ NEEDS REVIEW'}

## HEALTH CHECK RESULTS
${this.results.healthChecks.map(check => 
  `- ${check.endpoint}: ${check.healthy ? '✅' : '❌'} ${check.status} ${check.duration || ''}`
).join('\n')}

## LOAD TEST RESULTS
${this.results.testResults.map(test => `
### ${test.test}
- **Total Requests**: ${test.requests.total}
- **Average Latency**: ${test.latency.average}ms
- **Throughput**: ${test.throughput.average} req/sec
- **Errors**: ${test.errors}
- **Success Rate**: ${(((test.requests.total - test.errors) / test.requests.total) * 100).toFixed(2)}%
`).join('\n')}

## OVERALL PERFORMANCE METRICS
- **Total Requests Processed**: ${this.results.performanceMetrics.totalRequests}
- **Average Response Time**: ${this.results.performanceMetrics.averageLatency}
- **Average Throughput**: ${this.results.performanceMetrics.averageThroughput}
- **Error Rate**: ${this.results.performanceMetrics.errorRate}
- **Success Rate**: ${this.results.performanceMetrics.successRate}

## RECOMMENDATIONS
${this.results.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## CONCLUSION
${this.results.summary.productionReady ? 
  'The EIQ™ platform has successfully passed all production validation tests and is ready for commercial deployment.' :
  'The EIQ™ platform requires attention to the identified issues before full production deployment.'}
`;

    fs.writeFileSync('FINAL_PRODUCTION_VALIDATION_REPORT.md', reportContent);
    console.log('\n📄 Report generated: FINAL_PRODUCTION_VALIDATION_REPORT.md');
  }

  async run() {
    console.log('🚀 STARTING FINAL PRODUCTION VALIDATION...');
    console.log(`📊 Testing with ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION}`);

    try {
      // Health checks first
      await this.validateHealth();

      // Run all load tests
      await this.runPersonalityAssessmentLoadTest();
      await this.runIQAssessmentLoadTest();
      await this.runAvatarSystemLoadTest();
      await this.runVoiceToTextLoadTest();
      await this.runAuditLoggingLoadTest();

      // Calculate metrics and generate report
      this.calculateOverallMetrics();
      await this.generateReport();

      console.log('\n🎉 VALIDATION COMPLETE!');
      console.log(`✅ Production Ready: ${this.results.summary.productionReady}`);
      
      return this.results;

    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.results.errors.push(error.message);
      return this.results;
    }
  }
}

// Run the validation
const validator = new ProductionValidator();
validator.run().then(results => {
  console.log('\n📈 FINAL METRICS:');
  console.log(JSON.stringify(results.performanceMetrics, null, 2));
  process.exit(results.summary.productionReady ? 0 : 1);
}).catch(error => {
  console.error('💥 Critical validation error:', error);
  process.exit(1);
});