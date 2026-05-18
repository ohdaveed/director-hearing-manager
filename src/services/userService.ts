import { supabase } from "@/lib/supabase";

/** Column selections to avoid SELECT * */
export const USER_LIST_COLUMNS = `
  id, email, first_name, last_name, role, last_login,
  signature_text, signature_style, deleted_at
`;

export const USER_PUBLIC_COLUMNS = `
  id, email, first_name, last_name, role
`;

export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from("users")
      .select(USER_LIST_COLUMNS)
      .is("deleted_at", null)
      .order("last_name", { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from("users")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(USER_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async saveSignature(userId: string, text: string, style: string) {
    const { data, error } = await supabase
      .from("users")
      .update({
        signature_text: text,
        signature_style: style,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(USER_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },
};
