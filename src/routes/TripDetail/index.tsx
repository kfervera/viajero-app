import { LayoutGrid } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { BottomTabBar } from '../../components/BottomTabBar'
import { getTrip } from '../../data/trips'
import type { Trip } from '../../lib/types'

export interface TripDetailContext {
  trip: Trip | null
  onTripSaved: (trip: Trip) => void
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
  const [trip, setTrip] = useState<Trip | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    tripId ? 'loading' : 'ready',
  )

  useEffect(() => {
    if (!tripId) return

    let cancelled = false

    getTrip(tripId)
      .then((loadedTrip) => {
        if (cancelled) return
        setTrip(loadedTrip)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [tripId])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-slate-500">Cargando viaje…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-slate-500">
          No se pudo cargar este viaje. Revisa tu conexión e intenta de nuevo.
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
      <Outlet context={{ trip, onTripSaved: setTrip } satisfies TripDetailContext} />
      <BottomTabBar tripId={tripId} />
    </div>
  )
}
