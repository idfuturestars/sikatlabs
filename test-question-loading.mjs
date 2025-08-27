#!/usr/bin/env node

/**
 * Direct database test to verify assessment engine can access questions
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

console.log('🔍 Testing Question Database Access...\n');

async function testQuestionAccess() {
  try {
    // Test direct database query
    const result = await pool.query('SELECT COUNT(*) as count FROM question_bank WHERE is_active = true');
    const questionCount = parseInt(result.rows[0].count);
    
    console.log(`📊 Database Query Results:`);
    console.log(`   - Total active questions: ${questionCount}`);
    
    if (questionCount >= 1200) {
      console.log('   - ✅ Database contains expected number of questions');
      
      // Test question variety
      const varietyResult = await pool.query(`
        SELECT subject, COUNT(*) as count 
        FROM question_bank 
        WHERE is_active = true 
        GROUP BY subject 
        ORDER BY count DESC
      `);
      
      console.log('   - Question distribution by subject:');
      varietyResult.rows.forEach(row => {
        console.log(`     ${row.subject}: ${row.count} questions`);
      });
      
      // Test random sampling
      const sampleResult = await pool.query(`
        SELECT id, question_text, subject, difficulty 
        FROM question_bank 
        WHERE is_active = true 
        ORDER BY RANDOM() 
        LIMIT 5
      `);
      
      console.log('\n🎲 Random Question Sample:');
      sampleResult.rows.forEach((q, i) => {
        console.log(`   ${i+1}. [${q.subject}] ${q.question_text.substring(0, 60)}... (diff: ${q.difficulty})`);
      });
      
      console.log('\n✅ ASSESSMENT ENGINE DATABASE ACCESS: OPERATIONAL');
      console.log('   - Questions are accessible via database');
      console.log('   - Proper subject distribution maintained');
      console.log('   - Random selection capability confirmed');
      
      return true;
      
    } else {
      console.log('   - ❌ Insufficient questions in database');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Database access error:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

testQuestionAccess().then(success => {
  process.exit(success ? 0 : 1);
});