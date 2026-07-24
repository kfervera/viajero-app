import { differenceInCalendarDays, eachDayOfInterval, format } from 'date-fns'
import type { Trip, TripIndexEntry } from './types'

type TripDates = Pick<Trip | TripIndexEntry, 'start_datetime' | 'end_datetime'>

export function getDayNightCount(trip: TripDates): { days: number; nights: number } {
  const start = new Date(trip.start_datetime)
  const end = new Date(trip.end_datetime)
  const days = differenceInCalendarDays(end, start) + 1
  return { days, nights: days - 1 }
}

// Claves (yyyy-MM-dd) de cada noche del viaje: todos los días calendario
// salvo el último — el día de checkout del viaje no requiere estadía esa
// noche, así que no cuenta como una noche a cubrir.
export function getTripNightKeys(trip: TripDates): string[] {
  const { nights } = getDayNightCount(trip)
  if (nights <= 0) return []

  const start = new Date(trip.start_datetime)
  const end = new Date(trip.end_datetime)
  return eachDayOfInterval({ start, end })
    .slice(0, nights)
    .map((day) => format(day, 'yyyy-MM-dd'))
}
