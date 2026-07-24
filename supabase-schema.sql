-- ============================================
-- Chayil CEO OS — Supabase 数据库建表脚本
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. tasks（每日任务）
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'personalGrowth',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  completed BOOLEAN DEFAULT false,
  scheduled_time TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, local_id)
);

-- 2. customers（客户资产）
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  name TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  preference TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  frequency TEXT DEFAULT '',
  note TEXT DEFAULT '',
  follow_up_time TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, local_id)
);

-- 3. finance（财务记录）
CREATE TABLE IF NOT EXISTS finance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  category TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, local_id)
);

-- 4. contents（内容资产 / 复盘）
CREATE TABLE IF NOT EXISTS contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  publish_time TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  review TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, local_id)
);

-- 5. app_meta（灵感中心、爆款雷达、产品库、交易、打卡数据等）
CREATE TABLE IF NOT EXISTS app_meta (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(user_id, category);
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_user ON finance(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_contents_user ON contents(user_id);

-- ============================================
-- RLS（Row Level Security）
-- 所有表：用户只能读写自己的数据
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_meta ENABLE ROW LEVEL SECURITY;

-- tasks
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- customers
CREATE POLICY "customers_select_own" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_own" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_own" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "customers_delete_own" ON customers FOR DELETE USING (auth.uid() = user_id);

-- finance
CREATE POLICY "finance_select_own" ON finance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "finance_insert_own" ON finance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "finance_update_own" ON finance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "finance_delete_own" ON finance FOR DELETE USING (auth.uid() = user_id);

-- contents
CREATE POLICY "contents_select_own" ON contents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contents_insert_own" ON contents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contents_update_own" ON contents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "contents_delete_own" ON contents FOR DELETE USING (auth.uid() = user_id);

-- app_meta
CREATE POLICY "meta_select_own" ON app_meta FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meta_insert_own" ON app_meta FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meta_update_own" ON app_meta FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meta_delete_own" ON app_meta FOR DELETE USING (auth.uid() = user_id);
