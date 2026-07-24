import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { LodgingCard } from '../../components/LodgingCard'
import { LodgingForm } from '../../components/LodgingForm'
import { StayDaysStrip } from '../../components/StayDaysStrip'
import { listLodgings } from '../../data/lodgings'
import type { Lodging } from '../../lib/types'
import type { TripDetailContext } from './index'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; lodging: Lodging }

export function Estadia() {
  const { tripId } = useParams()
  const { trip } = useOutletContext<TripDetailContext>()
  const [lodgings, setLodgings] = useState<Lodging[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' })
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tripId) return

    let cancelled = false

    listLodgings(tripId)
      .then((data) => {
        if (!cancelled) {
          setLodgings(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [tripId])

  function handleSaved(lodging: Lodging) {
    setLodgings((prev) => {
      const exists = prev.some((l) => l.id === lodging.id)
      const next = exists
        ? prev.map((l) => (l.id === lodging.id ? lodging : l))
        : [...prev, lodging]
      return next.sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
    })
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <StayDaysStrip trip={trip} lodgings={lodgings} />

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
            lodging={formState.mode === 'edit' ? formState.lodging : null}
            onSaved={handleSaved}
            onCancel={() => setFormState({ mode: 'closed' })}
          />
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {status === 'loading' && (
          <p className="text-center text-slate-500">Cargando estadías…</p>
        )}
        {status === 'error' && (
          <p className="text-center text-slate-500">
            No se pudieron cargar las estadías. Revisa tu conexión.
          </p>
        )}
        {status === 'ready' && lodgings.length === 0 && (
          <p className="text-center text-slate-500">
            Todavía no hay estadías registradas.
          </p>
        )}
        {status === 'ready' &&
          lodgings.map((lodging) => (
            <LodgingCard
              key={lodging.id}
              lodging={lodging}
              onEdit={() => handleEdit(lodging)}
            />
          ))}
      </div>
    </div>
  )
}
