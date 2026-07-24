import { supabase } from '../lib/supabase'
import type { Lodging, NewLodging } from '../lib/types'

export async function listLodgings(tripId: string): Promise<Lodging[]> {
  const { data, error } = await supabase
    .from('lodgings')
    .select('*')
    .eq('trip_id', tripId)
    .order('checkin_date', { ascending: true })

  if (error) throw error
  return data
}

export async function createLodging(lodging: NewLodging): Promise<Lodging> {
  const { data, error } = await supabase
    .from('lodgings')
    .insert(lodging)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLodging(
  id: string,
  lodging: Partial<NewLodging>,
): Promise<Lodging> {
  const { data, error } = await supabase
    .from('lodgings')
    .update({ ...lodging, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLodging(id: string): Promise<void> {
  const { error } = await supabase.from('lodgings').delete().eq('id', id)
  if (error) throw error
}
