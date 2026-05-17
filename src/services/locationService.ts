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
        complaints (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return {
      location: data,
      inspections: data.inspections || [],
      complaints: data.complaints || []
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
