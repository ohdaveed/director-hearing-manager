import { supabase } from "@/lib/supabase";
import { aiService } from "./aiService";
import { pdfService } from "./pdfService";
import { wordService } from "./wordService";

/** Column selections to avoid SELECT * */
const PACKET_COMPLAINT_COLUMNS = "id, legacy_complaint_ref, complaint_id";
const INSPECTION_IMPORT_COLUMNS = `
  inspection_id, inspection_date, inspector, inspection_type,
  status, notes, deleted_at
`;
const CHRONO_RELATED_COLUMNS =
  "id, legacy_inspection_ref, legacy_complaint_ref, complaint_id, deleted_at";

export const importService = {
  async importDraftPacket({
    packetId,
    file,
  }: {
    packetId: string;
    file: File;
  }) {
    let text = "";
    if (file.name.toLowerCase().endsWith(".pdf")) {
      text = await pdfService.extractText(file);
    } else if (file.name.toLowerCase().endsWith(".docx")) {
      text = await wordService.extractText(file);
    } else {
      throw new Error("Unsupported file format");
    }

    const extractedViolations = await aiService.extractViolations(text);

    const { data: packet } = await supabase
      .from("hearing_packets")
      .select(PACKET_COMPLAINT_COLUMNS)
      .eq("id", packetId)
      .single();

    if (!packet) throw new Error("Packet not found");

    const { error: chronoError } = await supabase.from("chronology").insert([
      {
        legacy_complaint_ref: (packet as any).legacy_complaint_ref,
        complaint_id: packet.complaint_id,
        entry_date: new Date().toISOString().split("T")[0],
        entry_type: "Inspection",
        summary: `Imported from draft: ${file.name}. ${extractedViolations.length} violations found.`,
        violations_observed: JSON.stringify(extractedViolations),
      },
    ]);

    if (chronoError) throw chronoError;

    return {
      chronologyEntriesCreated: 1,
      violationsFound: extractedViolations.length,
    };
  },
  async listInspectionsForImport({ packetId }: { packetId: string }) {
    const { data: packet } = await supabase
      .from("hearing_packets")
      .select(PACKET_COMPLAINT_COLUMNS)
      .eq("id", packetId)
      .single();

    if (!packet) throw new Error("Packet not found");

    // Fetch inspections + violations + photos in ONE query with specific columns
    const { data: inspections, error } = await supabase
      .from("inspections")
      .select(
        `
        ${INSPECTION_IMPORT_COLUMNS},
        violations!inspection_id ( id, violation_label, violation_code, status, deleted_at ),
        inspection_photos!inspection_id ( id, photo_url, caption, deleted_at )
      `,
      )
      .eq("legacy_complaint_ref", (packet as any).legacy_complaint_ref)
      .eq("status", "Submitted")
      .is("deleted_at", null);

    if (error) throw error;

    // Fetch already-imported inspection IDs in a parallel query
    const { data: existingChrono } = await supabase
      .from("chronology")
      .select(CHRONO_RELATED_COLUMNS)
      .eq("legacy_complaint_ref", (packet as any).legacy_complaint_ref)
      .is("deleted_at", null);

    const importedIds = new Set(
      (existingChrono ?? [])
        .map((c) => (c as any).legacy_inspection_ref)
        .filter(Boolean),
    );

    return {
      inspections: (inspections ?? []).map((i) => ({
        ...i,
        alreadyImported: importedIds.has(String(i.inspection_id)),
        violation_count: (i as any).violations?.length || 0,
        photoCount: (i as any).inspection_photos?.length || 0,
        photoThumbnails: ((i as any).inspection_photos ?? [])
          .slice(0, 3)
          .map((p: any) => p.photo_url),
      })),
    };
  },

  async importInspectionHistory({
    packetId,
    inspectionIds,
  }: {
    packetId: string;
    inspectionIds: string[];
  }) {
    if (!inspectionIds.length) {
      return { chronologyEntriesCreated: 0, exhibitsCreated: 0, skipped: 0 };
    }

    const { data: packet } = await supabase
      .from("hearing_packets")
      .select(PACKET_COMPLAINT_COLUMNS)
      .eq("id", packetId)
      .single();

    if (!packet) throw new Error("Packet not found");

    const { data: inspections, error: inspError } = await supabase
      .from("inspections")
      .select(INSPECTION_IMPORT_COLUMNS)
      .in("inspection_id", inspectionIds)
      .is("deleted_at", null);

    if (inspError) throw inspError;
    if (!inspections || inspections.length === 0) {
      return {
        chronologyEntriesCreated: 0,
        exhibitsCreated: 0,
        skipped: inspectionIds.length,
      };
    }

    const chronologyEntries = inspections.map((insp: any) => ({
      legacy_complaint_ref: (packet as any).legacy_complaint_ref,
      complaint_id: packet.complaint_id,
      legacy_inspection_ref: String(insp.inspection_id),
      entry_date: insp.inspection_date,
      entry_type: "Inspection" as const,
      summary: `Inspection conducted by ${insp.inspector}.`,
    }));

    const { data: createdChronology, error: chronoBatchError } = await supabase
      .from("chronology")
      .insert(chronologyEntries)
      .select("id");

    if (chronoBatchError) throw chronoBatchError;

    const exhibitEntries = inspections.map((insp: any) => ({
      legacy_complaint_ref: (packet as any).legacy_complaint_ref,
      complaint_id: packet.complaint_id,
      legacy_inspection_ref: String(insp.inspection_id),
      source_inspection_id: insp.inspection_id,
      exhibit_type: "Inspection Report" as const,
      category: "Inspection Report" as const,
      description: `Inspection Report - ${insp.inspection_date}`,
      exhibit_date: insp.inspection_date,
    }));

    const { error: exhibitBatchError } = await supabase
      .from("exhibits")
      .insert(exhibitEntries);

    if (exhibitBatchError) throw exhibitBatchError;

    return {
      chronologyEntriesCreated: createdChronology?.length ?? 0,
      exhibitsCreated: exhibitEntries.length,
      skipped: inspectionIds.length - inspections.length,
    };
  },
};
