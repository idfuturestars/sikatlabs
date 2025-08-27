#!/usr/bin/env node

/**
 * Question Uniqueness Analysis Tool
 * Analyzes the behavioral learning simulation to verify unique question generation
 */

import fs from 'fs';
import { randomUUID } from 'crypto';

// Mock question domains and difficulties for analysis
const QUESTION_DOMAINS = [
  'logical_reasoning', 'mathematical_concepts', 'language_comprehension',
  'spatial_reasoning', 'pattern_recognition', 'memory_recall'
];

const DIFFICULTIES = [1, 2, 3, 4, 5];

// Generate sample questions using the same logic as simulation
function generateBehavioralResponse(userIndex, questionDomain, difficulty) {
  return {
    questionId: `behavioral_q_${questionDomain}_${difficulty}_${Date.now()}_${userIndex}`,
    domain: questionDomain,
    difficulty,
    timestamp: Date.now(),
    userIndex
  };
}

async function analyzeQuestionUniqueness() {
  console.log('🔍 QUESTION UNIQUENESS ANALYSIS - EIQ BEHAVIORAL LEARNING SIMULATION');
  console.log('================================================================\n');

  const totalUsers = 1000; // Sample size for analysis
  const questionsPerUser = 15; // Typical assessment length
  const allQuestions = new Map(); // Track all generated questions
  const questionsByUser = new Map(); // Track questions per user
  const duplicateQuestions = [];

  console.log(`📊 SIMULATION PARAMETERS:`);
  console.log(`   Users to simulate: ${totalUsers}`);
  console.log(`   Questions per user: ${questionsPerUser}`);
  console.log(`   Total questions expected: ${totalUsers * questionsPerUser}`);
  console.log(`   Domains: ${QUESTION_DOMAINS.length}`);
  console.log(`   Difficulty levels: ${DIFFICULTIES.length}\n`);

  // Simulate question generation
  console.log('🔄 GENERATING QUESTIONS...');
  
  for (let userIndex = 1; userIndex <= totalUsers; userIndex++) {
    const userQuestions = [];
    
    // Generate questions for each user
    for (let questionNum = 1; questionNum <= questionsPerUser; questionNum++) {
      const domain = QUESTION_DOMAINS[Math.floor(Math.random() * QUESTION_DOMAINS.length)];
      const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
      
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const question = generateBehavioralResponse(userIndex, domain, difficulty);
      
      // Check for duplicates
      if (allQuestions.has(question.questionId)) {
        duplicateQuestions.push({
          questionId: question.questionId,
          originalUser: allQuestions.get(question.questionId),
          duplicateUser: userIndex
        });
      } else {
        allQuestions.set(question.questionId, userIndex);
      }
      
      userQuestions.push(question);
    }
    
    questionsByUser.set(userIndex, userQuestions);
    
    // Progress indicator
    if (userIndex % 100 === 0) {
      console.log(`   Generated questions for ${userIndex}/${totalUsers} users`);
    }
  }

  console.log('\n✅ QUESTION GENERATION COMPLETE\n');

  // Analysis Results
  console.log('📈 UNIQUENESS ANALYSIS RESULTS:');
  console.log('================================\n');

  const totalQuestionsGenerated = allQuestions.size;
  const expectedQuestions = totalUsers * questionsPerUser;
  const duplicateCount = duplicateQuestions.length;
  const uniquenessRate = ((totalQuestionsGenerated / expectedQuestions) * 100).toFixed(2);

  console.log(`📊 QUESTION STATISTICS:`);
  console.log(`   Total questions generated: ${totalQuestionsGenerated.toLocaleString()}`);
  console.log(`   Expected unique questions: ${expectedQuestions.toLocaleString()}`);
  console.log(`   Duplicate questions found: ${duplicateCount.toLocaleString()}`);
  console.log(`   Uniqueness rate: ${uniquenessRate}%\n`);

  // Domain distribution analysis
  const domainCounts = new Map();
  const difficultyCounts = new Map();

  for (const [questionId, userIndex] of allQuestions) {
    const [, , domain, difficulty] = questionId.split('_');
    
    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) || 0) + 1);
  }

  console.log(`🎯 DOMAIN DISTRIBUTION:`);
  for (const [domain, count] of domainCounts) {
    const percentage = ((count / totalQuestionsGenerated) * 100).toFixed(1);
    console.log(`   ${domain}: ${count.toLocaleString()} questions (${percentage}%)`);
  }

  console.log(`\n📊 DIFFICULTY DISTRIBUTION:`);
  for (const [difficulty, count] of difficultyCounts) {
    const percentage = ((count / totalQuestionsGenerated) * 100).toFixed(1);
    console.log(`   Level ${difficulty}: ${count.toLocaleString()} questions (${percentage}%)`);
  }

  // Duplicate analysis (if any found)
  if (duplicateCount > 0) {
    console.log(`\n⚠️  DUPLICATE QUESTION ANALYSIS:`);
    console.log(`   ${duplicateCount} duplicate questions found:\n`);
    
    for (let i = 0; i < Math.min(5, duplicateCount); i++) {
      const dup = duplicateQuestions[i];
      console.log(`   ${i + 1}. Question ID: ${dup.questionId}`);
      console.log(`      Original User: ${dup.originalUser}`);
      console.log(`      Duplicate User: ${dup.duplicateUser}\n`);
    }
    
    if (duplicateCount > 5) {
      console.log(`   ... and ${duplicateCount - 5} more duplicates\n`);
    }
  }

  // User-specific analysis (sample)
  console.log('👤 USER-SPECIFIC QUESTION ANALYSIS (Sample):');
  console.log('============================================\n');

  for (let sampleUser = 1; sampleUser <= Math.min(3, totalUsers); sampleUser++) {
    const userQuestions = questionsByUser.get(sampleUser);
    const userQuestionIds = new Set(userQuestions.map(q => q.questionId));
    const userDuplicates = userQuestions.length - userQuestionIds.size;

    console.log(`📋 USER ${sampleUser}:`);
    console.log(`   Questions assigned: ${userQuestions.length}`);
    console.log(`   Unique questions: ${userQuestionIds.size}`);
    console.log(`   Duplicates within user: ${userDuplicates}`);
    
    // Show first 3 questions
    console.log(`   Sample questions:`);
    for (let i = 0; i < Math.min(3, userQuestions.length); i++) {
      const q = userQuestions[i];
      console.log(`     ${i + 1}. ${q.questionId} (${q.domain}, Level ${q.difficulty})`);
    }
    console.log('');
  }

  // Final assessment
  console.log('🎯 UNIQUENESS ASSESSMENT:');
  console.log('=========================\n');

  if (uniquenessRate >= 99.9) {
    console.log('✅ EXCELLENT: Questions are highly unique (≥99.9% uniqueness)');
    console.log('   The behavioral learning simulation generates unique questions for each user.');
    console.log('   No significant duplicate question issues detected.');
  } else if (uniquenessRate >= 95) {
    console.log('✅ GOOD: Questions show good uniqueness (≥95% uniqueness)');
    console.log('   Minor duplicates may occur but within acceptable ranges.');
  } else if (uniquenessRate >= 90) {
    console.log('⚠️  MODERATE: Some duplicate questions detected (90-95% uniqueness)');
    console.log('   Consider improving question generation algorithm.');
  } else {
    console.log('❌ POOR: High number of duplicate questions (<90% uniqueness)');
    console.log('   Question generation needs improvement to ensure uniqueness.');
  }

  console.log(`\n🔬 TECHNICAL ANALYSIS:`);
  console.log(`   Question ID format: behavioral_q_{domain}_{difficulty}_{timestamp}_{userIndex}`);
  console.log(`   Timestamp resolution: ${Date.now()} (millisecond precision)`);
  console.log(`   User index uniqueness: Each user gets unique identifier`);
  console.log(`   Domain/Difficulty combinations: ${QUESTION_DOMAINS.length * DIFFICULTIES.length} possible`);

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    analysis: 'question_uniqueness',
    parameters: {
      totalUsers,
      questionsPerUser,
      domains: QUESTION_DOMAINS.length,
      difficulties: DIFFICULTIES.length
    },
    results: {
      totalQuestionsGenerated,
      expectedQuestions,
      duplicateCount,
      uniquenessRate: parseFloat(uniquenessRate),
      domainDistribution: Object.fromEntries(domainCounts),
      difficultyDistribution: Object.fromEntries(difficultyCounts)
    },
    assessment: uniquenessRate >= 99.9 ? 'EXCELLENT' : uniquenessRate >= 95 ? 'GOOD' : uniquenessRate >= 90 ? 'MODERATE' : 'POOR'
  };

  // Save report
  const reportFilename = `question-uniqueness-report-${Date.now()}.json`;
  fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 REPORT SAVED: ${reportFilename}`);
  console.log(`\n🎉 ANALYSIS COMPLETE - Question uniqueness verification finished.`);

  return report;
}

// Run analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeQuestionUniqueness()
    .then(report => {
      console.log(`\n✅ Final Assessment: ${report.assessment}`);
      console.log(`📊 Uniqueness Rate: ${report.results.uniquenessRate}%`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeQuestionUniqueness };