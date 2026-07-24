import { addDays, differenceInCalendarDays, format } from 'date-fns'
import type { Activity } from './types'

export interface TransportNightEntry {
  activity: Activity
  dayKeys: string[]
}

// Una actividad de categoría "transport" cuya fecha de fin cae en un día
// calendario posterior al de inicio (estrictamente posterior, no el mismo
// día) ya cubre esa/s noche/s de tránsito — no hace falta registrar una
// estadía aparte para esos días.
export function getTransportNightEntries(
  activities: Activity[],
): TransportNightEntry[] {
  const entries: TransportNightEntry[] = []

  for (const activity of activities) {
    if (activity.category !== 'transport') continue

    const start = new Date(activity.start_datetime)
    const end = new Date(activity.end_datetime)
    const nightsCount = differenceInCalendarDays(end, start)

    if (nightsCount <= 0) continue

    const dayKeys = Array.from({ length: nightsCount }, (_, i) =>
      format(addDays(start, i), 'yyyy-MM-dd'),
    )

    entries.push({ activity, dayKeys })
  }

  return entries
}
