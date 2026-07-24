import { MapPin, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TripCard } from '../components/TripCard'
import { useNow } from '../hooks/useNow'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useTrips } from '../hooks/useTrips'
import { getCurrentActivity, getTripStatus } from '../lib/tripStatus'

export function Home() {
  const { trips, status, syncedTripId, syncedTripActivities } = useTrips()
  const isOnline = useOnlineStatus()
  const now = useNow()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Mis viajes</h1>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-600">
              Sin conexión
            </span>
          )}
          {status === 'ready' && trips.length > 0 && (
            <Link
              to="/viajes/nuevo"
              className="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-2 text-sm text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo viaje
            </Link>
          )}
        </div>
      </header>

      {status === 'loading' && (
        <p className="text-center text-slate-500">Cargando viajes…</p>
      )}

      {status === 'ready' && trips.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MapPin className="h-10 w-10 text-slate-400" />
          <p className="text-slate-500">Todavía no tienes ningún viaje.</p>
          <Link
            to="/viajes/nuevo"
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Crear viaje
          </Link>
        </div>
      )}

      {status === 'ready' && trips.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const isSynced = trip.id === syncedTripId
            const tripStatus = getTripStatus(trip, now)
            const currentActivity =
              isSynced && tripStatus === 'active'
                ? getCurrentActivity(syncedTripActivities, now)
                : null

            return (
              <TripCard
                key={trip.id}
                trip={trip}
                isSynced={isSynced}
                status={tripStatus}
                currentActivity={currentActivity}
              />
            )
          })}
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-slate-500">
        v{__APP_VERSION__}
      </footer>
    </div>
  )
}
