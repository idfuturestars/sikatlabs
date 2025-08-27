/**
 * Database Seed Script
 * Populates initial data for demo user, assessments, and custom questions
 */

import { db } from '../server/db.js';
import { users, customQuestions, eiqScores, assessments, industryTracks, curriculumModules, questionBank } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Check for existing users
    console.log('Checking for existing users...');
    let demoUserId = '42571909'; // Using existing demo123 user ID
    let staffUserId = 'staff-user-123'; // Using existing staff user ID
    
    // Verify demo user exists
    const existingUsers = await db.select().from(users).where(eq(users.username, 'demo123'));
    if (existingUsers.length > 0) {
      demoUserId = existingUsers[0].id;
      console.log(`Found existing demo user with ID: ${demoUserId}`);
    } else {
      console.log('Creating demo user...');
      const hashedPassword = await bcrypt.hash('demo123', 10);
      
      await db.insert(users).values({
        id: demoUserId,
        username: 'demo123',
        email: 'demo@eiq.education',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        displayName: 'Demo User',
        role: 'student',
        currentLevel: 'Foundation',
        assessmentProgress: 0,
        learningStreak: 0,
        aiInteractions: 0,
        authProvider: 'local',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    }

    // 2. Seed Industry Tracks (Similar to Role Models)
    console.log('Seeding industry tracks...');
    const industryTrackData = [
      {
        id: 'track-jobs-cook',
        name: 'Jobs/Cook',
        displayName: 'Steve Jobs & Tim Cook Track',
        description: 'Innovation & Design Excellence - Learn the principles of revolutionary product design and user experience.',
        focusAreas: ['innovation', 'design thinking', 'user experience', 'leadership'],
        ageRanges: { min: 12, max: 18, grades: ['6-12'] },
        prerequisites: ['basic mathematics', 'critical thinking'],
        learningObjectives: ['Develop creative problem-solving skills', 'Master design thinking methodology', 'Understand technology leadership'],
        industryPartners: ['Apple', 'Design Firms', 'Tech Startups'],
        isActive: true
      },
      {
        id: 'track-page-pichai',
        name: 'Page/Pichai',
        displayName: 'Larry Page & Sundar Pichai Track',
        description: 'Search & AI Innovation - Master the fundamentals of information organization and artificial intelligence.',
        focusAreas: ['algorithms', 'artificial intelligence', 'data structures', 'search technology'],
        ageRanges: { min: 12, max: 18, grades: ['6-12'] },
        prerequisites: ['algebra', 'logical reasoning'],
        learningObjectives: ['Understand search algorithms', 'Learn AI fundamentals', 'Develop analytical thinking'],
        industryPartners: ['Google', 'AI Research Labs', 'Tech Companies'],
        isActive: true
      },
      {
        id: 'track-gates-ballmer',
        name: 'Gates/Ballmer',
        displayName: 'Bill Gates & Steve Ballmer Track',
        description: 'Software & Business Strategy - Build foundations in software development and business leadership.',
        focusAreas: ['software engineering', 'business strategy', 'philanthropy', 'global impact'],
        ageRanges: { min: 12, max: 18, grades: ['6-12'] },
        prerequisites: ['basic programming', 'mathematics'],
        learningObjectives: ['Master software development', 'Understand business strategy', 'Learn about global impact'],
        industryPartners: ['Microsoft', 'Software Companies', 'NGOs'],
        isActive: true
      }
    ];

    for (const track of industryTrackData) {
      await db.insert(industryTracks).values(track).onConflictDoNothing();
    }

    // 3. Seed Curriculum Modules
    console.log('Seeding curriculum modules...');
    const moduleData = [
      {
        id: 'mod-1',
        trackId: 'track-jobs-cook',
        name: 'Introduction to Design Thinking',
        description: 'Learn the fundamentals of human-centered design and creative problem-solving.',
        gradeLevel: '6-8',
        subject: 'design',
        difficulty: 'foundation',
        estimatedDuration: 45,
        prerequisites: [],
        learningObjectives: ['Understand design thinking process', 'Apply creativity to problem-solving'],
        assessmentCriteria: { completion: 80, understanding: 70 },
        contentStructure: { videos: 3, exercises: 5, projects: 1 },
        isActive: true
      },
      {
        id: 'mod-2',
        trackId: 'track-page-pichai',
        name: 'Introduction to Algorithms',
        description: 'Explore basic algorithmic thinking and problem-solving strategies.',
        gradeLevel: '6-8',
        subject: 'programming',
        difficulty: 'foundation',
        estimatedDuration: 60,
        prerequisites: ['basic mathematics'],
        learningObjectives: ['Understand algorithms', 'Learn basic programming concepts'],
        assessmentCriteria: { completion: 80, understanding: 75 },
        contentStructure: { videos: 4, exercises: 8, projects: 2 },
        isActive: true
      }
    ];

    for (const module of moduleData) {
      await db.insert(curriculumModules).values(module).onConflictDoNothing();
    }

    // 4. Seed Question Bank
    console.log('Seeding question bank...');
    const domains = ['mathematical', 'verbal', 'spatial', 'logical', 'creative', 'emotional'];
    const difficulties = [1.0, 2.0, 3.0, 4.0];
    
    let questionId = 1;
    for (const domain of domains) {
      for (const difficulty of difficulties) {
        await db.insert(questionBank).values({
          id: `qb-${questionId}`,
          moduleId: questionId % 2 === 0 ? 'mod-1' : 'mod-2',
          questionType: 'multiple_choice',
          subject: domain,
          topic: `${domain} reasoning`,
          difficulty: difficulty.toString(),
          questionText: `Sample ${domain} question with difficulty ${difficulty}`,
          questionData: {
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A'
          },
          explanation: `This tests ${domain} intelligence at difficulty level ${difficulty}.`,
          hints: [`Think about ${domain} concepts`, `Consider the relationships`],
          tags: [domain, `level-${difficulty}`],
          aiGenerated: false,
          usageCount: 0,
          isActive: true,
          createdAt: new Date()
        }).onConflictDoNothing();
        questionId++;
      }
    }

    // 5. Check for staff user
    console.log('Checking for staff user...');
    const existingStaffUsers = await db.select().from(users).where(eq(users.username, 'staff123'));
    if (existingStaffUsers.length > 0) {
      staffUserId = existingStaffUsers[0].id;
      console.log(`Found existing staff user with ID: ${staffUserId}`);
    } else {
      console.log('Staff user not found, skipping custom questions...');
      // Skip custom questions if no staff user exists
      staffUserId = null;
    }

    // 6. Seed Custom Questions for AI Training (with staff_id)
    if (staffUserId) {
      console.log('Seeding custom questions for AI training...');
      const customQuestionData = [
        {
          id: 'cq-1',
          staffId: staffUserId,
          title: 'Calculus - Derivative',
          questionText: 'What is the derivative of x^2?',
          questionType: 'open_ended',
          correctAnswer: '2x',
          difficultyEstimate: 5,
          cognitiveDomains: ['mathematical', 'logical'],
          aiAssistanceUsed: false,
          status: 'active',
          tags: ['calculus', 'derivatives', 'college'],
          metadata: { topic: 'calculus', grade: 'college' },
          createdAt: new Date()
        },
        {
          id: 'cq-2',
          staffId: staffUserId,
          title: 'Chemistry - Water Formula',
          questionText: 'What is the chemical formula for water?',
          questionType: 'open_ended',
          correctAnswer: 'H2O',
          difficultyEstimate: 2,
          cognitiveDomains: ['scientific'],
          aiAssistanceUsed: false,
          status: 'active',
          tags: ['chemistry', 'formulas', 'elementary'],
          metadata: { topic: 'chemistry', grade: 'elementary' },
          createdAt: new Date()
        },
        {
          id: 'cq-3',
          staffId: staffUserId,
          title: 'History - World War II',
          questionText: 'When did World War II end?',
          questionType: 'open_ended',
          correctAnswer: '1945',
          difficultyEstimate: 4,
          cognitiveDomains: ['verbal', 'logical'],
          aiAssistanceUsed: false,
          status: 'active',
          tags: ['history', 'world-war-2', 'high-school'],
          metadata: { topic: 'world history', grade: 'high school' },
          createdAt: new Date()
        }
      ];

      for (const question of customQuestionData) {
        await db.insert(customQuestions).values(question).onConflictDoNothing();
      }
    }

    // 7. Seed Initial Assessment for Demo User
    console.log('Creating initial assessment for demo user...');
    await db.insert(assessments).values({
      id: 'assessment-demo-1',
      userId: demoUserId,
      type: 'comprehensive',
      status: 'completed',
      score: 78,
      totalQuestions: 60,
      answeredQuestions: 60,
      correctAnswers: 47,
      timeSpent: 2700, // 45 minutes in seconds
      adaptiveDifficulty: 3.5,
      completedAt: new Date(),
      createdAt: new Date()
    }).onConflictDoNothing();

    // 8. Seed Initial EIQ Scores for Demo User
    console.log('Creating initial EIQ score for demo user...');
    await db.insert(eiqScores).values({
      id: 'eiq-demo-1',
      userId: demoUserId,
      score: 650, // EIQ Score (300-850 like FICO)
      percentile: '75.00',
      problemSolvingScore: '82.50',
      knowledgeDepthScore: '78.00',
      learningVelocityScore: '71.50',
      adaptabilityScore: '76.00',
      communicationScore: '79.00',
      predictedImprovement: 45,
      improvementTimeframe: '3 months',
      recommendations: {
        priority: 'Focus on adaptive learning techniques',
        strategies: [
          'Practice diverse problem-solving scenarios',
          'Engage with collaborative learning activities',
          'Work on time-pressured assessments'
        ]
      },
      historicalTrend: [
        { date: '2025-01', score: 620 },
        { date: '2025-02', score: 635 },
        { date: '2025-03', score: 650 }
      ],
      assessmentId: 'assessment-demo-1',
      createdAt: new Date()
    }).onConflictDoNothing();

    console.log('✅ Database seeding completed successfully!');
    console.log('Demo user credentials:');
    console.log('  Username: demo123');
    console.log('  Password: demo123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seed().catch(console.error);