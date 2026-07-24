import { useEffect, useState } from 'react'
import { listTrips } from '../data/trips'
import { getActiveTripCache, getTripsIndex, setTripsIndex } from '../lib/idb'
import type { TripIndexEntry } from '../lib/types'
import { useOnlineStatus } from './useOnlineStatus'

type TripsStatus = 'loading' | 'ready'

// El viaje sincronizado va siempre primero, esté o no offline — es el que
// tiene copia disponible sin conexión, conviene tenerlo a mano.
function withSyncedFirst(trips: TripIndexEntry[], syncedTripId: string | null) {
  if (!syncedTripId) return trips
  return [...trips].sort((a, b) => {
    if (a.id === syncedTripId) return -1
    if (b.id === syncedTripId) return 1
    return 0
  })
}

export function useTrips() {
  const [trips, setTrips] = useState<TripIndexEntry[]>([])
  const [syncedTripId, setSyncedTripId] = useState<string | null>(null)
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
        setTrips(withSyncedFirst(cached, activeCache?.trip_id ?? null))
        setSyncedTripId(activeCache?.trip_id ?? null)
        setStatus('ready')
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isOnline])

  return { trips, status, syncedTripId }
}
