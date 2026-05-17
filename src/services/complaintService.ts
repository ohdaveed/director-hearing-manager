import { supabase } from '@/lib/supabase'

export const complaintService = {
  async getAll(filters: { assigned_to?: string } = {}) {
    let query = supabase
      .from('complaints')
      .select('*')
      .order('date_entered', { ascending: false })
    
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    const { data, error } = await query
    if (error) throw error
    return data as any[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        inspections (*,
          violations (*),
          inspection_photos (*)
        ),
        chronology (*),
        hearing_packets (*),
        locations (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(complaint: any) {
    const { data, error } = await supabase
      .from('complaints')
      .insert([complaint])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
