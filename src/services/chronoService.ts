import { supabase } from "@/lib/supabase";

/** Column selections to avoid SELECT * */
export const CHRONOLOGY_LIST_COLUMNS = `
  id, summary, entry_date, entry_type, created_by,
  related_inspection, visibility, chronology_order,
  citation_code, violations_observed, exhibit_refs,
  attachment_page_ref, frozen_at, source_record,
  deleted_at
`;

export const chronoService = {
  async getChronologyForPacket({ packetId }: { packetId: string }) {
    const { data: packet } = await supabase
      .from("hearing_packets")
      .select("complaint")
      .eq("id", packetId)
      .single();

    if (!packet) throw new Error("Packet not found");

    const { data, error } = await supabase
      .from("chronology")
      .select(CHRONOLOGY_LIST_COLUMNS)
      .eq("complaint", packet.complaint)
      .is("deleted_at", null)
      .order("chronology_order", { ascending: true });

    if (error) throw error;
    return { chronology: data };
  },

  async addChronologyEntry(entry: any) {
    const { data, error } = await supabase
      .from("chronology")
      .insert([
        {
          ...entry,
        },
      ])
      .select(CHRONOLOGY_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async updateChronologyEntry(id: string, updates: any) {
    const { data, error } = await supabase
      .from("chronology")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(CHRONOLOGY_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteChronologyEntry(id: string) {
    const { error } = await supabase
      .from("chronology")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },

  async reorderChronology({
    complaintId: _complaintId,
    orderedIds,
  }: {
    complaintId?: string;
    orderedIds: string[];
  }) {
    const updates = orderedIds.map((id, index) => ({
      id,
      chronology_order: index + 1,
    }));

    const { error } = await supabase
      .from("chronology")
      .upsert(updates, { onConflict: "id" })
      .select();

    if (error) throw error;
  },
};
