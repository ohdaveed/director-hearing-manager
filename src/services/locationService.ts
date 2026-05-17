import { supabase } from '@/lib/supabase'

export const locationService = {
  async search(query: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .or(`address.ilike.%${query}%,location_id.ilike.%${query}%`)
      .limit(20)
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        inspections (*),
        arrizon_open_complaint_inspections_list_1 (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return {
      location: data,
      inspections: data.inspections || [],
      complaints: data.arrizon_open_complaint_inspections_list_1 || []
    }
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
