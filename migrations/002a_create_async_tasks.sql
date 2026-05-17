-- Migration: Create async_tasks table for packet analysis pipeline
-- Created: 2026-05-17
-- Description: Stores async task state for background LLM processing

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create async_tasks table
CREATE TABLE IF NOT EXISTS async_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_async_tasks_status ON async_tasks(status);
CREATE INDEX IF NOT EXISTS idx_async_tasks_task_type_created_at ON async_tasks(task_type, created_at);
CREATE INDEX IF NOT EXISTS idx_async_tasks_user_id ON async_tasks(user_id);

-- Enable Row Level Security
ALTER TABLE async_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own tasks
CREATE POLICY "Users can view own tasks" ON async_tasks
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own tasks
CREATE POLICY "Users can insert own tasks" ON async_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks" ON async_tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access" ON async_tasks
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_async_tasks_updated_at ON async_tasks;
CREATE TRIGGER update_async_tasks_updated_at
    BEFORE UPDATE ON async_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE async_tasks IS 'Stores async task state for background processing (packet analysis, document processing, etc.)';
COMMENT ON COLUMN async_tasks.task_type IS 'Type of task: packet_analysis, document_embedding, etc.';
COMMENT ON COLUMN async_tasks.status IS 'Task status: pending, processing, completed, failed';
COMMENT ON COLUMN async_tasks.progress IS 'Progress percentage 0-100';
COMMENT ON COLUMN async_tasks.metadata IS 'JSON blob for task-specific data (file_name, text_length, model_used, etc.)';