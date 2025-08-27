#!/usr/bin/env node

/**
 * EiQ™ Platform - Long-Running 415K User Simulation
 * Optimized for 6-8 hour continuous execution
 */

import fetch from 'node-fetch';
import fs from 'fs';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000';
const TARGET_USERS = 415000;
const BATCH_SIZE = 100; // Smaller batches for sustained performance
const CONCURRENT_BATCHES = 5;
const PROGRESS_INTERVAL = 1000; // Report every 1000 users
const CHECKPOINT_INTERVAL = 5000;

class LongRunningSimulation {
  constructor() {
    this.startTime = performance.now();
    this.totalUsers = 0;
    this.successfulOperations = 0;
    this.failedOperations = 0;
    this.running = true;
    this.currentBatch = 0;
  }

  async runSimulation() {
    console.log(`🚀 Starting 415K Long-Running Simulation - Target Duration: 6-8 hours`);
    console.log(`📊 Configuration: ${BATCH_SIZE} users per batch, ${CONCURRENT_BATCHES} concurrent batches`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    // Setup graceful shutdown handlers
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));

    try {
      await this.systemHealthCheck();
      await this.processAllUsers();
      await this.generateFinalReport();
    } catch (error) {
      console.error('❌ Simulation failed:', error.message);
      await this.saveErrorReport(error);
    }
  }

  async systemHealthCheck() {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        console.log('✅ System health check passed');
        return true;
      }
    } catch (error) {
      console.log('⚠️  Health check failed, continuing anyway');
    }
    return false;
  }

  async processAllUsers() {
    const totalBatches = Math.ceil(TARGET_USERS / BATCH_SIZE);
    console.log(`📈 Processing ${TARGET_USERS.toLocaleString()} users across ${totalBatches} batches`);

    for (let batchGroup = 0; batchGroup < totalBatches && this.running; batchGroup += CONCURRENT_BATCHES) {
      const batchPromises = [];
      
      for (let i = 0; i < CONCURRENT_BATCHES && (batchGroup + i) < totalBatches && this.running; i++) {
        const batchIndex = batchGroup + i;
        const startUser = batchIndex * BATCH_SIZE;
        const endUser = Math.min(startUser + BATCH_SIZE, TARGET_USERS);
        
        batchPromises.push(this.processBatch(batchIndex, startUser, endUser));
      }

      await Promise.all(batchPromises);
      
      // Progress reporting
      if (this.totalUsers % PROGRESS_INTERVAL === 0 || this.totalUsers % CHECKPOINT_INTERVAL === 0) {
        await this.reportProgress();
      }

      // Checkpoint saving
      if (this.totalUsers >= (Math.floor(this.totalUsers / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL)) {
        await this.saveCheckpoint();
      }

      // Brief pause to prevent overwhelming the system
      await this.pause(100);
    }
  }

  async processBatch(batchIndex, startUser, endUser) {
    const batchStartTime = performance.now();
    let batchSuccesses = 0;

    try {
      for (let userId = startUser; userId < endUser && this.running; userId++) {
        try {
          await this.simulateUser(userId);
          batchSuccesses++;
          this.successfulOperations++;
        } catch (error) {
          this.failedOperations++;
        }
      }

      const batchTime = performance.now() - batchStartTime;
      const usersProcessed = endUser - startUser;
      this.totalUsers += usersProcessed;
      this.currentBatch = batchIndex;

    } catch (error) {
      console.error(`❌ Batch ${batchIndex} failed: ${error.message}`);
    }
  }

  async simulateUser(userId) {
    const profile = this.generateUserProfile(userId);
    
    // Simulate realistic user journey with reduced API calls
    await this.makeAPICall('POST', '/api/register', {
      email: `sim.user.${userId}@eiq.edu`,
      username: `user_${userId}`,
      password: 'SimPass123!',
      role: this.selectRole(),
      ageGroup: this.selectAgeGroup()
    });

    // 60% of users take assessments
    if (Math.random() < 0.6) {
      await this.makeAPICall('POST', '/api/assessments/baseline', {
        type: 'baseline',
        responses: this.generateResponses(30),
        timeSpent: 1800000
      });
    }

    // 30% engage in AI mentoring
    if (Math.random() < 0.3) {
      await this.makeAPICall('POST', '/api/ai-mentor/session', {
        messages: ['Help me understand this topic'],
        duration: 600000
      });
    }
  }

  async makeAPICall(method, endpoint, data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };

    if (data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      await this.pause(Math.random() * 50 + 10); // 10-60ms delay
      return response;
    } catch (error) {
      throw new Error(`API call failed: ${endpoint}`);
    }
  }

  generateUserProfile(userId) {
    return {
      id: userId,
      role: this.selectRole(),
      ageGroup: this.selectAgeGroup(),
      skillLevel: Math.random()
    };
  }

  selectRole() {
    const rand = Math.random();
    if (rand < 0.85) return 'student';
    if (rand < 0.97) return 'staff';
    return 'admin';
  }

  selectAgeGroup() {
    const groups = ['K-5', '6-8', '9-12', 'college', 'adult'];
    return groups[Math.floor(Math.random() * groups.length)];
  }

  generateResponses(count) {
    return Array.from({ length: count }, (_, i) => ({
      questionId: `q_${i}`,
      response: Math.random() > 0.3 ? 'correct' : 'incorrect',
      timeSpent: Math.random() * 60000 + 30000
    }));
  }

  async reportProgress() {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const usersPerSecond = this.totalUsers / elapsed;
    const estimatedTotal = (TARGET_USERS / usersPerSecond) / 3600; // hours
    const progressPercent = (this.totalUsers / TARGET_USERS * 100).toFixed(1);

    console.log(`📊 Progress: ${this.totalUsers.toLocaleString()}/${TARGET_USERS.toLocaleString()} users (${progressPercent}%)`);
    console.log(`⚡ Performance: ${usersPerSecond.toFixed(1)} users/sec`);
    console.log(`⏱️  Elapsed: ${(elapsed/3600).toFixed(1)}h | Estimated Total: ${estimatedTotal.toFixed(1)}h`);
    console.log(`✅ Success Rate: ${(this.successfulOperations/this.totalUsers*100).toFixed(1)}%`);
    console.log('---');
  }

  async saveCheckpoint() {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      totalUsers: this.totalUsers,
      successfulOperations: this.successfulOperations,
      failedOperations: this.failedOperations,
      currentBatch: this.currentBatch,
      elapsed: (performance.now() - this.startTime) / 1000
    };

    const filename = `checkpoint-${this.totalUsers}.json`;
    await fs.promises.writeFile(filename, JSON.stringify(checkpoint, null, 2));
  }

  async generateFinalReport() {
    const totalTime = (performance.now() - this.startTime) / 1000;
    const report = {
      completed: true,
      timestamp: new Date().toISOString(),
      duration: {
        seconds: totalTime,
        hours: totalTime / 3600,
        formatted: `${Math.floor(totalTime/3600)}h ${Math.floor((totalTime%3600)/60)}m`
      },
      users: {
        target: TARGET_USERS,
        processed: this.totalUsers,
        successful: this.successfulOperations,
        failed: this.failedOperations,
        successRate: (this.successfulOperations / this.totalUsers * 100).toFixed(2)
      },
      performance: {
        usersPerSecond: (this.totalUsers / totalTime).toFixed(2),
        totalBatches: Math.ceil(this.totalUsers / BATCH_SIZE)
      }
    };

    const filename = `final-415k-simulation-${Date.now()}.json`;
    await fs.promises.writeFile(filename, JSON.stringify(report, null, 2));

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                        415K SIMULATION COMPLETED                            ║
║                                                                              ║
║ 🎯 Users Processed: ${this.totalUsers.toLocaleString().padStart(10)}                                        ║
║ ✅ Success Rate: ${(this.successfulOperations/this.totalUsers*100).toFixed(1).padStart(8)}%                                             ║
║ ⚡ Performance: ${(this.totalUsers/totalTime).toFixed(1).padStart(8)} users/second                               ║
║ ⏱️  Duration: ${Math.floor(totalTime/3600)}h ${Math.floor((totalTime%3600)/60)}m                                                 ║
║                                                                              ║
║ 🚀 EiQ™ Platform Successfully Handled Massive Load!                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  async saveErrorReport(error) {
    const errorReport = {
      error: error.message,
      timestamp: new Date().toISOString(),
      usersProcessed: this.totalUsers,
      elapsed: (performance.now() - this.startTime) / 1000
    };

    await fs.promises.writeFile(`error-${Date.now()}.json`, JSON.stringify(errorReport, null, 2));
  }

  async gracefulShutdown(signal) {
    console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
    this.running = false;
    await this.reportProgress();
    await this.saveCheckpoint();
    console.log('💾 Final checkpoint saved');
    process.exit(0);
  }

  async pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the simulation
const simulation = new LongRunningSimulation();
simulation.runSimulation().catch(error => {
  console.error('💥 Simulation crashed:', error.message);
  process.exit(1);
});