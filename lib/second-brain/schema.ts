import { pgSchema, text, timestamp, boolean, integer, jsonb, uuid, date } from 'drizzle-orm/pg-core';

export const secondBrainSchema = pgSchema('second_brain');

// 1. Projects
export const sbProjects = secondBrainSchema.table('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  status: text('status').default('active').notNull(),
  color: text('color').default('#007AFF'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Sources
export const sbSources = secondBrainSchema.table('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // claude, cursor, chatgpt, gemini, grok, manual, import, system
  externalId: text('external_id'),
  title: text('title'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Memories
export const sbMemories = secondBrainSchema.table('memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  content: text('content').notNull(),
  contentHash: text('content_hash').notNull(),
  category: text('category').default('fact').notNull(),
  importance: integer('importance').default(3).notNull(),
  projectId: uuid('project_id').references(() => sbProjects.id),
  sourceId: uuid('source_id').references(() => sbSources.id),
  supersededById: uuid('superseded_by_id'),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Tasks
export const sbTasks = secondBrainSchema.table('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('todo').notNull(),
  priority: text('priority').default('medium').notNull(),
  dueDate: date('due_date'),
  projectId: uuid('project_id').references(() => sbProjects.id),
  sourceId: uuid('source_id').references(() => sbSources.id),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Decisions
export const sbDecisions = secondBrainSchema.table('decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  rationale: text('rationale').notNull(),
  implications: text('implications'),
  status: text('status').default('active').notNull(),
  projectId: uuid('project_id').references(() => sbProjects.id),
  supersededById: uuid('superseded_by_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. API Tokens
export const sbApiTokens = secondBrainSchema.table('api_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  tokenHint: text('token_hint').notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

// 7. Audit Logs
export const sbAuditLogs = secondBrainSchema.table('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  clientType: text('client_type').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id'),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
