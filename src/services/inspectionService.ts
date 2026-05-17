import { supabase } from '@/lib/supabase'

export const inspectionService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        locations (address)
      `)
      .order('inspection_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        violations (*),
        inspection_photos (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async save(inspection: any) {
    const { violations, photos, ...inspectionData } = inspection
    
    // 1. Save main inspection record
    const { data: savedInspection, error: inspectionError } = await supabase
      .from('inspections')
      .upsert(inspectionData)
      .select()
      .single()
    
    if (inspectionError) throw inspectionError

    // 2. Sync Violations
    if (violations) {
      // Simplest way is to delete existing and re-insert for the inspection
      await supabase.from('violations').delete().eq('inspection_id', savedInspection.id)
      
      const violationsWithId = violations.map((v: any) => ({
        ...v,
        inspection_id: savedInspection.id
      }))
      
      const { error: vError } = await supabase.from('violations').insert(violationsWithId)
      if (vError) throw vError
    }

    // 3. Sync Photos
    if (photos) {
      const photosWithId = photos.map((p: any) => ({
        ...p,
        inspection_id: savedInspection.id
      }))
      const { error: pError } = await supabase.from('inspection_photos').upsert(photosWithId)
      if (pError) throw pError
    }

    return savedInspection
  }
}
