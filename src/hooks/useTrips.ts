import { useEffect, useState } from 'react'
import { listTrips } from '../data/trips'
import { getActiveTripCache, getTripsIndex, setTripsIndex } from '../lib/idb'
import type { Activity, TripIndexEntry } from '../lib/types'
import { useOnlineStatus } from './useOnlineStatus'

type TripsStatus = 'loading' | 'ready'

// Orden descendente por fecha de inicio (más nuevas primero); el viaje
// sincronizado, si existe, siempre pasa a la primera posición sin alterar
// el orden relativo del resto — es el que tiene copia disponible offline.
function sortTrips(trips: TripIndexEntry[], syncedTripId: string | null) {
  const sorted = [...trips].sort(
    (a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime(),
  )
  if (!syncedTripId) return sorted

  const syncedIndex = sorted.findIndex((trip) => trip.id === syncedTripId)
  if (syncedIndex <= 0) return sorted

  const [synced] = sorted.splice(syncedIndex, 1)
  return [synced, ...sorted]
}

export function useTrips() {
  const [trips, setTrips] = useState<TripIndexEntry[]>([])
  const [syncedTripId, setSyncedTripId] = useState<string | null>(null)
  const [syncedTripActivities, setSyncedTripActivities] = useState<Activity[]>([])
  const [status, setStatus] = useState<TripsStatus>('loading')
  const isOnline = useOnlineStatus()

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (isOnline) {
        try {
          const remoteTrips = await listTrips()
          await setTripsIndex(
            remoteTrips.map(
              ({ id, name, cover_image_url, start_datetime, end_datetime, updated_at }) => ({
                id,
                name,
                cover_image_url,
                start_datetime,
                end_datetime,
                updated_at,
              }),
            ),
          )
        } catch {
          // Sin conexión real o falla de red: se sigue mostrando lo cacheado.
        }
      }

      const [cached, activeCache] = await Promise.all([
        getTripsIndex(),
        getActiveTripCache(),
      ])
      if (!cancelled) {
        setTrips(sortTrips(cached, activeCache?.trip_id ?? null))
        setSyncedTripId(activeCache?.trip_id ?? null)
        setSyncedTripActivities(activeCache?.activities ?? [])
        setStatus('ready')
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isOnline])

  return { trips, status, syncedTripId, syncedTripActivities }
}
