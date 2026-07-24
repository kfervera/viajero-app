export interface Trip {
  id: string
  name: string
  cover_image_url: string | null
  start_datetime: string
  end_datetime: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  trip_id: string
  summary: string
  description: string | null
  place: string | null
  map_url: string | null
  agency: string | null
  phone_number: string | null
  notes: string[]
  start_datetime: string
  end_datetime: string
  created_at: string
  updated_at: string
}

export interface Lodging {
  id: string
  trip_id: string
  name: string
  checkin_date: string
  checkout_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type NewTrip = Omit<Trip, 'id' | 'created_at' | 'updated_at'>
export type NewActivity = Omit<Activity, 'id' | 'created_at' | 'updated_at'>
export type NewLodging = Omit<Lodging, 'id' | 'created_at' | 'updated_at'>

export type TripIndexEntry = Pick<
  Trip,
  'id' | 'name' | 'cover_image_url' | 'start_datetime' | 'end_datetime' | 'updated_at'
>

export interface ActiveTripCache {
  trip_id: string
  synced_at: string
  trip: Trip
  activities: Activity[]
  lodgings: Lodging[]
}
