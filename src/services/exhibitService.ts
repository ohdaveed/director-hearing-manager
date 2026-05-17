import { supabase } from "@/lib/supabase";

/** Column selections to avoid SELECT * */
export const EXHIBIT_COLUMNS = `
  id, exhibit_label, exhibit_type, description, sort_order,
  caption, category, file, exhibit_date, page_count,
  complaint, source_inspection, source_photo,
  deleted_at, created_at, updated_at
`;

export const exhibitService = {
  async uploadExhibit(exhibit: any) {
    const { data, error } = await supabase
      .from("exhibits")
      .insert([
        {
          ...exhibit,
          created_at: new Date().toISOString(),
        },
      ])
      .select(EXHIBIT_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExhibit(id: string) {
    const { error } = await supabase
      .from("exhibits")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },
};
