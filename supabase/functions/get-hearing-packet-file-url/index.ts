import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { fileId, file_id } = await req.json().catch(() => ({}));
    const id = fileId || file_id;
    if (!id) {
      return new Response(JSON.stringify({ error: "fileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: file, error: fileError } = await admin
      .from("generated_packet_files")
      .select("id, file_path, file_name, metadata")
      .eq("id", id)
      .single();
    if (fileError) throw fileError;

    const metadata = (file?.metadata ?? {}) as Record<string, unknown>;
    const storageBucket = String(metadata.storageBucket ?? "hearing-packets");
    const storagePath = String(metadata.storagePath ?? "");

    if (!storagePath) {
      return new Response(JSON.stringify({ signedUrl: file.file_path, file }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed, error: signedError } = await admin.storage
      .from(storageBucket)
      .createSignedUrl(storagePath, 60 * 60);
    if (signedError) throw signedError;

    return new Response(
      JSON.stringify({ signedUrl: signed?.signedUrl ?? file.file_path, file }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
