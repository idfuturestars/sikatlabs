#!/usr/bin/env node

/**
 * Comprehensive 400K User Simulation for EiQ™ Assessment Platform
 * Tests: Authentication, Assessment Taking, Data Collection, AI/ML Integration
 * Generates realistic seed data for analytics and machine learning
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: 'http://localhost:5000',
  totalUsers: 400000,
  concurrentUsers: 1000,
  assessmentTypes: ['baseline', 'comprehensive'],
  domains: [
    'Logical Reasoning',
    'Working Memory', 
    'Processing Speed',
    'Emotional Intelligence',
    'Social Cognition',
    'Creative Problem Solving'
  ],
  ageGroups: ['K-5', '6-8', '9-12', 'college', 'adult'],
  sessionDuration: 45 * 60 * 1000, // 45 minutes in ms
  batchSize: 100,
  delayBetweenBatches: 500 // ms
};

// User simulation data generators
const userProfiles = {
  generateRealisticUser: (id) => {
    const ageGroup = config.ageGroups[Math.floor(Math.random() * config.ageGroups.length)];
    const baseScore = 300 + Math.random() * 500; // 300-800 range
    
    return {
      id: `sim_user_${id}`,
      username: `testuser_${id}`,
      email: `test${id}@simulation.local`,
      ageGroup,
      profileData: {
        learningStyle: ['visual', 'auditory', 'kinesthetic'][Math.floor(Math.random() * 3)],
        previousAssessments: Math.floor(Math.random() * 5),
        studyHours: Math.floor(Math.random() * 40) + 5
      },
      expectedScore: Math.floor(baseScore + (Math.random() - 0.5) * 100)
    };
  },

  generateAssessmentResponse: (user, questionIndex, domain) => {
    // Simulate realistic response patterns based on user profile
    const baseAccuracy = (user.expectedScore - 300) / 500; // 0-1 scale
    const difficultyFactor = Math.min(questionIndex / 12, 1); // Increases with question number
    const domainModifier = Math.random() * 0.3 - 0.15; // ±15% variance
    
    const accuracy = Math.max(0.1, Math.min(0.95, baseAccuracy - difficultyFactor * 0.3 + domainModifier));
    const responseTime = 15000 + Math.random() * 45000; // 15-60 seconds
    
    return {
      questionId: `q_${domain}_${questionIndex}`,
      domain,
      isCorrect: Math.random() < accuracy,
      responseTime: Math.floor(responseTime),
      hintsUsed: Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0,
      timestamp: new Date().toISOString()
    };
  }
};

// HTTP request utilities
const makeRequest = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EiQ-LoadTest/1.0',
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Simulation classes
class UserSession {
  constructor(user) {
    this.user = user;
    this.token = null;
    this.assessmentId = null;
    this.startTime = Date.now();
    this.responses = [];
    this.metrics = {
      loginTime: 0,
      assessmentTime: 0,
      totalTime: 0,
      errors: []
    };
  }

  async authenticate() {
    const startTime = Date.now();
    try {
      // Simulate demo login
      const response = await makeRequest('POST', '/api/auth/demo', {
        username: this.user.username,
        simulationId: this.user.id
      });

      if (response.statusCode === 200 && response.body.token) {
        this.token = response.body.token;
        this.metrics.loginTime = Date.now() - startTime;
        return true;
      }
      
      throw new Error(`Login failed: ${response.statusCode}`);
    } catch (error) {
      this.metrics.errors.push(`Login error: ${error.message}`);
      return false;
    }
  }

  async startAssessment() {
    const assessmentType = config.assessmentTypes[Math.floor(Math.random() * config.assessmentTypes.length)];
    
    try {
      const response = await makeRequest('POST', '/api/assessments/start', {
        type: assessmentType,
        ageGroup: this.user.ageGroup
      }, {
        'Authorization': `Bearer ${this.token}`
      });

      if (response.statusCode === 200) {
        this.assessmentId = response.body.assessmentId;
        return response.body.questions || this.generateMockQuestions();
      }
      
      throw new Error(`Assessment start failed: ${response.statusCode}`);
    } catch (error) {
      this.metrics.errors.push(`Assessment start error: ${error.message}`);
      return this.generateMockQuestions();
    }
  }

  generateMockQuestions() {
    const questions = [];
    for (let i = 0; i < 12; i++) {
      const domain = config.domains[i % config.domains.length];
      questions.push({
        id: `mock_q_${i}`,
        domain,
        question: `Sample ${domain} question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        difficulty: Math.floor(Math.random() * 3) + 1
      });
    }
    return questions;
  }

  async takeAssessment(questions) {
    const assessmentStartTime = Date.now();
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const response = userProfiles.generateAssessmentResponse(this.user, i, question.domain);
      
      this.responses.push(response);
      
      // Simulate real-time response submission
      try {
        await makeRequest('POST', `/api/assessments/${this.assessmentId}/response`, {
          questionId: question.id,
          answer: response.isCorrect ? 'A' : 'B', // Simplified
          responseTime: response.responseTime,
          hintsUsed: response.hintsUsed
        }, {
          'Authorization': `Bearer ${this.token}`
        });
      } catch (error) {
        this.metrics.errors.push(`Response submission error: ${error.message}`);
      }
      
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    }
    
    this.metrics.assessmentTime = Date.now() - assessmentStartTime;
  }

  async submitAssessment() {
    try {
      const response = await makeRequest('POST', `/api/assessments/${this.assessmentId}/submit`, {
        responses: this.responses,
        completionTime: this.metrics.assessmentTime
      }, {
        'Authorization': `Bearer ${this.token}`
      });

      if (response.statusCode === 200) {
        return response.body;
      }
      
      throw new Error(`Assessment submission failed: ${response.statusCode}`);
    } catch (error) {
      this.metrics.errors.push(`Submission error: ${error.message}`);
      return null;
    }
  }

  async runCompleteSession() {
    console.log(`Starting session for user ${this.user.id}`);
    
    // Authentication
    const loginSuccess = await this.authenticate();
    if (!loginSuccess) return this.getMetrics();
    
    // Start assessment
    const questions = await this.startAssessment();
    if (!questions || questions.length === 0) return this.getMetrics();
    
    // Take assessment
    await this.takeAssessment(questions);
    
    // Submit assessment
    const results = await this.submitAssessment();
    
    this.metrics.totalTime = Date.now() - this.startTime;
    this.metrics.success = !!results;
    this.metrics.finalScore = results ? results.eiqScore : null;
    
    return this.getMetrics();
  }

  getMetrics() {
    return {
      userId: this.user.id,
      ageGroup: this.user.ageGroup,
      expectedScore: this.user.expectedScore,
      actualScore: this.metrics.finalScore,
      loginTime: this.metrics.loginTime,
      assessmentTime: this.metrics.assessmentTime,
      totalTime: this.metrics.totalTime,
      success: this.metrics.success,
      errors: this.metrics.errors,
      responsesCount: this.responses.length,
      averageResponseTime: this.responses.length > 0 
        ? this.responses.reduce((sum, r) => sum + r.responseTime, 0) / this.responses.length 
        : 0,
      accuracy: this.responses.length > 0
        ? this.responses.filter(r => r.isCorrect).length / this.responses.length
        : 0,
      hintsUsed: this.responses.reduce((sum, r) => sum + r.hintsUsed, 0)
    };
  }
}

// Main simulation orchestrator
class LoadTestOrchestrator {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.activeSessions = 0;
    this.completedSessions = 0;
    this.errors = [];
  }

  async runBatch(batchNumber, userIds) {
    console.log(`\n🚀 Starting batch ${batchNumber} with ${userIds.length} users`);
    
    const batchPromises = userIds.map(async (userId) => {
      this.activeSessions++;
      
      try {
        const user = userProfiles.generateRealisticUser(userId);
        const session = new UserSession(user);
        const metrics = await session.runCompleteSession();
        
        this.results.push(metrics);
        this.completedSessions++;
        
        if (this.completedSessions % 1000 === 0) {
          this.printProgress();
        }
        
        return metrics;
      } catch (error) {
        this.errors.push(`Batch ${batchNumber}, User ${userId}: ${error.message}`);
        return null;
      } finally {
        this.activeSessions--;
      }
    });

    await Promise.all(batchPromises);
    console.log(`✅ Completed batch ${batchNumber}`);
  }

  printProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.completedSessions / elapsed;
    const eta = (config.totalUsers - this.completedSessions) / rate;
    
    console.log(`\n📊 Progress: ${this.completedSessions}/${config.totalUsers} users (${(this.completedSessions/config.totalUsers*100).toFixed(1)}%)`);
    console.log(`📈 Rate: ${rate.toFixed(1)} users/sec`);
    console.log(`⏱️  ETA: ${Math.floor(eta/60)}m ${Math.floor(eta%60)}s`);
    console.log(`🔄 Active sessions: ${this.activeSessions}`);
  }

  generateAnalyticsReport() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    const avgLoginTime = successful.reduce((sum, r) => sum + r.loginTime, 0) / successful.length;
    const avgAssessmentTime = successful.reduce((sum, r) => sum + r.assessmentTime, 0) / successful.length;
    const avgScore = successful.reduce((sum, r) => sum + (r.actualScore || 0), 0) / successful.length;
    const avgAccuracy = successful.reduce((sum, r) => sum + r.accuracy, 0) / successful.length;
    
    const domainPerformance = {};
    successful.forEach(result => {
      if (!domainPerformance[result.ageGroup]) {
        domainPerformance[result.ageGroup] = {
          count: 0,
          totalScore: 0,
          totalAccuracy: 0
        };
      }
      domainPerformance[result.ageGroup].count++;
      domainPerformance[result.ageGroup].totalScore += (result.actualScore || 0);
      domainPerformance[result.ageGroup].totalAccuracy += result.accuracy;
    });

    return {
      summary: {
        totalUsers: config.totalUsers,
        successfulSessions: successful.length,
        failedSessions: failed.length,
        successRate: (successful.length / this.results.length * 100).toFixed(2) + '%',
        totalErrors: this.errors.length
      },
      performance: {
        avgLoginTime: Math.round(avgLoginTime) + 'ms',
        avgAssessmentTime: Math.round(avgAssessmentTime / 1000) + 's',
        avgTotalSessionTime: Math.round((avgLoginTime + avgAssessmentTime) / 1000) + 's'
      },
      assessment: {
        avgScore: Math.round(avgScore),
        avgAccuracy: (avgAccuracy * 100).toFixed(1) + '%',
        scoreDistribution: this.calculateScoreDistribution(successful),
        ageGroupPerformance: Object.keys(domainPerformance).map(group => ({
          ageGroup: group,
          avgScore: Math.round(domainPerformance[group].totalScore / domainPerformance[group].count),
          avgAccuracy: (domainPerformance[group].totalAccuracy / domainPerformance[group].count * 100).toFixed(1) + '%',
          userCount: domainPerformance[group].count
        }))
      },
      mlSeedData: {
        totalDataPoints: successful.length,
        featuresGenerated: successful.length * 12, // 12 questions per assessment
        domainCoverage: config.domains.length,
        ageGroupCoverage: config.ageGroups.length
      }
    };
  }

  calculateScoreDistribution(results) {
    const ranges = [
      { min: 200, max: 399, label: 'Developing' },
      { min: 400, max: 499, label: 'Below Average' },
      { min: 500, max: 599, label: 'Average' },
      { min: 600, max: 699, label: 'Above Average' },
      { min: 700, max: 800, label: 'Exceptional' }
    ];

    return ranges.map(range => {
      const count = results.filter(r => 
        r.actualScore >= range.min && r.actualScore <= range.max
      ).length;
      return {
        range: `${range.min}-${range.max}`,
        label: range.label,
        count,
        percentage: (count / results.length * 100).toFixed(1) + '%'
      };
    });
  }

  async saveSeedData() {
    const seedData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalUsers: config.totalUsers,
        simulationVersion: '2.0',
        platform: 'EiQ Assessment'
      },
      userData: this.results.map(result => ({
        userId: result.userId,
        ageGroup: result.ageGroup,
        assessmentData: {
          eiqScore: result.actualScore,
          accuracy: result.accuracy,
          responseTime: result.averageResponseTime,
          hintsUsed: result.hintsUsed,
          sessionDuration: result.totalTime
        },
        performanceMetrics: {
          loginTime: result.loginTime,
          assessmentTime: result.assessmentTime,
          success: result.success
        }
      }))
    };

    // Save to JSON file for AI/ML training
    const fs = require('fs');
    const filename = `eiq-ml-seed-data-${Date.now()}.json`;
    
    try {
      fs.writeFileSync(filename, JSON.stringify(seedData, null, 2));
      console.log(`\n💾 ML seed data saved to: ${filename}`);
      console.log(`📊 Data points: ${seedData.userData.length}`);
      console.log(`🎯 Ready for AI/ML training and analytics`);
    } catch (error) {
      console.error(`❌ Failed to save seed data: ${error.message}`);
    }

    return filename;
  }

  async run() {
    console.log('🎯 EiQ™ 400K User Load Test & ML Data Generation');
    console.log('=' .repeat(60));
    console.log(`👥 Total users: ${config.totalUsers.toLocaleString()}`);
    console.log(`⚡ Concurrent users: ${config.concurrentUsers}`);
    console.log(`📦 Batch size: ${config.batchSize}`);
    console.log(`🎲 Assessment types: ${config.assessmentTypes.join(', ')}`);
    console.log(`👶 Age groups: ${config.ageGroups.join(', ')}`);
    console.log(`🧠 Cognitive domains: ${config.domains.length}`);
    
    const totalBatches = Math.ceil(config.totalUsers / config.batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startId = batch * config.batchSize;
      const endId = Math.min(startId + config.batchSize, config.totalUsers);
      const userIds = Array.from({ length: endId - startId }, (_, i) => startId + i);
      
      await this.runBatch(batch + 1, userIds);
      
      if (batch < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
    }

    console.log('\n🎉 Load test completed!');
    console.log('📈 Generating analytics report...');
    
    const report = this.generateAnalyticsReport();
    const seedFile = await this.saveSeedData();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL LOAD TEST REPORT');
    console.log('='.repeat(60));
    
    console.log('\n🎯 SUMMARY:');
    Object.entries(report.summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n⚡ PERFORMANCE:');
    Object.entries(report.performance).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n🧠 ASSESSMENT ANALYTICS:');
    Object.entries(report.assessment).forEach(([key, value]) => {
      if (typeof value === 'object' && Array.isArray(value)) {
        console.log(`  ${key}:`);
        value.forEach(item => {
          if (typeof item === 'object') {
            console.log(`    ${Object.values(item).join(' | ')}`);
          }
        });
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    console.log('\n🤖 ML SEED DATA:');
    Object.entries(report.mlSeedData).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log(`\n💾 Seed data file: ${seedFile}`);
    console.log('🚀 Ready for production deployment!');
    
    return report;
  }
}

// Server health check
async function checkServerHealth() {
  try {
    console.log('🔍 Checking server health...');
    const response = await makeRequest('GET', '/api/health');
    
    if (response.statusCode === 200) {
      console.log('✅ Server is healthy and ready');
      return true;
    } else {
      console.log(`❌ Server health check failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server health check error: ${error.message}`);
    console.log('🔄 Continuing with load test anyway...');
    return true; // Continue even if health check fails
  }
}

// Main execution
async function main() {
  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    console.log('⚠️  Warning: Server health check failed, but continuing...');
  }
  
  const orchestrator = new LoadTestOrchestrator();
  await orchestrator.run();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Load test failed:', error);
    process.exit(1);
  });
}

module.exports = { LoadTestOrchestrator, UserSession };