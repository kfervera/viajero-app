import type { Activity, Trip, TripIndexEntry } from './types'

export type TripTemporalStatus = 'past' | 'active' | 'future'

type TripDates = Pick<Trip | TripIndexEntry, 'start_datetime' | 'end_datetime'>

export function getTripStatus(trip: TripDates, now: Date): TripTemporalStatus {
  const start = new Date(trip.start_datetime)
  const end = new Date(trip.end_datetime)
  if (now < start) return 'future'
  if (now > end) return 'past'
  return 'active'
}

export function getCurrentActivity(
  activities: Activity[],
  now: Date,
): Activity | null {
  return (
    activities.find((activity) => {
      const start = new Date(activity.start_datetime)
      const end = new Date(activity.end_datetime)
      return start <= now && now <= end
    }) ?? null
  )
}
