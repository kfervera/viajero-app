import { addMinutes, differenceInMinutes, eachDayOfInterval, format, startOfDay } from 'date-fns'
import type { Activity, Trip } from './types'

export const SLOT_MINUTES = 30
export const SLOT_HEIGHT_PX = 48
export const MINUTES_IN_DAY = 24 * 60
export const DAY_HEIGHT_PX = (MINUTES_IN_DAY / SLOT_MINUTES) * SLOT_HEIGHT_PX

type TripDates = Pick<Trip, 'start_datetime' | 'end_datetime'>

// Todos los días calendario que toca el viaje (a diferencia de las "noches"
// de dayNight.ts, acá se incluye también el día de checkout/fin).
export function getScheduleDays(trip: TripDates): Date[] {
  return eachDayOfInterval({
    start: startOfDay(new Date(trip.start_datetime)),
    end: startOfDay(new Date(trip.end_datetime)),
  })
}

// Etiquetas "HH:mm" cada 30 minutos, las 24 horas del día.
export function getSlotLabels(): string[] {
  const base = startOfDay(new Date())
  return Array.from({ length: MINUTES_IN_DAY / SLOT_MINUTES }, (_, i) =>
    format(addMinutes(base, i * SLOT_MINUTES), 'HH:mm'),
  )
}

export function minutesFromMidnight(date: Date): number {
  return differenceInMinutes(date, startOfDay(date))
}

export interface ActivitySegment {
  activity: Activity
  topPx: number
  heightPx: number
}

// Recorta cada actividad a la porción que cae dentro de este día calendario
// (00:00–24:00). Una actividad que cruza medianoche genera un segmento por
// cada día que toca, cada uno con su propio alto proporcional a esa porción.
export function getActivitySegmentsForDay(
  activities: Activity[],
  day: Date,
): ActivitySegment[] {
  const dayStart = startOfDay(day)
  const dayEnd = addMinutes(dayStart, MINUTES_IN_DAY)

  const segments: ActivitySegment[] = []
  for (const activity of activities) {
    const start = new Date(activity.start_datetime)
    const end = new Date(activity.end_datetime)
    if (end <= dayStart || start >= dayEnd) continue

    const segmentStart = start < dayStart ? dayStart : start
    const segmentEnd = end > dayEnd ? dayEnd : end

    const topPx = (minutesFromMidnight(segmentStart) / SLOT_MINUTES) * SLOT_HEIGHT_PX
    const durationMinutes = differenceInMinutes(segmentEnd, segmentStart)
    const heightPx = Math.max(
      (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT_PX,
      SLOT_HEIGHT_PX / 2,
    )

    segments.push({ activity, topPx, heightPx })
  }

  return segments.sort((a, b) => a.topPx - b.topPx)
}
