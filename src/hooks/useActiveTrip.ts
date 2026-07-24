import { useEffect, useState } from 'react'
import { listActivities } from '../data/activities'
import { listLodgings } from '../data/lodgings'
import { getTrip } from '../data/trips'
import { getActiveTripCache } from '../lib/idb'
import { downloadTripForOffline } from '../lib/sync'
import type { Activity, Lodging, Trip } from '../lib/types'
import { useOnlineStatus } from './useOnlineStatus'

type ActiveTripStatus = 'loading' | 'ready' | 'offline-unavailable'

interface ActiveTripState {
  trip: Trip | null
  activities: Activity[]
  lodgings: Lodging[]
  status: ActiveTripStatus
  isFromCache: boolean
  syncedAt: string | null
}

const READY_EMPTY: ActiveTripState = {
  trip: null,
  activities: [],
  lodgings: [],
  status: 'ready',
  isFromCache: false,
  syncedAt: null,
}

const LOADING: ActiveTripState = { ...READY_EMPTY, status: 'loading' }

// Lee el viaje activo (trip + activities + lodgings): si hay conexión, va
// directo a Supabase; si falla o está offline, cae a active_trip_cache
// cuando coincide con este trip_id (ver PLAN.md §5).
export function useActiveTrip(tripId: string | undefined) {
  const isOnline = useOnlineStatus()
  const [state, setState] = useState<ActiveTripState>(
    tripId ? LOADING : READY_EMPTY,
  )

  useEffect(() => {
    if (!tripId) return

    let cancelled = false

    async function load() {
      if (!tripId) return

      if (isOnline) {
        try {
          const [trip, activities, lodgings] = await Promise.all([
            getTrip(tripId),
            listActivities(tripId),
            listLodgings(tripId),
          ])
          if (!cancelled) {
            setState({
              trip,
              activities,
              lodgings,
              status: 'ready',
              isFromCache: false,
              syncedAt: null,
            })
          }
          return
        } catch {
          // Sin conexión real o falla de red: se sigue con el cache.
        }
      }

      const cached = await getActiveTripCache()
      if (cancelled) return

      if (cached && cached.trip_id === tripId) {
        setState({
          trip: cached.trip,
          activities: cached.activities,
          lodgings: cached.lodgings,
          status: 'ready',
          isFromCache: true,
          syncedAt: cached.synced_at,
        })
      } else {
        setState((prev) => ({ ...prev, status: 'offline-unavailable' }))
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [tripId, isOnline])

  async function sync() {
    if (!tripId) return
    const cache = await downloadTripForOffline(tripId)
    setState({
      trip: cache.trip,
      activities: cache.activities,
      lodgings: cache.lodgings,
      status: 'ready',
      isFromCache: false,
      syncedAt: cache.synced_at,
    })
  }

  function setTrip(trip: Trip) {
    setState((prev) => ({ ...prev, trip }))
  }

  function setActivities(activities: Activity[]) {
    setState((prev) => ({ ...prev, activities }))
  }

  function setLodgings(lodgings: Lodging[]) {
    setState((prev) => ({ ...prev, lodgings }))
  }

  return { ...state, isOnline, sync, setTrip, setActivities, setLodgings }
}
