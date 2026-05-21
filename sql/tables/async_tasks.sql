-- Created by migration 002a: Async tasks for packet analysis pipeline

CREATE TABLE async_tasks (
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

COMMENT ON TABLE async_tasks IS 'Stores async task state for background processing (packet analysis, document processing, etc.)';
COMMENT ON COLUMN async_tasks.task_type IS 'Type of task: packet_analysis, document_embedding, etc.';
COMMENT ON COLUMN async_tasks.status IS 'Task status: pending, processing, completed, failed';
COMMENT ON COLUMN async_tasks.progress IS 'Progress percentage 0-100';
COMMENT ON COLUMN async_tasks.metadata IS 'JSON blob for task-specific data (file_name, text_length, model_used, etc.)';
