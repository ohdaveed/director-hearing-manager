import { supabase } from "@/lib/supabase";

export interface SopReference {
  content: string;
  sourceDocument: string;
  chunkIndex: number;
  similarityScore: number;
}

const SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_TOP_K = 3;

export async function searchSOP(
  query: string,
  topK: number = DEFAULT_TOP_K,
): Promise<SopReference[]> {
  // Get embedding for the query
  // Note: In production, this would call an embedding API
  // For now, we'll use a simple text search as a fallback

  const { data, error } = await supabase.rpc("match_sop_documents", {
    query_embedding: query, // This would be the actual embedding vector
    match_threshold: SIMILARITY_THRESHOLD,
    match_count: topK,
  });

  if (error) {
    console.error("SOP search error:", error);
    // Fallback to simple text search if RPC fails
    return fallbackTextSearch(query, topK);
  }

  if (!data) {
    return [];
  }

  return data.map((row: any) => ({
    content: row.content_chunk,
    sourceDocument: row.source_document,
    chunkIndex: row.chunk_index,
    similarityScore: row.similarity,
  }));
}

// Fallback text search when vector search is unavailable
async function fallbackTextSearch(query: string, topK: number): Promise<SopReference[]> {
  const queryTerms = query.toLowerCase().split(/\s+/);

  const { data, error } = await supabase
    .from("sop_embeddings")
    .select("content_chunk, source_document, chunk_index")
    .or(queryTerms.map((term) => `content_chunk.ilike.%${term}%`).join(","))
    .limit(topK * 2);

  if (error || !data) {
    return [];
  }

  // Simple relevance scoring based on term frequency
  const scored = data.map((row: any) => {
    const content = row.content_chunk.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const matches = (content.match(new RegExp(term, "g")) || []).length;
      score += matches / content.length;
    }
    return {
      content: row.content_chunk,
      sourceDocument: row.source_document,
      chunkIndex: row.chunk_index,
      similarityScore: Math.min(score * 100, 0.99), // Normalize
    };
  });

  // Sort by score and take top K
  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK)
    .filter((ref) => ref.similarityScore > 0.1);
}
