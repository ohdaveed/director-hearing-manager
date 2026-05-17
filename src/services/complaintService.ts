import { supabase } from '@/lib/supabase'
import type { Complaint } from '@/types/complaint'

export const complaintService = {
  async getAll(filters: { assignedTo?: string } = {}) {
    let query = supabase
      .from('arrizon_open_complaint_inspections_list_1')
      .select('*')
      .order('date_entered', { ascending: false })
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('arrizon_open_complaint_inspections_list_1')
      .select(`
        *,
        inspections (*,
          violations (*),
          inspection_photos (*)
        ),
        chronology (*),
        hearing_packets (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(complaint: Partial<Complaint>) {
    const { data, error } = await supabase
      .from('arrizon_open_complaint_inspections_list_1')
      .insert([complaint])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Complaint>) {
    const { data, error } = await supabase
      .from('arrizon_open_complaint_inspections_list_1')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
