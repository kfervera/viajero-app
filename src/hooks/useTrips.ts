import { useEffect, useState } from 'react'
import { listTrips } from '../data/trips'
import { getTripsIndex, setTripsIndex } from '../lib/idb'
import type { TripIndexEntry } from '../lib/types'
import { useOnlineStatus } from './useOnlineStatus'

type TripsStatus = 'loading' | 'ready'

export function useTrips() {
  const [trips, setTrips] = useState<TripIndexEntry[]>([])
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

      const cached = await getTripsIndex()
      if (!cancelled) {
        setTrips(cached)
        setStatus('ready')
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isOnline])

  return { trips, status }
}
