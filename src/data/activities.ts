import { supabase } from '../lib/supabase'
import type { Activity, NewActivity } from '../lib/types'

export async function listActivities(tripId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('trip_id', tripId)
    .order('start_datetime', { ascending: true })

  if (error) throw error
  return data
}

export async function createActivity(
  activity: NewActivity,
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateActivity(
  id: string,
  activity: Partial<NewActivity>,
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .update({ ...activity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw error
}
