import { listActivities } from '../data/activities'
import { listLodgings } from '../data/lodgings'
import { getTrip } from '../data/trips'
import { setActiveTripCache } from './idb'
import type { ActiveTripCache } from './types'

// Descarga el viaje completo (trip + activities + lodgings) y reemplaza
// por completo active_trip_cache — nunca se acumulan varios viajes.
export async function downloadTripForOffline(
  tripId: string,
): Promise<ActiveTripCache> {
  const [trip, activities, lodgings] = await Promise.all([
    getTrip(tripId),
    listActivities(tripId),
    listLodgings(tripId),
  ])

  const cache: ActiveTripCache = {
    trip_id: tripId,
    synced_at: new Date().toISOString(),
    trip,
    activities,
    lodgings,
  }

  await setActiveTripCache(cache)
  return cache
}
