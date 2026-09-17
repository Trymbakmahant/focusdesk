-- FocusDeck Cloud Database Schema (Compatible with WorkOS AuthKit)
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,            -- WorkOS User ID (e.g. user_01JC...)
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  importance TEXT DEFAULT 'Medium', -- 'Urgent', 'High', 'Medium', 'Low'
  badge TEXT,                       -- Custom badge name from Badge Box
  due_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,            -- WorkOS User ID
  title TEXT NOT NULL,
  icon TEXT,
  type TEXT DEFAULT 'Good',         -- 'Good' or 'Bad'
  count_today INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,            -- WorkOS User ID
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,            -- WorkOS User ID
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Daily Focus & Workday Analysis Table
CREATE TABLE IF NOT EXISTS daily_focus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,            -- WorkOS User ID
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  focus_intention TEXT NOT NULL,
  category TEXT DEFAULT 'Deep Work',
  workday_hours NUMERIC DEFAULT 8.0,
  target_minutes INTEGER DEFAULT 240,
  actual_minutes INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Performance Indexes on user_id
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_focus_user_date ON daily_focus(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_focus ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon access via API keys scoped by user_id filter
CREATE POLICY "Allow anon and auth access for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon and auth access for habits" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon and auth access for notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon and auth access for reminders" ON reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon and auth access for daily_focus" ON daily_focus FOR ALL USING (true) WITH CHECK (true);

