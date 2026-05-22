import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PacketType = "draft" | "final";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildHtml(packetJson: any, packetType: PacketType) {
  const c = packetJson?.case ?? {};
  const chronology = Array.isArray(packetJson?.chronology) ? packetJson.chronology : [];
  const violations = Array.isArray(packetJson?.violations) ? packetJson.violations : [];
  const exhibits = Array.isArray(packetJson?.exhibits) ? packetJson.exhibits : [];
  const photos = Array.isArray(packetJson?.photos) ? packetJson.photos : [];

  const tableRows = (items: any[], mapper: (item: any, index: number) => string) =>
    items.length ? items.map(mapper).join("\n") : `<tr><td colspan="4">No records found.</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8" />
<title>Director's Hearing Packet</title>
<style>
@page{size:letter;margin:.7in}body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;line-height:1.45}h1{font-size:22px}h2{font-size:16px;border-bottom:1px solid #d1d5db;padding-bottom:4px;margin-top:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.label{color:#6b7280;text-transform:uppercase;font-size:9px}.value{font-weight:600}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:6px;vertical-align:top}th{background:#f3f4f6;text-align:left}.cover{page-break-after:always}.photo-page{page-break-before:always}.photo-box{border:1px solid #d1d5db;min-height:5in;display:flex;align-items:center;justify-content:center;background:#f9fafb;color:#6b7280;margin:12px 0}
</style></head><body>
<section class="cover"><p>San Francisco Department of Public Health</p><h1>Director's Hearing Packet</h1><p>${escapeHtml(packetType.toUpperCase())}</p><div class="grid">
<div><div class="label">Case Number</div><div class="value">${escapeHtml(c.packet_case_number ?? c.case_number ?? c.complaintid ?? "—")}</div></div>
<div><div class="label">Complaint ID</div><div class="value">${escapeHtml(c.complaintid ?? "—")}</div></div>
<div><div class="label">Address</div><div class="value">${escapeHtml(c.address ?? "—")}</div></div>
<div><div class="label">Hearing Date</div><div class="value">${escapeHtml(c.hearing_date ?? "—")}</div></div>
<div><div class="label">Responsible Party</div><div class="value">${escapeHtml(c.responsible_party_name ?? "—")}</div></div>
<div><div class="label">Packet Status</div><div class="value">${escapeHtml(c.packet_status ?? "—")}</div></div>
</div><h2>Complaint Summary</h2><p>${escapeHtml(c.complaint_description ?? "No complaint summary available.")}</p></section>
<h2>Case Chronology</h2><table><thead><tr><th>Date</th><th>Type</th><th>Summary</th><th>Exhibits</th></tr></thead><tbody>${tableRows(chronology, (item) => `<tr><td>${escapeHtml(item.entry_date ?? "—")}</td><td>${escapeHtml(item.entry_type ?? "—")}</td><td>${escapeHtml(item.summary ?? "")}</td><td>${escapeHtml(item.exhibit_refs ?? "")}</td></tr>`)}</tbody></table>
<h2>Violations</h2><table><thead><tr><th>Label</th><th>Code</th><th>Location</th><th>Status</th></tr></thead><tbody>${tableRows(violations, (item) => `<tr><td>${escapeHtml(item.violation_label ?? "—")}</td><td>${escapeHtml(item.violation_code ?? "—")}</td><td>${escapeHtml(item.location_in_property ?? "—")}</td><td>${escapeHtml(item.status ?? "—")}</td></tr>`)}</tbody></table>
<h2>Exhibit Index</h2><table><thead><tr><th>Exhibit</th><th>Title</th><th>Description</th><th>Pages</th></tr></thead><tbody>${tableRows(exhibits, (item) => `<tr><td>${escapeHtml(item.exhibit_label ?? item.exhibit_letter ?? "—")}</td><td>${escapeHtml(item.title ?? item.document_type ?? "—")}</td><td>${escapeHtml(item.description ?? item.notes ?? "")}</td><td>${escapeHtml([item.packet_page_start, item.packet_page_end].filter(Boolean).join("-") || "—")}</td></tr>`)}</tbody></table>
${photos.map((p: any, i: number) => `<section class="photo-page"><h2>Photo ${i + 1}</h2><div class="photo-box">${escapeHtml(p.photo_url ?? p.file_path ?? "No file path")}</div><p><strong>Label:</strong> ${escapeHtml(p.exhibit_label ?? p.violation_label ?? "—")}</p><p><strong>Description:</strong> ${escapeHtml(p.caption ?? "—")}</p></section>`).join("\n")}
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { packetId, packet_id, packetType: requestedType } = await req.json().catch(() => ({}));
    const id = packetId || packet_id;
    const packetType: PacketType = requestedType === "final" ? "final" : "draft";
    if (!id)
      return new Response(JSON.stringify({ error: "packetId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: packetJson, error: packetError } = await admin.rpc("build_hearing_packet_json", {
      p_hearing_packet_id: id,
    });
    if (packetError) throw packetError;
    const { data: validationResults, error: validationError } = await admin.rpc(
      "validate_hearing_packet",
      { p_hearing_packet_id: id },
    );
    if (validationError) throw validationError;

    const html = buildHtml(packetJson, packetType);
    const caseData = packetJson?.case ?? {};
    const now = new Date();
    const version = now.toISOString().replaceAll(":", "-").replaceAll(".", "-");
    const fileName = `${packetType}-hearing-packet-${caseData.complaintid ?? id}-${version}.html`;
    const filePath = `${id}/${fileName}`;

    const { data: upload, error: uploadError } = await admin.storage
      .from("hearing-packets")
      .upload(filePath, new Blob([html], { type: "text/html" }), {
        contentType: "text/html; charset=utf-8",
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const { data: signed } = await admin.storage
      .from("hearing-packets")
      .createSignedUrl(filePath, 3600);

    const { data: fileRecord, error: fileError } = await admin
      .from("generated_packet_files")
      .insert({
        hearing_packet_id: id,
        complaint_uuid: packetJson?.complaint_uuid ?? caseData.complaint_uuid ?? null,
        file_type: packetType === "final" ? "final_pdf" : "draft_pdf",
        file_path: signed?.signedUrl ?? upload.path,
        file_name: fileName,
        mime_type: "text/html",
        is_final: packetType === "final",
        notes: `${packetType} packet generated as HTML. Use browser print/save as PDF until PDF renderer is enabled.`,
        metadata: {
          storageBucket: "hearing-packets",
          storagePath: upload.path,
          packetType,
          validationResults,
        },
      })
      .select("*")
      .single();
    if (fileError) throw fileError;

    await admin.from("packet_generation_events").insert({
      hearing_packet_id: id,
      complaint_uuid: packetJson?.complaint_uuid ?? caseData.complaint_uuid ?? null,
      event_type: packetType === "final" ? "final_packet_generated" : "draft_packet_generated",
      event_status: "success",
      event_message: `${packetType} hearing packet generated and stored.`,
      event_data: { fileRecordId: fileRecord.id, storagePath: upload.path },
    });
    await admin
      .from("hearing_packets")
      .update({
        [packetType === "final" ? "final_file_path" : "generated_file_path"]:
          signed?.signedUrl ?? upload.path,
        packet_snapshot_json: packetJson,
        validation_results_json: validationResults ?? [],
        generated_at: now.toISOString(),
        ...(packetType === "final" ? { packet_status: "Complete" } : {}),
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({
        ok: true,
        packetId: id,
        packetType,
        file: fileRecord,
        signedUrl: signed?.signedUrl ?? null,
        validationResults: validationResults ?? [],
      }),
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
