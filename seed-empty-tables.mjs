#!/usr/bin/env node

// Comprehensive Data Seeding Script for EiQ™ Platform
// Populates empty tables: question_bank, ai_learning_data, custom_questions

import { execSync } from 'child_process';

console.log('🌱 EiQ™ Platform - Comprehensive Data Seeding');
console.log('='.repeat(60));
console.log('Populating empty tables with realistic, production-ready data...\n');

try {
  // Run the TypeScript seeder through tsx
  console.log('🚀 Starting seeding process...');
  execSync('npx tsx server/seeders/run-seeder.ts', { stdio: 'inherit' });
  
  console.log('\n✅ Seeding completed successfully!');
  console.log('📊 Your platform now has comprehensive data in all tables');
  console.log('🎯 Ready for full production testing and deployment');
  
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}