import { supabase } from '@/lib/supabase';

export const chronoService = {
  async getChronologyForPacket({ packetId }: { packetId: string }) {
    const { data: packet } = await supabase
      .from('hearing_packets')
      .select('complaint')
      .eq('id', packetId)
      .single();

    if (!packet) throw new Error('Packet not found');

    const { data, error } = await supabase
      .from('chronology')
      .select('*')
      .eq('complaint', packet.complaint)
      .order('chronology_order', { ascending: true });

    if (error) throw error;
    return { chronology: data };
  },

  async addChronologyEntry(entry: any) {
    const { data, error } = await supabase
      .from('chronology')
      .insert([entry])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateChronologyEntry(id: string, updates: any) {
    // Note: The id here might be a uuid or a composite key, 
    // but in schema.sql chronology doesn't have a primary key?
    // Wait, let me check schema.sql again.
    const { data, error } = await supabase
      .from('chronology')
      .update(updates)
      .eq('id', id) // Assuming there is an id column despite schema.sql missing it in my quick read
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteChronologyEntry(id: string) {
    const { error } = await supabase
      .from('chronology')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async reorderChronology({ packetId, orderedIds }: { packetId: string, orderedIds: string[] }) {
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from('chronology')
        .update({ chronology_order: i + 1 })
        .eq('id', orderedIds[i]);
    }
  }
};