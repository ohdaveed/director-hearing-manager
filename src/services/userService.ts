import { supabase } from '@/lib/supabase'

export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('last_name', { ascending: true })
    
    if (error) throw error
    return data
  },

  async updateRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async saveSignature(userId: string, text: string, style: string) {
    const { data, error } = await supabase
      .from('users')
      .update({
        signature_text: text,
        signature_style: style
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
