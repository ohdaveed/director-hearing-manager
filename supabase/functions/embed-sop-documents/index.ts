import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SOP_CHUNKS } from "../../../src/utils/sopChunking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: max 10 chunks per second
const RATE_LIMIT_MS = 100;

async function getEmbedding(_text: string): Promise<number[]> {
  // Placeholder: In production, call OpenAI/Claude embedding API
  // For now, return a random 1536-dim vector
  return Array.from({ length: 1536 }, () => Math.random() - 0.5);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let embeddedCount = 0;
    const errors: string[] = [];

    // Process chunks with rate limiting
    for (const chunk of SOP_CHUNKS) {
      try {
        // Check if chunk already exists
        const { data: existing } = await supabase
          .from("sop_embeddings")
          .select("id")
          .eq("source_document", chunk.sourceDocument)
          .eq("chunk_index", chunk.chunkIndex)
          .single();

        if (existing) {
          console.log(`Skipping existing chunk: ${chunk.sourceDocument}[${chunk.chunkIndex}]`);
          continue;
        }

        // Get embedding
        const embedding = await getEmbedding(chunk.content);

        // Insert into database
        const { error: insertError } = await supabase.from("sop_embeddings").upsert(
          {
            content_chunk: chunk.content,
            embedding: embedding,
            source_document: chunk.sourceDocument,
            chunk_index: chunk.chunkIndex,
            metadata: {
              char_count: chunk.charCount,
            },
          },
          {
            onConflict: "source_document,chunk_index",
          },
        );

        if (insertError) {
          errors.push(
            `Failed to insert ${chunk.sourceDocument}[${chunk.chunkIndex}]: ${insertError.message}`,
          );
        } else {
          embeddedCount++;
          console.log(`Embedded: ${chunk.sourceDocument}[${chunk.chunkIndex}]`);
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
      } catch (error) {
        errors.push(
          `Error processing ${chunk.sourceDocument}[${chunk.chunkIndex}]: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: "Embedding complete",
        embeddedCount,
        totalChunks: SOP_CHUNKS.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
