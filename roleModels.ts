import { pgTable, varchar, text, integer, jsonb, timestamp, index, primaryKey, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "../schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role models table
export const roleModels = pgTable("role_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").notNull(), // e.g., "Tech CEO", "AI Research", "Media/Creative"
  region: text("region").notNull(), // e.g., "North America", "Asia", "Europe"
  bio: text("bio"),
  strategicIQ: integer("strategic_iq"),
  technicalIQ: integer("technical_iq"),
  creativeIQ: integer("creative_iq"),
  socialIQ: integer("social_iq"),
  attributes: jsonb("attributes"), // {education, career, leadershipStyle, achievements}
  profileVector: text("profile_vector"), // Store as JSON string for now
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  domainIdx: index("role_models_domain_idx").on(table.domain),
  regionIdx: index("role_models_region_idx").on(table.region),
}));

// Milestones for timelines
export const roleModelMilestones = pgTable("role_model_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleModelId: varchar("role_model_id").references(() => roleModels.id, { onDelete: "cascade" }).notNull(),
  age: integer("age"),
  year: integer("year"),
  category: text("category"), // education | career | award | research | startup | other
  description: text("description").notNull(),
  orderIndex: integer("order_index").default(0),
});

// User EiQ scores (one row per user)
export const userEiqScores = pgTable("user_eiq_scores", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  strategic: integer("strategic").notNull(),
  technical: integer("technical").notNull(),
  creative: integer("creative").notNull(),
  social: integer("social").notNull(),
  aiLiteracy: integer("ai_literacy").default(0), // AI Literacy/Turing Test score (0-100)
  embedding: text("embedding"), // Store as JSON string
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Cache last matches (for analytics & quick loads)
export const matchesCache = pgTable("matches_cache", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(), // 'ml' | 'rules'
  rank: integer("rank").notNull(),
  roleModelId: varchar("role_model_id").notNull().references(() => roleModels.id, { onDelete: "cascade" }),
  score: doublePrecision("score").notNull(),
  reason: text("reason"),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.mode, table.rank] })
}));

// Admin-configurable algorithm mode
export const matchConfig = pgTable("match_config", {
  id: integer("id").primaryKey().default(1),
  algorithm: text("algorithm").notNull().default('ml'), // 'ml' | 'rules'
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Types
export type RoleModel = typeof roleModels.$inferSelect;
export type InsertRoleModel = typeof roleModels.$inferInsert;
export type RoleModelMilestone = typeof roleModelMilestones.$inferSelect;
export type InsertRoleModelMilestone = typeof roleModelMilestones.$inferInsert;
export type UserEiqScore = typeof userEiqScores.$inferSelect;
export type InsertUserEiqScore = typeof userEiqScores.$inferInsert;
export type MatchCache = typeof matchesCache.$inferSelect;
export type InsertMatchCache = typeof matchesCache.$inferInsert;
export type MatchConfig = typeof matchConfig.$inferSelect;

// Zod schemas
export const insertRoleModelSchema = createInsertSchema(roleModels);
export const insertMilestoneSchema = createInsertSchema(roleModelMilestones);
export const insertUserEiqScoreSchema = createInsertSchema(userEiqScores);