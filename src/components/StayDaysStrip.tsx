import { eachDayOfInterval, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Lodging, Trip } from '../lib/types'

interface StayDaysStripProps {
  trip: Trip
  lodgings: Lodging[]
}

export function StayDaysStrip({ trip, lodgings }: StayDaysStripProps) {
  const days = eachDayOfInterval({
    start: new Date(trip.start_datetime),
    end: new Date(trip.end_datetime),
  })

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((day) => {
        const dayKey = format(day, 'yyyy-MM-dd')
        const covered = lodgings.some(
          (lodging) =>
            lodging.checkin_date <= dayKey && dayKey <= lodging.checkout_date,
        )

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
