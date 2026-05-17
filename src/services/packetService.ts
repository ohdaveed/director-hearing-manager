import { supabase } from '@/lib/supabase'

export const packetService = {
  async getAll(filters: { statusFilter?: string; assignedToFilter?: string } = {}) {
    let query = supabase
      .from('hearing_packets')
      .select(`
        *,
        arrizon_open_complaint_inspections_list_1 (address, complaint_id, hearing_status)
      `)
      .order('hearing_date', { ascending: true })

    if (filters.statusFilter) {
      query = query.eq('packet_status', filters.statusFilter)
    }
    
    if (filters.assignedToFilter) {
      query = query.eq('assigned_to', filters.assignedToFilter)
    }

    const { data, error } = await query
    if (error) throw error

    // Map to the expected frontend format
    return data.map(p => ({
      ...p,
      address: p.arrizon_open_complaint_inspections_list_1?.address,
      complaintId: p.arrizon_open_complaint_inspections_list_1?.complaint_id,
      hearingStatus: p.arrizon_open_complaint_inspections_list_1?.hearing_status
    }))
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('hearing_packets')
      .select(`
        *,
        complaint:arrizon_open_complaint_inspections_list_1 (
          *,
          inspections (*,
            violations (*),
            inspection_photos (*)
          ),
          locations (*),
          chronology (*),
          service_log (*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error

    // The frontend expects a specific structure for the printable document
    return {
      packet: data,
      complaint: data.complaint,
      location: data.complaint?.locations,
      inspections: data.complaint?.inspections || [],
      chronology: data.complaint?.chronology || [],
      serviceLog: data.complaint?.service_log || []
    }
  },

  async create(complaintId: string) {
    const { data, error } = await supabase
      .from('hearing_packets')
      .insert([{ complaint_id: complaintId, packet_status: 'Not Started' }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('hearing_packets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
