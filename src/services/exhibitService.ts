import { supabase } from '@/lib/supabase';

export const exhibitService = {
  async uploadExhibit(exhibit: any) {
    const { data, error } = await supabase
      .from('exhibits')
      .insert([exhibit])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteExhibit(id: string) {
    const { error } = await supabase
      .from('exhibits')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};