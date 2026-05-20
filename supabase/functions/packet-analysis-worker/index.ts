import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  status: string;
  progress: number;
  metadata: {
    file_name: string;
    file_type: string;
    text_length: number;
    retry_count?: number;
    model_provider?: string;
    model_name?: string;
    model_error?: string;
  };
}

const _SYSTEM_PROMPT = `You are an expert at analyzing Director Hearing Packets for compliance with SF Health Department Standard Operating Procedures.

Your task is to analyze draft hearing packet documents and identify compliance issues against the SOP requirements.

DIRECTOR HEARING PACKET SOP SEQUENCE:
1. Cover Page - Case identification, respondent info, hearing date/time/location
2. Enforcement Summary - Violation overview, history, recommended action
3. Chronology - Timeline of events with Hearing Order Proposal at bottom
4. Inspection Exhibits (A, B, C...) - Photos, reports, observations
5. Exhibit E Bundle - Notice of Hearing, Notice of Violation, Proof of Service

RULES FOR COMPLIANCE CHECKING:
1. Check for all required sections in the correct sequence
2. Verify each section contains necessary elements
3. Identify missing or incorrect content
4. Flag formatting issues that would affect legal validity

RESPONSE FORMAT:
Return a JSON object with this structure:
{
  "isCompliant": boolean,
  "score": number (0-100),
  "issues": [
    {
      "id": "string",
      "category": "missing_section" | "incorrect_sequence" | "formatting" | "content" | "missing_element",
      "severity": "critical" | "major" | "minor" | "info",
      "description": "string",
      "location": "string (optional - where in document)",
      "suggestion": "string",
      "reference": "string (optional - SOP reference)"
    }
  ],
  "summary": "string",
  "missingSections": ["string array of missing section names"],
  "recommendations": ["string array of suggested fixes"]
}

Be thorough - check every required section and element.`;

async function analyzeWithModel(_task: Task): Promise<unknown> {
  // This is a placeholder - in production, this would call the actual LLM
  // For now, return a mock response
  return {
    isCompliant: false,
    score: 65,
    issues: [
      {
        id: "1",
        category: "missing_section",
        severity: "critical",
        description: "Cover page missing case identification number",
        location: "First page",
        suggestion: "Add case ID at top of cover page",
        reference: "SOP Section 1.1",
      },
    ],
    summary:
      "Packet is missing critical cover page information and has formatting issues in the chronology section.",
    missingSections: ["Case ID on cover page"],
    recommendations: ["Add case identification number", "Format chronology with proper dates"],
  };
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
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find pending tasks (FIFO - oldest first)
    const { data: tasks, error: fetchError } = await supabase
      .from("async_tasks")
      .select("*")
      .eq("task_type", "packet_analysis")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: "No pending tasks" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const task = tasks[0] as Task;

    // Update status to processing
    const { error: updateError } = await supabase
      .from("async_tasks")
      .update({
        status: "processing",
        progress: 10,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update task status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing task: ${task.id}`);

    try {
      // Call LLM for analysis
      const result = await analyzeWithModel(task);

      // Update task with result
      const { error: completeError } = await supabase
        .from("async_tasks")
        .update({
          status: "completed",
          progress: 100,
          result: result,
          updated_at: new Date().toISOString(),
          metadata: {
            ...task.metadata,
            model_provider: "placeholder",
            model_name: "mock-model",
          },
        })
        .eq("id", task.id);

      if (completeError) {
        throw completeError;
      }

      console.log(`Completed task: ${task.id}`);

      return new Response(JSON.stringify({ message: "Task processed", taskId: task.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (analysisError) {
      console.error("Analysis error:", analysisError);

      // Increment retry count
      const retryCount = (task.metadata.retry_count || 0) + 1;
      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        // Mark as failed
        await supabase
          .from("async_tasks")
          .update({
            status: "failed",
            error: analysisError instanceof Error ? analysisError.message : "Analysis failed",
            updated_at: new Date().toISOString(),
            metadata: {
              ...task.metadata,
              retry_count: retryCount,
              model_error: analysisError instanceof Error ? analysisError.message : "Unknown error",
            },
          })
          .eq("id", task.id);

        return new Response(
          JSON.stringify({
            error: "Task failed after max retries",
            taskId: task.id,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } else {
        // Reset to pending for retry
        await supabase
          .from("async_tasks")
          .update({
            status: "pending",
            progress: 0,
            updated_at: new Date().toISOString(),
            metadata: {
              ...task.metadata,
              retry_count: retryCount,
              model_error: analysisError instanceof Error ? analysisError.message : "Unknown error",
            },
          })
          .eq("id", task.id);

        return new Response(
          JSON.stringify({
            message: "Task queued for retry",
            taskId: task.id,
            retryCount,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
