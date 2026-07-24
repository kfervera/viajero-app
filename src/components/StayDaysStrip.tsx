import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { getTripNightKeys } from '../lib/dayNight'
import type { TransportNightEntry } from '../lib/transportNights'
import type { Lodging, Trip } from '../lib/types'

interface StayDaysStripProps {
  trip: Trip
  lodgings: Lodging[]
  transportNightEntries: TransportNightEntry[]
}

export function StayDaysStrip({
  trip,
  lodgings,
  transportNightEntries,
}: StayDaysStripProps) {
  // Un chip por noche del viaje (no por día calendario): el día de checkout
  // del viaje no necesita estadía, así que no aparece acá. Ver PLAN2.md §7 Fase 2.
  const nightKeys = getTripNightKeys(trip)

  if (nightKeys.length === 0) return null

  const transportDayKeys = new Set(
    transportNightEntries.flatMap((entry) => entry.dayKeys),
  )

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {nightKeys.map((dayKey) => {
        const day = parseISO(dayKey)
        // Cobertura exclusiva del checkout: una estadía cubre la noche solo
        // si el checkout es posterior a esa noche (no ese mismo día) — si el
        // viaje sigue después de un checkout, hace falta otra estadía.
        const coveredByLodging = lodgings.some(
          (lodging) =>
            lodging.checkin_date <= dayKey && dayKey < lodging.checkout_date,
        )
        const covered = coveredByLodging || transportDayKeys.has(dayKey)

        return (
          <div
            key={dayKey}
            className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 ${
              covered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            <span className="text-[10px] uppercase">
              {format(day, 'EEE', { locale: es })}
            </span>
            <span className="text-sm font-semibold">{format(day, 'd')}</span>
          </div>
        )
      })}
    </div>
  )
}
