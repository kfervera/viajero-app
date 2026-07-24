import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ActiveTripCache, TripIndexEntry } from './types'

const DB_NAME = 'viajero-db'
const DB_VERSION = 1
const ACTIVE_TRIP_KEY = 'current'

interface ViajeroDB extends DBSchema {
  trips_index: {
    key: string
    value: TripIndexEntry
  }
  active_trip_cache: {
    key: string
    value: ActiveTripCache
  }
}

let dbPromise: Promise<IDBPDatabase<ViajeroDB>> | undefined

function getDb() {
  dbPromise ??= openDB<ViajeroDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('trips_index', { keyPath: 'id' })
      db.createObjectStore('active_trip_cache')
    },
  })
  return dbPromise
}

export async function getTripsIndex(): Promise<TripIndexEntry[]> {
  const db = await getDb()
  return db.getAll('trips_index')
}

export async function setTripsIndex(trips: TripIndexEntry[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('trips_index', 'readwrite')
  await tx.store.clear()
  await Promise.all(trips.map((trip) => tx.store.put(trip)))
  await tx.done
}

export async function getActiveTripCache(): Promise<
  ActiveTripCache | undefined
> {
  const db = await getDb()
  return db.get('active_trip_cache', ACTIVE_TRIP_KEY)
}

// Reemplaza por completo el cache (regla dura: nunca acumular más de un viaje).
export async function setActiveTripCache(
  cache: ActiveTripCache,
): Promise<void> {
  const db = await getDb()
  await db.put('active_trip_cache', cache, ACTIVE_TRIP_KEY)
}
