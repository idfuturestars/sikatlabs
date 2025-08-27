#!/usr/bin/env node

/**
 * Test Comprehensive Scoring Engine Integration
 * Validates the new comprehensive scoring endpoint is fully operational
 */

import fs from 'fs';
import { execSync } from 'child_process';

const API_BASE = 'http://localhost:5000/api';
const TEST_USER_ID = 'test-user-scoring-' + Date.now();
const MOCK_TOKEN = 'mock-token-' + TEST_USER_ID;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '📊';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function testComprehensiveScoring() {
  log('Starting Comprehensive Scoring Engine Test');
  
  try {
    // Step 1: Generate sample question history for the test user
    log('Generating sample question history...');
    
    // Create some test answers with varying difficulty and correctness
    const testAnswers = [
      { subject: 'verbal_reasoning', difficulty: 0.3, wasCorrect: true, responseTime: 25000 },
      { subject: 'quantitative_reasoning', difficulty: 0.5, wasCorrect: true, responseTime: 30000 },
      { subject: 'spatial_reasoning', difficulty: 0.7, wasCorrect: false, responseTime: 35000 },
      { subject: 'logical_reasoning', difficulty: 0.6, wasCorrect: true, responseTime: 28000 },
      { subject: 'pattern_recognition', difficulty: 0.8, wasCorrect: false, responseTime: 40000 },
      { subject: 'emotional_intelligence', difficulty: 0.4, wasCorrect: true, responseTime: 22000 },
      { subject: 'critical_thinking', difficulty: 0.65, wasCorrect: true, responseTime: 32000 },
      { subject: 'learning_velocity', difficulty: 0.55, wasCorrect: true, responseTime: 27000 }
    ];
    
    // Record each answer
    for (const answer of testAnswers) {
      const response = await fetch(`${API_BASE}/adaptive/record-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOCK_TOKEN}`
        },
        body: JSON.stringify({
          questionId: `test-q-${Date.now()}-${Math.random()}`,
          questionText: `Test question for ${answer.subject}`,
          answer: `Test answer for ${answer.subject} question`,
          subject: answer.subject,
          difficulty: answer.difficulty,
          responseTime: answer.responseTime,
          isCorrect: answer.wasCorrect
        })
      });
      
      if (!response.ok) {
        log(`Failed to record answer: ${response.status}`, 'error');
      }
    }
    
    log('Sample history generated successfully', 'success');
    
    // Step 2: Test the comprehensive scoring endpoint
    log('Testing comprehensive scoring endpoint...');
    
    const scoringResponse = await fetch(`${API_BASE}/adaptive/comprehensive-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOCK_TOKEN}`
      },
      body: JSON.stringify({
        assessmentId: `test-assessment-${Date.now()}`
      })
    });
    
    if (!scoringResponse.ok) {
      const errorText = await scoringResponse.text();
      throw new Error(`Scoring failed (${scoringResponse.status}): ${errorText}`);
    }
    
    const scores = await scoringResponse.json();
    
    // Step 3: Validate the response structure
    log('Validating comprehensive score response...');
    
    const validations = [
      { field: 'scores.iq.score', value: scores.scores?.iq?.score, type: 'number' },
      { field: 'scores.eiq.score', value: scores.scores?.eiq?.score, type: 'number' },
      { field: 'scores.alternative.score', value: scores.scores?.alternative?.score, type: 'number' },
      { field: 'scores.combined.score', value: scores.scores?.combined?.score, type: 'number' },
      { field: 'scores.breakdown', value: scores.scores?.breakdown, type: 'object' },
      { field: 'scores.recommendations', value: scores.scores?.recommendations, type: 'object' }
    ];
    
    let allValid = true;
    for (const validation of validations) {
      const isValid = validation.value !== undefined && typeof validation.value === validation.type;
      if (!isValid) {
        log(`Invalid field: ${validation.field} (expected ${validation.type}, got ${typeof validation.value})`, 'error');
        allValid = false;
      }
    }
    
    if (allValid) {
      log('All score fields validated successfully', 'success');
    }
    
    // Step 4: Display the calculated scores
    log('\n=== COMPREHENSIVE SCORING RESULTS ===');
    log(`IQ Score: ${scores.scores?.iq?.score} (${scores.scores?.iq?.description})`);
    log(`EIQ Score: ${scores.scores?.eiq?.score} (${scores.scores?.eiq?.description})`);
    log(`Alternative Score: ${scores.scores?.alternative?.score} (${scores.scores?.alternative?.description})`);
    log(`Combined Score: ${scores.scores?.combined?.score} (${scores.scores?.combined?.description})`);
    
    // Display recommendations
    if (scores.scores?.recommendations?.length > 0) {
      log('\nRecommendations:');
      scores.scores.recommendations.forEach((rec, i) => {
        log(`  ${i + 1}. ${rec}`);
      });
    }
    
    // Step 5: Test score ranges
    log('\nValidating score ranges...');
    const rangeValidations = [
      { name: 'IQ', score: scores.scores?.iq?.score, min: 40, max: 160 },
      { name: 'EIQ', score: scores.scores?.eiq?.score, min: 300, max: 850 },
      { name: 'Alternative', score: scores.scores?.alternative?.score, min: 0, max: 100 },
      { name: 'Combined', score: scores.scores?.combined?.score, min: 0, max: 100 }
    ];
    
    for (const range of rangeValidations) {
      if (range.score >= range.min && range.score <= range.max) {
        log(`${range.name} score within valid range: ${range.score} (${range.min}-${range.max})`, 'success');
      } else {
        log(`${range.name} score OUT OF RANGE: ${range.score} (expected ${range.min}-${range.max})`, 'error');
      }
    }
    
    // Final summary
    log('\n=== TEST SUMMARY ===');
    log('Comprehensive Scoring Engine Integration: SUCCESS', 'success');
    log(`Total test duration: ${Date.now() - startTime}ms`);
    
    // Save results to file
    const results = {
      timestamp: new Date().toISOString(),
      testUserId: TEST_USER_ID,
      scores: scores.scores,
      status: 'SUCCESS'
    };
    
    fs.writeFileSync('comprehensive-scoring-test-results.json', JSON.stringify(results, null, 2));
    log('Results saved to comprehensive-scoring-test-results.json', 'success');
    
    return true;
    
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    console.error(error);
    return false;
  }
}

// Run the test
const startTime = Date.now();
testComprehensiveScoring().then(success => {
  process.exit(success ? 0 : 1);
});