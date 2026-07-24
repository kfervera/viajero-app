import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { LayoutGrid } from 'lucide-react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { BottomTabBar } from '../../components/BottomTabBar'
import { SyncFab } from '../../components/SyncFab'
import { useActiveTrip } from '../../hooks/useActiveTrip'
import type { Activity, Lodging, Trip } from '../../lib/types'

export interface TripDetailContext {
  trip: Trip | null
  activities: Activity[]
  lodgings: Lodging[]
  isOnline: boolean
  isFromCache: boolean
  onTripSaved: (trip: Trip) => void
  onActivitiesChanged: (activities: Activity[]) => void
  onLodgingsChanged: (lodgings: Lodging[]) => void
}

// Envuelve el contenido con una key atada a tripId: React Router reutiliza
// la misma instancia de TripDetail al navegar entre /viajes/:tripId y
// /viajes/nuevo (misma posición en el árbol), así que sin esta key el
// estado de un viaje quedaba pegado al entrar a otro.
export function TripDetail() {
  const { tripId } = useParams()
  return <TripDetailContent key={tripId ?? 'nuevo'} tripId={tripId} />
}

function TripDetailContent({ tripId }: { tripId?: string }) {
  const {
    trip,
    activities,
    lodgings,
    status,
    isOnline,
    isFromCache,
    syncedAt,
    sync,
    setTrip,
    setActivities,
    setLodgings,
  } = useActiveTrip(tripId)

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-slate-500">Cargando viaje…</p>
      </div>
    )
  }

  if (status === 'offline-unavailable') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-slate-500">
          Sin conexión. Este viaje no está disponible sin conexión —
          sincronízalo primero cuando tengas internet.
        </p>
        <Link to="/" className="font-medium text-sky-600">
          Volver a mis viajes
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-slate-500">
          No se pudo cargar este viaje. Puede que ya no exista o el enlace
          esté mal escrito.
        </p>
        <Link to="/" className="font-medium text-sky-600">
          Volver a mis viajes
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-svh pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link to="/" aria-label="Volver a mis viajes" className="text-slate-500">
          <LayoutGrid className="h-5 w-5" />
        </Link>
        <h1 className="truncate font-medium text-slate-800">
          {trip ? trip.name : 'Nuevo viaje'}
        </h1>
      </header>

      {isFromCache && syncedAt && (
        <p className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">
          Sin conexión. Viendo datos sincronizados el{' '}
          {format(new Date(syncedAt), "d 'de' MMMM, HH:mm", { locale: es })}.
        </p>
      )}

      <Outlet
        context={
          {
            trip,
            activities,
            lodgings,
            isOnline,
            isFromCache,
            onTripSaved: setTrip,
            onActivitiesChanged: setActivities,
            onLodgingsChanged: setLodgings,
          } satisfies TripDetailContext
        }
      />
      <BottomTabBar tripId={tripId} />
      {tripId && <SyncFab onSync={sync} disabled={!isOnline} />}
    </div>
  )
}
