import { supabase } from '../lib/supabase'
import type { NewTrip, Trip } from '../lib/types'

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_datetime', { ascending: true })

  if (error) throw error
  return data
}

export async function getTrip(id: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTrip(trip: NewTrip): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTrip(
  id: string,
  trip: Partial<NewTrip>,
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update({ ...trip, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw error
}
