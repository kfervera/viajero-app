import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TripIndexEntry } from '../lib/types'

interface TripCardProps {
  trip: TripIndexEntry
}

export function TripCard({ trip }: TripCardProps) {
  const dateRange = `${format(new Date(trip.start_datetime), 'd MMM', { locale: es })} – ${format(
    new Date(trip.end_datetime),
    'd MMM yyyy',
    { locale: es },
  )}`

  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div
        className="h-32 w-full bg-slate-200 bg-cover bg-center"
        style={
          trip.cover_image_url
            ? { backgroundImage: `url(${trip.cover_image_url})` }
            : undefined
        }
      />
      <div className="p-3">
        <h2 className="truncate font-medium text-slate-800">{trip.name}</h2>
        <p className="text-sm text-slate-500">{dateRange}</p>
      </div>
    </article>
  )
}
