/**
 * Verify Database Seed Script
 * Checks that data was properly seeded
 */

import { db } from '../server/db.js';
import { users, assessments, eiqScores, industryTracks, customQuestions, curriculumModules, questionBank } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function verify() {
  console.log('\n🔍 Verifying database seed...\n');

  try {
    // Check demo user
    const demoUsers = await db.select().from(users).where(eq(users.username, 'demo123'));
    if (demoUsers.length > 0) {
      console.log('✅ Demo User Found:');
      console.log('   - ID:', demoUsers[0].id);
      console.log('   - Username:', demoUsers[0].username);
      console.log('   - Email:', demoUsers[0].email);
    } else {
      console.log('❌ Demo user not found');
    }

    // Check assessments
    const assessmentList = await db.select().from(assessments);
    console.log('\n✅ Assessments:', assessmentList.length, 'total');
    const demoAssessments = assessmentList.filter(a => a.userId === demoUsers[0]?.id);
    console.log('   - Demo user assessments:', demoAssessments.length);

    // Check EIQ scores
    const eiqList = await db.select().from(eiqScores);
    console.log('\n✅ EIQ Scores:', eiqList.length, 'total');
    const demoScores = eiqList.filter(e => e.userId === demoUsers[0]?.id);
    if (demoScores.length > 0) {
      console.log('   - Demo user EIQ score:', demoScores[0].score);
      console.log('   - Percentile:', demoScores[0].percentile);
    }

    // Check industry tracks
    const tracks = await db.select().from(industryTracks);
    console.log('\n✅ Industry Tracks:', tracks.length);
    tracks.forEach(t => {
      console.log('   -', t.name);
    });

    // Check curriculum modules
    const modules = await db.select().from(curriculumModules);
    console.log('\n✅ Curriculum Modules:', modules.length);

    // Check question bank
    const questions = await db.select().from(questionBank);
    console.log('\n✅ Question Bank:', questions.length, 'questions');

    // Check custom questions
    const customQs = await db.select().from(customQuestions);
    console.log('\n✅ Custom Questions:', customQs.length);
    customQs.forEach(q => {
      console.log('   -', q.title);
    });

    console.log('\n✅ Database verification complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification error:', error);
    process.exit(1);
  }
}

verify();