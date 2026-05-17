-- Migration: Enable pg_vector extension and create sop_embeddings table
-- Created: 2026-05-17
-- Description: Vector storage for SOP document embeddings (RAG pipeline)

-- Enable pg_vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create sop_embeddings table for RAG
CREATE TABLE IF NOT EXISTS sop_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_chunk TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,  -- 1536 dimensions for OpenAI/Claude compatibility
    source_document TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create IVFFlat index for cosine similarity search
-- Using 100 lists which is good for ~10k vectors (adjust based on data volume)
CREATE INDEX IF NOT EXISTS idx_sop_embeddings_embedding 
ON sop_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create index for source document lookups
CREATE INDEX IF NOT EXISTS idx_sop_embeddings_source_document 
ON sop_embeddings(source_document);

-- Create unique index to prevent duplicate chunks
CREATE UNIQUE INDEX IF NOT EXISTS idx_sop_embeddings_unique_chunk 
ON sop_embeddings(source_document, chunk_index);

-- Enable Row Level Security
ALTER TABLE sop_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can read embeddings (for similarity search)
CREATE POLICY "Authenticated users can read embeddings" ON sop_embeddings
    FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

-- RLS Policy: Only service role can insert/update/delete (Edge Functions)
CREATE POLICY "Service role can modify embeddings" ON sop_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE sop_embeddings IS 'Stores vector embeddings of SOP document chunks for RAG similarity search';
COMMENT ON COLUMN sop_embeddings.content_chunk IS 'The text content of the document chunk';
COMMENT ON COLUMN sop_embeddings.embedding IS 'Vector embedding (1536 dimensions) for similarity search';
COMMENT ON COLUMN sop_embeddings.source_document IS 'Source SOP document identifier (e.g., SOP_Cover_Page, SOP_Enforcement_Summary)';
COMMENT ON COLUMN sop_embeddings.chunk_index IS 'Sequential index of the chunk within the source document';
COMMENT ON COLUMN sop_embeddings.metadata IS 'Additional metadata (chunk_size, overlap_size, etc.)';