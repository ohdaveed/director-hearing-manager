import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface RequestBody {
  text: string;
  fileName: string;
  fileType: "pdf" | "docx";
  metadata?: Record<string, unknown>;
}

interface TaskResponse {
  taskId: string;
  status: string;
  message: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, fileName, fileType, metadata = {} } = body;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid text field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fileName || typeof fileName !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid fileName field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fileType || !["pdf", "docx"].includes(fileType)) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid fileType field (must be pdf or docx)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: task, error: insertError } = await supabase
      .from("async_tasks")
      .insert({
        task_type: "packet_analysis",
        status: "pending",
        progress: 0,
        user_id: user.id,
        metadata: {
          file_name: fileName,
          file_type: fileType,
          text_length: text.length,
          ...metadata,
        },
      })
      .select("id")
      .single();

    if (insertError || !task) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create task" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Created packet analysis task: ${task.id} for user: ${user.id}`);

    const response: TaskResponse = {
      taskId: task.id,
      status: "pending",
      message: "Analysis queued",
    };

    return new Response(JSON.stringify(response), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
