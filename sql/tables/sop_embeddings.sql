-- Created by migration 002c: Vector storage for SOP document embeddings (RAG pipeline)

CREATE TABLE sop_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_chunk TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  source_document TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE sop_embeddings IS 'Stores vector embeddings of SOP document chunks for RAG similarity search';
COMMENT ON COLUMN sop_embeddings.content_chunk IS 'The text content of the document chunk';
COMMENT ON COLUMN sop_embeddings.embedding IS 'Vector embedding (1536 dimensions) for similarity search';
COMMENT ON COLUMN sop_embeddings.source_document IS 'Source SOP document identifier (e.g., SOP_Cover_Page, SOP_Enforcement_Summary)';
COMMENT ON COLUMN sop_embeddings.chunk_index IS 'Sequential index of the chunk within the source document';
COMMENT ON COLUMN sop_embeddings.metadata IS 'Additional metadata (chunk_size, overlap_size, etc.)';
