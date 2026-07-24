import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TripTemporalStatus } from '../lib/tripStatus'
import type { Activity, TripIndexEntry } from '../lib/types'

interface TripCardProps {
  trip: TripIndexEntry
  isSynced?: boolean
  status: TripTemporalStatus
  currentActivity?: Activity | null
}

const STATUS_COLOR: Record<TripTemporalStatus, string> = {
  past: 'bg-slate-400',
  active: 'bg-blue-500',
  future: 'bg-emerald-500',
}

export function TripCard({
  trip,
  isSynced = false,
  status,
  currentActivity = null,
}: TripCardProps) {
  const dateRange = `${format(new Date(trip.start_datetime), 'd MMM', { locale: es })} – ${format(
    new Date(trip.end_datetime),
    'd MMM yyyy',
    { locale: es },
  )}`

  return (
    <Link
      to={`/viajes/${trip.id}`}
      className="relative block overflow-hidden rounded-xl bg-white shadow-sm"
    >
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 z-10 w-1.5 ${STATUS_COLOR[status]}`}
      />
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
        {currentActivity && (
          <div className="mt-2 rounded-lg bg-blue-50 px-2 py-1.5">
            <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">
              <Clock className="h-3 w-3" />
              En curso
            </p>
            <p className="truncate text-xs text-blue-800">
              {currentActivity.summary} ·{' '}
              {format(new Date(currentActivity.start_datetime), 'HH:mm')}–
              {format(new Date(currentActivity.end_datetime), 'HH:mm')}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
