import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, index, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Enterprise and Institutional Features Schema
// Comprehensive multi-tenant, organization management, and enterprise functionality

// === ORGANIZATION MANAGEMENT ===

// Organizations/Institutions table for multi-tenant support
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).unique(), // For custom domains
  
  // Organization type and tier
  organizationType: text("organization_type").notNull(), // 'school', 'university', 'enterprise', 'government', 'non_profit'
  subscriptionTier: text("subscription_tier").notNull().default("basic"), // 'basic', 'professional', 'enterprise', 'custom'
  
  // Contact and administrative info
  primaryContactEmail: varchar("primary_contact_email", { length: 255 }).notNull(),
  adminUserId: varchar("admin_user_id").references(() => users.id),
  phoneNumber: varchar("phone_number", { length: 50 }),
  address: jsonb("address"), // {street, city, state, country, zipCode}
  
  // Branding and customization
  logoUrl: text("logo_url"),
  brandColors: jsonb("brand_colors"), // {primary, secondary, accent}
  customDomain: varchar("custom_domain", { length: 255 }),
  
  // Settings and configuration
  settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`), // Organization-specific settings
  features: text("features").array().default(sql`'{}'::text[]`), // Enabled features
  userLimits: jsonb("user_limits"), // {maxUsers, maxStorage, maxAPICallsPerMonth}
  
  // Business information
  industry: varchar("industry", { length: 100 }),
  size: text("size"), // 'small', 'medium', 'large', 'enterprise'
  establishedYear: integer("established_year"),
  
  // Status and lifecycle
  status: text("status").notNull().default("active"), // 'active', 'suspended', 'trial', 'cancelled'
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  
  // Metadata and tracking
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => ({
  subdomainIdx: index("idx_orgs_subdomain").on(table.subdomain),
  typeIdx: index("idx_orgs_type").on(table.organizationType),
  statusIdx: index("idx_orgs_status").on(table.status),
  adminIdx: index("idx_orgs_admin").on(table.adminUserId)
}));

// Forward declaration for self-reference
const departmentsTemp = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  parentDepartmentId: varchar("parent_department_id"), // For hierarchical structure
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  departmentCode: varchar("department_code", { length: 50 }),
  
  // Department leadership
  headOfDepartment: varchar("head_of_department").references(() => users.id),
  managerIds: text("manager_ids").array().default(sql`'{}'::text[]`),
  
  // Department settings
  budget: decimal("budget", { precision: 12, scale: 2 }),
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => ({
  orgIdx: index("idx_dept_org").on(table.organizationId),
  parentIdx: index("idx_dept_parent").on(table.parentDepartmentId),
  headIdx: index("idx_dept_head").on(table.headOfDepartment)
}));

export const departments = departmentsTemp;

// === ADVANCED ROLE-BASED ACCESS CONTROL ===

// Forward declaration for self-reference
const enterpriseRolesTemp = pgTable("enterprise_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  
  // Role definition
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  roleType: text("role_type").notNull(), // 'system', 'custom', 'inherited'
  
  // Permissions structure
  permissions: jsonb("permissions").notNull(), // Detailed permissions object
  scopes: text("scopes").array().notNull(), // Areas where role applies: 'global', 'department', 'course', etc.
  
  // Role hierarchy and inheritance
  parentRoleId: varchar("parent_role_id"),
  inheritsFrom: text("inherits_from").array().default(sql`'{}'::text[]`),
  
  // Status and lifecycle
  isActive: boolean("is_active").default(true),
  isSystemRole: boolean("is_system_role").default(false), // Cannot be deleted
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => ({
  orgIdx: index("idx_roles_org").on(table.organizationId),
  nameIdx: index("idx_roles_name").on(table.name),
  typeIdx: index("idx_roles_type").on(table.roleType)
}));

export const enterpriseRoles = enterpriseRolesTemp;

// User role assignments with context
export const userRoleAssignments = pgTable("user_role_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => enterpriseRoles.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Assignment context and scope
  scope: text("scope").notNull().default("organization"), // 'organization', 'department', 'course', 'project'
  scopeId: varchar("scope_id"), // ID of the scope (department, course, etc.)
  
  // Assignment details
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignmentReason: text("assignment_reason"),
  
  // Temporary assignments
  expiresAt: timestamp("expires_at"),
  isTemporary: boolean("is_temporary").default(false),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => ({
  userIdx: index("idx_role_assignments_user").on(table.userId),
  roleIdx: index("idx_role_assignments_role").on(table.roleId),
  orgIdx: index("idx_role_assignments_org").on(table.organizationId),
  scopeIdx: index("idx_role_assignments_scope").on(table.scope, table.scopeId),
  expiresIdx: index("idx_role_assignments_expires").on(table.expiresAt)
}));

// === ENTERPRISE REPORTING & ANALYTICS ===

// Institutional analytics and reporting
export const institutionalReports = pgTable("institutional_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Report definition
  reportName: varchar("report_name", { length: 255 }).notNull(),
  reportType: text("report_type").notNull(), // 'performance', 'usage', 'compliance', 'financial', 'custom'
  description: text("description"),
  
  // Report configuration
  dataFilters: jsonb("data_filters").notNull(), // Filtering criteria
  columns: text("columns").array().notNull(), // Data columns to include
  aggregations: jsonb("aggregations"), // Grouping and aggregation rules
  timeRange: jsonb("time_range").notNull(), // {start, end, period}
  
  // Scheduling and automation
  schedule: text("schedule"), // cron expression for automated reports
  isAutomated: boolean("is_automated").default(false),
  nextRunAt: timestamp("next_run_at"),
  
  // Recipients and distribution
  recipients: text("recipients").array().default(sql`'{}'::text[]`), // Email addresses
  deliveryMethod: text("delivery_method").default("email"), // 'email', 'download', 'api'
  
  // Report data and results
  lastRunAt: timestamp("last_run_at"),
  lastRunStatus: text("last_run_status"), // 'success', 'error', 'running'
  reportData: jsonb("report_data"), // Cached report results
  
  // Access control
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(false),
  sharedWith: text("shared_with").array().default(sql`'{}'::text[]`),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => ({
  orgIdx: index("idx_reports_org").on(table.organizationId),
  typeIdx: index("idx_reports_type").on(table.reportType),
  scheduleIdx: index("idx_reports_schedule").on(table.nextRunAt),
  creatorIdx: index("idx_reports_creator").on(table.createdBy)
}));

// === BULK OPERATIONS ===

// Bulk user operations tracking
export const bulkOperations = pgTable("bulk_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Operation definition
  operationType: text("operation_type").notNull(), // 'user_import', 'user_export', 'role_assignment', 'data_migration', 'bulk_update'
  operationName: varchar("operation_name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Operation configuration
  parameters: jsonb("parameters").notNull(), // Operation-specific parameters
  targetCount: integer("target_count"), // Expected number of items to process
  
  // Progress tracking
  status: text("status").notNull().default("pending"), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  processedCount: integer("processed_count").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  
  // Execution details
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  executionLog: jsonb("execution_log"), // Detailed execution log
  errors: jsonb("errors"), // Error details
  
  // File handling for imports/exports
  inputFileUrl: text("input_file_url"),
  outputFileUrl: text("output_file_url"),
  fileMetadata: jsonb("file_metadata"),
  
  // Access control
  initiatedBy: varchar("initiated_by").notNull().references(() => users.id),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => ({
  orgIdx: index("idx_bulk_ops_org").on(table.organizationId),
  statusIdx: index("idx_bulk_ops_status").on(table.status),
  typeIdx: index("idx_bulk_ops_type").on(table.operationType),
  initiatorIdx: index("idx_bulk_ops_initiator").on(table.initiatedBy),
  dateIdx: index("idx_bulk_ops_date").on(table.createdAt)
}));

// === API MANAGEMENT ===

// Enterprise API keys and access management
export const enterpriseApiKeys = pgTable("enterprise_api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // API Key details
  keyName: varchar("key_name", { length: 255 }).notNull(),
  keyHash: text("key_hash").notNull().unique(), // Hashed API key
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(), // Visible prefix (e.g., "eiq_")
  
  // Access control and permissions
  permissions: jsonb("permissions").notNull(), // API permissions
  scopes: text("scopes").array().notNull(), // API scopes
  rateLimits: jsonb("rate_limits").notNull(), // {requests_per_minute, requests_per_hour, requests_per_day}
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  lastUsedIp: text("last_used_ip"),
  
  // Key lifecycle
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  
  // Key metadata
  description: text("description"),
  environment: text("environment").default("production"), // 'development', 'staging', 'production'
  
  // Access control
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
}, (table) => ({
  orgIdx: index("idx_api_keys_org").on(table.organizationId),
  keyHashIdx: index("idx_api_keys_hash").on(table.keyHash),
  creatorIdx: index("idx_api_keys_creator").on(table.createdBy),
  activeIdx: index("idx_api_keys_active").on(table.isActive),
  expiresIdx: index("idx_api_keys_expires").on(table.expiresAt)
}));

// API usage analytics
export const apiUsageAnalytics = pgTable("api_usage_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  apiKeyId: varchar("api_key_id").references(() => enterpriseApiKeys.id, { onDelete: "set null" }),
  
  // Request details
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // milliseconds
  
  // Request metadata
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  requestSize: integer("request_size"), // bytes
  responseSize: integer("response_size"), // bytes
  
  // Error tracking
  errorType: text("error_type"),
  errorMessage: text("error_message"),
  
  // Timestamp
  timestamp: timestamp("timestamp").default(sql`now()`).notNull()
}, (table) => ({
  orgIdx: index("idx_api_usage_org").on(table.organizationId),
  keyIdx: index("idx_api_usage_key").on(table.apiKeyId),
  endpointIdx: index("idx_api_usage_endpoint").on(table.endpoint),
  timestampIdx: index("idx_api_usage_timestamp").on(table.timestamp),
  statusIdx: index("idx_api_usage_status").on(table.statusCode)
}));

// === COMPLIANCE & AUDIT ===

// Comprehensive audit log for compliance
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  
  // Event details
  eventType: text("event_type").notNull(), // 'user_action', 'system_action', 'data_change', 'access_attempt', 'configuration_change'
  eventCategory: text("event_category").notNull(), // 'authentication', 'authorization', 'data_modification', 'system_configuration'
  action: text("action").notNull(), // Specific action taken
  description: text("description").notNull(),
  
  // Actor information
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  actorType: text("actor_type").notNull().default("user"), // 'user', 'system', 'api', 'admin'
  actorIdentifier: text("actor_identifier"), // IP address, API key prefix, etc.
  
  // Target information
  targetType: text("target_type"), // 'user', 'role', 'organization', 'data', 'system'
  targetId: varchar("target_id"),
  targetIdentifier: text("target_identifier"),
  
  // Change tracking
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  changeMetadata: jsonb("change_metadata"),
  
  // Request context
  requestId: varchar("request_id"),
  sessionId: varchar("session_id"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  
  // Risk and compliance
  riskLevel: text("risk_level").default("low"), // 'low', 'medium', 'high', 'critical'
  complianceFlags: text("compliance_flags").array().default(sql`'{}'::text[]`),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  timestamp: timestamp("timestamp").default(sql`now()`).notNull()
}, (table) => ({
  orgIdx: index("idx_audit_org").on(table.organizationId),
  userIdx: index("idx_audit_user").on(table.userId),
  eventIdx: index("idx_audit_event").on(table.eventType, table.eventCategory),
  timestampIdx: index("idx_audit_timestamp").on(table.timestamp),
  riskIdx: index("idx_audit_risk").on(table.riskLevel),
  targetIdx: index("idx_audit_target").on(table.targetType, table.targetId)
}));

// === RELATIONS ===

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  departments: many(departments),
  roles: many(enterpriseRoles),
  reports: many(institutionalReports),
  bulkOperations: many(bulkOperations),
  apiKeys: many(enterpriseApiKeys),
  apiUsage: many(apiUsageAnalytics),
  auditLogs: many(auditLog),
  admin: one(users, { fields: [organizations.adminUserId], references: [users.id] })
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, { fields: [departments.organizationId], references: [organizations.id] }),
  parent: one(departments, { fields: [departments.parentDepartmentId], references: [departments.id] }),
  children: many(departments),
  head: one(users, { fields: [departments.headOfDepartment], references: [users.id] })
}));

export const enterpriseRolesRelations = relations(enterpriseRoles, ({ one, many }) => ({
  organization: one(organizations, { fields: [enterpriseRoles.organizationId], references: [organizations.id] }),
  parent: one(enterpriseRoles, { fields: [enterpriseRoles.parentRoleId], references: [enterpriseRoles.id] }),
  children: many(enterpriseRoles),
  assignments: many(userRoleAssignments),
  creator: one(users, { fields: [enterpriseRoles.createdBy], references: [users.id] })
}));

export const userRoleAssignmentsRelations = relations(userRoleAssignments, ({ one }) => ({
  user: one(users, { fields: [userRoleAssignments.userId], references: [users.id] }),
  role: one(enterpriseRoles, { fields: [userRoleAssignments.roleId], references: [enterpriseRoles.id] }),
  organization: one(organizations, { fields: [userRoleAssignments.organizationId], references: [organizations.id] }),
  assignedBy: one(users, { fields: [userRoleAssignments.assignedBy], references: [users.id] })
}));

// === TYPES AND SCHEMAS ===

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEnterpriseRoleSchema = createInsertSchema(enterpriseRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserRoleAssignmentSchema = createInsertSchema(userRoleAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInstitutionalReportSchema = createInsertSchema(institutionalReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBulkOperationSchema = createInsertSchema(bulkOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEnterpriseApiKeySchema = createInsertSchema(enterpriseApiKeys).omit({
  id: true,
  keyHash: true,
  keyPrefix: true,
  usageCount: true,
  lastUsedAt: true,
  lastUsedIp: true,
  createdAt: true,
  updatedAt: true
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true
});

// Export types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type EnterpriseRole = typeof enterpriseRoles.$inferSelect;
export type InsertEnterpriseRole = z.infer<typeof insertEnterpriseRoleSchema>;

export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type InsertUserRoleAssignment = z.infer<typeof insertUserRoleAssignmentSchema>;

export type InstitutionalReport = typeof institutionalReports.$inferSelect;
export type InsertInstitutionalReport = z.infer<typeof insertInstitutionalReportSchema>;

export type BulkOperation = typeof bulkOperations.$inferSelect;
export type InsertBulkOperation = z.infer<typeof insertBulkOperationSchema>;

export type EnterpriseApiKey = typeof enterpriseApiKeys.$inferSelect;
export type InsertEnterpriseApiKey = z.infer<typeof insertEnterpriseApiKeySchema>;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type ApiUsageAnalytics = typeof apiUsageAnalytics.$inferSelect;