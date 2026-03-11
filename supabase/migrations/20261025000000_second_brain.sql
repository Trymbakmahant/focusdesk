-- ==============================================================================
-- Focus Desk: AI Second Brain & Universal MCP Memory Layer
-- Dedicated Schema Isolation: second_brain.*
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Create Schema
CREATE SCHEMA IF NOT EXISTS second_brain;

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS second_brain.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- active, paused, completed, archived
  color TEXT DEFAULT '#007AFF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- 4. Sources Table (Provenance)
CREATE TABLE IF NOT EXISTS second_brain.sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- claude, cursor, chatgpt, gemini, grok, manual, import, system
  external_id TEXT,
  title TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Memories Table
CREATE TABLE IF NOT EXISTS second_brain.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'fact', -- fact, preference, lesson, note, project_context
  importance INTEGER DEFAULT 3, -- 1 to 5
  project_id UUID REFERENCES second_brain.projects(id) ON DELETE SET NULL,
  source_id UUID REFERENCES second_brain.sources(id) ON DELETE SET NULL,
  embedding vector(1536),
  superseded_by_id UUID REFERENCES second_brain.memories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tasks Table (Integrated with Focus Desk)
CREATE TABLE IF NOT EXISTS second_brain.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- todo, in_progress, completed, cancelled
  priority TEXT DEFAULT 'medium', -- urgent, high, medium, low
  due_date DATE DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES second_brain.projects(id) ON DELETE SET NULL,
  source_id UUID REFERENCES second_brain.sources(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Decisions Table
CREATE TABLE IF NOT EXISTS second_brain.decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  implications TEXT,
  status TEXT DEFAULT 'active', -- active, superseded, deprecated
  project_id UUID REFERENCES second_brain.projects(id) ON DELETE SET NULL,
  superseded_by_id UUID REFERENCES second_brain.decisions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. API Tokens Table (High-entropy sb_live_... stored as SHA-256 hashes)
CREATE TABLE IF NOT EXISTS second_brain.api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_hint TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS second_brain.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  client_type TEXT NOT NULL, -- mcp:claude, mcp:cursor, web:dashboard, system
  action TEXT NOT NULL, -- memory.save, memory.correct, task.create, task.update, decision.record, token.create, token.revoke
  target_type TEXT NOT NULL, -- memory, task, decision, token, project
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Performance, Vector & Full-Text Search Indexes
CREATE INDEX IF NOT EXISTS idx_sb_projects_user ON second_brain.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_sb_memories_user_active ON second_brain.memories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sb_memories_content_hash ON second_brain.memories(user_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_sb_memories_category ON second_brain.memories(user_id, category);
CREATE INDEX IF NOT EXISTS idx_sb_memories_fts ON second_brain.memories USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_sb_tasks_user_status ON second_brain.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sb_tasks_due_date ON second_brain.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_sb_decisions_user ON second_brain.decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_sb_tokens_hash ON second_brain.api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_sb_audit_user_time ON second_brain.audit_logs(user_id, created_at DESC);

-- 11. Row Level Security (RLS)
ALTER TABLE second_brain.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_brain.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_brain.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_brain.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_brain.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_brain.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_brain.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow second_brain projects access" ON second_brain.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow second_brain sources access" ON second_brain.sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow second_brain memories access" ON second_brain.memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow second_brain tasks access" ON second_brain.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow second_brain decisions access" ON second_brain.decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow second_brain api_tokens access" ON second_brain.api_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow second_brain audit_logs access" ON second_brain.audit_logs FOR ALL USING (true) WITH CHECK (true);
