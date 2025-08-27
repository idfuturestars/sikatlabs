#!/usr/bin/env tsx

/**
 * EiQ Simulation Data Seeding Script
 * 
 * Seeds the database with simulation data for large-scale testing
 * Default: 1,000,000 rows in 20k chunks
 * 
 * Usage:
 * npm run seed:simulation (default 1M rows)
 * SIM_ROWS=250000 SIM_CHUNK=20000 npm run seed:simulation (custom batch)
 */

import { db } from '../server/db.js';
import { simulationAssessments } from '../shared/schema.js';
import { randomUUID } from 'crypto';

// Configuration from environment variables
const SIM_ROWS = parseInt(process.env.SIM_ROWS || '1000000');
const SIM_CHUNK = parseInt(process.env.SIM_CHUNK || '1000'); // Reduced chunk size to avoid stack overflow

// Education levels for realistic distribution
const EDUCATION_LEVELS = ["High School", "Some College", "Bachelor's Degree", "Master's Degree", "PhD"];

console.log(`\n🚀 EiQ Simulation Data Seeding Started`);
console.log(`📊 Target Records: ${SIM_ROWS.toLocaleString()}`);
console.log(`📦 Chunk Size: ${SIM_CHUNK.toLocaleString()}`);
console.log(`🔄 Total Batches: ${Math.ceil(SIM_ROWS / SIM_CHUNK)}`);

// Generate realistic simulation data
function generateSimulationBatch(batchStart: number, batchSize: number) {
  const batch = [];
  
  for (let i = 0; i < batchSize; i++) {
    const recordId = batchStart + i;
    
    // Generate realistic user demographics
    const ageGroups = ['K12', 'College', 'Graduate', 'Adult', 'Senior'];
    const ageGroup = ageGroups[Math.floor(Math.random() * ageGroups.length)];
    
    // Generate EIQ scores based on age group (realistic distributions)
    let baseEiq: number;
    switch (ageGroup) {
      case 'K12': baseEiq = 120 + Math.random() * 180; break;
      case 'College': baseEiq = 250 + Math.random() * 200; break;
      case 'Graduate': baseEiq = 350 + Math.random() * 300; break;
      case 'Adult': baseEiq = 400 + Math.random() * 350; break;
      case 'Senior': baseEiq = 450 + Math.random() * 400; break;
      default: baseEiq = 300 + Math.random() * 250;
    }
    
    // Generate traditional IQ (Wechsler scale 40-160)
    const traditionalIq = Math.min(160, Math.max(40, 85 + Math.random() * 50));
    
    // Generate emotional IQ (0-200 scale)
    const emotionalIq = Math.random() * 200;
    
    // Generate alternative IQ (Gardner's 0-100)
    const alternativeIq = Math.random() * 100;
    
    // Calculate combined score (weighted 30/40/30)
    const combinedScore = (traditionalIq * 0.3) + (baseEiq * 0.4 / 8.5) + (alternativeIq * 0.3);
    
    batch.push({
      id: randomUUID(),
      userId: `user_sim_${recordId}`,
      sessionId: `session_sim_${recordId}`,
      eiqTotal: Math.round(baseEiq),
      strategicIQ: Math.round(baseEiq * 0.25 + Math.random() * 50),
      technicalIQ: Math.round(baseEiq * 0.25 + Math.random() * 50),
      creativeIQ: Math.round(baseEiq * 0.25 + Math.random() * 50),
      socialIQ: Math.round(baseEiq * 0.25 + Math.random() * 50),
      ageGroup,
      educationLevel: EDUCATION_LEVELS[Math.floor(Math.random() * EDUCATION_LEVELS.length)],
      responseTime: Math.round(Math.random() * 1000 + 500),
      accuracy: parseFloat((0.6 + Math.random() * 0.4).toFixed(3)),
      metadata: {
        simulationBatch: Math.floor(recordId / SIM_CHUNK) + 1,
        traditionalIq: Math.round(traditionalIq),
        emotionalIq: Math.round(emotionalIq),
        alternativeIq: Math.round(alternativeIq),
        combinedScore: Math.round(combinedScore),
        platform: 'EiQ_Simulation',
        version: '6.0'
      }
    });
  }
  
  return batch;
}

async function seedSimulationData() {
  const startTime = Date.now();
  let totalInserted = 0;
  
  try {
    // Process in chunks to avoid memory issues
    for (let batchStart = 0; batchStart < SIM_ROWS; batchStart += SIM_CHUNK) {
      const batchEnd = Math.min(batchStart + SIM_CHUNK, SIM_ROWS);
      const batchSize = batchEnd - batchStart;
      
      console.log(`\n📦 Processing batch ${Math.floor(batchStart / SIM_CHUNK) + 1}/${Math.ceil(SIM_ROWS / SIM_CHUNK)}`);
      console.log(`   Records: ${batchStart + 1} - ${batchEnd}`);
      
      const batchData = generateSimulationBatch(batchStart, batchSize);
      
      // Insert batch into database
      const batchStartTime = Date.now();
      await db.insert(simulationAssessments).values(batchData);
      const batchDuration = Date.now() - batchStartTime;
      
      totalInserted += batchSize;
      
      console.log(`   ✅ Inserted ${batchSize.toLocaleString()} records in ${batchDuration}ms`);
      console.log(`   📈 Progress: ${totalInserted.toLocaleString()}/${SIM_ROWS.toLocaleString()} (${((totalInserted / SIM_ROWS) * 100).toFixed(1)}%)`);
      
      // Calculate ETA
      const elapsed = Date.now() - startTime;
      const rate = totalInserted / elapsed;
      const remaining = SIM_ROWS - totalInserted;
      const eta = remaining / rate;
      
      console.log(`   ⏱️  Rate: ${Math.round(rate * 1000).toLocaleString()} records/sec`);
      console.log(`   🕐 ETA: ${Math.round(eta / 1000)} seconds`);
    }
    
    const totalDuration = Date.now() - startTime;
    const finalRate = totalInserted / totalDuration * 1000;
    
    console.log(`\n🎉 Simulation Data Seeding Complete!`);
    console.log(`📊 Total Records: ${totalInserted.toLocaleString()}`);
    console.log(`⏱️  Total Time: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`🚀 Average Rate: ${Math.round(finalRate).toLocaleString()} records/second`);
    console.log(`💾 Database Size Impact: ~${Math.round(totalInserted * 0.5 / 1024)} MB estimated`);
    
  } catch (error) {
    console.error('\n❌ Simulation seeding failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSimulationData()
    .then(() => {
      console.log('\n✅ Simulation seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Simulation seeding script failed:', error);
      process.exit(1);
    });
}

export { seedSimulationData };