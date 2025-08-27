import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, index, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced Users table with complete authentication support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("student"), // student, staff, admin
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => {
  return {
    emailIdx: index("idx_users_email").on(table.email),
    usernameIdx: index("idx_users_username").on(table.username),
    roleIdx: index("idx_users_role").on(table.role)
  };
});

// OAuth Providers for Google/Apple Sign-In
export const oauthProviders = pgTable("oauth_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // google, apple, github, etc.
  providerId: text("provider_id").notNull(), // Provider's user ID
  providerEmail: text("provider_email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpires: timestamp("token_expires"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    userProviderIdx: index("idx_oauth_user_provider").on(table.userId, table.provider),
    providerIdIdx: index("idx_oauth_provider_id").on(table.provider, table.providerId)
  };
});

// User Sessions for persistent authentication
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  deviceInfo: jsonb("device_info"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    tokenIdx: index("idx_sessions_token").on(table.token),
    userIdIdx: index("idx_sessions_user_id").on(table.userId),
    expiresIdx: index("idx_sessions_expires").on(table.expiresAt)
  };
});

// Enhanced EiQ Scores with FICO-like 300-850 range
export const eiqScores = pgTable("eiq_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assessmentId: varchar("assessment_id").references(() => userAssessments.id),
  
  // Overall EiQ Score (300-850 range like FICO)
  overallEiq: integer("overall_eiq").notNull(), // 300-850
  
  // Multi-methodology breakdown
  traditionalIq: integer("traditional_iq").notNull(), // 70-170 range
  emotionalIq: integer("emotional_iq").notNull(), // 70-170 range
  alternativeIq: integer("alternative_iq").notNull(), // 70-170 range
  combinedScore: integer("combined_score").notNull(), // Weighted average
  
  // Sub-component scores
  strategicIq: integer("strategic_iq").notNull(),
  technicalIq: integer("technical_iq").notNull(),
  creativeIq: integer("creative_iq").notNull(),
  socialIq: integer("social_iq").notNull(),
  adaptabilityIq: integer("adaptability_iq").notNull(),
  
  // Performance metrics
  accuracy: decimal("accuracy", { precision: 5, scale: 3 }),
  responseTime: integer("response_time"), // average in milliseconds
  questionCount: integer("question_count").default(60),
  difficultyLevel: text("difficulty_level"), // beginner, intermediate, advanced
  
  // Improvement tracking
  previousScore: integer("previous_score"),
  scoreImprovement: integer("score_improvement"),
  improvementPercentage: decimal("improvement_percentage", { precision: 5, scale: 2 }),
  
  // Recommendations and next steps
  recommendations: jsonb("recommendations").default(sql`'[]'::jsonb`),
  nextTestDate: timestamp("next_test_date"),
  retestEligible: boolean("retest_eligible").default(true),
  
  // Metadata
  scoreBreakdown: jsonb("score_breakdown"),
  testMetadata: jsonb("test_metadata"),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    userScoreIdx: index("idx_eiq_user_score").on(table.userId, table.overallEiq),
    dateIdx: index("idx_eiq_created").on(table.createdAt),
    improvementIdx: index("idx_eiq_improvement").on(table.scoreImprovement)
  };
});

// User Assessment Results with detailed tracking
export const userAssessments = pgTable("user_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"),
  
  // Assessment details
  assessmentType: text("assessment_type").notNull(), // eiq, sat, act, myers_briggs, dsm, voice, etc.
  category: text("category"), // IQ, EQ, personality, academic, etc.
  
  // Results
  score: integer("score"),
  maxScore: integer("max_score"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  grade: text("grade"), // A+, A, B+, etc.
  
  // Timing and performance
  timeSpent: integer("time_spent"), // in seconds
  questionsAnswered: integer("questions_answered"),
  questionsCorrect: integer("questions_correct"),
  
  // Adaptive difficulty tracking
  startingDifficulty: decimal("starting_difficulty", { precision: 3, scale: 2 }),
  endingDifficulty: decimal("ending_difficulty", { precision: 3, scale: 2 }),
  averageDifficulty: decimal("average_difficulty", { precision: 3, scale: 2 }),
  
  // Status and completion
  status: text("status").default("in_progress"), // in_progress, completed, abandoned
  completedAt: timestamp("completed_at"),
  
  // Detailed results
  detailedResults: jsonb("detailed_results"),
  questionHistory: jsonb("question_history"),
  
  // Context
  deviceInfo: jsonb("device_info"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    userTypeIdx: index("idx_assessments_user_type").on(table.userId, table.assessmentType),
    statusIdx: index("idx_assessments_status").on(table.status),
    completedIdx: index("idx_assessments_completed").on(table.completedAt)
  };
});

// User Progress Tracking for learning paths
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Progress tracking
  currentLevel: integer("current_level").default(1),
  totalXp: integer("total_xp").default(0),
  streakDays: integer("streak_days").default(0),
  lastActiveDate: timestamp("last_active_date"),
  
  // Learning path progress
  activeLearningPaths: jsonb("active_learning_paths").default(sql`'[]'::jsonb`),
  completedModules: jsonb("completed_modules").default(sql`'[]'::jsonb`),
  skillsAcquired: jsonb("skills_acquired").default(sql`'[]'::jsonb`),
  
  // Performance metrics
  averageScore: decimal("average_score", { precision: 5, scale: 2 }),
  improvementRate: decimal("improvement_rate", { precision: 5, scale: 2 }),
  strongSubjects: jsonb("strong_subjects").default(sql`'[]'::jsonb`),
  improvementAreas: jsonb("improvement_areas").default(sql`'[]'::jsonb`),
  
  // Goals and targets
  currentGoals: jsonb("current_goals").default(sql`'[]'::jsonb`),
  targetEiqScore: integer("target_eiq_score"),
  targetCompletionDate: timestamp("target_completion_date"),
  
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => {
  return {
    userIdx: index("idx_progress_user").on(table.userId),
    levelIdx: index("idx_progress_level").on(table.currentLevel)
  };
});

// User Preferences for personalization
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Learning preferences
  preferredLanguage: text("preferred_language").default("en"),
  preferredDifficulty: text("preferred_difficulty").default("adaptive"), // adaptive, easy, medium, hard
  learningStyle: text("learning_style"), // visual, auditory, kinesthetic, reading
  
  // Assessment preferences
  questionTypes: jsonb("question_types").default(sql`'["multiple_choice", "true_false", "short_answer"]'::jsonb`),
  testDuration: integer("test_duration").default(30), // preferred minutes
  hintsEnabled: boolean("hints_enabled").default(true),
  
  // Notification preferences
  emailNotifications: boolean("email_notifications").default(true),
  reminderFrequency: text("reminder_frequency").default("weekly"), // daily, weekly, monthly
  
  // UI/UX preferences
  theme: text("theme").default("dark"), // light, dark, auto
  animationsEnabled: boolean("animations_enabled").default(true),
  soundEnabled: boolean("sound_enabled").default(true),
  
  // Privacy settings
  profileVisibility: text("profile_visibility").default("private"), // public, friends, private
  scoreSharing: boolean("score_sharing").default(false),
  
  // Personalization data
  interests: jsonb("interests").default(sql`'[]'::jsonb`),
  educationLevel: text("education_level"), // k12, undergraduate, graduate, professional
  careerGoals: jsonb("career_goals").default(sql`'[]'::jsonb`),
  
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => {
  return {
    userIdx: index("idx_preferences_user").on(table.userId)
  };
});

// Enhanced Database Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  oauthProviders: many(oauthProviders),
  sessions: many(userSessions),
  assessments: many(userAssessments),
  eiqScores: many(eiqScores),
  progress: one(userProgress, {
    fields: [users.id],
    references: [userProgress.userId]
  }),
  preferences: one(userPreferences, {
    fields: [users.id], 
    references: [userPreferences.userId]
  }),
  onboarding: one(userOnboarding, {
    fields: [users.id],
    references: [userOnboarding.userId]
  })
}));

export const oauthProvidersRelations = relations(oauthProviders, ({ one }) => ({
  user: one(users, {
    fields: [oauthProviders.userId],
    references: [users.id]
  })
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id]
  })
}));

export const eiqScoresRelations = relations(eiqScores, ({ one }) => ({
  user: one(users, {
    fields: [eiqScores.userId],
    references: [users.id]
  }),
  assessment: one(userAssessments, {
    fields: [eiqScores.assessmentId],
    references: [userAssessments.id]
  })
}));

export const userAssessmentsRelations = relations(userAssessments, ({ one, many }) => ({
  user: one(users, {
    fields: [userAssessments.userId],
    references: [users.id]
  }),
  eiqScores: many(eiqScores)
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  })
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id]
  })
}));

// Enhanced Type Exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = Pick<InsertUser, 'id' | 'email' | 'username' | 'firstName' | 'lastName'> & 
  Partial<Omit<InsertUser, 'id' | 'email' | 'username' | 'firstName' | 'lastName'>>;

export type OAuthProvider = typeof oauthProviders.$inferSelect;
export type InsertOAuthProvider = typeof oauthProviders.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;  
export type InsertUserSession = typeof userSessions.$inferInsert;

export type EiqScore = typeof eiqScores.$inferSelect;
export type InsertEiqScore = typeof eiqScores.$inferInsert;

export type UserAssessment = typeof userAssessments.$inferSelect;
export type InsertUserAssessment = typeof userAssessments.$inferInsert;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

// Zod Schemas for Validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true
});

export const insertEiqScoreSchema = createInsertSchema(eiqScores).omit({
  id: true,
  createdAt: true
});

export const insertUserAssessmentSchema = createInsertSchema(userAssessments).omit({
  id: true,
  createdAt: true
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  updatedAt: true
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true
});

// Import role models schema
export * from "./schema/roleModels";

// AI Literacy / Turing Test Tables
export const turingTestItems = pgTable("turing_test_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptText: text("prompt_text").notNull(),
  expectedAnswer: text("expected_answer").notNull(), // "human", "ai", or generation evaluation criteria
  itemType: text("item_type").notNull(), // "distinguish" or "generate"
  difficulty: decimal("difficulty", { precision: 3, scale: 2 }).default("1.0"), // 1.0 to 5.0
  metadata: jsonb("metadata"), // Additional context, scoring rubrics, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const turingTestResponses = pgTable("turing_test_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemId: varchar("item_id").notNull().references(() => turingTestItems.id),
  userAnswer: text("user_answer").notNull(),
  score: decimal("score", { precision: 5, scale: 3 }).notNull(), // 0.000 to 1.000
  responseTime: integer("response_time"), // in milliseconds
  metadata: jsonb("metadata"), // Detailed scoring breakdown, AI analysis
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const turingTestSessions = pgTable("turing_test_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  prompt: text("prompt").notNull(),
  aiResponse: text("ai_response").notNull(),
  humanEvaluator: text("human_evaluator"),
  evaluatorScore: integer("evaluator_score"), // 1-10 scale
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    userIdIdx: index("idx_turing_user_id").on(table.userId)
  };
});

// Relations for Turing Test tables
export const turingTestItemsRelations = relations(turingTestItems, ({ many }) => ({
  responses: many(turingTestResponses)
}));

export const turingTestResponsesRelations = relations(turingTestResponses, ({ one }) => ({
  user: one(users, {
    fields: [turingTestResponses.userId],
    references: [users.id]
  }),
  item: one(turingTestItems, {
    fields: [turingTestResponses.itemId],
    references: [turingTestItems.id]
  })
}));

export const turingTestSessionsRelations = relations(turingTestSessions, ({ one }) => ({
  user: one(users, {
    fields: [turingTestSessions.userId],
    references: [users.id]
  })
}));

// Types for Turing Test tables
export type TuringTestItem = typeof turingTestItems.$inferSelect;
export type InsertTuringTestItem = typeof turingTestItems.$inferInsert;
export type TuringTestResponse = typeof turingTestResponses.$inferSelect;
export type InsertTuringTestResponse = typeof turingTestResponses.$inferInsert;
export type TuringTestSession = typeof turingTestSessions.$inferSelect;
export type InsertTuringTestSession = typeof turingTestSessions.$inferInsert;

// Simulation Assessments for large-scale testing
export const simulationAssessments = pgTable("simulation_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  eiqTotal: integer("eiq_total").notNull(),
  strategicIQ: integer("strategic_iq").notNull(),
  technicalIQ: integer("technical_iq").notNull(),
  creativeIQ: integer("creative_iq").notNull(),
  socialIQ: integer("social_iq").notNull(),
  ageGroup: text("age_group").notNull(),
  educationLevel: text("education_level").notNull(),
  takenAt: timestamp("taken_at").default(sql`now()`),
  responseTime: integer("response_time"), // in milliseconds
  questionCount: integer("question_count").default(60),
  accuracy: decimal("accuracy", { precision: 5, scale: 3 }),
  metadata: jsonb("metadata")
}, (table) => {
  return {
    takenAtIndex: index("idx_sim_taken_at").on(table.takenAt),
    scoresIndex: index("idx_sim_scores").on(table.eiqTotal)
  };
});

// API Keys for Public EIQ API
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  organizationId: varchar("organization_id"),
  userId: varchar("user_id").references(() => users.id),
  permissions: jsonb("permissions").default(sql`'["assess:read", "assess:write"]'::jsonb`),
  rateLimit: integer("rate_limit").default(1000), // requests per hour
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at")
});

// API Usage Tracking
export const apiUsage = pgTable("api_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").notNull().references(() => apiKeys.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // in milliseconds
  timestamp: timestamp("timestamp").default(sql`now()`)
});

// Public Assessments via API
export const publicAssessments = pgTable("public_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  apiKeyId: varchar("api_key_id").notNull().references(() => apiKeys.id),
  userId: text("user_id"), // Optional external user ID
  userMetadata: jsonb("user_metadata"), // Custom user data
  assessmentType: text("assessment_type").notNull(),
  domains: text("domains").array().notNull(),
  questionCount: integer("question_count").notNull(),
  timeLimit: integer("time_limit"), // in minutes
  adaptiveDifficulty: boolean("adaptive_difficulty").default(true),
  status: text("status").default("active"), // active, completed, abandoned
  responses: jsonb("responses"),
  currentTheta: decimal("current_theta", { precision: 5, scale: 3 }),
  finalScore: integer("final_score"),
  percentile: integer("percentile"),
  domainScores: jsonb("domain_scores"),
  startedAt: timestamp("started_at").default(sql`now()`),
  completedAt: timestamp("completed_at")
});

// Viral Challenge Sessions
export const viralChallenges = pgTable("viral_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id").notNull().unique(),
  challengeType: text("challenge_type").notNull(), // '15_second', '30_second', 'speed_round'
  questions: jsonb("questions").notNull(),
  responses: jsonb("responses"),
  score: integer("score"),
  timeSpent: integer("time_spent"), // in seconds
  shareCode: text("share_code").unique(),
  leaderboardRank: integer("leaderboard_rank"),
  socialShares: jsonb("social_shares"), // Track where it was shared
  status: text("status").default("active"),
  createdAt: timestamp("created_at").default(sql`now()`),
  completedAt: timestamp("completed_at")
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Note: users and oauthProviders tables are already defined earlier in this file

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'core_math', 'applied_reasoning', 'ai_concepts'
  difficulty: text("difficulty").default("adaptive"), // 'beginner', 'intermediate', 'advanced', 'adaptive'
  adaptiveLevel: decimal("adaptive_level", { precision: 3, scale: 2 }).default("0.00"), // -3.0 to +3.0 IRT scale
  score: decimal("score", { precision: 5, scale: 2 }),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  data: jsonb("data"), // Store assessment responses and detailed results
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const learningPaths = pgTable("learning_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  pathType: text("path_type").notNull(), // 'foundation', 'immersion', 'mastery'
  currentStep: integer("current_step").default(0),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  data: jsonb("data"), // Store pathway-specific progress and content
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const userOnboarding = pgTable("user_onboarding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Primary Educational Level Classification (captured first)
  educationalLevel: text("educational_level").notNull(), // k-12, college, masters, phd, phd+, professional
  gradeLevel: text("grade_level"), // K, 1, 2, ..., 12 (for K-12 students)
  age: integer("age"),
  pathwayType: text("pathway_type").notNull(), // "student" or "career"
  
  // Student-focused information (K-12)
  parentEmail: text("parent_email"), // Required for K-12 students
  schoolName: text("school_name"),
  preferredSubjects: text("preferred_subjects").array(),
  
  personalInfo: jsonb("personal_info").notNull(),
  educationalBackground: jsonb("educational_background").notNull(),
  careerGoals: jsonb("career_goals").notNull(),
  learningPreferences: jsonb("learning_preferences").notNull(),
  assessmentReadiness: jsonb("assessment_readiness").notNull(),
  completed: boolean("completed").default(true),
  recommendedTrack: text("recommended_track"),
  estimatedEiqRange: text("estimated_eiq_range"),
  
  // Interactive AI Mentor fields
  mentorPersonality: text("mentor_personality").default("supportive"), // supportive, challenging, friendly, professional
  aiConversationHistory: jsonb("ai_conversation_history"), // Store mentor conversation
  personalizedInsights: jsonb("personalized_insights"), // AI-generated insights about user
  adaptiveSuggestions: jsonb("adaptive_suggestions"), // Real-time AI recommendations
  engagementLevel: integer("engagement_level").default(5), // 1-10 scale
  mentorFeedbackRating: integer("mentor_feedback_rating"), // User's rating of AI mentor
  
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// AI Mentor Sessions - track detailed interactions
export const aiMentorSessions = pgTable("ai_mentor_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(), // onboarding, assessment_prep, career_guidance, study_planning
  startedAt: timestamp("started_at").default(sql`now()`),
  completedAt: timestamp("completed_at"),
  conversationLog: jsonb("conversation_log").notNull(), // Full conversation with AI mentor
  insights: jsonb("insights"), // AI-generated insights from session
  actionItems: jsonb("action_items"), // Suggested next steps
  userSatisfaction: integer("user_satisfaction"), // 1-5 rating
  mentorPersonality: text("mentor_personality").notNull(),
  aiProvider: text("ai_provider").default("anthropic"), // Which AI was used
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  status: text("status").default("processing"), // 'processing', 'completed', 'failed'
  extractedData: jsonb("extracted_data"), // OCR and analysis results
  uploadedAt: timestamp("uploaded_at").default(sql`now()`)
});

// Event Tracking for Data Ingestion and Analytics
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  tenantId: text('tenant_id'),
  type: text('type'),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("idx_events_user_id").on(table.userId),
    tenantIdIdx: index("idx_events_tenant_id").on(table.tenantId),
    typeIdx: index("idx_events_type").on(table.type),
    createdAtIdx: index("idx_events_created_at").on(table.createdAt)
  };
});



export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  messages: jsonb("messages").notNull(), // Array of conversation messages
  provider: text("provider").notNull(), // 'openai', 'anthropic', 'gemini'
  sessionId: varchar("session_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const studyGroups = pgTable("study_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  topic: text("topic").notNull(),
  maxMembers: integer("max_members").default(10),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const studyGroupMembers = pgTable("study_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => studyGroups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // 'admin', 'member'
  joinedAt: timestamp("joined_at").default(sql`now()`)
});

export const courseFeed = pgTable("course_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'lesson', 'practice', 'discussion'
  category: text("category").notNull(), // 'python', 'math', 'ai_ethics'
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  publishedAt: timestamp("published_at").default(sql`now()`)
});

// K-12 Industry Titan Tracks
export const industryTracks = pgTable("industry_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // 'Jobs/Cook', 'Page/Pichai', 'Gates/Ballmer', 'Zuck/Huang', 'Ellison/Catz', 'Buffet/Apfel'
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  focusAreas: jsonb("focus_areas").notNull(), // Array of key focus areas
  ageRanges: jsonb("age_ranges").notNull(), // Supported age ranges and grade levels
  prerequisites: jsonb("prerequisites"), // Required skills/knowledge
  learningObjectives: jsonb("learning_objectives").notNull(),
  industryPartners: jsonb("industry_partners"), // Companies and industry connections
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// K-12 Curriculum Modules
export const curriculumModules = pgTable("curriculum_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => industryTracks.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  gradeLevel: text("grade_level").notNull(), // 'K-2', '3-5', '6-8', '9-12', 'adult'
  subject: text("subject").notNull(), // 'mathematics', 'science', 'programming', 'logic', 'ai_concepts'
  difficulty: text("difficulty").notNull(), // 'foundation', 'intermediate', 'advanced', 'mastery'
  estimatedDuration: integer("estimated_duration").notNull(), // in minutes
  prerequisites: jsonb("prerequisites"),
  learningObjectives: jsonb("learning_objectives").notNull(),
  assessmentCriteria: jsonb("assessment_criteria").notNull(),
  contentStructure: jsonb("content_structure").notNull(), // Video lessons, exercises, projects
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Question Bank for Adaptive Assessments
export const questionBank = pgTable("question_bank", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => curriculumModules.id),
  questionType: text("question_type").notNull(), // 'multiple_choice', 'open_ended', 'coding', 'visual'
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  difficulty: decimal("difficulty", { precision: 3, scale: 2 }).notNull(), // 1.0 to 5.0
  questionText: text("question_text").notNull(),
  questionData: jsonb("question_data").notNull(), // Options, correct answers, code templates
  explanation: text("explanation").notNull(),
  hints: jsonb("hints"), // Progressive hint system
  tags: jsonb("tags"), // Categorization tags
  aiGenerated: boolean("ai_generated").default(false),
  validatedBy: varchar("validated_by"), // Educator who validated the question
  usageCount: integer("usage_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  averageTime: integer("average_time"), // in seconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Advanced AI Tutoring & EiQ Coaching
export const aiTutoringSessions = pgTable("ai_tutoring_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionType: text("session_type").notNull(), // 'khan_style_lesson', 'adaptive_practice', 'project_mode', 'diagnostic'
  subject: text("subject").notNull(), // 'mathematics', 'science', 'programming', 'logic', 'ai_concepts'
  gradeLevel: text("grade_level"), // Target grade level
  currentEiQScore: decimal("current_eiq_score", { precision: 5, scale: 2 }),
  targetEiQScore: decimal("target_eiq_score", { precision: 5, scale: 2 }),
  masteryLevel: text("mastery_level").default("attempted"), // 'attempted', 'familiar', 'proficient', 'mastered'
  improvementPlan: jsonb("improvement_plan"), // Personalized coaching plan
  conversationHistory: jsonb("conversation_history").notNull(),
  learningGaps: jsonb("learning_gaps"), // Identified weaknesses and improvement areas
  progressMetrics: jsonb("progress_metrics"), // Session-specific metrics
  hintUsage: jsonb("hint_usage"), // Progressive hint system usage
  aiProvider: text("ai_provider").notNull().default("openai"),
  status: text("status").default("active"), // 'active', 'completed', 'paused'
  sessionDuration: integer("session_duration"), // in minutes
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Student Assessment Responses
export const assessmentResponses = pgTable("assessment_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questionId: varchar("question_id").notNull().references(() => questionBank.id),
  sessionId: varchar("session_id").references(() => aiTutoringSessions.id),
  userAnswer: jsonb("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  hintsUsed: integer("hints_used").default(0),
  attemptsCount: integer("attempts_count").default(1),
  masteryLevel: text("mastery_level"), // Student's mastery after this response
  aiExplanation: text("ai_explanation"), // AI-generated explanation
  responseDate: timestamp("response_date").default(sql`now()`)
});

// Adaptive Learning Pathways
export const learningPathways = pgTable("learning_pathways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  trackId: varchar("track_id").notNull().references(() => industryTracks.id),
  pathwayType: text("pathway_type").notNull(), // 'foundation', 'immersion', 'mastery'
  currentModule: varchar("current_module").references(() => curriculumModules.id),
  completedModules: jsonb("completed_modules").default(sql`'[]'::jsonb`),
  progressMap: jsonb("progress_map").notNull(), // Detailed progress tracking
  adaptiveRecommendations: jsonb("adaptive_recommendations"), // AI-driven next steps
  difficultyProfile: jsonb("difficulty_profile"), // Subject-specific difficulty preferences
  learningStyle: text("learning_style"), // 'visual', 'auditory', 'kinesthetic', 'mixed'
  weeklyGoals: jsonb("weekly_goals"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Video Lessons (Khan Academy Style)
export const videoLessons = pgTable("video_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => curriculumModules.id),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"), // Link to video content
  duration: integer("duration").notNull(), // in seconds
  transcript: text("transcript"),
  lessonOrder: integer("lesson_order").notNull(),
  prerequisites: jsonb("prerequisites"),
  keyConceptsIntroduced: jsonb("key_concepts_introduced"),
  practiceExercises: jsonb("practice_exercises"), // Associated practice problems
  isInteractive: boolean("is_interactive").default(false),
  interactiveElements: jsonb("interactive_elements"), // Embedded quizzes, simulations
  viewCount: integer("view_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Student Video Progress
export const videoProgress = pgTable("video_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videoLessons.id),
  watchedDuration: integer("watched_duration").default(0), // in seconds
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  lastWatchedPosition: integer("last_watched_position").default(0),
  isCompleted: boolean("is_completed").default(false),
  notesCount: integer("notes_count").default(0),
  questionsAsked: integer("questions_asked").default(0),
  userRating: integer("user_rating"), // 1-5 stars
  watchHistory: jsonb("watch_history"), // Detailed viewing patterns
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Practice Exercises
export const practiceExercises = pgTable("practice_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => curriculumModules.id),
  title: text("title").notNull(),
  description: text("description"),
  exerciseType: text("exercise_type").notNull(), // 'drill', 'application', 'project', 'game'
  difficulty: decimal("difficulty", { precision: 3, scale: 2 }).notNull(),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  instructions: text("instructions").notNull(),
  exerciseData: jsonb("exercise_data").notNull(), // Exercise content and structure
  solutionData: jsonb("solution_data"), // Solutions and rubrics
  hints: jsonb("hints"),
  prerequisites: jsonb("prerequisites"),
  learningObjectives: jsonb("learning_objectives"),
  isAdaptive: boolean("is_adaptive").default(false),
  adaptiveParameters: jsonb("adaptive_parameters"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Student Exercise Attempts
export const exerciseAttempts = pgTable("exercise_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  exerciseId: varchar("exercise_id").notNull().references(() => practiceExercises.id),
  attemptNumber: integer("attempt_number").default(1),
  startTime: timestamp("start_time").default(sql`now()`),
  endTime: timestamp("end_time"),
  timeSpent: integer("time_spent"), // in seconds
  userResponse: jsonb("user_response").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  masteryLevel: text("mastery_level"), // 'attempted', 'familiar', 'proficient', 'mastered'
  feedback: text("feedback"),
  hintsUsed: integer("hints_used").default(0),
  isCompleted: boolean("is_completed").default(false),
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of student work
  createdAt: timestamp("created_at").default(sql`now()`)
});

// VR Competition Environments
export const vrCompetitions = pgTable("vr_competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  competitionType: text("competition_type").notNull(), // 'global_championship', 'regional_contest', 'practice_battle'
  subject: text("subject").notNull(), // 'mathematics', 'reasoning', 'ai_concepts', 'mixed'
  difficulty: text("difficulty").notNull(), // 'foundation', 'intermediate', 'advanced', 'mastery'
  vrEnvironment: text("vr_environment").notNull(), // 'space_station', 'ancient_library', 'futuristic_lab'
  maxParticipants: integer("max_participants").default(100),
  entryRequirement: decimal("entry_requirement", { precision: 5, scale: 2 }), // Minimum EiQ score
  prizeStructure: jsonb("prize_structure"), // Prize distribution and rewards
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("upcoming"), // 'upcoming', 'active', 'completed', 'cancelled'
  leaderboard: jsonb("leaderboard"), // Real-time competition standings
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const vrCompetitionParticipants = pgTable("vr_competition_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => vrCompetitions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  entryEiQScore: decimal("entry_eiq_score", { precision: 5, scale: 2 }),
  currentScore: decimal("current_score", { precision: 8, scale: 2 }).default("0"),
  rank: integer("rank"),
  completedChallenges: integer("completed_challenges").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in minutes
  vrSessionData: jsonb("vr_session_data"), // VR-specific interaction data
  achievements: jsonb("achievements"), // Competition-specific achievements
  joinedAt: timestamp("joined_at").default(sql`now()`),
  lastActiveAt: timestamp("last_active_at").default(sql`now()`)
});

// Comprehensive Degree Planning System (HighPoint.io Integration)
export const degreePrograms = pgTable("degree_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  universityId: varchar("university_id").notNull().references(() => universityPartners.id),
  name: text("name").notNull(), // e.g., "Computer Science BS", "Mathematics PhD"
  degreeType: text("degree_type").notNull(), // 'bachelor', 'master', 'phd', 'certificate'
  department: text("department").notNull(),
  totalCredits: integer("total_credits").notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // in semesters
  minEiQScore: decimal("min_eiq_score", { precision: 5, scale: 2 }),
  recommendedEiQScore: decimal("recommended_eiq_score", { precision: 5, scale: 2 }),
  prerequisites: jsonb("prerequisites"), // Course prerequisites and requirements
  coreRequirements: jsonb("core_requirements"), // Required courses with credit hours
  electiveRequirements: jsonb("elective_requirements"), // Elective categories and requirements
  specializations: jsonb("specializations"), // Available specialization tracks
  careerOutcomes: jsonb("career_outcomes"), // Expected career paths and outcomes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseCode: text("course_code").notNull().unique(), // e.g., "MATH101", "CS202"
  title: text("title").notNull(),
  description: text("description"),
  credits: integer("credits").notNull(),
  department: text("department").notNull(),
  level: text("level").notNull(), // 'undergraduate', 'graduate'
  prerequisites: jsonb("prerequisites"), // Required prerequisite courses
  corequisites: jsonb("corequisites"), // Courses that must be taken concurrently
  difficulty: text("difficulty"), // 'foundation', 'intermediate', 'advanced'
  averageWorkload: integer("average_workload"), // Hours per week
  passRate: decimal("pass_rate", { precision: 5, scale: 2 }), // Historical pass rate
  recommendedEiQScore: decimal("recommended_eiq_score", { precision: 5, scale: 2 }),
  offerings: jsonb("offerings"), // When the course is typically offered (fall/spring/summer)
  maxEnrollment: integer("max_enrollment"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const studentDegreePlans = pgTable("student_degree_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  degreeProgramId: varchar("degree_program_id").notNull().references(() => degreePrograms.id),
  planName: text("plan_name").notNull(), // e.g., "My CS Degree Plan", "Accelerated Path"
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false),
  currentGPA: decimal("current_gpa", { precision: 3, scale: 2 }),
  completedCredits: integer("completed_credits").default(0),
  remainingCredits: integer("remaining_credits"),
  projectedGraduationDate: timestamp("projected_graduation_date"),
  actualGraduationDate: timestamp("actual_graduation_date"),
  planStatus: text("plan_status").default("active"), // 'active', 'on_track', 'off_track', 'completed', 'withdrawn'
  riskFactors: jsonb("risk_factors"), // Identified risks to graduation
  interventionRecommendations: jsonb("intervention_recommendations"), // AI-generated recommendations
  eiqBasedRecommendations: jsonb("eiq_based_recommendations"), // EiQ score-based course suggestions
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const plannedCourses = pgTable("planned_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  degreePlanId: varchar("degree_plan_id").notNull().references(() => studentDegreePlans.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  plannedSemester: text("planned_semester").notNull(), // e.g., "Fall 2024", "Spring 2025"
  plannedYear: integer("planned_year").notNull(),
  semesterOrder: integer("semester_order"), // 1, 2, 3, etc.
  status: text("status").default("planned"), // 'planned', 'enrolled', 'in_progress', 'completed', 'failed', 'withdrawn'
  actualGrade: text("actual_grade"), // 'A', 'B', 'C', etc.
  gradePoints: decimal("grade_points", { precision: 3, scale: 2 }),
  isRequired: boolean("is_required").default(true), // vs elective
  requirementType: text("requirement_type"), // 'core', 'major_elective', 'general_elective', 'prerequisite'
  alternativeCourses: jsonb("alternative_courses"), // Alternative courses that meet the same requirement
  eiqRecommendationScore: decimal("eiq_recommendation_score", { precision: 3, scale: 2 }), // How well this matches student's EiQ
  difficultyPrediction: text("difficulty_prediction"), // AI prediction of difficulty for this student
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const degreeAudits = pgTable("degree_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  degreePlanId: varchar("degree_plan_id").notNull().references(() => studentDegreePlans.id),
  auditType: text("audit_type").notNull(), // 'real_time', 'graduation_check', 'what_if'
  completedRequirements: jsonb("completed_requirements"),
  pendingRequirements: jsonb("pending_requirements"),
  missingRequirements: jsonb("missing_requirements"),
  excessCredits: jsonb("excess_credits"), // Credits beyond degree requirements
  substituteCredits: jsonb("substitute_credits"), // Approved course substitutions
  waivedRequirements: jsonb("waived_requirements"), // Waived requirements with justification
  gpaCalculation: jsonb("gpa_calculation"), // Detailed GPA breakdown
  graduationEligibility: text("graduation_eligibility"), // 'eligible', 'pending', 'not_eligible'
  recommendedActions: jsonb("recommended_actions"), // Next steps to stay on track
  runDate: timestamp("run_date").default(sql`now()`),
  auditResults: jsonb("audit_results") // Complete audit results
});

export const courseDemandAnalytics = pgTable("course_demand_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  semester: text("semester").notNull(),
  year: integer("year").notNull(),
  plannedEnrollment: integer("planned_enrollment"), // Students who have this in their plan
  actualEnrollment: integer("actual_enrollment"),
  waitlistSize: integer("waitlist_size"),
  demandScore: decimal("demand_score", { precision: 5, scale: 2 }), // Calculated demand metric
  shortageRisk: text("shortage_risk"), // 'low', 'medium', 'high', 'critical'
  recommendedSections: integer("recommended_sections"), // AI recommendation for sections needed
  eiqDrivenDemand: jsonb("eiq_driven_demand"), // Demand based on EiQ score distributions
  generatedAt: timestamp("generated_at").default(sql`now()`)
});

// University Admission System Integration
export const universityPartners = pgTable("university_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  country: text("country").notNull(),
  ranking: integer("ranking"), // Global university ranking
  logoUrl: text("logo_url"),
  website: text("website"),
  contactEmail: text("contact_email"),
  minEiQScore: decimal("min_eiq_score", { precision: 5, scale: 2 }), // Minimum EiQ for consideration
  preferredEiQScore: decimal("preferred_eiq_score", { precision: 5, scale: 2 }), // Target EiQ for strong candidacy
  programs: jsonb("programs"), // Available programs and their EiQ requirements
  admissionProcess: jsonb("admission_process"), // EiQ integration specifics
  partnershipStatus: text("partnership_status").default("active"), // 'active', 'pending', 'inactive'
  partnershipTier: text("partnership_tier"), // 'premier', 'standard', 'basic'
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const universityApplications = pgTable("university_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  universityId: varchar("university_id").notNull().references(() => universityPartners.id),
  program: text("program").notNull(),
  applicationEiQScore: decimal("application_eiq_score", { precision: 5, scale: 2 }),
  transcriptAnalysis: jsonb("transcript_analysis"), // AI analysis of uploaded transcripts
  recommendationStatus: text("recommendation_status"), // 'highly_recommended', 'recommended', 'conditional', 'not_recommended'
  applicationData: jsonb("application_data"), // Complete application information
  status: text("status").default("draft"), // 'draft', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted'
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Corporate Partnership Program
export const corporatePartners = pgTable("corporate_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  industry: text("industry").notNull(), // 'technology', 'finance', 'healthcare', 'consulting'
  size: text("size"), // 'startup', 'medium', 'enterprise', 'fortune500'
  logoUrl: text("logo_url"),
  website: text("website"),
  contactEmail: text("contact_email"),
  headquarters: text("headquarters"),
  targetEiQRange: jsonb("target_eiq_range"), // Preferred EiQ score ranges for different roles
  talentRequirements: jsonb("talent_requirements"), // Specific skills and EiQ criteria
  partnershipTier: text("partnership_tier"), // 'premier', 'standard', 'basic'
  partnershipStatus: text("partnership_status").default("active"),
  recruitmentQuota: integer("recruitment_quota"), // Annual hiring targets from platform
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const talentProfile = pgTable("talent_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentEiQScore: decimal("current_eiq_score", { precision: 5, scale: 2 }),
  peakEiQScore: decimal("peak_eiq_score", { precision: 5, scale: 2 }),
  skillsProfile: jsonb("skills_profile"), // Detailed breakdown of abilities
  careerInterests: jsonb("career_interests"), // Preferred industries and roles
  availability: text("availability"), // 'immediate', 'graduate_2024', 'graduate_2025', 'flexible'
  resumeData: jsonb("resume_data"), // AI-extracted resume information
  portfolioLinks: jsonb("portfolio_links"),
  isOpenToRecruitment: boolean("is_open_to_recruitment").default(false),
  visibilitySettings: jsonb("visibility_settings"), // Privacy controls
  lastProfileUpdate: timestamp("last_profile_update").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const recruitmentMatches = pgTable("recruitment_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  talentProfileId: varchar("talent_profile_id").notNull().references(() => talentProfile.id),
  corporatePartnerId: varchar("corporate_partner_id").notNull().references(() => corporatePartners.id),
  jobTitle: text("job_title").notNull(),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }), // AI-calculated compatibility
  eiqRequirement: decimal("eiq_requirement", { precision: 5, scale: 2 }),
  jobDescription: text("job_description"),
  salary: jsonb("salary"), // Salary range and benefits
  status: text("status").default("matched"), // 'matched', 'contacted', 'interviewing', 'offered', 'hired', 'declined'
  contactedAt: timestamp("contacted_at"),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Note: usersRelations is already defined earlier in this file

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id]
  })
}));

export const learningPathsRelations = relations(learningPaths, ({ one }) => ({
  user: one(users, {
    fields: [learningPaths.userId],
    references: [users.id]
  })
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id]
  })
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id]
  })
}));

export const studyGroupsRelations = relations(studyGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [studyGroups.createdBy],
    references: [users.id]
  }),
  members: many(studyGroupMembers)
}));

export const studyGroupMembersRelations = relations(studyGroupMembers, ({ one }) => ({
  group: one(studyGroups, {
    fields: [studyGroupMembers.groupId],
    references: [studyGroups.id]
  }),
  user: one(users, {
    fields: [studyGroupMembers.userId],
    references: [users.id]
  })
}));

// K-12 Education Relations
export const industryTracksRelations = relations(industryTracks, ({ many }) => ({
  modules: many(curriculumModules),
  pathways: many(learningPathways)
}));

export const curriculumModulesRelations = relations(curriculumModules, ({ one, many }) => ({
  track: one(industryTracks, {
    fields: [curriculumModules.trackId],
    references: [industryTracks.id]
  }),
  questions: many(questionBank),
  videos: many(videoLessons),
  exercises: many(practiceExercises)
}));

export const questionBankRelations = relations(questionBank, ({ one, many }) => ({
  module: one(curriculumModules, {
    fields: [questionBank.moduleId],
    references: [curriculumModules.id]
  }),
  responses: many(assessmentResponses)
}));

export const learningPathwaysRelations = relations(learningPathways, ({ one }) => ({
  user: one(users, {
    fields: [learningPathways.userId],
    references: [users.id]
  }),
  track: one(industryTracks, {
    fields: [learningPathways.trackId],
    references: [industryTracks.id]
  }),
  currentModule: one(curriculumModules, {
    fields: [learningPathways.currentModule],
    references: [curriculumModules.id]
  })
}));

export const videoLessonsRelations = relations(videoLessons, ({ one, many }) => ({
  module: one(curriculumModules, {
    fields: [videoLessons.moduleId],
    references: [curriculumModules.id]
  }),
  progress: many(videoProgress)
}));

export const videoProgressRelations = relations(videoProgress, ({ one }) => ({
  user: one(users, {
    fields: [videoProgress.userId],
    references: [users.id]
  }),
  video: one(videoLessons, {
    fields: [videoProgress.videoId],
    references: [videoLessons.id]
  })
}));

export const practiceExercisesRelations = relations(practiceExercises, ({ one, many }) => ({
  module: one(curriculumModules, {
    fields: [practiceExercises.moduleId],
    references: [curriculumModules.id]
  }),
  attempts: many(exerciseAttempts)
}));

export const exerciseAttemptsRelations = relations(exerciseAttempts, ({ one }) => ({
  user: one(users, {
    fields: [exerciseAttempts.userId],
    references: [users.id]
  }),
  exercise: one(practiceExercises, {
    fields: [exerciseAttempts.exerciseId],
    references: [practiceExercises.id]
  })
}));

export const assessmentResponsesRelations = relations(assessmentResponses, ({ one }) => ({
  user: one(users, {
    fields: [assessmentResponses.userId],
    references: [users.id]
  }),
  question: one(questionBank, {
    fields: [assessmentResponses.questionId],
    references: [questionBank.id]
  }),
  session: one(aiTutoringSessions, {
    fields: [assessmentResponses.sessionId],
    references: [aiTutoringSessions.id]
  })
}));

// Advanced AI Tutoring Relations
export const aiTutoringSessionsRelations = relations(aiTutoringSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [aiTutoringSessions.userId],
    references: [users.id]
  }),
  responses: many(assessmentResponses)
}));

export const vrCompetitionsRelations = relations(vrCompetitions, ({ many }) => ({
  participants: many(vrCompetitionParticipants)
}));

export const vrCompetitionParticipantsRelations = relations(vrCompetitionParticipants, ({ one }) => ({
  competition: one(vrCompetitions, {
    fields: [vrCompetitionParticipants.competitionId],
    references: [vrCompetitions.id]
  }),
  user: one(users, {
    fields: [vrCompetitionParticipants.userId],
    references: [users.id]
  })
}));

export const universityApplicationsRelations = relations(universityApplications, ({ one }) => ({
  user: one(users, {
    fields: [universityApplications.userId],
    references: [users.id]
  }),
  university: one(universityPartners, {
    fields: [universityApplications.universityId],
    references: [universityPartners.id]
  })
}));

export const universityPartnersRelations = relations(universityPartners, ({ many }) => ({
  applications: many(universityApplications)
}));

export const talentProfileRelations = relations(talentProfile, ({ one, many }) => ({
  user: one(users, {
    fields: [talentProfile.userId],
    references: [users.id]
  }),
  matches: many(recruitmentMatches)
}));

export const corporatePartnersRelations = relations(corporatePartners, ({ many }) => ({
  matches: many(recruitmentMatches)
}));

export const recruitmentMatchesRelations = relations(recruitmentMatches, ({ one }) => ({
  talentProfile: one(talentProfile, {
    fields: [recruitmentMatches.talentProfileId],
    references: [talentProfile.id]
  }),
  corporatePartner: one(corporatePartners, {
    fields: [recruitmentMatches.corporatePartnerId],
    references: [corporatePartners.id]
  })
}));

// Insert schemas - Note: insertUserSchema is already defined earlier in this file
// export const insertUserSchema = createInsertSchema(users).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true
// });

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  createdAt: true
});

export const insertStudyGroupMemberSchema = createInsertSchema(studyGroupMembers).omit({
  id: true,
  joinedAt: true
});

export const insertCourseFeedSchema = createInsertSchema(courseFeed).omit({
  id: true,
  publishedAt: true
});

// K-12 Education Insert Schemas
export const insertIndustryTrackSchema = createInsertSchema(industryTracks).omit({
  id: true,
  createdAt: true
});

export const insertCurriculumModuleSchema = createInsertSchema(curriculumModules).omit({
  id: true,
  createdAt: true
});

export const insertQuestionBankSchema = createInsertSchema(questionBank).omit({
  id: true,
  createdAt: true
});

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({
  id: true,
  responseDate: true
});

export const insertLearningPathwaySchema = createInsertSchema(learningPathways).omit({
  id: true,
  createdAt: true
});

export const insertVideoLessonSchema = createInsertSchema(videoLessons).omit({
  id: true,
  createdAt: true
});

export const insertVideoProgressSchema = createInsertSchema(videoProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPracticeExerciseSchema = createInsertSchema(practiceExercises).omit({
  id: true,
  createdAt: true
});

export const insertExerciseAttemptSchema = createInsertSchema(exerciseAttempts).omit({
  id: true,
  createdAt: true
});

// AI Tutoring Insert Schemas
export const insertAiTutoringSessionSchema = createInsertSchema(aiTutoringSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVrCompetitionSchema = createInsertSchema(vrCompetitions).omit({
  id: true,
  createdAt: true
});

export const insertVrCompetitionParticipantSchema = createInsertSchema(vrCompetitionParticipants).omit({
  id: true,
  joinedAt: true,
  lastActiveAt: true
});

export const insertUniversityPartnerSchema = createInsertSchema(universityPartners).omit({
  id: true,
  createdAt: true
});

export const insertUniversityApplicationSchema = createInsertSchema(universityApplications).omit({
  id: true,
  createdAt: true
});

export const insertCorporatePartnerSchema = createInsertSchema(corporatePartners).omit({
  id: true,
  createdAt: true
});

export const insertTalentProfileSchema = createInsertSchema(talentProfile).omit({
  id: true,
  createdAt: true
});

export const insertRecruitmentMatchSchema = createInsertSchema(recruitmentMatches).omit({
  id: true,
  createdAt: true
});

export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiMentorSessionSchema = createInsertSchema(aiMentorSessions).omit({
  id: true,
  createdAt: true
});

// Skill Recommendations Schema
export const skillRecommendations = pgTable("skill_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillCategory: text("skill_category").notNull(), // 'programming', 'mathematics', 'ai_concepts', 'problem_solving'
  skillName: text("skill_name").notNull(),
  currentLevel: text("current_level").notNull(), // 'beginner', 'intermediate', 'advanced', 'expert'
  targetLevel: text("target_level").notNull(),
  priority: integer("priority").default(1), // 1-5 priority ranking
  estimatedHours: integer("estimated_hours").default(0),
  prerequisiteSkills: text("prerequisite_skills").array().default(sql`'{}'::text[]`),
  learningPath: jsonb("learning_path").notNull(), // Structured learning steps and resources
  aiReasoning: text("ai_reasoning"), // AI explanation for why this skill is recommended
  progress: integer("progress").default(0), // 0-100 completion percentage
  isActive: boolean("is_active").default(true),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const insertSkillRecommendationSchema = createInsertSchema(skillRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types for skill recommendations
export type SkillRecommendation = typeof skillRecommendations.$inferSelect;
export type InsertSkillRecommendation = typeof skillRecommendations.$inferInsert;

// LIVE USER TESTING & ANALYTICS SCHEMAS
export const userBehaviorTracking = pgTable("user_behavior_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(),
  
  // Interaction tracking
  eventType: text("event_type").notNull(), // 'page_view', 'button_click', 'form_submit', 'assessment_start', 'hint_request', 'question_answer'
  eventData: jsonb("event_data").notNull(),
  page: text("page").notNull(),
  component: text("component"),
  
  // Performance metrics
  responseTime: integer("response_time"), // milliseconds
  timeOnPage: integer("time_on_page"), // seconds
  scrollDepth: integer("scroll_depth"), // percentage
  clickPath: text("click_path").array().default(sql`'{}'::text[]`),
  
  // Engagement metrics
  interactionQuality: integer("interaction_quality"), // 1-10 scale
  focusTime: integer("focus_time"), // milliseconds of focused activity
  idleTime: integer("idle_time"), // milliseconds of inactivity
  
  // Technical data
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  deviceType: text("device_type"), // 'desktop', 'tablet', 'mobile'
  browserType: text("browser_type"),
  viewport: jsonb("viewport"), // {width, height}
  connectionSpeed: text("connection_speed"),
  
  // A/B Testing flags
  experimentGroup: text("experiment_group"),
  featureFlags: text("feature_flags").array().default(sql`'{}'::text[]`),
  
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Contextual Learning Hint System
export const learningHints = pgTable("learning_hints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questionId: varchar("question_id"),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'conceptual', 'procedural', 'strategic', 'motivational'
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }).default("0.50"),
  context: jsonb("context"), // Store hint generation context
  isUseful: boolean("is_useful"), // User feedback on hint usefulness
  wasFollowed: boolean("was_followed"), // Whether user acted on the hint
  timeToShow: integer("time_to_show"), // Seconds before hint was shown
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const hintEffectiveness = pgTable("hint_effectiveness", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  hintId: varchar("hint_id").notNull().references(() => learningHints.id),
  performanceBefore: decimal("performance_before", { precision: 3, scale: 2 }),
  performanceAfter: decimal("performance_after", { precision: 3, scale: 2 }),
  improvementScore: decimal("improvement_score", { precision: 3, scale: 2 }),
  contextSimilarity: decimal("context_similarity", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const liveTestingSessions = pgTable("live_testing_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(), // 'assessment', 'learning', 'collaboration', 'onboarding'
  
  // Session metadata
  startedAt: timestamp("started_at").default(sql`now()`),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // seconds
  isActive: boolean("is_active").default(true),
  
  // Testing parameters
  testGroup: text("test_group"), // A/B test group assignment
  testVariant: text("test_variant"), // specific variant within test
  goalMetrics: jsonb("goal_metrics"), // target metrics for this session
  
  // Performance data
  interactionCount: integer("interaction_count").default(0),
  errorCount: integer("error_count").default(0),
  completionRate: decimal("completion_rate", { precision: 3, scale: 2 }),
  satisfactionScore: integer("satisfaction_score"), // 1-10 user rating
  
  // AI Learning data
  learningObjectives: text("learning_objectives").array(),
  achievedObjectives: text("achieved_objectives").array().default(sql`'{}'::text[]`),
  adaptiveAdjustments: jsonb("adaptive_adjustments"), // AI-driven session modifications
  
  // Real-time insights
  aiInsights: jsonb("ai_insights"), // Live AI analysis during session
  behaviorPatterns: jsonb("behavior_patterns"), // Detected patterns
  performanceMetrics: jsonb("performance_metrics"), // Real-time performance data
  
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const aiLearningData = pgTable("ai_learning_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Data source identification
  dataType: text("data_type").notNull(), // 'user_interaction', 'assessment_response', 'learning_outcome', 'behavior_pattern'
  sourceUserId: varchar("source_user_id").references(() => users.id),
  sourceSessionId: varchar("source_session_id").references(() => liveTestingSessions.id),
  
  // Learning data
  rawData: jsonb("raw_data").notNull(), // Original interaction/response data
  processedData: jsonb("processed_data"), // AI-processed insights
  patterns: jsonb("patterns"), // Identified patterns
  correlations: jsonb("correlations"), // Found correlations with other data
  
  // AI model training features
  featureVector: jsonb("feature_vector"), // Extracted features for ML
  labels: text("labels").array(), // Classification labels
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence in analysis
  
  // Learning optimization
  modelVersion: text("model_version"), // AI model version used
  processingAlgorithm: text("processing_algorithm"), // Algorithm used for analysis
  validationStatus: text("validation_status").default("pending"), // 'pending', 'validated', 'rejected'
  
  // Meta-learning data
  learningImpact: jsonb("learning_impact"), // How this data influenced AI learning
  predictionAccuracy: decimal("prediction_accuracy", { precision: 3, scale: 2 }),
  improvementMetrics: jsonb("improvement_metrics"),
  
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const realTimeAnalytics = pgTable("real_time_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Time-based aggregation
  timeWindow: text("time_window").notNull(), // '1min', '5min', '15min', '1hour', '1day'
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  
  // Platform metrics
  activeUsers: integer("active_users").default(0),
  newRegistrations: integer("new_registrations").default(0),
  assessmentSessions: integer("assessment_sessions").default(0),
  completionRate: decimal("completion_rate", { precision: 3, scale: 2 }),
  
  // Performance metrics
  avgResponseTime: integer("avg_response_time"), // milliseconds
  errorRate: decimal("error_rate", { precision: 3, scale: 2 }),
  serverLoad: decimal("server_load", { precision: 3, scale: 2 }),
  databaseConnections: integer("database_connections"),
  
  // User engagement
  avgSessionDuration: integer("avg_session_duration"), // seconds
  pagesPerSession: decimal("pages_per_session", { precision: 3, scale: 2 }),
  bounceRate: decimal("bounce_rate", { precision: 3, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 3, scale: 2 }),
  
  // AI insights metrics
  aiInteractions: integer("ai_interactions").default(0),
  hintsGenerated: integer("hints_generated").default(0),
  adaptiveAdjustments: integer("adaptive_adjustments").default(0),
  learningEfficiency: decimal("learning_efficiency", { precision: 3, scale: 2 }),
  
  // A/B Testing results
  testResults: jsonb("test_results"), // Current A/B test performance
  statSigResults: jsonb("stat_sig_results"), // Statistically significant findings
  
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Insert schemas for live testing
export const insertUserBehaviorTrackingSchema = createInsertSchema(userBehaviorTracking).omit({
  id: true,
  createdAt: true
});

export const insertLiveTestingSessionSchema = createInsertSchema(liveTestingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiLearningDataSchema = createInsertSchema(aiLearningData).omit({
  id: true,
  createdAt: true
});

export const insertRealTimeAnalyticsSchema = createInsertSchema(realTimeAnalytics).omit({
  id: true,
  createdAt: true
});

// Types for live testing
export type UserBehaviorTracking = typeof userBehaviorTracking.$inferSelect;
export type InsertUserBehaviorTracking = typeof userBehaviorTracking.$inferInsert;
export type LiveTestingSession = typeof liveTestingSessions.$inferSelect;
export type InsertLiveTestingSession = typeof liveTestingSessions.$inferInsert;
export type AiLearningData = typeof aiLearningData.$inferSelect;
export type InsertAiLearningData = typeof aiLearningData.$inferInsert;
export type RealTimeAnalytics = typeof realTimeAnalytics.$inferSelect;
export type InsertRealTimeAnalytics = typeof realTimeAnalytics.$inferInsert;

// Additional Types (User types already defined above)
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type StudyGroupMember = typeof studyGroupMembers.$inferSelect;
export type InsertStudyGroupMember = z.infer<typeof insertStudyGroupMemberSchema>;
export type CourseFeed = typeof courseFeed.$inferSelect;
export type InsertCourseFeed = z.infer<typeof insertCourseFeedSchema>;

// K-12 Education Types
export type IndustryTrack = typeof industryTracks.$inferSelect;
export type InsertIndustryTrack = z.infer<typeof insertIndustryTrackSchema>;
export type CurriculumModule = typeof curriculumModules.$inferSelect;
export type InsertCurriculumModule = z.infer<typeof insertCurriculumModuleSchema>;
export type QuestionBank = typeof questionBank.$inferSelect;
export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type LearningPathway = typeof learningPathways.$inferSelect;
export type InsertLearningPathway = z.infer<typeof insertLearningPathwaySchema>;
export type VideoLesson = typeof videoLessons.$inferSelect;
export type InsertVideoLesson = z.infer<typeof insertVideoLessonSchema>;
export type VideoProgress = typeof videoProgress.$inferSelect;
export type InsertVideoProgress = z.infer<typeof insertVideoProgressSchema>;
export type PracticeExercise = typeof practiceExercises.$inferSelect;
export type InsertPracticeExercise = z.infer<typeof insertPracticeExerciseSchema>;
export type ExerciseAttempt = typeof exerciseAttempts.$inferSelect;
export type InsertExerciseAttempt = z.infer<typeof insertExerciseAttemptSchema>;

// AI Tutoring Types
export type AiTutoringSession = typeof aiTutoringSessions.$inferSelect;
export type InsertAiTutoringSession = z.infer<typeof insertAiTutoringSessionSchema>;

// VR Competition Types
export type VrCompetition = typeof vrCompetitions.$inferSelect;
export type InsertVrCompetition = z.infer<typeof insertVrCompetitionSchema>;
export type VrCompetitionParticipant = typeof vrCompetitionParticipants.$inferSelect;
export type InsertVrCompetitionParticipant = z.infer<typeof insertVrCompetitionParticipantSchema>;

// University & Corporate Types
export type UniversityPartner = typeof universityPartners.$inferSelect;
export type InsertUniversityPartner = z.infer<typeof insertUniversityPartnerSchema>;
export type UniversityApplication = typeof universityApplications.$inferSelect;
export type InsertUniversityApplication = z.infer<typeof insertUniversityApplicationSchema>;
export type CorporatePartner = typeof corporatePartners.$inferSelect;
export type InsertCorporatePartner = z.infer<typeof insertCorporatePartnerSchema>;
export type TalentProfile = typeof talentProfile.$inferSelect;
export type InsertTalentProfile = z.infer<typeof insertTalentProfileSchema>;
export type RecruitmentMatch = typeof recruitmentMatches.$inferSelect;
export type InsertRecruitmentMatch = z.infer<typeof insertRecruitmentMatchSchema>;

// Onboarding types
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;
export type AiMentorSession = typeof aiMentorSessions.$inferSelect;
export type InsertAiMentorSession = z.infer<typeof insertAiMentorSessionSchema>;

// Degree Planning Insert Schemas
export const insertDegreeProgramSchema = createInsertSchema(degreePrograms).omit({
  id: true,
  createdAt: true
});
export type InsertDegreeProgram = z.infer<typeof insertDegreeProgramSchema>;

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true
});
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export const insertStudentDegreePlanSchema = createInsertSchema(studentDegreePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertStudentDegreePlan = z.infer<typeof insertStudentDegreePlanSchema>;

export const insertPlannedCourseSchema = createInsertSchema(plannedCourses).omit({
  id: true,
  createdAt: true
});
export type InsertPlannedCourse = z.infer<typeof insertPlannedCourseSchema>;

export const insertDegreeAuditSchema = createInsertSchema(degreeAudits).omit({
  id: true,
  runDate: true
});
export type InsertDegreeAudit = z.infer<typeof insertDegreeAuditSchema>;

// Degree Planning Types
export type DegreeProgram = typeof degreePrograms.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type StudentDegreePlan = typeof studentDegreePlans.$inferSelect;
export type PlannedCourse = typeof plannedCourses.$inferSelect;
export type DegreeAudit = typeof degreeAudits.$inferSelect;
export type CourseDemandAnalytics = typeof courseDemandAnalytics.$inferSelect;

// Achievement Badges System
export const achievementBadges = pgTable("achievement_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // 'assessment', 'learning', 'streak', 'ai', 'social', 'mastery'
  tier: text("tier").notNull(), // 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconPath: text("icon_path").notNull(),
  colorScheme: text("color_scheme").notNull(), // 'bronze', 'silver', 'gold', 'platinum', 'rainbow'
  criteria: jsonb("criteria").notNull(), // Requirements to earn badge
  points: integer("points").notNull().default(0), // Badge point value
  rarity: text("rarity").notNull().default("common"), // 'common', 'uncommon', 'rare', 'epic', 'legendary'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: varchar("badge_id").notNull().references(() => achievementBadges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").default(sql`now()`),
  progress: jsonb("progress"), // Progress towards next tier if applicable
  isDisplayed: boolean("is_displayed").default(true), // Show on profile
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => [
  index("idx_user_badges_user_id").on(table.userId),
  index("idx_user_badges_badge_id").on(table.badgeId)
]);

export const achievementProgress = pgTable("achievement_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: varchar("badge_id").notNull().references(() => achievementBadges.id, { onDelete: "cascade" }),
  currentProgress: integer("current_progress").default(0),
  targetValue: integer("target_value").notNull(),
  progressData: jsonb("progress_data"), // Detailed progress tracking
  lastUpdated: timestamp("last_updated").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => [
  index("idx_achievement_progress_user").on(table.userId),
  index("idx_achievement_progress_badge").on(table.badgeId)
]);

// Achievement Relations
export const achievementBadgesRelations = relations(achievementBadges, ({ many }) => ({
  userBadges: many(userBadges),
  progress: many(achievementProgress)
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id]
  }),
  badge: one(achievementBadges, {
    fields: [userBadges.badgeId],
    references: [achievementBadges.id]
  })
}));

export const achievementProgressRelations = relations(achievementProgress, ({ one }) => ({
  user: one(users, {
    fields: [achievementProgress.userId],
    references: [users.id]
  }),
  badge: one(achievementBadges, {
    fields: [achievementProgress.badgeId],
    references: [achievementBadges.id]
  })
}));

// Achievement Insert Schemas
export const insertAchievementBadgeSchema = createInsertSchema(achievementBadges).omit({
  id: true,
  createdAt: true
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
  createdAt: true
});

export const insertAchievementProgressSchema = createInsertSchema(achievementProgress).omit({
  id: true,
  lastUpdated: true,
  createdAt: true
});

// Achievement Badge Types
export type AchievementBadge = typeof achievementBadges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type AchievementProgress = typeof achievementProgress.$inferSelect;

// Hint System Relations
export const learningHintsRelations = relations(learningHints, ({ one, many }) => ({
  user: one(users, {
    fields: [learningHints.userId],
    references: [users.id]
  }),
  effectiveness: many(hintEffectiveness)
}));

export const hintEffectivenessRelations = relations(hintEffectiveness, ({ one }) => ({
  user: one(users, {
    fields: [hintEffectiveness.userId],
    references: [users.id]
  }),
  hint: one(learningHints, {
    fields: [hintEffectiveness.hintId],
    references: [learningHints.id]
  })
}));

// Hint System Types
export type LearningHint = typeof learningHints.$inferSelect;
export type HintEffectiveness = typeof hintEffectiveness.$inferSelect;

// Chat System Tables
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  messageCount: integer("message_count").default(0).notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: varchar("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
});

// Chat System Relations
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id]
  }),
  messages: many(chatMessages)
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id]
  })
}));

// Chat System Insert Schemas
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});

// Custom Questions System - Staff-created questions with AI assistance
export const customQuestions = pgTable("custom_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // 'multiple_choice', 'open_ended', 'scenario_based'
  options: jsonb("options"), // For multiple choice options
  correctAnswer: text("correct_answer"), // Expected answer or rubric
  difficultyEstimate: integer("difficulty_estimate"), // Staff's estimated difficulty 1-10
  cognitiveDomains: text("cognitive_domains").array().default(sql`'{}'::text[]`), // Targeted domains
  createdFromAssessmentId: varchar("created_from_assessment_id").references(() => assessments.id),
  aiAssistanceUsed: boolean("ai_assistance_used").default(false),
  aiGenerationPrompt: text("ai_generation_prompt"), // The prompt used for AI assistance
  status: text("status").default("draft"), // 'draft', 'active', 'archived'
  tags: text("tags").array().default(sql`'{}'::text[]`), // Searchable tags
  metadata: jsonb("metadata"), // Additional question metadata
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Student responses to custom questions
export const customQuestionResponses = pgTable("custom_question_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customQuestionId: varchar("custom_question_id").notNull().references(() => customQuestions.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  responseText: text("response_text"),
  responseTime: integer("response_time"), // Time taken in seconds
  isCorrect: boolean("is_correct"),
  staffFeedback: text("staff_feedback"), // Staff's evaluation/feedback
  score: decimal("score", { precision: 5, scale: 2 }), // Numerical score if applicable
  followUpNeeded: boolean("follow_up_needed").default(false),
  responseMetadata: jsonb("response_metadata"), // Additional response data
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// AI question generation sessions
export const aiQuestionSessions = pgTable("ai_question_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentAssessmentData: jsonb("student_assessment_data"), // Relevant assessment results
  aiProviderUsed: text("ai_provider_used"), // 'openai', 'anthropic', 'gemini'
  generationParameters: jsonb("generation_parameters"), // Prompt settings and parameters
  generatedQuestions: jsonb("generated_questions"), // Array of AI suggestions
  selectedQuestionIds: text("selected_question_ids").array().default(sql`'{}'::text[]`), // Questions staff used
  sessionMetadata: jsonb("session_metadata"), // Timing, iterations, refinements
  effectiveness: decimal("effectiveness", { precision: 3, scale: 2 }), // Measured effectiveness over time
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Question assignments to students
export const questionAssignments = pgTable("question_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customQuestionId: varchar("custom_question_id").notNull().references(() => customQuestions.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").default(sql`now()`),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  instructions: text("instructions"), // Special instructions for the student
  status: text("status").default("assigned"), // 'assigned', 'completed', 'overdue', 'skipped'
  completedAt: timestamp("completed_at"),
  assignmentMetadata: jsonb("assignment_metadata")
});

// Institutions table for staff affiliation
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'ivy_league', 'university', 'college', 'k12_school', 'tutoring_center'
  accreditation: text("accreditation"), // Academic accreditation info
  website: text("website"),
  contactEmail: text("contact_email"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Staff-Student assignments
export const staffStudentAssignments = pgTable("staff_student_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id), // Admin who made assignment
  assignedAt: timestamp("assigned_at").default(sql`now()`),
  isActive: boolean("is_active").default(true),
  notes: text("notes"), // Assignment notes
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Staff observations and recommendations
export const staffObservations = pgTable("staff_observations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  observationType: text("observation_type").notNull(), // 'progress_note', 'recommendation', 'intervention', 'milestone'
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  tags: text("tags").array().default(sql`'{}'::text[]`),
  isPrivate: boolean("is_private").default(false), // Staff-only notes
  parentNotification: boolean("parent_notification").default(false),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Student progress analytics for staff
export const studentProgressAnalytics = pgTable("student_progress_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  analysisDate: timestamp("analysis_date").default(sql`now()`),
  cognitiveStrengths: jsonb("cognitive_strengths"), // Areas of strong performance
  improvementAreas: jsonb("improvement_areas"), // Areas needing attention
  learningVelocity: decimal("learning_velocity", { precision: 5, scale: 2 }), // Rate of improvement
  engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }), // 0-10 scale
  riskFactors: jsonb("risk_factors"), // Academic risk indicators
  interventionSuggestions: jsonb("intervention_suggestions"), // AI-generated recommendations
  nextMilestones: jsonb("next_milestones"), // Upcoming learning targets
  parentReportGenerated: boolean("parent_report_generated").default(false),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Staff-related schema exports
export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStaffStudentAssignmentSchema = createInsertSchema(staffStudentAssignments).omit({
  id: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertStaffObservationSchema = createInsertSchema(staffObservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentProgressAnalyticsSchema = createInsertSchema(studentProgressAnalytics).omit({
  id: true,
  analysisDate: true,
  createdAt: true
});

// Staff-related types
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type StaffStudentAssignment = typeof staffStudentAssignments.$inferSelect;
export type InsertStaffStudentAssignment = z.infer<typeof insertStaffStudentAssignmentSchema>;
export type StaffObservation = typeof staffObservations.$inferSelect;
export type InsertStaffObservation = z.infer<typeof insertStaffObservationSchema>;
export type StudentProgressAnalytics = typeof studentProgressAnalytics.$inferSelect;
export type InsertStudentProgressAnalytics = z.infer<typeof insertStudentProgressAnalyticsSchema>;

// Custom questions relations
export const customQuestionsRelations = relations(customQuestions, ({ one, many }) => ({
  staff: one(users, {
    fields: [customQuestions.staffId],
    references: [users.id]
  }),
  student: one(users, {
    fields: [customQuestions.studentId],
    references: [users.id]
  }),
  assessment: one(assessments, {
    fields: [customQuestions.createdFromAssessmentId],
    references: [assessments.id]
  }),
  responses: many(customQuestionResponses),
  assignments: many(questionAssignments)
}));

export const customQuestionResponsesRelations = relations(customQuestionResponses, ({ one }) => ({
  question: one(customQuestions, {
    fields: [customQuestionResponses.customQuestionId],
    references: [customQuestions.id]
  }),
  student: one(users, {
    fields: [customQuestionResponses.studentId],
    references: [users.id]
  })
}));

export const aiQuestionSessionsRelations = relations(aiQuestionSessions, ({ one }) => ({
  staff: one(users, {
    fields: [aiQuestionSessions.staffId],
    references: [users.id]
  })
}));

export const questionAssignmentsRelations = relations(questionAssignments, ({ one }) => ({
  question: one(customQuestions, {
    fields: [questionAssignments.customQuestionId],
    references: [customQuestions.id]
  }),
  student: one(users, {
    fields: [questionAssignments.studentId],
    references: [users.id]
  }),
  staff: one(users, {
    fields: [questionAssignments.staffId],
    references: [users.id]
  })
}));

// Custom questions insert schemas
export const insertCustomQuestionSchema = createInsertSchema(customQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomQuestionResponseSchema = createInsertSchema(customQuestionResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiQuestionSessionSchema = createInsertSchema(aiQuestionSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertQuestionAssignmentSchema = createInsertSchema(questionAssignments).omit({
  id: true,
  assignedAt: true
});

// Custom questions types
export type CustomQuestion = typeof customQuestions.$inferSelect;
export type InsertCustomQuestion = z.infer<typeof insertCustomQuestionSchema>;
export type CustomQuestionResponse = typeof customQuestionResponses.$inferSelect;
export type InsertCustomQuestionResponse = z.infer<typeof insertCustomQuestionResponseSchema>;
export type AiQuestionSession = typeof aiQuestionSessions.$inferSelect;
export type InsertAiQuestionSession = z.infer<typeof insertAiQuestionSessionSchema>;
export type QuestionAssignment = typeof questionAssignments.$inferSelect;
export type InsertQuestionAssignment = z.infer<typeof insertQuestionAssignmentSchema>;

// Chat System Types
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Role Model Matching System Tables
export const matchConfig = pgTable("match_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  algorithm: text("algorithm").notNull().default("ml"), // 'ml' or 'rules'
  parameters: jsonb("parameters").default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const matchesCache = pgTable("matches_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  algorithm: text("algorithm").notNull(), // 'ml' or 'rules'
  matchData: jsonb("match_data").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  matchCount: integer("match_count").default(0),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => [
  index("idx_matches_cache_user_algorithm").on(table.userId, table.algorithm),
  index("idx_matches_cache_expires").on(table.expiresAt)
]);

// Role Model Matching Relations
export const matchConfigRelations = relations(matchConfig, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [matchConfig.updatedBy],
    references: [users.id]
  })
}));

export const matchesCacheRelations = relations(matchesCache, ({ one }) => ({
  user: one(users, {
    fields: [matchesCache.userId],
    references: [users.id]
  })
}));

// Role Model Matching Insert Schemas
export const insertMatchConfigSchema = createInsertSchema(matchConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMatchesCacheSchema = createInsertSchema(matchesCache).omit({
  id: true,
  createdAt: true
});

// Role Model Matching Types
export type MatchConfig = typeof matchConfig.$inferSelect;
export type InsertMatchConfig = z.infer<typeof insertMatchConfigSchema>;
export type MatchesCache = typeof matchesCache.$inferSelect;
export type InsertMatchesCache = z.infer<typeof insertMatchesCacheSchema>;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Knowledge Visualization Tables
export const knowledgeNodes = pgTable("knowledge_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // concept, skill, topic, domain
  category: text("category"), // math, science, language, etc.
  description: text("description"),
  masteryLevel: decimal("mastery_level", { precision: 3, scale: 2 }).default("0.00"), // 0.0 to 1.0
  connections: jsonb("connections").default(sql`'[]'::jsonb`), // Array of connected node IDs
  position: jsonb("position"), // x, y coordinates for visualization
  metadata: jsonb("metadata"), // Additional node data
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const knowledgeConnections = pgTable("knowledge_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fromNodeId: varchar("from_node_id").notNull().references(() => knowledgeNodes.id, { onDelete: "cascade" }),
  toNodeId: varchar("to_node_id").notNull().references(() => knowledgeNodes.id, { onDelete: "cascade" }),
  connectionType: text("connection_type").default("prerequisite"), // prerequisite, related, advanced
  strength: decimal("strength", { precision: 3, scale: 2 }).default("1.00"), // Connection weight
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const knowledgeVisualizations = pgTable("knowledge_visualizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // network, tree, timeline, heatmap
  config: jsonb("config"), // Visualization configuration
  nodes: jsonb("nodes"), // Node data snapshot
  connections: jsonb("connections"), // Connection data snapshot
  layout: jsonb("layout"), // Layout algorithm results
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Knowledge visualization relations
export const knowledgeNodesRelations = relations(knowledgeNodes, ({ one, many }) => ({
  user: one(users, {
    fields: [knowledgeNodes.userId],
    references: [users.id],
  }),
  outgoingConnections: many(knowledgeConnections, {
    relationName: "fromNode",
  }),
  incomingConnections: many(knowledgeConnections, {
    relationName: "toNode",
  }),
}));

export const knowledgeConnectionsRelations = relations(knowledgeConnections, ({ one }) => ({
  user: one(users, {
    fields: [knowledgeConnections.userId],
    references: [users.id],
  }),
  fromNode: one(knowledgeNodes, {
    fields: [knowledgeConnections.fromNodeId],
    references: [knowledgeNodes.id],
    relationName: "fromNode",
  }),
  toNode: one(knowledgeNodes, {
    fields: [knowledgeConnections.toNodeId],
    references: [knowledgeNodes.id],
    relationName: "toNode",
  }),
}));

export const knowledgeVisualizationsRelations = relations(knowledgeVisualizations, ({ one }) => ({
  user: one(users, {
    fields: [knowledgeVisualizations.userId],
    references: [users.id],
  }),
}));

// Insert schemas for knowledge visualization
export const insertKnowledgeNodeSchema = createInsertSchema(knowledgeNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertKnowledgeConnectionSchema = createInsertSchema(knowledgeConnections).omit({
  id: true,
  createdAt: true
});

export const insertKnowledgeVisualizationSchema = createInsertSchema(knowledgeVisualizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Knowledge Visualization Types
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type InsertKnowledgeNode = z.infer<typeof insertKnowledgeNodeSchema>;
export type KnowledgeConnection = typeof knowledgeConnections.$inferSelect;
export type InsertKnowledgeConnection = z.infer<typeof insertKnowledgeConnectionSchema>;
export type KnowledgeVisualization = typeof knowledgeVisualizations.$inferSelect;
export type InsertKnowledgeVisualization = z.infer<typeof insertKnowledgeVisualizationSchema>;

// ==================== AI-DRIVEN ADAPTIVE ASSESSMENT TABLES ====================
// These tables ensure NO question repetition and enable FICO-like EIQ scoring

// Track EVERY question a user has EVER seen - NEVER repeat
export const userQuestionHistory = pgTable("user_question_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionHash: varchar("question_hash").notNull(), // Unique hash of question text
  questionId: varchar("question_id"), // Reference to original or generated question
  questionText: text("question_text").notNull(), // Store full text for analysis
  subject: text("subject").notNull(),
  difficulty: decimal("difficulty", { precision: 3, scale: 2 }),
  responseTime: integer("response_time"), // Milliseconds to answer
  wasCorrect: boolean("was_correct"),
  timestamp: timestamp("timestamp").default(sql`now()`),
}, (table) => [
  index("idx_user_question_history").on(table.userId, table.questionHash),
]);

// User Learning Profiles - How each user thinks and learns
export const userLearningProfiles = pgTable("user_learning_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  
  // Communication and thinking style
  communicationStyle: text("communication_style"), // visual, verbal, kinesthetic, analytical
  problemSolvingApproach: text("problem_solving_approach"), // systematic, intuitive, creative, practical
  responseSpeed: text("response_speed"), // fast, moderate, deliberate
  comprehensionDepth: text("comprehension_depth"), // surface, moderate, deep
  
  // Cognitive measurements
  preferredComplexity: decimal("preferred_complexity", { precision: 3, scale: 2 }), // 1-10 scale
  learningVelocity: decimal("learning_velocity", { precision: 5, scale: 3 }), // Rate of improvement
  knowledgeCeiling: decimal("knowledge_ceiling", { precision: 5, scale: 2 }), // Estimated max capacity
  
  // Personality assessments
  myersBriggsType: varchar("myers_briggs_type", { length: 4 }), // INTJ, ENFP, etc.
  dominantIntelligenceType: text("dominant_intelligence_type"), // Based on Gardner's theory
  
  // DISC Personality Profile (0-100 scale for each dimension)
  discDominance: decimal("disc_dominance", { precision: 5, scale: 2 }), // Direct, results-oriented
  discInfluence: decimal("disc_influence", { precision: 5, scale: 2 }), // People-oriented, optimistic
  discSteadiness: decimal("disc_steadiness", { precision: 5, scale: 2 }), // Patient, loyal
  discConscientiousness: decimal("disc_conscientiousness", { precision: 5, scale: 2 }), // Accurate, analytical
  
  // OCEAN (Big Five) Personality Profile (0-100 scale for each trait)
  oceanOpenness: decimal("ocean_openness", { precision: 5, scale: 2 }), // Openness to experience
  oceanConscientiousness: decimal("ocean_conscientiousness", { precision: 5, scale: 2 }), // Organization, discipline
  oceanExtraversion: decimal("ocean_extraversion", { precision: 5, scale: 2 }), // Sociability, energy
  oceanAgreeableness: decimal("ocean_agreeableness", { precision: 5, scale: 2 }), // Compassion, cooperation
  oceanNeuroticism: decimal("ocean_neuroticism", { precision: 5, scale: 2 }), // Emotional stability
  
  // Strengths and weaknesses
  strengths: text("strengths").array().default(sql`'{}'::text[]`),
  weaknesses: text("weaknesses").array().default(sql`'{}'::text[]`),
  
  // Learning patterns from free-form responses
  writingClarity: decimal("writing_clarity", { precision: 3, scale: 2 }), // 0-1 score
  logicalStructure: decimal("logical_structure", { precision: 3, scale: 2 }), // 0-1 score
  creativityIndex: decimal("creativity_index", { precision: 3, scale: 2 }), // 0-1 score
  emotionalAwareness: decimal("emotional_awareness", { precision: 3, scale: 2 }), // 0-1 score
  
  // Metadata
  lastAnalyzed: timestamp("last_analyzed"),
  profileData: jsonb("profile_data"), // Additional AI-generated insights
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// AI-Generated Questions - Store all AI-created questions
export const aiGeneratedQuestions = pgTable("ai_generated_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Question content
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // multiple-choice, free-form, visual, etc.
  assessmentType: text("assessment_type"), // sat, act, iq, eq, myers-briggs, dsm, hybrid
  
  // Question parameters
  subject: text("subject").notNull(),
  difficulty: decimal("difficulty", { precision: 3, scale: 2 }).notNull(),
  skills: text("skills").array().default(sql`'{}'::text[]`),
  
  // For multiple choice
  options: jsonb("options"), // Array of answer options
  correctAnswer: text("correct_answer"),
  
  // For free-form questions
  expectedResponseType: text("expected_response_type"), // essay, calculation, diagram, etc.
  evaluationCriteria: jsonb("evaluation_criteria"),
  
  // Learning context
  learningProfile: jsonb("learning_profile"), // Snapshot of user's profile when generated
  generationContext: jsonb("generation_context"), // Why this question was generated
  
  // Metadata
  aiProvider: text("ai_provider"), // openai, anthropic, gemini
  generatedAt: timestamp("generated_at").default(sql`now()`),
  wasUsed: boolean("was_used").default(false),
  userResponse: text("user_response"),
  responseAnalysis: jsonb("response_analysis")
});

// EIQ Scores - Note: eiqScores table is already defined earlier in this file
// export const eiqScores = pgTable("eiq_scores", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
//   
//   // Overall EIQ Score (300-850 like FICO)
//   score: integer("score").notNull(),
//   percentile: decimal("percentile", { precision: 5, scale: 2 }), // 0-100
//   
//   // Score components (like FICO categories)
//   problemSolvingScore: decimal("problem_solving_score", { precision: 5, scale: 2 }), // 35% weight
//   knowledgeDepthScore: decimal("knowledge_depth_score", { precision: 5, scale: 2 }), // 30% weight
//   learningVelocityScore: decimal("learning_velocity_score", { precision: 5, scale: 2 }), // 15% weight
//   adaptabilityScore: decimal("adaptability_score", { precision: 5, scale: 2 }), // 10% weight
//   communicationScore: decimal("communication_score", { precision: 5, scale: 2 }), // 10% weight
//   
//   // Predictions and recommendations
//   predictedImprovement: integer("predicted_improvement"), // Points likely to gain
//   improvementTimeframe: text("improvement_timeframe"), // "3 months", "6 months", etc.
//   recommendations: jsonb("recommendations"), // Personalized improvement strategies
//   
//   // Assessment breakdown
//   iqComponent: integer("iq_component"), // Traditional IQ score component
//   eqComponent: integer("eq_component"), // Emotional intelligence component
//   satEquivalent: integer("sat_equivalent"), // SAT score equivalent
//   actEquivalent: integer("act_equivalent"), // ACT score equivalent
//   
//   // Extended IQ Score Types
//   traditionalIQ: integer("traditional_iq"), // Wechsler-style IQ (40-160 range)
//   emotionalIQ: integer("emotional_iq"), // EQ score (0-200 range)
//   alternativeIQ: integer("alternative_iq"), // Gardner's Multiple Intelligence (0-100 range)
//   
//   // Metadata
//   assessmentCount: integer("assessment_count"), // Number of assessments taken
//   questionsAnswered: integer("questions_answered"), // Total questions answered
//   calculatedAt: timestamp("calculated_at").default(sql`now()`),
//   validUntil: timestamp("valid_until"), // When recalculation is needed
//   scoreData: jsonb("score_data") // Detailed scoring breakdown
// });

// Free-form Response Analysis - Deep learning from open-ended answers
export const freeFormAnalysis = pgTable("free_form_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull(),
  
  // Response content
  responseText: text("response_text").notNull(),
  responseLength: integer("response_length"),
  responseTime: integer("response_time"), // Milliseconds
  
  // Communication analysis
  clarity: decimal("clarity", { precision: 3, scale: 2 }), // 0-1
  coherence: decimal("coherence", { precision: 3, scale: 2 }), // 0-1
  vocabulary: decimal("vocabulary", { precision: 3, scale: 2 }), // 0-1
  grammar: decimal("grammar", { precision: 3, scale: 2 }), // 0-1
  
  // Thinking analysis
  logicalFlow: decimal("logical_flow", { precision: 3, scale: 2 }), // 0-1
  creativity: decimal("creativity", { precision: 3, scale: 2 }), // 0-1
  criticalThinking: decimal("critical_thinking", { precision: 3, scale: 2 }), // 0-1
  problemDecomposition: decimal("problem_decomposition", { precision: 3, scale: 2 }), // 0-1
  
  // Emotional intelligence indicators
  selfAwareness: decimal("self_awareness", { precision: 3, scale: 2 }), // 0-1
  empathy: decimal("empathy", { precision: 3, scale: 2 }), // 0-1
  emotionalRegulation: decimal("emotional_regulation", { precision: 3, scale: 2 }), // 0-1
  
  // AI insights
  aiAnalysis: jsonb("ai_analysis"), // Full AI analysis
  identifiedPatterns: text("identified_patterns").array().default(sql`'{}'::text[]`),
  suggestedFollowUp: text("suggested_follow_up"), // Next question to ask
  
  analyzedAt: timestamp("analyzed_at").default(sql`now()`)
});

// Dedicated Personality Profiles table for comprehensive personality assessment storage
export const personalityProfiles = pgTable("personality_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  
  // Myers-Briggs Type Indicator
  myersBriggsType: varchar("myers_briggs_type", { length: 4 }), // INTJ, ENFP, etc.
  myersBriggsConfidence: decimal("myers_briggs_confidence", { precision: 5, scale: 2 }), // 0-100
  extraversionIntroversion: varchar("extraversion_introversion", { length: 1 }), // E or I
  sensingIntuition: varchar("sensing_intuition", { length: 1 }), // S or N  
  thinkingFeeling: varchar("thinking_feeling", { length: 1 }), // T or F
  judgingPerceiving: varchar("judging_perceiving", { length: 1 }), // J or P
  
  // DISC Profile (0-100 scale for each dimension)
  discDominance: decimal("disc_dominance", { precision: 5, scale: 2 }), // Direct, results-oriented
  discInfluence: decimal("disc_influence", { precision: 5, scale: 2 }), // People-oriented, optimistic
  discSteadiness: decimal("disc_steadiness", { precision: 5, scale: 2 }), // Patient, loyal
  discConscientiousness: decimal("disc_conscientiousness", { precision: 5, scale: 2 }), // Accurate, analytical
  discPrimaryStyle: varchar("disc_primary_style", { length: 1 }), // D, I, S, or C
  discAdaptedStyle: varchar("disc_adapted_style", { length: 1 }), // D, I, S, or C (optional)
  
  // OCEAN/Big Five Personality Profile (0-100 scale for each trait)
  oceanOpenness: decimal("ocean_openness", { precision: 5, scale: 2 }), // Openness to experience
  oceanConscientiousness: decimal("ocean_conscientiousness", { precision: 5, scale: 2 }), // Organization, discipline
  oceanExtraversion: decimal("ocean_extraversion", { precision: 5, scale: 2 }), // Sociability, energy
  oceanAgreeableness: decimal("ocean_agreeableness", { precision: 5, scale: 2 }), // Compassion, cooperation
  oceanNeuroticism: decimal("ocean_neuroticism", { precision: 5, scale: 2 }), // Emotional stability
  
  // Personalized Recommendations
  learningStylePrimary: text("learning_style_primary"),
  learningStyleSecondary: text("learning_style_secondary"),
  cognitiveStrengths: text("cognitive_strengths").array().default(sql`'{}'::text[]`),
  growthAreas: text("growth_areas").array().default(sql`'{}'::text[]`),
  studyMethods: text("study_methods").array().default(sql`'{}'::text[]`),
  collaborationStyle: text("collaboration_style").array().default(sql`'{}'::text[]`),
  motivationTriggers: text("motivation_triggers").array().default(sql`'{}'::text[]`),
  stressManagement: text("stress_management").array().default(sql`'{}'::text[]`),
  
  // Career Alignment
  compatibleFields: text("compatible_fields").array().default(sql`'{}'::text[]`),
  roleTypes: text("role_types").array().default(sql`'{}'::text[]`),
  workEnvironments: text("work_environments").array().default(sql`'{}'::text[]`),
  
  // Assessment metadata
  assessmentVersion: text("assessment_version").default("1.0"),
  completedAt: timestamp("completed_at").default(sql`now()`),
  lastUpdated: timestamp("last_updated").default(sql`now()`),
  rawAssessmentData: jsonb("raw_assessment_data") // Store detailed assessment responses
});

// Extended IQ Scores table for Traditional/Emotional/Alternative scoring
export const extendedIqScores = pgTable("extended_iq_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eiqScoreId: varchar("eiq_score_id").references(() => eiqScores.id), // Link to main EIQ score
  
  // EIQ Score (existing FICO-like system 300-850)
  eiq: integer("eiq").notNull(),
  
  // Traditional IQ Scores (Wechsler scale)
  traditionalOverall: integer("traditional_overall"), // 40-160 range
  traditionalVerbal: integer("traditional_verbal"),
  traditionalPerformance: integer("traditional_performance"),
  traditionalWorkingMemory: integer("traditional_working_memory"),
  traditionalProcessingSpeed: integer("traditional_processing_speed"),
  
  // Emotional Intelligence (0-200 range)
  emotionalOverall: integer("emotional_overall"),
  emotionalSelfAwareness: integer("emotional_self_awareness"),
  emotionalSelfManagement: integer("emotional_self_management"),
  emotionalSocialAwareness: integer("emotional_social_awareness"),
  emotionalRelationshipManagement: integer("emotional_relationship_management"),
  
  // Alternative Intelligence (Gardner's Multiple Intelligences, 0-100 range)
  alternativeOverall: integer("alternative_overall"),
  alternativeLinguistic: integer("alternative_linguistic"),
  alternativeLogicalMathematical: integer("alternative_logical_mathematical"),
  alternativeSpatial: integer("alternative_spatial"),
  alternativeMusicalRhythmic: integer("alternative_musical_rhythmic"),
  alternativeBodilyKinesthetic: integer("alternative_bodily_kinesthetic"),
  alternativeInterpersonal: integer("alternative_interpersonal"),
  alternativeIntrapersonal: integer("alternative_intrapersonal"),
  alternativeNaturalistic: integer("alternative_naturalistic"),
  
  // Score metadata
  assessmentDate: timestamp("assessment_date").default(sql`now()`),
  scoringMethod: text("scoring_method").default("adaptive"), // adaptive, traditional, combined
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100 confidence level
  rawScoreData: jsonb("raw_score_data") // Detailed scoring breakdown
});

// Export types for the new tables
export type UserQuestionHistory = typeof userQuestionHistory.$inferSelect;
export type UserLearningProfile = typeof userLearningProfiles.$inferSelect;
export type InsertUserLearningProfile = typeof userLearningProfiles.$inferInsert;
export type AIGeneratedQuestion = typeof aiGeneratedQuestions.$inferSelect;
// EIQScore and InsertEiqScore types already defined above
export type FreeFormAnalysis = typeof freeFormAnalysis.$inferSelect;
export type PersonalityProfile = typeof personalityProfiles.$inferSelect;
export type InsertPersonalityProfile = typeof personalityProfiles.$inferInsert;
export type ExtendedIqScore = typeof extendedIqScores.$inferSelect;
export type InsertExtendedIqScore = typeof extendedIqScores.$inferInsert;

// ========================================
// PHASE 2: MOTHERAI ↔ CHILDAI ARCHITECTURE WITH PRIVACY CONTROLS
// ========================================

// AI Agents Registry - Manages MotherAI and ChildAI instances
export const aiAgents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(), // 'mother', 'child', 'guardian'
  agentName: text("agent_name").notNull(),
  agentVersion: text("agent_version").notNull().default("1.0"),
  parentAgentId: varchar("parent_agent_id"), // NULL for MotherAI, references mother for ChildAI
  capabilities: jsonb("capabilities").notNull(), // What this AI can do
  permissions: jsonb("permissions").notNull(), // What data it can access
  privacyLevel: text("privacy_level").notNull().default("standard"), // 'minimal', 'standard', 'elevated', 'full'
  aiProvider: text("ai_provider").notNull().default("openai"), // 'openai', 'anthropic', 'gemini'
  modelConfig: jsonb("model_config"), // Model-specific configuration
  isActive: boolean("is_active").default(true),
  resourceLimits: jsonb("resource_limits"), // Rate limiting, token limits
  lastHealthCheck: timestamp("last_health_check"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// AI Agent Sessions - Track individual AI interactions
export const aiAgentSessions = pgTable("ai_agent_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => aiAgents.id),
  userId: varchar("user_id").references(() => users.id), // NULL for system sessions
  sessionType: text("session_type").notNull(), // 'assessment', 'tutoring', 'analysis', 'monitoring'
  privacyMode: text("privacy_mode").notNull().default("standard"), // 'anonymous', 'standard', 'identified'
  dataAccessLevel: text("data_access_level").notNull(), // 'public', 'profile', 'learning', 'full'
  parentSessionId: varchar("parent_session_id"), // Link to parent MotherAI session
  contextData: jsonb("context_data"), // Session context with privacy filtering
  conversationHistory: jsonb("conversation_history").notNull().default(sql`'[]'::jsonb`),
  performanceMetrics: jsonb("performance_metrics"), // Response time, accuracy, etc.
  privacyViolations: jsonb("privacy_violations").default(sql`'[]'::jsonb`), // Logged privacy issues
  status: text("status").default("active"), // 'active', 'completed', 'suspended', 'error'
  startedAt: timestamp("started_at").default(sql`now()`),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Privacy Controls - User-defined privacy settings for AI interactions
export const privacyControls = pgTable("privacy_controls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  controlType: text("control_type").notNull(), // 'data_sharing', 'ai_access', 'monitoring', 'retention'
  settingName: text("setting_name").notNull(), // Specific privacy setting
  settingValue: jsonb("setting_value").notNull(), // Setting configuration
  restrictionLevel: text("restriction_level").notNull().default("moderate"), // 'minimal', 'moderate', 'strict', 'paranoid'
  allowedAgents: jsonb("allowed_agents"), // Which AI agents can access this data
  dataCategories: jsonb("data_categories"), // What data categories this affects
  expirationDate: timestamp("expiration_date"), // When this control expires
  inheritanceRules: jsonb("inheritance_rules"), // How this applies to child agents
  auditRequired: boolean("audit_required").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// AI Data Access Logs - Comprehensive privacy audit trail
export const aiDataAccessLogs = pgTable("ai_data_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => aiAgentSessions.id),
  agentId: varchar("agent_id").notNull().references(() => aiAgents.id),
  userId: varchar("user_id").references(() => users.id),
  accessType: text("access_type").notNull(), // 'read', 'analyze', 'store', 'transmit'
  dataCategory: text("data_category").notNull(), // 'profile', 'assessment', 'conversation', 'behavioral'
  dataFields: jsonb("data_fields").notNull(), // Specific fields accessed
  privacyControlsApplied: jsonb("privacy_controls_applied"), // Which controls were enforced
  accessJustification: text("access_justification"), // Why this access was needed
  dataAnonymized: boolean("data_anonymized").default(false),
  consentLevel: text("consent_level"), // Level of user consent for this access
  privacyScore: decimal("privacy_score", { precision: 5, scale: 2 }), // Privacy compliance score 0-100
  violationFlags: jsonb("violation_flags"), // Any detected violations
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// AI Learning Models - Track AI model performance and improvement
export const aiLearningModels = pgTable("ai_learning_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => aiAgents.id),
  modelType: text("model_type").notNull(), // 'assessment', 'tutoring', 'behavioral', 'predictive'
  modelVersion: text("model_version").notNull(),
  trainingDataSource: text("training_data_source"), // Source of training data
  privacyCompliantTraining: boolean("privacy_compliant_training").default(true),
  performanceMetrics: jsonb("performance_metrics"), // Accuracy, efficiency metrics
  biasDetectionResults: jsonb("bias_detection_results"), // Bias analysis results
  fairnessScores: jsonb("fairness_scores"), // Fairness across demographic groups
  modelParameters: jsonb("model_parameters"), // Encrypted model configuration
  lastRetraining: timestamp("last_retraining"),
  deploymentStatus: text("deployment_status").default("development"), // 'development', 'testing', 'production', 'deprecated'
  ethicalApproval: boolean("ethical_approval").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// AI Communication Bridge - Manages MotherAI ↔ ChildAI communication
export const aiCommunicationBridge = pgTable("ai_communication_bridge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  motherAgentId: varchar("mother_agent_id").notNull().references(() => aiAgents.id),
  childAgentId: varchar("child_agent_id").notNull().references(() => aiAgents.id),
  communicationType: text("communication_type").notNull(), // 'delegation', 'supervision', 'data_sharing', 'coordination'
  messageContent: jsonb("message_content").notNull(), // Encrypted communication content
  privacyFilters: jsonb("privacy_filters"), // Applied privacy transformations
  dataTransferred: jsonb("data_transferred"), // Summary of transferred data
  authorizationLevel: text("authorization_level").notNull(), // 'read', 'write', 'execute', 'admin'
  encryptionUsed: boolean("encryption_used").default(true),
  auditTrail: jsonb("audit_trail"), // Complete communication audit
  responseRequired: boolean("response_required").default(false),
  responseReceived: boolean("response_received").default(false),
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'critical'
  status: text("status").default("pending"), // 'pending', 'delivered', 'processed', 'failed'
  sentAt: timestamp("sent_at").default(sql`now()`),
  receivedAt: timestamp("received_at"),
  processedAt: timestamp("processed_at")
});

// AI Agent Relations
export const aiAgentsRelations = relations(aiAgents, ({ one, many }) => ({
  parent: one(aiAgents, {
    fields: [aiAgents.parentAgentId],
    references: [aiAgents.id]
  }),
  children: many(aiAgents),
  sessions: many(aiAgentSessions),
  learningModels: many(aiLearningModels),
  communicationsAsMother: many(aiCommunicationBridge),
  communicationsAsChild: many(aiCommunicationBridge),
  accessLogs: many(aiDataAccessLogs)
}));

export const aiAgentSessionsRelations = relations(aiAgentSessions, ({ one, many }) => ({
  agent: one(aiAgents, {
    fields: [aiAgentSessions.agentId],
    references: [aiAgents.id]
  }),
  user: one(users, {
    fields: [aiAgentSessions.userId],
    references: [users.id]
  }),
  parentSession: one(aiAgentSessions, {
    fields: [aiAgentSessions.parentSessionId],
    references: [aiAgentSessions.id]
  }),
  childSessions: many(aiAgentSessions),
  accessLogs: many(aiDataAccessLogs)
}));

export const privacyControlsRelations = relations(privacyControls, ({ one }) => ({
  user: one(users, {
    fields: [privacyControls.userId],
    references: [users.id]
  })
}));

export const aiDataAccessLogsRelations = relations(aiDataAccessLogs, ({ one }) => ({
  session: one(aiAgentSessions, {
    fields: [aiDataAccessLogs.sessionId],
    references: [aiAgentSessions.id]
  }),
  agent: one(aiAgents, {
    fields: [aiDataAccessLogs.agentId],
    references: [aiAgents.id]
  }),
  user: one(users, {
    fields: [aiDataAccessLogs.userId],
    references: [users.id]
  })
}));

export const aiLearningModelsRelations = relations(aiLearningModels, ({ one }) => ({
  agent: one(aiAgents, {
    fields: [aiLearningModels.agentId],
    references: [aiAgents.id]
  })
}));

export const aiCommunicationBridgeRelations = relations(aiCommunicationBridge, ({ one }) => ({
  motherAgent: one(aiAgents, {
    fields: [aiCommunicationBridge.motherAgentId],
    references: [aiAgents.id]
  }),
  childAgent: one(aiAgents, {
    fields: [aiCommunicationBridge.childAgentId],
    references: [aiAgents.id]
  })
}));

// =====================================
// PHASE 3: AVATAR & AUDIT SYSTEM
// =====================================

// Avatar System - Comprehensive Avatar Management
export const avatars = pgTable("avatars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  avatarType: text("avatar_type").notNull().default("generated"), // 'uploaded', 'generated', 'preset'
  avatarUrl: text("avatar_url"), // URL to avatar image
  avatarData: jsonb("avatar_data"), // Customization data for generated avatars
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  style: text("style").default("professional"), // 'professional', 'casual', 'artistic', 'minimalist'
  colors: jsonb("colors"), // Color scheme for generated avatars
  accessories: jsonb("accessories"), // Glasses, hats, etc.
  mood: text("mood").default("neutral"), // 'happy', 'neutral', 'focused', 'confident'
  generationPrompt: text("generation_prompt"), // AI prompt used to generate avatar
  modificationHistory: jsonb("modification_history"), // Track changes
  privacyLevel: text("privacy_level").default("public"), // 'public', 'cohort', 'private'
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Avatar Presets - Predefined avatar styles and templates
export const avatarPresets = pgTable("avatar_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'professional', 'academic', 'creative', 'fun'
  presetData: jsonb("preset_data").notNull(), // Template configuration
  previewUrl: text("preview_url"),
  popularity: integer("popularity").default(0),
  isActive: boolean("is_active").default(true),
  ageAppropriate: text("age_appropriate").default("all"), // 'all', 'teen', 'adult'
  createdAt: timestamp("created_at").default(sql`now()`)
});

// Comprehensive Audit Logging System
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  staffId: varchar("staff_id").references(() => users.id), // For admin actions
  sessionId: varchar("session_id"), // Link to user session if applicable
  action: text("action").notNull(), // 'create', 'update', 'delete', 'view', 'login', 'logout', 'assess', 'export'
  resourceType: text("resource_type").notNull(), // 'user', 'assessment', 'avatar', 'ai_agent', 'privacy_control'
  resourceId: varchar("resource_id"), // ID of the affected resource
  resourceName: text("resource_name"), // Human-readable name of resource
  oldValues: jsonb("old_values"), // Previous state before change
  newValues: jsonb("new_values"), // New state after change
  changeDetails: jsonb("change_details"), // Detailed change information
  outcome: text("outcome").default("success"), // 'success', 'failed', 'partial'
  riskLevel: text("risk_level").default("low"), // 'low', 'medium', 'high', 'critical'
  complianceFlags: text("compliance_flags").array().default(sql`'{}'::text[]`), // GDPR, COPPA, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: jsonb("location"), // Geographic data if available
  reason: text("reason"), // Why the action was performed
  automatedAction: boolean("automated_action").default(false),
  requiresReview: boolean("requires_review").default(false),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  retentionDate: timestamp("retention_date"), // When this log can be deleted
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    userIdIdx: index("idx_audit_user_id").on(table.userId),
    actionIdx: index("idx_audit_action").on(table.action),
    resourceTypeIdx: index("idx_audit_resource_type").on(table.resourceType),
    createdAtIdx: index("idx_audit_created_at").on(table.createdAt),
    riskLevelIdx: index("idx_audit_risk_level").on(table.riskLevel)
  };
});

// System Monitoring and Health Audit
export const systemAuditLogs = pgTable("system_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  systemComponent: text("system_component").notNull(), // 'database', 'ai_service', 'auth', 'api', 'frontend'
  eventType: text("event_type").notNull(), // 'startup', 'shutdown', 'error', 'warning', 'info'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  message: text("message").notNull(),
  details: jsonb("details"),
  performanceMetrics: jsonb("performance_metrics"), // Response time, memory usage, etc.
  affectedUsers: integer("affected_users").default(0),
  resolution: text("resolution"), // How the issue was resolved
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  automatedResolution: boolean("automated_resolution").default(false),
  alertsSent: boolean("alerts_sent").default(false),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    componentIdx: index("idx_system_audit_component").on(table.systemComponent),
    eventTypeIdx: index("idx_system_audit_event_type").on(table.eventType),
    severityIdx: index("idx_system_audit_severity").on(table.severity),
    createdAtIdx: index("idx_system_audit_created_at").on(table.createdAt)
  };
});

// Compliance and Data Governance Audit
export const complianceAudit = pgTable("compliance_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditType: text("audit_type").notNull(), // 'gdpr', 'coppa', 'ferpa', 'privacy', 'security', 'accessibility'
  userId: varchar("user_id").references(() => users.id),
  dataCategory: text("data_category").notNull(), // 'personal', 'educational', 'behavioral', 'assessment'
  complianceStatus: text("compliance_status").notNull(), // 'compliant', 'violation', 'warning', 'review_needed'
  violationType: text("violation_type"), // 'unauthorized_access', 'data_retention', 'consent_missing'
  severity: text("severity").default("medium"), // 'low', 'medium', 'high', 'critical'
  details: jsonb("details").notNull(),
  remediation: text("remediation"), // Actions taken to fix violations
  remediatedBy: varchar("remediated_by").references(() => users.id),
  remediatedAt: timestamp("remediated_at"),
  reportRequired: boolean("report_required").default(false), // Must report to authorities
  reportedAt: timestamp("reported_at"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    auditTypeIdx: index("idx_compliance_audit_type").on(table.auditType),
    userIdIdx: index("idx_compliance_user_id").on(table.userId),
    statusIdx: index("idx_compliance_status").on(table.complianceStatus),
    severityIdx: index("idx_compliance_severity").on(table.severity),
    createdAtIdx: index("idx_compliance_created_at").on(table.createdAt)
  };
});

// Avatar Relations
export const avatarsRelations = relations(avatars, ({ one }) => ({
  user: one(users, {
    fields: [avatars.userId],
    references: [users.id]
  })
}));

// Audit Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  }),
  staff: one(users, {
    fields: [auditLogs.staffId],
    references: [users.id]
  }),
  reviewer: one(users, {
    fields: [auditLogs.reviewedBy],
    references: [users.id]
  })
}));

export const systemAuditLogsRelations = relations(systemAuditLogs, ({ one }) => ({
  resolvedByUser: one(users, {
    fields: [systemAuditLogs.resolvedBy],
    references: [users.id]
  })
}));

export const complianceAuditRelations = relations(complianceAudit, ({ one }) => ({
  user: one(users, {
    fields: [complianceAudit.userId],
    references: [users.id]
  }),
  remediatedByUser: one(users, {
    fields: [complianceAudit.remediatedBy],
    references: [users.id]
  })
}));

// Phase 3 Types - Avatar & Audit System
export type Avatar = typeof avatars.$inferSelect;
export type InsertAvatar = typeof avatars.$inferInsert;
export type AvatarPreset = typeof avatarPresets.$inferSelect;
export type InsertAvatarPreset = typeof avatarPresets.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type SystemAuditLog = typeof systemAuditLogs.$inferSelect;
export type InsertSystemAuditLog = typeof systemAuditLogs.$inferInsert;
export type ComplianceAudit = typeof complianceAudit.$inferSelect;
export type InsertComplianceAudit = typeof complianceAudit.$inferInsert;

// Types for MotherAI ↔ ChildAI Architecture
export type AIAgent = typeof aiAgents.$inferSelect;
export type InsertAIAgent = typeof aiAgents.$inferInsert;
export type AIAgentSession = typeof aiAgentSessions.$inferSelect;
export type InsertAIAgentSession = typeof aiAgentSessions.$inferInsert;
export type PrivacyControl = typeof privacyControls.$inferSelect;
export type InsertPrivacyControl = typeof privacyControls.$inferInsert;
export type AIDataAccessLog = typeof aiDataAccessLogs.$inferSelect;
export type InsertAIDataAccessLog = typeof aiDataAccessLogs.$inferInsert;
export type AILearningModel = typeof aiLearningModels.$inferSelect;
export type InsertAILearningModel = typeof aiLearningModels.$inferInsert;
export type AICommunicationBridge = typeof aiCommunicationBridge.$inferSelect;
export type InsertAICommunicationBridge = typeof aiCommunicationBridge.$inferInsert;

// Math Testing System Tables

// Math Problem Bank with IRT parameters
export const mathProblems = pgTable("math_problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Content
  problemText: text("problem_text").notNull(), // Supports LaTeX
  correctAnswer: text("correct_answer"), // For auto-scored items
  answerType: text("answer_type").notNull().default("multiple_choice"), // multiple_choice, numeric, free_response
  choices: jsonb("choices"), // For multiple choice questions
  solution: text("solution"), // Detailed solution/explanation
  
  // Taxonomy
  domain: text("domain").notNull(), // Number Sense, Algebra, Geometry, Combinatorics, etc.
  subTopic: text("sub_topic"),
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard, expert
  gradeLevel: text("grade_level"), // K-1, K-2, ..., K-12, college, graduate
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  
  // IRT Parameters for adaptive testing
  irtDifficulty: decimal("irt_difficulty", { precision: 5, scale: 3 }).default("0.000"), // b parameter
  irtDiscrimination: decimal("irt_discrimination", { precision: 5, scale: 3 }).default("1.000"), // a parameter
  irtGuessing: decimal("irt_guessing", { precision: 5, scale: 3 }).default("0.000"), // c parameter (for 3PL)
  
  // Performance tracking
  timesUsed: integer("times_used").default(0),
  correctRate: decimal("correct_rate", { precision: 5, scale: 3 }),
  averageTime: integer("average_time"), // milliseconds
  
  // Admin metadata
  createdBy: varchar("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  calibrationStatus: text("calibration_status").default("estimated"), // estimated, calibrated, expert_reviewed
  lastCalibrated: timestamp("last_calibrated"),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => {
  return {
    domainIdx: index("idx_math_problems_domain").on(table.domain),
    difficultyIdx: index("idx_math_problems_difficulty").on(table.difficulty),
    gradeIdx: index("idx_math_problems_grade").on(table.gradeLevel),
    activeIdx: index("idx_math_problems_active").on(table.isActive),
    irtDiffIdx: index("idx_math_problems_irt_diff").on(table.irtDifficulty)
  };
});

// Math Test Sessions (for adaptive testing)
export const mathTestSessions = pgTable("math_test_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Session configuration
  testMode: text("test_mode").notNull(), // timed_quiz, full_round, free_response, practice
  domains: jsonb("domains").default(sql`'[]'::jsonb`), // Selected domains for this session
  targetGrade: text("target_grade"),
  maxQuestions: integer("max_questions").default(25),
  timeLimit: integer("time_limit"), // minutes
  
  // Adaptive testing state
  currentTheta: decimal("current_theta", { precision: 5, scale: 3 }).default("0.000"), // Current ability estimate
  thetaHistory: jsonb("theta_history").default(sql`'[]'::jsonb`), // Track theta evolution
  standardError: decimal("standard_error", { precision: 5, scale: 3 }),
  
  // Session progress
  currentQuestionIndex: integer("current_question_index").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  totalTime: integer("total_time").default(0), // milliseconds
  
  // Session status
  status: text("status").default("active"), // active, completed, abandoned, paused
  completedAt: timestamp("completed_at"),
  finalScore: decimal("final_score", { precision: 5, scale: 2 }),
  percentile: decimal("percentile", { precision: 5, scale: 2 }),
  
  // Results and feedback
  results: jsonb("results").default(sql`'{}'::jsonb`),
  feedback: text("feedback"),
  recommendedNextSteps: jsonb("recommended_next_steps").default(sql`'[]'::jsonb`),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    userIdx: index("idx_math_sessions_user").on(table.userId),
    statusIdx: index("idx_math_sessions_status").on(table.status),
    modeIdx: index("idx_math_sessions_mode").on(table.testMode),
    completedIdx: index("idx_math_sessions_completed").on(table.completedAt)
  };
});

// Math Test Responses (individual question responses)
export const mathTestResponses = pgTable("math_test_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => mathTestSessions.id, { onDelete: "cascade" }),
  problemId: varchar("problem_id").notNull().references(() => mathProblems.id),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Response data
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  responseTime: integer("response_time"), // milliseconds
  questionOrder: integer("question_order"),
  
  // Adaptive testing data
  thetaBeforeQuestion: decimal("theta_before_question", { precision: 5, scale: 3 }),
  thetaAfterQuestion: decimal("theta_after_question", { precision: 5, scale: 3 }),
  informationValue: decimal("information_value", { precision: 5, scale: 3 }),
  
  // Speed-weighted scoring
  speedPenalty: decimal("speed_penalty", { precision: 5, scale: 3 }).default("0.000"),
  adjustedScore: decimal("adjusted_score", { precision: 5, scale: 3 }),
  
  // AI feedback
  hint: text("hint"), // If user requested a hint
  explanation: text("explanation"), // Post-answer explanation
  errorAnalysis: text("error_analysis"), // If answer was wrong
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    sessionIdx: index("idx_math_responses_session").on(table.sessionId),
    userIdx: index("idx_math_responses_user").on(table.userId),
    problemIdx: index("idx_math_responses_problem").on(table.problemId),
    orderIdx: index("idx_math_responses_order").on(table.sessionId, table.questionOrder)
  };
});

// User Math Ability Tracking (IRT theta over time)
export const userMathAbility = pgTable("user_math_ability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Overall ability
  overallTheta: decimal("overall_theta", { precision: 5, scale: 3 }).default("0.000"),
  overallStandardError: decimal("overall_standard_error", { precision: 5, scale: 3 }),
  
  // Domain-specific abilities
  domainAbilities: jsonb("domain_abilities").default(sql`'{}'::jsonb`), // {domain: {theta: x, se: y}}
  
  // Performance metrics
  totalQuestions: integer("total_questions").default(0),
  totalCorrect: integer("total_correct").default(0),
  averageResponseTime: integer("average_response_time"),
  
  // Progress tracking
  abilityHistory: jsonb("ability_history").default(sql`'[]'::jsonb`), // Track theta over time
  lastUpdated: timestamp("last_updated").default(sql`now()`),
  
  // Recommendations
  weakDomains: jsonb("weak_domains").default(sql`'[]'::jsonb`),
  recommendedPractice: jsonb("recommended_practice").default(sql`'[]'::jsonb`),
  nextTestRecommendation: timestamp("next_test_recommendation"),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    userIdx: index("idx_math_ability_user").on(table.userId),
    thetaIdx: index("idx_math_ability_theta").on(table.overallTheta),
    updatedIdx: index("idx_math_ability_updated").on(table.lastUpdated)
  };
});

// Math Contest Leaderboards
export const mathLeaderboards = pgTable("math_leaderboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Contest info
  contestType: text("contest_type").notNull(), // timed_quiz, full_round, speed_challenge
  contestPeriod: text("contest_period").notNull(), // daily, weekly, monthly, all_time
  gradeLevel: text("grade_level"),
  
  // Performance metrics
  score: decimal("score", { precision: 8, scale: 2 }).notNull(),
  questionsCorrect: integer("questions_correct"),
  totalQuestions: integer("total_questions"),
  averageTime: integer("average_time"),
  rank: integer("rank"),
  percentile: decimal("percentile", { precision: 5, scale: 2 }),
  
  // Time period
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`)
}, (table) => {
  return {
    contestTypeIdx: index("idx_math_leaderboard_contest").on(table.contestType),
    periodIdx: index("idx_math_leaderboard_period").on(table.contestPeriod),
    scoreIdx: index("idx_math_leaderboard_score").on(table.score),
    rankIdx: index("idx_math_leaderboard_rank").on(table.rank)
  };
});

// Event tracking schema already defined above

// Math Testing System Types
export type MathProblem = typeof mathProblems.$inferSelect;
export type InsertMathProblem = typeof mathProblems.$inferInsert;

export type MathTestSession = typeof mathTestSessions.$inferSelect;
export type InsertMathTestSession = typeof mathTestSessions.$inferInsert;

export type MathTestResponse = typeof mathTestResponses.$inferSelect;
export type InsertMathTestResponse = typeof mathTestResponses.$inferInsert;

export type UserMathAbility = typeof userMathAbility.$inferSelect;
export type InsertUserMathAbility = typeof userMathAbility.$inferInsert;

export type MathLeaderboard = typeof mathLeaderboards.$inferSelect;
export type InsertMathLeaderboard = typeof mathLeaderboards.$inferInsert;

// Math Testing Insert Schemas
export const insertMathProblemSchema = createInsertSchema(mathProblems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMathTestSessionSchema = createInsertSchema(mathTestSessions).omit({
  id: true,
  createdAt: true
});

export const insertMathTestResponseSchema = createInsertSchema(mathTestResponses).omit({
  id: true,
  createdAt: true
});

export const insertUserMathAbilitySchema = createInsertSchema(userMathAbility).omit({
  id: true,
  createdAt: true
});

export const insertMathLeaderboardSchema = createInsertSchema(mathLeaderboards).omit({
  id: true,
  createdAt: true
});

// Events system types
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});
