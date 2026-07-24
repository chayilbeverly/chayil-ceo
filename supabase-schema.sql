-- ============================================
-- Chayil CEO OS - Supabase 数据库迁移
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 创建 app_data 表（主数据存储，JSONB）
CREATE TABLE IF NOT EXISTS app_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 启用 RLS（行级安全）
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

-- 3. 创建 RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view own data"
  ON app_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON app_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON app_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON app_data FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 启用实时订阅（可选，用于 Supabase Realtime）
ALTER PUBLICATION supabase_realtime ADD TABLE app_data;

-- 5. 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_app_data_user_id ON app_data(user_id);
CREATE INDEX IF NOT EXISTS idx_app_data_updated_at ON app_data(updated_at DESC);
