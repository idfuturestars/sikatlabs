#!/usr/bin/env node

/**
 * EIQ™ 450K User Behavioral Learning Simulation
 * Advanced AI/ML system testing with behavioral adaptation focus
 * 
 * Features tested:
 * - Behavioral learning from user responses
 * - AI-adapted question generation
 * - EIQ prediction and improvement tracking
 * - Personalized learning paths
 * - Multi-AI provider integration
 * - Progressive difficulty adaptation
 */

import fs from 'fs';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000';
const SIMULATION_SIZE = 450000; // 450K users
const CONCURRENT_USERS = 75; // Higher concurrency for behavioral testing
const BATCH_SIZE = 1500; // Larger batches for efficiency

// Enhanced behavioral learning patterns
const LEARNING_BEHAVIORS = {
  VISUAL_LEARNER: {
    preferredQuestionTypes: ['spatial_reasoning', 'pattern_recognition'],
    hintPreference: 'visual',
    responseTimePattern: 'deliberate',
    improvementRate: 1.3
  },
  ANALYTICAL_THINKER: {
    preferredQuestionTypes: ['mathematical_reasoning', 'logical_deduction'],
    hintPreference: 'step_by_step',
    responseTimePattern: 'systematic',
    improvementRate: 1.5
  },
  CREATIVE_PROBLEM_SOLVER: {
    preferredQuestionTypes: ['creative_thinking', 'unconventional_reasoning'],
    hintPreference: 'conceptual',
    responseTimePattern: 'intuitive',
    improvementRate: 1.2
  },
  QUICK_PROCESSOR: {
    preferredQuestionTypes: ['processing_speed', 'rapid_comprehension'],
    hintPreference: 'minimal',
    responseTimePattern: 'fast',
    improvementRate: 1.1
  },
  DEEP_THINKER: {
    preferredQuestionTypes: ['complex_reasoning', 'abstract_concepts'],
    hintPreference: 'detailed',
    responseTimePattern: 'thorough',
    improvementRate: 1.4
  }
};

const COGNITIVE_DOMAINS = [
  'mathematical_reasoning', 'verbal_comprehension', 'spatial_reasoning',
  'processing_speed', 'working_memory', 'logical_reasoning',
  'pattern_recognition', 'abstract_reasoning', 'creative_thinking',
  'critical_analysis', 'problem_solving', 'conceptual_understanding'
];

const AGE_GROUPS = [
  { range: '6-12', label: 'K-6 Elementary', weight: 0.25, baseIQ: 95 },
  { range: '13-15', label: 'Middle School', weight: 0.20, baseIQ: 100 },
  { range: '16-18', label: 'High School', weight: 0.20, baseIQ: 105 },
  { range: '19-25', label: 'College/University', weight: 0.20, baseIQ: 110 },
  { range: '26-65', label: 'Adult Professional', weight: 0.15, baseIQ: 108 }
];

// Simulation state
let simulationResults = {
  startTime: new Date().toISOString(),
  totalUsers: SIMULATION_SIZE,
  processedUsers: 0,
  successfulUsers: 0,
  failedUsers: 0,
  avgProcessingTime: 0,
  peakConcurrency: 0,
  behavioralLearningData: [],
  aiProviderUsage: { anthropic: 0, gemini: 0, openai: 0 },
  cognitiveGrowthTracking: [],
  personalizedRecommendations: [],
  errors: [],
  checkpoints: []
};

// Utility functions
function generateRandomUser(userIndex) {
  const ageGroup = AGE_GROUPS[Math.floor(Math.random() * AGE_GROUPS.length)];
  const learningBehavior = Object.keys(LEARNING_BEHAVIORS)[Math.floor(Math.random() * Object.keys(LEARNING_BEHAVIORS).length)];
  
  return {
    username: `behavioral_sim_user_${userIndex}_${Date.now()}`,
    email: `behavioral_test_${userIndex}_${Date.now()}@simulation.ai`,
    firstName: `BehavioralUser${userIndex}`,
    lastName: 'TestSimulation',
    password: 'SimulationPass2025!',
    profile: {
      ageGroup: ageGroup.range,
      educationLevel: ageGroup.label,
      baselineIQ: ageGroup.baseIQ + Math.floor(Math.random() * 30) - 15,
      learningBehavior,
      preferredDomains: LEARNING_BEHAVIORS[learningBehavior].preferredQuestionTypes
    }
  };
}

function generateBehavioralResponse(user, questionDomain, difficulty) {
  const behavior = LEARNING_BEHAVIORS[user.profile.learningBehavior];
  const isPreferredDomain = behavior.preferredQuestionTypes.includes(questionDomain);
  
  // Simulate realistic response patterns
  const baseAccuracy = isPreferredDomain ? 0.75 : 0.60;
  const difficultyAdjustment = (6 - difficulty) * 0.05;
  const finalAccuracy = Math.min(0.95, baseAccuracy + difficultyAdjustment);
  
  const isCorrect = Math.random() < finalAccuracy;
  const responseTime = generateResponseTime(behavior.responseTimePattern, difficulty);
  
  return {
    questionId: `behavioral_q_${questionDomain}_${difficulty}_${Date.now()}`,
    domain: questionDomain,
    difficulty,
    isCorrect,
    responseTime,
    confidenceLevel: isCorrect ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4 + 0.2,
    hintUsed: Math.random() < 0.3,
    sessionContext: {
      assessmentType: 'behavioral_adaptive',
      currentScore: user.profile.baselineIQ + (isCorrect ? 5 : -2),
      learningStyle: user.profile.learningBehavior
    }
  };
}

function generateResponseTime(pattern, difficulty) {
  const baseTimes = {
    fast: 15000,      // 15 seconds
    deliberate: 45000, // 45 seconds
    systematic: 75000, // 75 seconds
    intuitive: 30000,  // 30 seconds
    thorough: 120000   // 2 minutes
  };
  
  const baseTime = baseTimes[pattern] || 45000;
  const difficultyMultiplier = 1 + (difficulty - 3) * 0.2;
  const variation = Math.random() * 0.4 + 0.8; // ±20% variation
  
  return Math.floor(baseTime * difficultyMultiplier * variation);
}

async function makeRequest(url, method = 'GET', body = null, headers = {}) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok && response.status !== 401) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { status: response.status, data, success: response.ok };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function simulateBehavioralLearningSession(user, authToken) {
  const sessionsCount = Math.floor(Math.random() * 5) + 3; // 3-7 sessions
  const behavioralData = [];
  
  for (let session = 0; session < sessionsCount; session++) {
    const domain = COGNITIVE_DOMAINS[Math.floor(Math.random() * COGNITIVE_DOMAINS.length)];
    const difficulty = Math.floor(Math.random() * 5) + 1;
    
    // Generate behavioral response
    const response = generateBehavioralResponse(user, domain, difficulty);
    
    // Submit behavioral learning data
    const learningResponse = await makeRequest(
      `${BASE_URL}/api/behavioral-learning/learn-response`,
      'POST',
      response,
      { Authorization: `Bearer ${authToken}` }
    );
    
    if (learningResponse.success) {
      behavioralData.push({
        domain,
        difficulty,
        isCorrect: response.isCorrect,
        responseTime: response.responseTime,
        learningBehavior: user.profile.learningBehavior
      });
      
      // Track AI provider usage
      simulationResults.aiProviderUsage.anthropic++;
    }
    
    // Generate adaptive question based on behavior
    const adaptiveQuestionResponse = await makeRequest(
      `${BASE_URL}/api/behavioral-learning/adaptive-question`,
      'POST',
      { targetDomain: domain },
      { Authorization: `Bearer ${authToken}` }
    );
    
    if (adaptiveQuestionResponse.success) {
      simulationResults.aiProviderUsage.gemini++;
    }
    
    // Get personalized hints
    const hintsResponse = await makeRequest(
      `${BASE_URL}/api/behavioral-learning/personalized-hints`,
      'POST',
      {
        questionId: response.questionId,
        context: {
          currentDifficulty: difficulty,
          domain,
          learningStyle: user.profile.learningBehavior
        }
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    if (hintsResponse.success) {
      simulationResults.aiProviderUsage.openai++;
    }
  }
  
  // Get EIQ growth prediction
  const predictionResponse = await makeRequest(
    `${BASE_URL}/api/behavioral-learning/eiq-prediction`,
    'GET',
    null,
    { Authorization: `Bearer ${authToken}` }
  );
  
  if (predictionResponse.success && predictionResponse.data.prediction) {
    simulationResults.cognitiveGrowthTracking.push({
      userId: user.username,
      learningBehavior: user.profile.learningBehavior,
      currentIQ: user.profile.baselineIQ,
      predictedGrowth: predictionResponse.data.prediction.predictedGrowth || 0,
      confidenceLevel: predictionResponse.data.prediction.confidenceLevel || 0.5
    });
  }
  
  // Get behavioral insights
  const insightsResponse = await makeRequest(
    `${BASE_URL}/api/behavioral-learning/behavioral-insights`,
    'GET',
    null,
    { Authorization: `Bearer ${authToken}` }
  );
  
  if (insightsResponse.success && insightsResponse.data.insights) {
    simulationResults.personalizedRecommendations.push({
      userId: user.username,
      learningStyle: insightsResponse.data.insights.learningStyle,
      recommendedDomains: insightsResponse.data.insights.recommendedDomains || [],
      improvementAreas: insightsResponse.data.insights.improvementAreas || []
    });
  }
  
  return behavioralData;
}

async function processUserBatch(users, batchIndex) {
  const startTime = Date.now();
  const promises = users.map(async (user, userIndex) => {
    const globalIndex = batchIndex * BATCH_SIZE + userIndex;
    
    try {
      // Register user
      const registerResponse = await makeRequest(`${BASE_URL}/api/register`, 'POST', user);
      
      let authToken = null;
      if (registerResponse.success && registerResponse.data.token) {
        authToken = registerResponse.data.token;
      } else {
        // Try login if registration failed
        const loginResponse = await makeRequest(`${BASE_URL}/api/login`, 'POST', {
          username: user.username,
          password: user.password
        });
        
        if (loginResponse.success && loginResponse.data.token) {
          authToken = loginResponse.data.token;
        }
      }
      
      if (authToken) {
        // Simulate behavioral learning sessions
        const behavioralData = await simulateBehavioralLearningSession(user, authToken);
        
        simulationResults.behavioralLearningData.push({
          userId: user.username,
          learningBehavior: user.profile.learningBehavior,
          ageGroup: user.profile.ageGroup,
          sessionsCompleted: behavioralData.length,
          avgAccuracy: behavioralData.reduce((acc, curr) => acc + (curr.isCorrect ? 1 : 0), 0) / behavioralData.length,
          avgResponseTime: behavioralData.reduce((acc, curr) => acc + curr.responseTime, 0) / behavioralData.length
        });
        
        simulationResults.successfulUsers++;
      } else {
        simulationResults.failedUsers++;
        simulationResults.errors.push(`Failed to authenticate user ${globalIndex}`);
      }
      
      simulationResults.processedUsers++;
      
      // Progress logging
      if (globalIndex % 1000 === 0) {
        const elapsed = (Date.now() - simulationResults.startTime) / 1000;
        const rate = simulationResults.processedUsers / elapsed;
        console.log(`[PROGRESS] Processed ${simulationResults.processedUsers}/${SIMULATION_SIZE} users (${rate.toFixed(1)} users/sec)`);
      }
      
    } catch (error) {
      simulationResults.failedUsers++;
      simulationResults.errors.push(`User ${globalIndex}: ${error.message}`);
    }
  });
  
  await Promise.all(promises);
  
  const batchTime = Date.now() - startTime;
  console.log(`[BATCH ${batchIndex + 1}] Completed ${users.length} users in ${batchTime}ms`);
}

async function saveCheckpoint(checkpointIndex) {
  const checkpoint = {
    timestamp: new Date().toISOString(),
    processedUsers: simulationResults.processedUsers,
    successRate: (simulationResults.successfulUsers / simulationResults.processedUsers * 100).toFixed(2),
    behavioralDataPoints: simulationResults.behavioralLearningData.length,
    cognitiveGrowthPredictions: simulationResults.cognitiveGrowthTracking.length,
    aiProviderUsage: simulationResults.aiProviderUsage
  };
  
  const filename = `behavioral-learning-checkpoint-${checkpointIndex * BATCH_SIZE}.json`;
  fs.writeFileSync(filename, JSON.stringify(checkpoint, null, 2));
  console.log(`[CHECKPOINT] Saved progress to ${filename}`);
  
  simulationResults.checkpoints.push(checkpoint);
}

async function runBehavioralLearningSimulation() {
  console.log('🧠 Starting 450K Behavioral Learning Simulation...\n');
  console.log(`Target Users: ${SIMULATION_SIZE.toLocaleString()}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Learning Behaviors: ${Object.keys(LEARNING_BEHAVIORS).length}`);
  console.log(`Cognitive Domains: ${COGNITIVE_DOMAINS.length}\n`);
  
  simulationResults.startTime = Date.now();
  const totalBatches = Math.ceil(SIMULATION_SIZE / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStartTime = Date.now();
    
    // Generate user batch
    const batchSize = Math.min(BATCH_SIZE, SIMULATION_SIZE - batchIndex * BATCH_SIZE);
    const users = Array.from({ length: batchSize }, (_, i) => 
      generateRandomUser(batchIndex * BATCH_SIZE + i)
    );
    
    // Process batch with concurrency control
    const chunks = [];
    for (let i = 0; i < users.length; i += CONCURRENT_USERS) {
      chunks.push(users.slice(i, i + CONCURRENT_USERS));
    }
    
    for (const chunk of chunks) {
      await processUserBatch(chunk, batchIndex);
    }
    
    // Update peak concurrency tracking
    simulationResults.peakConcurrency = Math.max(simulationResults.peakConcurrency, CONCURRENT_USERS);
    
    // Save checkpoint every 10 batches
    if ((batchIndex + 1) % 10 === 0) {
      await saveCheckpoint(batchIndex);
    }
    
    const batchTime = Date.now() - batchStartTime;
    const avgTimePerUser = batchTime / batchSize;
    
    console.log(`[BATCH COMPLETE] ${batchIndex + 1}/${totalBatches} | Time: ${batchTime}ms | Avg/User: ${avgTimePerUser.toFixed(1)}ms`);
  }
  
  // Final results compilation
  const totalTime = Date.now() - simulationResults.startTime;
  simulationResults.avgProcessingTime = totalTime / simulationResults.processedUsers;
  simulationResults.endTime = new Date().toISOString();
  simulationResults.duration = `${(totalTime / 1000).toFixed(1)}s`;
  
  // Generate comprehensive report
  const report = {
    ...simulationResults,
    summary: {
      totalUsers: SIMULATION_SIZE,
      successfulUsers: simulationResults.successfulUsers,
      failedUsers: simulationResults.failedUsers,
      successRate: `${(simulationResults.successfulUsers / SIMULATION_SIZE * 100).toFixed(2)}%`,
      avgProcessingRate: `${(simulationResults.processedUsers / (totalTime / 1000)).toFixed(1)} users/sec`,
      behavioralDataGenerated: simulationResults.behavioralLearningData.length,
      cognitiveGrowthPredictions: simulationResults.cognitiveGrowthTracking.length,
      personalizedRecommendations: simulationResults.personalizedRecommendations.length,
      totalAIProviderCalls: Object.values(simulationResults.aiProviderUsage).reduce((a, b) => a + b, 0)
    },
    learningBehaviorAnalysis: analyzeLearningBehaviors(),
    cognitiveGrowthInsights: analyzeCognitiveGrowth(),
    aiProviderPerformance: analyzeAIProviderUsage()
  };
  
  // Save final report
  const reportFilename = `eiq-450k-behavioral-learning-simulation-${Date.now()}.json`;
  fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 450K BEHAVIORAL LEARNING SIMULATION COMPLETED');
  console.log('='.repeat(80));
  console.log(`Total Time: ${report.duration}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  console.log(`Processing Rate: ${report.summary.avgProcessingRate}`);
  console.log(`Behavioral Data Points: ${report.summary.behavioralDataGenerated.toLocaleString()}`);
  console.log(`Cognitive Growth Predictions: ${report.summary.cognitiveGrowthPredictions.toLocaleString()}`);
  console.log(`AI Provider Calls: ${report.summary.totalAIProviderCalls.toLocaleString()}`);
  console.log(`Report saved: ${reportFilename}`);
  console.log('='.repeat(80));
  
  return report.summary.successRate === '100.00%';
}

function analyzeLearningBehaviors() {
  const behaviorStats = {};
  
  simulationResults.behavioralLearningData.forEach(data => {
    if (!behaviorStats[data.learningBehavior]) {
      behaviorStats[data.learningBehavior] = {
        count: 0,
        totalAccuracy: 0,
        totalResponseTime: 0
      };
    }
    
    behaviorStats[data.learningBehavior].count++;
    behaviorStats[data.learningBehavior].totalAccuracy += data.avgAccuracy;
    behaviorStats[data.learningBehavior].totalResponseTime += data.avgResponseTime;
  });
  
  Object.keys(behaviorStats).forEach(behavior => {
    const stats = behaviorStats[behavior];
    stats.avgAccuracy = stats.totalAccuracy / stats.count;
    stats.avgResponseTime = stats.totalResponseTime / stats.count;
  });
  
  return behaviorStats;
}

function analyzeCognitiveGrowth() {
  const growthAnalysis = {
    totalPredictions: simulationResults.cognitiveGrowthTracking.length,
    avgPredictedGrowth: 0,
    avgConfidence: 0,
    behaviorGrowthRates: {}
  };
  
  let totalGrowth = 0;
  let totalConfidence = 0;
  
  simulationResults.cognitiveGrowthTracking.forEach(prediction => {
    totalGrowth += prediction.predictedGrowth;
    totalConfidence += prediction.confidenceLevel;
    
    if (!growthAnalysis.behaviorGrowthRates[prediction.learningBehavior]) {
      growthAnalysis.behaviorGrowthRates[prediction.learningBehavior] = [];
    }
    growthAnalysis.behaviorGrowthRates[prediction.learningBehavior].push(prediction.predictedGrowth);
  });
  
  growthAnalysis.avgPredictedGrowth = totalGrowth / growthAnalysis.totalPredictions;
  growthAnalysis.avgConfidence = totalConfidence / growthAnalysis.totalPredictions;
  
  return growthAnalysis;
}

function analyzeAIProviderUsage() {
  const total = Object.values(simulationResults.aiProviderUsage).reduce((a, b) => a + b, 0);
  return {
    total,
    distribution: {
      anthropic: `${(simulationResults.aiProviderUsage.anthropic / total * 100).toFixed(1)}%`,
      gemini: `${(simulationResults.aiProviderUsage.gemini / total * 100).toFixed(1)}%`,
      openai: `${(simulationResults.aiProviderUsage.openai / total * 100).toFixed(1)}%`
    }
  };
}

// Execute simulation
runBehavioralLearningSimulation()
  .then(success => {
    console.log(`\n🏁 Simulation completed. Success: ${success}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Simulation failed:', error);
    process.exit(1);
  });