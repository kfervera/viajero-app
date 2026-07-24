import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TripIndexEntry } from '../lib/types'

interface TripCardProps {
  trip: TripIndexEntry
  isSynced?: boolean
}

export function TripCard({ trip, isSynced = false }: TripCardProps) {
  const dateRange = `${format(new Date(trip.start_datetime), 'd MMM', { locale: es })} – ${format(
    new Date(trip.end_datetime),
    'd MMM yyyy',
    { locale: es },
  )}`

  return (
    <Link
      to={`/viajes/${trip.id}`}
      className="block overflow-hidden rounded-xl bg-white shadow-sm"
    >
      <div
        className="relative h-32 w-full bg-slate-200 bg-cover bg-center"
        style={
          trip.cover_image_url
            ? { backgroundImage: `url(${trip.cover_image_url})` }
            : undefined
        }
      >
        {isSynced && (
          <div
            title="Sincronizado para verlo sin conexión"
            aria-label="Sincronizado para verlo sin conexión"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm"
          >
            <Check className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h2 className="truncate font-medium text-slate-800">{trip.name}</h2>
        <p className="text-sm text-slate-500">{dateRange}</p>
      </div>
    </Link>
  )
}
