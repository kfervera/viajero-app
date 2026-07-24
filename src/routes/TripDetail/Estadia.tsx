import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { LodgingCard } from '../../components/LodgingCard'
import { LodgingForm } from '../../components/LodgingForm'
import { StayDaysStrip } from '../../components/StayDaysStrip'
import { TransportNightCard } from '../../components/TransportNightCard'
import { getTransportNightEntries } from '../../lib/transportNights'
import type { Lodging } from '../../lib/types'
import type { TripDetailContext } from './index'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; lodging: Lodging }

type StayListItem =
  | { kind: 'lodging'; key: string; sortKey: string; lodging: Lodging }
  | { kind: 'transport'; key: string; sortKey: string; entry: ReturnType<typeof getTransportNightEntries>[number] }

export function Estadia() {
  const { tripId } = useParams()
  const { trip, activities, lodgings, onLodgingsChanged } =
    useOutletContext<TripDetailContext>()
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' })
  const formRef = useRef<HTMLDivElement>(null)

  function handleSaved(lodging: Lodging) {
    const exists = lodgings.some((l) => l.id === lodging.id)
    const next = exists
      ? lodgings.map((l) => (l.id === lodging.id ? lodging : l))
      : [...lodgings, lodging]
    onLodgingsChanged(next.sort((a, b) => a.checkin_date.localeCompare(b.checkin_date)))
    setFormState({ mode: 'closed' })
  }

  function handleAddNew() {
    setFormState({ mode: 'create' })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleEdit(lodging: Lodging) {
    setFormState({ mode: 'edit', lodging })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!tripId || !trip) return null

  const tripStartDate = format(new Date(trip.start_datetime), 'yyyy-MM-dd')
  const tripEndDate = format(new Date(trip.end_datetime), 'yyyy-MM-dd')
  const transportNightEntries = getTransportNightEntries(activities)

  const items: StayListItem[] = [
    ...lodgings.map(
      (lodging): StayListItem => ({
        kind: 'lodging',
        key: lodging.id,
        sortKey: lodging.checkin_date,
        lodging,
      }),
    ),
    ...transportNightEntries.map(
      (entry): StayListItem => ({
        kind: 'transport',
        key: entry.activity.id,
        sortKey: entry.dayKeys[0],
        entry,
      }),
    ),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <StayDaysStrip
        trip={trip}
        lodgings={lodgings}
        transportNightEntries={transportNightEntries}
      />

      <div ref={formRef} className="mt-4">
        {formState.mode === 'closed' ? (
          <button
            type="button"
            onClick={handleAddNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva estadía
          </button>
        ) : (
          <LodgingForm
            key={formState.mode === 'edit' ? formState.lodging.id : 'new'}
            tripId={tripId}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
            lodging={formState.mode === 'edit' ? formState.lodging : null}
            onSaved={handleSaved}
            onCancel={() => setFormState({ mode: 'closed' })}
          />
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-center text-slate-500">
            Todavía no hay estadías registradas.
          </p>
        )}
        {items.map((item) =>
          item.kind === 'lodging' ? (
            <LodgingCard
              key={item.key}
              lodging={item.lodging}
              onEdit={() => handleEdit(item.lodging)}
            />
          ) : (
            <TransportNightCard key={item.key} entry={item.entry} />
          ),
        )}
      </div>
    </div>
  )
}
